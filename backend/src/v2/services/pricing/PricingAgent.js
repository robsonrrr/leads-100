import { PolicyEngine } from './PolicyEngine.js';
import { PriceCalculator } from './PriceCalculator.js';
import { RiskClassifier } from './RiskClassifier.js';
import { DecisionLogger } from './DecisionLogger.js';
import { ExceptionHandler } from './ExceptionHandler.js';
import { FreezeManager } from './FreezeManager.js';
import { aiService } from '../ai/AIService.js';
import { CustomerRepository } from '../../../repositories/customer.repository.js';
import { ProductRepository } from '../../../repositories/product.repository.js';
import { alertRepository } from '../../../repositories/alert.repository.js';
import { churnService } from '../analytics/ChurnService.js';
import logger from '../../../config/logger.js';

/**
 * Pricing Agent - Autoridade Única de Preços (V2)
 */
class PricingAgent {
    constructor() {
        this.policyEngine = new PolicyEngine();
        this.calculator = new PriceCalculator();
        this.riskClassifier = new RiskClassifier();
        this.logger = new DecisionLogger();
        this.exceptionHandler = new ExceptionHandler();
        this.freezeManager = new FreezeManager();

        this.customerRepo = new CustomerRepository();
        this.productRepo = new ProductRepository();

        this.initialized = false;
    }

    async initialize() {
        if (!this.initialized) {
            await this.policyEngine.loadPolicies();
            this.initialized = true;
            logger.info('V2: Pricing Agent initialized');
        }
    }

    /**
     * Cálculo e validação de preço com IA e Governança
     */
    async calculate(params) {
        try {
            await this.initialize();
            logger.info('V2: PricingAgent calculation started', { customer_id: params.customer_id });

            // 1. Construir Contexto Real (Busca no DB)
            const context = await this.buildContext(params);

            // Verificação de segurança: Price Freeze
            if (params.previous_event_id) {
                const isFrozen = await this.freezeManager.checkIsFrozen(params.previous_event_id);
                if (isFrozen) {
                    throw new Error('ESTE_PRECO_ESTA_CONGELADO: Alterações não permitidas após conversão.');
                }
            }

            // 2. Avaliar Políticas
            const policyEvaluation = await this.policyEngine.evaluate(context);
            context.policy_context = policyEvaluation;

            // 3. Enriquecer itens com dados de Custo/Lista do DB
            const enrichedItems = await this.enrichItems(params.items);

            // 4. Calcular Valores
            const pricingResult = await this.calculator.calculate(
                enrichedItems,
                context.customer_context,
                policyEvaluation
            );

            // 5. Adicionar Recomendações de IA (Bloco 3 do Q1)
            if (pricingResult.items && pricingResult.items.length > 0) {
                for (const item of pricingResult.items) {
                    item.ai_recommendation = await aiService.suggestPrice(
                        item.product_id,
                        params.customer_id,
                        {
                            unit_price_list: item.unit_price_list,
                            unit_cost: item.unit_cost,
                            limits: policyEvaluation.limits
                        }
                    );
                }
            }

            // 6. Classificar Risco
            const riskLevel = this.riskClassifier.classify(pricingResult, context.customer_context);

            // 7. Registrar Decisão
            const decisionEvent = await this.logger.log({
                source: params.source || 'CRM',
                action: params.action || 'CALCULATE',
                customer_context: context.customer_context,
                seller_context: context.seller_context,
                transaction_context: {
                    ...context.transaction_context,
                    lead_id: params.lead_id,
                    cart_id: params.cart_id,
                    items: enrichedItems
                },
                policy_context: context.policy_context,
                pricing_result: pricingResult,
                risk_level: riskLevel,
                compliance_status: pricingResult.is_within_policy ? 'APPROVED' : 'PENDING_APPROVAL',
                is_within_policy: pricingResult.is_within_policy,
                requires_approval: pricingResult.requires_approval,
                metadata: {
                    created_by: params.seller_id,
                    ip_address: params.ip_address,
                    previous_event_id: params.previous_event_id
                }
            });

            // 8. Alerta Proativo se Risco Alto ou Crítico
            if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
                try {
                    await alertRepository.create({
                        userId: params.seller_id,
                        type: riskLevel === 'CRITICAL' ? 'danger' : 'warning',
                        category: 'PRICING_RISK',
                        title: `Risco ${riskLevel} em simulação`,
                        description: `Uma simulação de preço para o cliente #${params.customer_id} resultou em risco ${riskLevel}. Margem: ${pricingResult.margin_percent.toFixed(1)}%.`,
                        referenceId: decisionEvent.id
                    });
                } catch (alertError) {
                    logger.error('Failed to create risk alert:', alertError);
                }
            }

            return {
                ...decisionEvent,
                risk_action: this.riskClassifier.suggestAction(riskLevel)
            };
        } catch (error) {
            logger.error('V2: PricingAgent calculation failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Busca dados reais de custo e preço de lista para os itens
     */
    async enrichItems(items = []) {
        return await Promise.all(items.map(async (item) => {
            const product = await this.productRepo.findById(item.product_id);
            return {
                ...item,
                product_id: item.product_id,
                unit_price_list: product ? parseFloat(product.revenda) : (item.unit_price_list || 0),
                unit_cost: product ? parseFloat(product.custo) : (item.unit_cost || 0),
                name: product ? product.nome : (item.name || 'Produto Desconhecido')
            };
        }));
    }

    /**
     * Constrói contexto real buscando dados dos Repositories
     */
    async buildContext(params) {
        const customer = await this.customerRepo.findById(params.customer_id);

        // Simplificação para o seller (TODO: Buscar no repository se necessário)
        const seller_context = {
            seller_id: params.seller_id,
            level: params.seller_level || 1
        };

        const churnData = await churnService.getScore(params.customer_id);

        return {
            customer_context: {
                customer_id: params.customer_id,
                name: customer ? customer.name : 'Unknown',
                credit_status: customer ? (customer.creditLimit > 0 ? 'APPROVED' : 'RESTRICTED') : 'UNKNOWN',
                segment: customer ? customer.segment : 'GERAL',
                churn_risk: churnData ? churnData.risk_level : 'UNKNOWN',
                churn_score: churnData ? churnData.score : 0
            },
            seller_context,
            transaction_context: {
                items_count: params.items?.length || 0
            }
        };
    }

    async requestException(event_id, reason, seller_id) {
        // Placeholder - No futuro buscaria o evento real para validar
        const mockEvent = { event_id, metadata: { created_by: seller_id }, pricing_result: { discount_percent: 15, margin_absolute: 500 } };
        return await this.exceptionHandler.request(mockEvent, reason);
    }

    async freeze(event_id) {
        return await this.freezeManager.freeze(event_id);
    }
}

export const pricingAgent = new PricingAgent();
