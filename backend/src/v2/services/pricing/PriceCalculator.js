import logger from '../../../config/logger.js';

/**
 * Price Calculator - Calcula preço base, descontos e margens.
 * Implementa a lógica matemática do Pricing Agent.
 */
export class PriceCalculator {
    /**
     * Executa o cálculo econômico da transação.
     * @param {Array} items - Lista de itens (product_id, quantity, unit_price_manual?)
     * @param {Object} customerContext - Dados do cliente
     * @param {Object} policyEvaluation - Resultado do PolicyEngine (limites e políticas)
     */
    async calculate(items = [], customerContext, policyEvaluation) {
        logger.info('V2: PriceCalculator starting specialized calculation');

        const { limits } = policyEvaluation;

        let subtotal_gross = 0;
        let total_discounts = 0;
        let total_cost = 0;
        const processedItems = [];

        // 1. Processar cada item
        for (const item of items) {
            // TODO: Em produção, buscar unit_price_list e unit_cost do banco/cache
            // Por enquanto usamos mocks ou valores passados
            const unit_price_list = item.unit_price_list || 100.0;
            const unit_cost = item.unit_cost || 60.0;
            const quantity = item.quantity || 1;

            const total_item_gross = unit_price_list * quantity;

            // Preço aplicado (pode vir de um input manual do vendedor)
            const unit_price_applied = item.unit_price_applied || unit_price_list;
            const total_item_net = unit_price_applied * quantity;

            const item_discount_absolute = total_item_gross - total_item_net;
            const item_discount_percent = (item_discount_absolute / total_item_gross) * 100;

            const item_margin_absolute = total_item_net - (unit_cost * quantity);
            const item_margin_percent = (item_margin_absolute / total_item_net) * 100;

            processedItems.push({
                ...item,
                unit_price_list,
                unit_price_applied,
                unit_cost,
                quantity,
                total_gross: total_item_gross,
                total_net: total_item_net,
                discount_percent: Math.round(item_discount_percent * 100) / 100,
                margin_percent: Math.round(item_margin_percent * 100) / 100
            });

            subtotal_gross += total_item_gross;
            total_discounts += item_discount_absolute;
            total_cost += (unit_cost * quantity);
        }

        const subtotal_net = subtotal_gross - total_discounts;
        const total_margin_absolute = subtotal_net - total_cost;
        const total_margin_percent = (total_margin_absolute / subtotal_net) * 100;
        const total_discount_percent = (total_discounts / subtotal_gross) * 100;

        // 2. Validar contra Políticas
        const margin_ok = total_margin_percent >= (limits.min_margin_percent || 0);
        const discount_ok = total_discount_percent <= (limits.max_discount_percent || 100);
        const credit_ok = !limits.credit_restricted;

        const is_within_policy = margin_ok && discount_ok && credit_ok;

        return {
            price_base: subtotal_gross,
            price_final: subtotal_net,
            discount_total: total_discounts,
            discount_percent: Math.round(total_discount_percent * 100) / 100,
            margin_absolute: total_margin_absolute,
            margin_percent: Math.round(total_margin_percent * 100) / 100,
            total_cost,
            items: processedItems,
            is_within_policy,
            requires_approval: !is_within_policy,
            validation_details: {
                margin_ok,
                discount_ok,
                credit_ok,
                min_margin_required: limits.min_margin_percent,
                max_discount_allowed: limits.max_discount_percent
            }
        };
    }
}
