import { ReplacementService } from '../services/analytics/ReplacementService.js';
import { customerGoalsService } from '../services/analytics/CustomerGoalsService.js';

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

    /**
     * GET /api/v2/analytics/goals/seller/:sellerId
     * Retorna metas de clientes para um vendedor específico
     */
    async getCustomerGoalsBySeller(req, res, next) {
        try {
            const sellerId = parseInt(req.params.sellerId);
            const {
                year,
                month,
                classification,
                limit,
                offset,
                order_by: orderBy // mapeando snake_case da query para camelCase
            } = req.query;

            const result = await customerGoalsService.getBySeller(sellerId, {
                year: year ? parseInt(year) : undefined,
                month: month ? parseInt(month) : undefined,
                classification,
                limit: limit ? parseInt(limit) : undefined,
                offset: offset ? parseInt(offset) : undefined,
                orderBy,
                requestUserId: req.user?.id,
                requestUserLevel: req.user?.level || 0
            });

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v2/analytics/goals/customer/:customerId
     * Retorna meta de um cliente específico
     */
    async getCustomerGoal(req, res, next) {
        try {
            const customerId = parseInt(req.params.customerId);
            const { year } = req.query;

            const result = await customerGoalsService.getByCustomer(customerId, year ? parseInt(year) : undefined);

            // Verificar permissão se necessário (se vendedor pode ver este cliente)
            // Aqui estamos assumindo que o service ou middleware já cuidou disso ou que é aberto para vendedores verem metas

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v2/analytics/goals/ranking
     * Retorna ranking de clientes
     */
    async getCustomerGoalsRanking(req, res, next) {
        try {
            const {
                seller_id: sellerId,
                year,
                limit,
                order_by: orderBy
            } = req.query;

            const result = await customerGoalsService.getRanking({
                sellerId: sellerId ? parseInt(sellerId) : undefined,
                year: year ? parseInt(year) : undefined,
                limit: limit ? parseInt(limit) : undefined,
                orderBy
            });

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}
