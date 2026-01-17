import { ReplacementService } from '../services/analytics/ReplacementService.js';

const replacementService = new ReplacementService();

export class AnalyticsController {

    /**
     * GET /api/v2/analytics/replenishment
     * Retorna sugestões de reposição para clientes da carteira
     */
    async getReplenishmentSuggestions(req, res, next) {
        try {
            const sellerId = req.user?.id; // Assumindo auth middleware já popula req.user
            const { customerId } = req.query;

            // Se for admin, pode não ter sellerId ou ver todos
            // Mas assumindo contexto de vendedor por enquanto

            const suggestions = await replacementService.getReplenishmentSuggestions(sellerId, customerId);

            res.json({
                success: true,
                data: suggestions,
                meta: {
                    count: suggestions.length,
                    explanation: "Sugestões baseadas no consumo médio dos últimos 12 meses para produtos recorrentes (3+ compras)."
                }
            });
        } catch (error) {
            next(error);
        }
    }
}
