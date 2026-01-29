/**
 * Superbot Routes
 * 
 * Rotas REST para integração com Superbot
 * 
 * @version 1.1
 * @date 2026-01-18
 */

import { Router } from 'express';
import { SuperbotController } from '../controllers/superbot.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// ============================================
// ROTAS PÚBLICAS (sem autenticação)
// O webhook precisa ser acessível externamente
// ============================================

/**
 * @swagger
 * /api/superbot/webhook:
 *   post:
 *     tags: [Superbot]
 *     summary: Recebe mensagens do Superbot (webhook público)
 *     description: Endpoint para receber mensagens. Valida assinatura HMAC em produção.
 */
router.post('/webhook', SuperbotController.receiveWebhook);

// ============================================
// ROTAS PROTEGIDAS (requerem autenticação)
// ============================================
router.use(authenticateToken);

/**
 * @swagger
 * /api/superbot/customers:
 *   get:
 *     tags: [Superbot]
 *     summary: Lista clientes do Superbot
 *     security:
 *       - bearerAuth: []
 */
router.get('/customers', SuperbotController.listCustomers);

/**
 * @swagger
 * /api/superbot/customers/{phone}:
 *   get:
 *     tags: [Superbot]
 *     summary: Busca cliente por telefone
 *     security:
 *       - bearerAuth: []
 */
router.get('/customers/:phone', SuperbotController.getCustomerByPhone);

/**
 * @swagger
 * /api/superbot/conversations/{phone}:
 *   get:
 *     tags: [Superbot]
 *     summary: Histórico de conversas de um cliente
 *     security:
 *       - bearerAuth: []
 */
router.get('/conversations/:phone', SuperbotController.getConversations);

/**
 * @swagger
 * /api/superbot/messages/{sessionId}:
 *   get:
 *     tags: [Superbot]
 *     summary: Mensagens de uma sessão
 *     security:
 *       - bearerAuth: []
 */
router.get('/messages/:sessionId', SuperbotController.getMessages);

/**
 * @swagger
 * /api/superbot/stats/{phone}:
 *   get:
 *     tags: [Superbot]
 *     summary: Estatísticas de um cliente
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats/:phone', SuperbotController.getStats);

/**
 * @swagger
 * /api/superbot/transcriptions/{phone}:
 *   get:
 *     tags: [Superbot]
 *     summary: Transcrições de áudio
 *     security:
 *       - bearerAuth: []
 */
router.get('/transcriptions/:phone', SuperbotController.getTranscriptions);

/**
 * @swagger
 * /api/superbot/sentiment/{phone}:
 *   get:
 *     tags: [Superbot]
 *     summary: Análise de sentimento
 *     security:
 *       - bearerAuth: []
 */
router.get('/sentiment/:phone', SuperbotController.getSentiment);

/**
 * @swagger
 * /api/superbot/context/{phone}:
 *   get:
 *     tags: [Superbot]
 *     summary: Contexto enriquecido para chatbot
 *     security:
 *       - bearerAuth: []
 */
router.get('/context/:phone', SuperbotController.getContext);

/**
 * @swagger
 * /api/superbot/analyze-intent:
 *   post:
 *     tags: [Superbot]
 *     summary: Analisa intenção de uma mensagem (básico)
 *     security:
 *       - bearerAuth: []
 */
router.post('/analyze-intent', SuperbotController.analyzeIntent);

/**
 * @swagger
 * /api/superbot/analyze-intent-ai:
 *   post:
 *     tags: [Superbot]
 *     summary: Analisa intenção de uma mensagem usando OpenAI GPT
 *     security:
 *       - bearerAuth: []
 */
router.post('/analyze-intent-ai', SuperbotController.analyzeIntentAI);

/**
 * @swagger
 * /api/superbot/detect-purchase-intent:
 *   post:
 *     tags: [Superbot]
 *     summary: Detecta intenção de compra em uma mensagem
 *     security:
 *       - bearerAuth: []
 */
router.post('/detect-purchase-intent', SuperbotController.detectPurchaseIntent);

/**
 * @swagger
 * /api/superbot/extract-products:
 *   post:
 *     tags: [Superbot]
 *     summary: Extrai produtos mencionados em uma mensagem
 *     security:
 *       - bearerAuth: []
 */
router.post('/extract-products', SuperbotController.extractProducts);

/**
 * @swagger
 * /api/superbot/suggested-links:
 *   get:
 *     tags: [Superbot]
 *     summary: Sugestões de links entre clientes
 *     security:
 *       - bearerAuth: []
 */
router.get('/suggested-links', SuperbotController.getSuggestedLinks);

/**
 * @swagger
 * /api/superbot/link:
 *   post:
 *     tags: [Superbot]
 *     summary: Cria vínculo entre clientes
 *     security:
 *       - bearerAuth: []
 */
router.post('/link', SuperbotController.createLink);

/**
 * @swagger
 * /api/superbot/link:
 *   delete:
 *     tags: [Superbot]
 *     summary: Remove vínculo entre clientes
 *     security:
 *       - bearerAuth: []
 */
router.delete('/link', SuperbotController.removeLink);

/**
 * @swagger
 * /api/superbot/linked-customer/{phone}:
 *   get:
 *     tags: [Superbot]
 *     summary: Busca cliente leads-agent vinculado
 *     security:
 *       - bearerAuth: []
 */
router.get('/linked-customer/:phone', SuperbotController.getLinkedCustomer);

// ============================================
// WEBHOOK ENDPOINTS (protegidos)
// ============================================

/**
 * @swagger
 * /api/superbot/webhook/status:
 *   get:
 *     tags: [Superbot]
 *     summary: Status do webhook
 *     security:
 *       - bearerAuth: []
 */
router.get('/webhook/status', SuperbotController.getWebhookStatus);

/**
 * @swagger
 * /api/superbot/webhook/process-queue:
 *   post:
 *     tags: [Superbot]
 *     summary: Processa fila de mensagens pendentes
 *     security:
 *       - bearerAuth: []
 */
router.post('/webhook/process-queue', SuperbotController.processWebhookQueue);

/**
 * @swagger
 * /api/superbot/webhook/test:
 *   post:
 *     tags: [Superbot]
 *     summary: Testa o webhook com mensagem simulada
 *     security:
 *       - bearerAuth: []
 */
router.post('/webhook/test', SuperbotController.testWebhook);

// ============================================
// CHATBOT INTEGRATION ENDPOINTS
// ============================================

/**
 * @swagger
 * /api/superbot/chatbot/context/{phone}:
 *   get:
 *     tags: [Superbot]
 *     summary: Retorna contexto enriquecido para o chatbot
 *     security:
 *       - bearerAuth: []
 */
router.get('/chatbot/context/:phone', SuperbotController.getChatbotContext);

/**
 * @swagger
 * /api/superbot/chatbot/prompt/{phone}:
 *   get:
 *     tags: [Superbot]
 *     summary: Retorna contexto formatado como prompt para IA
 *     security:
 *       - bearerAuth: []
 */
router.get('/chatbot/prompt/:phone', SuperbotController.getChatbotPrompt);

/**
 * @swagger
 * /api/superbot/chatbot/validate-discount:
 *   post:
 *     tags: [Superbot]
 *     summary: Valida desconto solicitado via WhatsApp
 *     security:
 *       - bearerAuth: []
 */
router.post('/chatbot/validate-discount', SuperbotController.validateDiscount);

/**
 * @swagger
 * /api/superbot/chatbot/log-event:
 *   post:
 *     tags: [Superbot]
 *     summary: Registra evento de interação WhatsApp
 *     security:
 *       - bearerAuth: []
 */
router.post('/chatbot/log-event', SuperbotController.logChatbotEvent);

// ============================================
// ANALYTICS ENDPOINTS
// ============================================

/**
 * @swagger
 * /api/superbot/analytics/dashboard:
 *   get:
 *     tags: [Superbot]
 *     summary: Dashboard completo de analytics WhatsApp
 *     security:
 *       - bearerAuth: []
 */
router.get('/analytics/dashboard', SuperbotController.getDashboard);

/**
 * @swagger
 * /api/superbot/analytics/summary:
 *   get:
 *     tags: [Superbot]
 *     summary: Resumo geral de WhatsApp
 *     security:
 *       - bearerAuth: []
 */
router.get('/analytics/summary', SuperbotController.getAnalyticsSummary);

/**
 * @swagger
 * /api/superbot/analytics/messages-by-day:
 *   get:
 *     tags: [Superbot]
 *     summary: Mensagens por dia
 *     security:
 *       - bearerAuth: []
 */
router.get('/analytics/messages-by-day', SuperbotController.getMessagesByDay);

/**
 * @swagger
 * /api/superbot/analytics/messages-by-hour:
 *   get:
 *     tags: [Superbot]
 *     summary: Distribuição de mensagens por hora
 *     security:
 *       - bearerAuth: []
 */
router.get('/analytics/messages-by-hour', SuperbotController.getMessagesByHour);

/**
 * @swagger
 * /api/superbot/analytics/top-customers:
 *   get:
 *     tags: [Superbot]
 *     summary: Top clientes por mensagens
 *     security:
 *       - bearerAuth: []
 */
router.get('/analytics/top-customers', SuperbotController.getTopCustomers);

/**
 * @swagger
 * /api/superbot/analytics/intents:
 *   get:
 *     tags: [Superbot]
 *     summary: Distribuição de intenções detectadas
 *     security:
 *       - bearerAuth: []
 */
router.get('/analytics/intents', SuperbotController.getIntentDistribution);

/**
 * @swagger
 * /api/superbot/analytics/conversion:
 *   get:
 *     tags: [Superbot]
 *     summary: Métricas de conversão
 *     security:
 *       - bearerAuth: []
 */
router.get('/analytics/conversion', SuperbotController.getConversionMetrics);

/**
 * @swagger
 * /api/superbot/analytics/response:
 *   get:
 *     tags: [Superbot]
 *     summary: Métricas de tempo de resposta
 *     security:
 *       - bearerAuth: []
 */
router.get('/analytics/response', SuperbotController.getResponseMetrics);

// ============================================
// SELLER PHONES - Gerenciar telefones de vendedores
// ============================================

/**
 * @swagger
 * /api/superbot/seller-phones:
 *   get:
 *     tags: [Superbot]
 *     summary: Lista todos os telefones de vendedores
 *     security:
 *       - bearerAuth: []
 */
router.get('/seller-phones', SuperbotController.listSellerPhones);

/**
 * @swagger
 * /api/superbot/seller-phones/user/{userId}:
 *   get:
 *     tags: [Superbot]
 *     summary: Busca telefones de um vendedor específico
 *     security:
 *       - bearerAuth: []
 */
router.get('/seller-phones/user/:userId', SuperbotController.getSellerPhones);

/**
 * @swagger
 * /api/superbot/seller-phones:
 *   post:
 *     tags: [Superbot]
 *     summary: Adiciona telefone a um vendedor
 *     security:
 *       - bearerAuth: []
 */
router.post('/seller-phones', SuperbotController.addSellerPhone);

/**
 * @swagger
 * /api/superbot/seller-phones/{phoneNumber}:
 *   delete:
 *     tags: [Superbot]
 *     summary: Remove telefone de vendedor
 *     security:
 *       - bearerAuth: []
 */
router.delete('/seller-phones/:phoneNumber', SuperbotController.removeSellerPhone);

/**
 * @swagger
 * /api/superbot/seller-phones/seller/{phone}:
 *   get:
 *     tags: [Superbot]
 *     summary: Busca vendedor pelo telefone do bot
 *     security:
 *       - bearerAuth: []
 */
router.get('/seller-phones/seller/:phone', SuperbotController.getSellerByPhone);

/**
 * @swagger
 * /api/superbot/my-customers:
 *   get:
 *     tags: [Superbot]
 *     summary: Lista clientes do vendedor logado (filtrado por level)
 *     security:
 *       - bearerAuth: []
 */
router.get('/my-customers', SuperbotController.listCustomersBySeller);

// ============================================
// LID (Linked ID) MANAGEMENT - WhatsApp Business API
// ============================================
// LIDs são identificadores usados quando clientes contactam via Facebook/Instagram ads

/**
 * @swagger
 * /api/superbot/lid/stats:
 *   get:
 *     tags: [Superbot]
 *     summary: Estatísticas de LIDs no sistema
 *     security:
 *       - bearerAuth: []
 */
router.get('/lid/stats', SuperbotController.getLidStats);

/**
 * @swagger
 * /api/superbot/lid/mappings:
 *   get:
 *     tags: [Superbot]
 *     summary: Lista mapeamentos LID -> telefone
 *     security:
 *       - bearerAuth: []
 */
router.get('/lid/mappings', SuperbotController.listLidMappings);

/**
 * @swagger
 * /api/superbot/lid/resolve/{lid}:
 *   get:
 *     tags: [Superbot]
 *     summary: Resolve um LID para telefone real
 *     security:
 *       - bearerAuth: []
 */
router.get('/lid/resolve/:lid', SuperbotController.resolveLid);

/**
 * @swagger
 * /api/superbot/lid/mappings:
 *   post:
 *     tags: [Superbot]
 *     summary: Cria ou atualiza mapeamento LID -> telefone
 *     security:
 *       - bearerAuth: []
 */
router.post('/lid/mappings', SuperbotController.createLidMapping);

/**
 * @swagger
 * /api/superbot/lid/mappings/{lid}:
 *   delete:
 *     tags: [Superbot]
 *     summary: Remove mapeamento LID
 *     security:
 *       - bearerAuth: []
 */
router.delete('/lid/mappings/:lid', SuperbotController.deleteLidMapping);

/**
 * @swagger
 * /api/superbot/lid/potential-mappings:
 *   get:
 *     tags: [Superbot]
 *     summary: Encontra potenciais mapeamentos baseado em push_name
 *     security:
 *       - bearerAuth: []
 */
router.get('/lid/potential-mappings', SuperbotController.findPotentialLidMappings);

/**
 * @swagger
 * /api/superbot/lid/check/{phone}:
 *   get:
 *     tags: [Superbot]
 *     summary: Verifica se um número é LID
 *     security:
 *       - bearerAuth: []
 */
router.get('/lid/check/:phone', SuperbotController.checkIsLid);

export default router;
