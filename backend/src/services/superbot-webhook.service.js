/**
 * Superbot Webhook Service
 * 
 * Processa mensagens recebidas do Superbot em tempo real
 * Detecta intenções de compra e cria leads automaticamente
 * 
 * @version 1.0
 * @date 2026-01-18
 */

import { SuperbotRepository } from '../repositories/superbot.repository.js';
import { SuperbotAIService } from './superbot-ai.service.js';
import { SuperbotService } from './superbot.service.js';
import { NotificationsService } from './notifications.service.js';
import { cacheGet, cacheSet } from '../config/redis.js';
import logger from '../config/logger.js';
import crypto from 'crypto';

// Filas de processamento (pode ser Redis em produção)
const processingQueue = new Map();

// Configurações
const CONFIG = {
    WEBHOOK_SECRET: process.env.SUPERBOT_WEBHOOK_SECRET || 'superbot-webhook-secret',
    AUTO_CREATE_LEADS: process.env.SUPERBOT_AUTO_CREATE_LEADS === 'true',
    MIN_CONFIDENCE_FOR_LEAD: 0.7,
    DEBOUNCE_MS: 5000, // Aguardar 5s entre mensagens do mesmo cliente
    MAX_QUEUE_SIZE: 1000
};

export const SuperbotWebhookService = {
    /**
     * Valida assinatura do webhook
     */
    validateSignature(payload, signature) {
        if (!signature) return false;

        const expectedSignature = crypto
            .createHmac('sha256', CONFIG.WEBHOOK_SECRET)
            .update(JSON.stringify(payload))
            .digest('hex');

        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    },

    /**
     * Processa mensagem recebida do webhook
     */
    async processIncomingMessage(payload) {
        const {
            message_id,
            session_id,
            sender_phone,
            recipient_phone,
            message_text,
            message_type,
            direction,
            timestamp,
            media_url,
            transcription
        } = payload;

        // Validar payload
        if (!sender_phone || !session_id) {
            logger.warn('Webhook: payload inválido', { payload });
            return { success: false, error: 'Payload inválido' };
        }

        // Ignorar mensagens de saída (do bot)
        if (direction === 'outgoing') {
            return { success: true, skipped: true, reason: 'Mensagem de saída' };
        }

        // Debounce - evitar processamento duplicado
        const debounceKey = `webhook:debounce:${sender_phone}`;
        const isDebounced = await cacheGet(debounceKey);
        if (isDebounced) {
            logger.debug('Webhook: mensagem em debounce', { sender_phone });
            // Adicionar à fila para processamento em lote
            return this.addToQueue(sender_phone, payload);
        }

        await cacheSet(debounceKey, true, CONFIG.DEBOUNCE_MS / 1000);

        try {
            // Texto para análise (mensagem ou transcrição)
            const textToAnalyze = message_text || transcription;

            if (!textToAnalyze) {
                return {
                    success: true,
                    skipped: true,
                    reason: 'Sem texto para analisar (mídia sem transcrição)'
                };
            }

            logger.info('Webhook: processando mensagem', {
                sender_phone,
                session_id,
                text_length: textToAnalyze.length
            });

            // Buscar contexto do cliente
            const customerContext = await this.getCustomerContext(sender_phone);

            // Analisar intenção com IA
            let analysis;
            if (SuperbotAIService.isConfigured()) {
                analysis = await SuperbotAIService.analyzeIntent(textToAnalyze, {
                    useCache: true,
                    customerName: customerContext?.customer_name
                });
            } else {
                analysis = SuperbotService.analyzeIntentBasic(textToAnalyze);
            }

            // Registrar análise
            const result = {
                success: true,
                message_id,
                sender_phone,
                analysis,
                customer_context: customerContext
            };

            // Verificar se deve criar lead automaticamente
            if (this.shouldCreateLead(analysis)) {
                const leadResult = await this.createLeadFromMessage({
                    sender_phone,
                    session_id,
                    message_text: textToAnalyze,
                    analysis,
                    customer_context: customerContext
                });
                result.lead_created = leadResult;
            }

            // Verificar se deve alertar vendedor
            if (this.shouldAlertSeller(analysis, customerContext)) {
                await this.alertSeller({
                    sender_phone,
                    analysis,
                    customer_context: customerContext,
                    message_text: textToAnalyze
                });
                result.alert_sent = true;
            }

            // Registrar evento
            await this.logWebhookEvent({
                type: 'message_processed',
                sender_phone,
                session_id,
                intent: analysis.intent,
                confidence: analysis.confidence,
                lead_created: !!result.lead_created,
                alert_sent: !!result.alert_sent
            });

            return result;
        } catch (error) {
            logger.error('Webhook: erro ao processar mensagem', {
                error: error.message,
                sender_phone,
                session_id
            });

            await this.logWebhookEvent({
                type: 'processing_error',
                sender_phone,
                session_id,
                error: error.message
            });

            return { success: false, error: error.message };
        }
    },

    /**
     * Obtém contexto do cliente
     */
    async getCustomerContext(phone) {
        try {
            // Buscar cliente Superbot
            const superbotCustomer = await SuperbotRepository.findCustomerByPhone(phone);

            // Buscar vínculo com leads-agent
            const linkedCustomer = await SuperbotService.findLinkedLeadsCustomer(phone);

            // Buscar estatísticas
            const stats = await SuperbotRepository.getCustomerStats(phone);

            // Sentimento recente
            const sentiment = await SuperbotService.analyzeCustomerSentiment(phone, { days: 7 });

            return {
                superbot_customer: superbotCustomer,
                leads_customer: linkedCustomer?.leads_customer,
                customer_name: linkedCustomer?.leads_customer?.nome || superbotCustomer?.name || superbotCustomer?.push_name,
                seller_id: linkedCustomer?.leads_customer?.cVendedor,
                seller_name: linkedCustomer?.link?.seller_name,
                stats,
                sentiment,
                is_linked: !!linkedCustomer
            };
        } catch (error) {
            logger.warn('Webhook: erro ao buscar contexto', { phone, error: error.message });
            return null;
        }
    },

    /**
     * Verifica se deve criar lead automaticamente
     */
    shouldCreateLead(analysis) {
        if (!CONFIG.AUTO_CREATE_LEADS) return false;
        if (!analysis) return false;

        const purchaseIntents = [
            'QUOTE_REQUEST',
            'PURCHASE_INTENT',
            'PRICE_CHECK'
        ];

        return (
            purchaseIntents.includes(analysis.intent) &&
            analysis.confidence >= CONFIG.MIN_CONFIDENCE_FOR_LEAD &&
            analysis.entities?.products?.length > 0
        );
    },

    /**
     * Cria lead a partir de mensagem
     */
    async createLeadFromMessage(data) {
        const { sender_phone, session_id, message_text, analysis, customer_context } = data;

        try {
            // Importar repository de leads
            const { getDatabase } = await import('../config/database.js');
            const db = getDatabase();

            // Buscar ou criar cliente
            let customerId = customer_context?.leads_customer?.cCliente;
            let sellerId = customer_context?.seller_id;

            if (!customerId) {
                // Cliente não vinculado - usar vendedor padrão ou criar lead avulso
                sellerId = sellerId || 1; // Vendedor padrão

                logger.info('Webhook: criando lead para cliente não vinculado', {
                    sender_phone,
                    products: analysis.entities?.products
                });
            }

            // Criar lead (sCart)
            const [result] = await db.query(`
        INSERT INTO sCart (cCustomer, cSeller, cType, xNote, dCart, xOrigin)
        VALUES (?, ?, 'lead', ?, NOW(), 'whatsapp')
      `, [
                customerId || 0,
                sellerId,
                `[Auto] Via WhatsApp: ${message_text.substring(0, 200)}...`
            ]);

            const leadId = result.insertId;

            // Adicionar itens ao lead (produtos extraídos)
            if (analysis.entities?.products?.length > 0) {
                for (const product of analysis.entities.products) {
                    // Tentar encontrar produto pelo código/query
                    const [products] = await db.query(`
            SELECT cProduto, xDescLoja, vVenda1 
            FROM mak.produtos 
            WHERE xDescLoja LIKE ? OR xCodFab LIKE ?
            LIMIT 1
          `, [`%${product.query || product.name}%`, `%${product.code || ''}%`]);

                    if (products.length > 0) {
                        const prod = products[0];
                        await db.query(`
              INSERT INTO sCartItem (cSCart, cProduto, nQtde, vUnitario, vTotal, xDesc)
              VALUES (?, ?, ?, ?, ?, ?)
            `, [
                            leadId,
                            prod.cProduto,
                            product.quantity || 1,
                            prod.vVenda1 || 0,
                            (product.quantity || 1) * (prod.vVenda1 || 0),
                            prod.xDescLoja
                        ]);
                    } else {
                        // Produto não encontrado - adicionar como observação
                        await db.query(`
              INSERT INTO sCartItem (cSCart, cProduto, nQtde, xDesc)
              VALUES (?, 0, ?, ?)
            `, [
                            leadId,
                            product.quantity || 1,
                            `[Não encontrado] ${product.query || product.name}`
                        ]);
                    }
                }
            }

            // Registrar origem do lead
            await db.query(`
        INSERT INTO superbot_lead_origins 
          (lead_id, session_id, superbot_customer_id, intent_detected, confidence, entities_json, auto_created)
        VALUES (?, ?, ?, ?, ?, ?, TRUE)
      `, [
                leadId,
                session_id,
                customer_context?.superbot_customer?.id || null,
                analysis.intent,
                analysis.confidence,
                JSON.stringify(analysis.entities)
            ]).catch(err => {
                // Tabela pode não existir ainda
                logger.warn('Webhook: erro ao registrar origem do lead', { error: err.message });
            });

            logger.info('Webhook: lead criado automaticamente', {
                leadId,
                sender_phone,
                intent: analysis.intent,
                products_count: analysis.entities?.products?.length || 0
            });

            return {
                success: true,
                lead_id: leadId,
                products_added: analysis.entities?.products?.length || 0
            };
        } catch (error) {
            logger.error('Webhook: erro ao criar lead', { error: error.message });
            return { success: false, error: error.message };
        }
    },

    /**
     * Verifica se deve alertar vendedor
     */
    shouldAlertSeller(analysis, customerContext) {
        if (!customerContext?.seller_id) return false;

        // Alertar em casos importantes
        const alertIntents = ['COMPLAINT', 'PURCHASE_INTENT', 'QUOTE_REQUEST'];
        const isUrgent = analysis.urgency === 'high';
        const isNegative = analysis.sentiment === 'negative';

        return (
            alertIntents.includes(analysis.intent) ||
            isUrgent ||
            isNegative
        );
    },

    /**
     * Alerta vendedor sobre mensagem importante
     */
    async alertSeller(data) {
        const { sender_phone, analysis, customer_context, message_text } = data;

        try {
            // Usar o novo sistema de notificações em tempo real
            await NotificationsService.notifyWhatsAppMessage(customer_context.seller_id, {
                phone: sender_phone,
                customerName: customer_context.customer_name,
                message: message_text,
                intent: analysis.intent,
                sentiment: analysis.sentiment,
                confidence: analysis.confidence
            });

            logger.info('Webhook: alerta enviado ao vendedor via NotificationsService', {
                seller_id: customer_context.seller_id,
                intent: analysis.intent,
                sentiment: analysis.sentiment
            });

            return true;
        } catch (error) {
            logger.warn('Webhook: erro ao alertar vendedor', { error: error.message });
            return false;
        }
    },

    /**
     * Adiciona mensagem à fila de processamento
     */
    async addToQueue(phone, payload) {
        if (processingQueue.size >= CONFIG.MAX_QUEUE_SIZE) {
            // Limpar mensagens antigas
            const now = Date.now();
            for (const [key, value] of processingQueue) {
                if (now - value.timestamp > 60000) {
                    processingQueue.delete(key);
                }
            }
        }

        const queueKey = `${phone}:${Date.now()}`;
        processingQueue.set(queueKey, {
            payload,
            timestamp: Date.now()
        });

        return {
            success: true,
            queued: true,
            queue_position: processingQueue.size
        };
    },

    /**
     * Processa fila de mensagens pendentes
     */
    async processQueue() {
        const entries = Array.from(processingQueue.entries());

        for (const [key, value] of entries) {
            try {
                await this.processIncomingMessage(value.payload);
                processingQueue.delete(key);
            } catch (error) {
                logger.error('Webhook: erro ao processar fila', { error: error.message });
            }
        }

        return { processed: entries.length };
    },

    /**
     * Registra evento do webhook para auditoria
     */
    async logWebhookEvent(event) {
        try {
            const logKey = `webhook:log:${Date.now()}`;
            await cacheSet(logKey, event, 86400); // 24h
        } catch (error) {
            // Ignorar erro de log
        }
    },

    /**
     * Obtém estatísticas do webhook
     */
    async getStats() {
        return {
            queue_size: processingQueue.size,
            auto_create_leads: CONFIG.AUTO_CREATE_LEADS,
            min_confidence: CONFIG.MIN_CONFIDENCE_FOR_LEAD,
            debounce_ms: CONFIG.DEBOUNCE_MS,
            ai_configured: SuperbotAIService.isConfigured()
        };
    }
};

export default SuperbotWebhookService;
