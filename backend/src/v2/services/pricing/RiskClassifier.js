/**
 * Risk Classifier - Classifica o risco econômico da decisão.
 * Ajuda gerentes a priorizarem aprovações e auditorias.
 */
export class RiskClassifier {
    /**
     * Classifica o nível de risco de uma transação.
     * @param {Object} pricingResult - Resultado do PriceCalculator
     * @param {Object} customerContext - Contexto do cliente
     */
    classify(pricingResult, customerContext) {
        const { margin_percent, is_within_policy, validation_details = {} } = pricingResult;
        const churnScore = customerContext?.churn_score || 0;

        // 1. Risco CRÍTICO: Margem negativa ou churn crítico com margem baixa
        if (margin_percent < 0) return 'CRITICAL';
        if (churnScore >= 80 && margin_percent < 10) return 'CRITICAL';

        // 2. Risco ALTO: Violação de crédito ou churn alto com margem no limite
        if (validation_details.credit_ok === false) return 'HIGH';
        if (churnScore >= 60 && !is_within_policy) return 'HIGH';
        if (margin_percent < (validation_details.min_margin_required - 5)) return 'HIGH';

        // 3. Risco MÉDIO: Fora da política, crédito restrito ou churn moderado
        if (!is_within_policy) return 'MEDIUM';
        if (customerContext?.credit_status === 'RESTRICTED') return 'MEDIUM';
        if (churnScore >= 40) return 'MEDIUM';

        // 4. Risco BAIXO: Tudo dentro dos conformes
        return 'LOW';
    }

    /**
     * Sugere uma ação baseada no nível de risco.
     */
    suggestAction(riskLevel) {
        switch (riskLevel) {
            case 'CRITICAL':
                return '⚠️ BLOQUEAR: Margem inviável ou risco extremo de churn. Requer intervenção da diretoria.';
            case 'HIGH':
                return '🔍 REVISAR: Margem abaixo da política ou situação financeira instável. Requer aprovação da gerência.';
            case 'MEDIUM':
                return '📈 MONITORAR: Leve desvio da política. Aprovação automática permitida com acompanhamento.';
            default:
                return '✅ APROVAR: Operação saudável e dentro das políticas.';
        }
    }
}
