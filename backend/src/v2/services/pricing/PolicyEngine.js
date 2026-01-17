import logger from '../../../config/logger.js';
import { query } from '../../../config/database.js';

/**
 * Policy Engine - Carrega e executa políticas de preço
 * Responsável por garantir que toda decisão respeite as diretrizes comerciais.
 */
export class PolicyEngine {
    constructor() {
        this.policies = [];
        this.version = 'v1-2026';
    }

    /**
     * Carrega as políticas ativas do banco de dados.
     * Se não houver políticas no banco, usa as diretrizes padrão do Q1 2026.
     */
    async loadPolicies(version = 'latest') {
        try {
            logger.info('V2: Loading policies', { version });

            const sql = `
        SELECT * FROM pricing_policies 
        WHERE is_active = 1 
        AND (effective_until IS NULL OR effective_until >= CURDATE())
        ORDER BY priority ASC
      `;

            try {
                const results = await query(sql);
                if (results && results.length > 0) {
                    this.policies = results.map(p => ({
                        ...p,
                        config: typeof p.config === 'string' ? JSON.parse(p.config) : p.config
                    }));
                    return this.policies;
                }
            } catch (dbError) {
                logger.warn('V2: pricing_policies table not found or empty, using Q1 defaults', { error: dbError.message });
            }

            // Fallback: Políticas padrão do Q1 2026 (Hardcoded até que o banco esteja pronto)
            this.policies = this.getDefaultQ1Policies();
            return this.policies;
        } catch (error) {
            logger.error('V2: Error loading policies', { error: error.message });
            throw error;
        }
    }

    /**
     * Avalia o contexto atual contra todas as políticas carregadas.
     * @param {Object} context - Ver SPEC_PRICING_SCHEMAS.md (customer_context, seller_context, etc)
     */
    async evaluate(context) {
        logger.info('V2: Evaluating policies for context');

        const applied_policies = [];
        const limits = {
            min_margin_percent: 20, // Padrão Q1
            max_discount_percent: 5,  // Padrão conservador
            requires_approval_above: 5,
            credit_restricted: false
        };

        const { customer_context, seller_context, transaction_context } = context;

        // 1. Processar cada política carregada
        for (const policy of this.policies) {
            const isApplicable = this.checkConditions(policy, context);

            if (isApplicable) {
                applied_policies.push({
                    policy_id: policy.policy_id,
                    policy_name: policy.policy_name,
                    policy_type: policy.policy_type,
                    priority: policy.priority,
                    reason: `Aplicada via regra: ${policy.policy_name}`
                });

                // Aplicar efeitos da política nos limites
                this.applyPolicyEffect(policy, limits, context);
            }
        }

        // 2. Validações de segurança obrigatórias (Hardcoded Safety Net)
        if (customer_context?.credit_status === 'BLOCKED') {
            limits.credit_restricted = true;
            applied_policies.push({
                policy_id: 'SAFETY_NET_CREDIT',
                policy_name: 'Bloqueio de Crédito Compulsório',
                policy_type: 'CREDIT_RESTRICTION',
                priority: 0,
                reason: 'Cliente com status BLOCKED no sistema'
            });
        }

        return {
            policy_version: this.version,
            applied_policies,
            limits
        };
    }

    /**
     * Verifica se as condições de uma política são atendidas pelo contexto.
     */
    checkConditions(policy, context) {
        // Implementação simplificada de engine de regras
        // No futuro, usar algo como json-rules-engine
        const { config } = policy;
        if (!config || !config.conditions) return true;

        // Por enquanto, retorna true para políticas sem condições complexas
        return true;
    }

    /**
     * Atualiza o objeto de limites baseado na ação da política.
     */
    applyPolicyEffect(policy, limits, context) {
        const { policy_type, config } = policy;

        switch (policy_type) {
            case 'MINIMUM_MARGIN':
                limits.min_margin_percent = Math.max(limits.min_margin_percent, config.value || 0);
                break;
            case 'DISCOUNT_LIMIT':
                // No Q1, o limite depende do nível do vendedor
                const sellerLevel = context.seller_context?.level || 1;
                if (config.levels && config.levels[sellerLevel]) {
                    limits.max_discount_percent = config.levels[sellerLevel];
                    limits.requires_approval_above = config.levels[sellerLevel];
                }
                break;
            case 'CREDIT_RESTRICTION':
                if (context.customer_context?.credit_status === 'RESTRICTED') {
                    limits.credit_restricted = true;
                }
                break;
        }
    }

    /**
     * Define as políticas padrão caso o banco de dados não esteja populado.
     */
    getDefaultQ1Policies() {
        return [
            {
                policy_id: 'POL-Q1-MARGIN-001',
                policy_name: 'Margem Mínima Q1 2026',
                policy_type: 'MINIMUM_MARGIN',
                priority: 10,
                config: { value: 20 }
            },
            {
                policy_id: 'POL-Q1-DISCOUNT-001',
                policy_name: 'Limites de Desconto por Nível Q1',
                policy_type: 'DISCOUNT_LIMIT',
                priority: 20,
                config: {
                    levels: {
                        1: 5,  // Nível 1: 5%
                        2: 7,
                        3: 10, // Nível 3: 10%
                        4: 12,
                        5: 15,
                        6: 20
                    }
                }
            }
        ];
    }
}
