import { getDatabase as db } from '../../../../config/database.js';
import logger from '../../../../config/logger.js';

export const metricsTools = {
    definitions: [
        {
            type: 'function',
            function: {
                name: 'get_my_sales_metrics',
                description: 'Get sales performance metrics for a specific seller or yourself for the current month vs previous month.',
                parameters: {
                    type: 'object',
                    properties: {
                        sellerId: { type: 'integer', description: 'Optional: The ID of the seller to check. If not provided, defaults to the current user.' },
                        userId: { type: 'integer', description: 'The current user ID (auto-injected)' }
                    }
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'get_daily_sales_metrics',
                description: 'Get sales metrics for a specific day (defaults to today) for a seller or yourself. Use this to check daily performance.',
                parameters: {
                    type: 'object',
                    properties: {
                        date: { type: 'string', description: 'Optional: Date in YYYY-MM-DD format. Defaults to today.' },
                        sellerId: { type: 'integer', description: 'Optional: Seller ID' },
                        userId: { type: 'integer', description: 'Current user ID' }
                    }
                }
            }
        }
    ],

    handlers: {
        async get_daily_sales_metrics({ date, sellerId, userId, userLevel }) {
            let targetId = userId;
            if (userLevel > 1 && sellerId) targetId = sellerId;

            const targetDate = date || new Date().toISOString().split('T')[0];

            try {
                const [rows] = await db().execute(
                    `SELECT 
                        COALESCE(SUM(valor), 0) as total, 
                        COUNT(*) as count 
                     FROM mak.hoje 
                     WHERE vendedor = ? AND DATE(data) = DATE(?)
                     AND valor > 0 AND nop IN (27, 28, 51, 76)`,
                    [targetId, targetDate]
                );

                return JSON.stringify({
                    date: targetDate,
                    total: parseFloat(rows[0].total),
                    orders_count: rows[0].count,
                    summary: `No dia ${targetDate}, o total de vendas foi de R$ ${parseFloat(rows[0].total).toLocaleString('pt-BR')} em ${rows[0].count} pedidos.`
                });
            } catch (error) {
                logger.error('Tool Error get_daily_sales_metrics:', error);
                return JSON.stringify({ error: error.message });
            }
        },

        async get_my_sales_metrics({ userId, sellerId, userLevel }) {
            // SEGURANÇA: Se for Level 1, só pode ver a si mesmo
            let targetId = userId;
            if (userLevel > 1 && sellerId) {
                targetId = sellerId;
            }

            if (!targetId) return JSON.stringify({ error: 'User ID is required' });

            try {
                const now = new Date();
                const year = now.getFullYear();
                const month = now.getMonth() + 1;
                const prevMonth = month === 1 ? 12 : month - 1;
                const prevYear = month === 1 ? year - 1 : year;

                // Vendas do mês atual
                const [currentRows] = await db().execute(
                    `SELECT 
            COALESCE(SUM(valor), 0) as total, 
            COUNT(*) as count 
           FROM mak.hoje 
           WHERE vendedor = ? AND YEAR(data) = ? AND MONTH(data) = ?
           AND valor > 0 AND nop IN (27, 28, 51, 76)`,
                    [targetId, year, month]
                );

                // Vendas do mês anterior
                const [prevRows] = await db().execute(
                    `SELECT 
            COALESCE(SUM(valor), 0) as total 
           FROM mak.hoje 
           WHERE vendedor = ? AND YEAR(data) = ? AND MONTH(data) = ?
           AND valor > 0 AND nop IN (27, 28, 51, 76)`,
                    [targetId, prevYear, prevMonth]
                );

                const currentTotal = parseFloat(currentRows[0].total);
                const prevTotal = parseFloat(prevRows[0].total);
                const variation = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : 0;

                return JSON.stringify({
                    period: `${month}/${year}`,
                    sales: {
                        current_month: currentTotal,
                        previous_month: prevTotal,
                        variation_percent: variation.toFixed(2),
                        orders_count: currentRows[0].count
                    },
                    summary: `Você vendeu R$ ${currentTotal.toLocaleString('pt-BR')} neste mês até agora, uma variação de ${variation.toFixed(2)}% em relação ao mês anterior.`
                });
            } catch (error) {
                logger.error('Tool Error get_my_sales_metrics:', error);
                return JSON.stringify({ error: error.message });
            }
        }
    }
};
