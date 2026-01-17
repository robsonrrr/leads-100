import { getDatabase } from '../../../config/database.js';
import logger from '../../../config/logger.js';

const db = () => getDatabase();

export class ChurnService {
    /**
     * Calcula o score de churn para um cliente específico ou para todos
     */
    async calculateScores(customerId = null) {
        try {
            logger.info('Starting churn score calculation', { customerId });

            // 1. Query para pegar dados de comportamento de compra
            // Comparamos os últimos 90 dias com os 90 dias anteriores
            let query = `
                WITH CustomerStats AS (
                    SELECT 
                        idcli,
                        MAX(data) as last_order_date,
                        DATEDIFF(NOW(), MAX(data)) as days_since_last,
                        SUM(CASE WHEN data >= DATE_SUB(NOW(), INTERVAL 90 DAY) THEN valor ELSE 0 END) as recent_revenue,
                        SUM(CASE WHEN data >= DATE_SUB(NOW(), INTERVAL 180 DAY) AND data < DATE_SUB(NOW(), INTERVAL 90 DAY) THEN valor ELSE 0 END) as previous_revenue
                    FROM mak.hoje
                    WHERE valor > 0
                    ${customerId ? 'AND idcli = ?' : ''}
                    GROUP BY idcli
                )
                SELECT 
                    cs.*,
                    (SELECT COUNT(*) FROM staging.customer_interactions ci 
                     WHERE ci.customer_id = cs.idcli 
                     AND ci.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as recent_interactions
                FROM CustomerStats cs
            `;

            const [stats] = await db().execute(query, customerId ? [customerId] : []);

            for (const row of stats) {
                let score = 0;

                // Fator 1: Recência (Máx 60 pontos)
                if (row.days_since_last > 180) score += 60;
                else if (row.days_since_last > 90) score += 40;
                else if (row.days_since_last > 45) score += 20;

                // Fator 2: Tendência de Faturamento (Máx 30 pontos)
                if (row.previous_revenue > 0) {
                    const variation = (row.recent_revenue / row.previous_revenue) - 1;
                    if (variation < -0.5) score += 30; // Queda de mais de 50%
                    else if (variation < -0.2) score += 15; // Queda de mais de 20%
                } else if (row.recent_revenue === 0 && row.days_since_last < 365) {
                    score += 20; // Parou de comprar mas era ativo no último ano
                }

                // Fator 3: Engajamento (Reduz score - Máx -20 pontos)
                if (row.recent_interactions > 2) score -= 20;
                else if (row.recent_interactions > 0) score -= 10;

                // Normalizar entre 0 e 100
                score = Math.max(0, Math.min(100, score));

                // Definir nível de risco
                let riskLevel = 'LOW';
                if (score >= 80) riskLevel = 'CRITICAL';
                else if (score >= 60) riskLevel = 'HIGH';
                else if (score >= 30) riskLevel = 'MEDIUM';

                // Salvar no staging
                await db().execute(`
                    INSERT INTO staging.customer_churn_scores 
                        (customer_id, score, risk_level, days_since_last_order, avg_ticket_variation)
                    VALUES (?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE 
                        score = VALUES(score),
                        risk_level = VALUES(risk_level),
                        days_since_last_order = VALUES(days_since_last_order),
                        avg_ticket_variation = VALUES(avg_ticket_variation)
                `, [
                    row.idcli,
                    score,
                    riskLevel,
                    row.days_since_last,
                    row.previous_revenue > 0 ? (row.recent_revenue / row.previous_revenue) - 1 : 0
                ]);
            }

            logger.info('Churn scores updated successfully');
            return { success: true, count: stats.length };

        } catch (error) {
            logger.error('Churn Service Error:', error);
            throw error;
        }
    }

    /**
     * Valida o modelo de Churn (Backtesting)
     * Calcula o AUC (Area Under the Curve)
     */
    async validateModel(referenceDate = null) {
        try {
            // Se não informar data, usar 6 meses atrás
            const refDate = referenceDate || new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0];
            logger.info('Starting churn model validation', { refDate });

            // 1. Calcular scores para todos os clientes usando dados APENAS ANTES da refDate
            const [stats] = await db().execute(`
                SELECT 
                    idcli,
                    MAX(data) as last_order_date,
                    DATEDIFF(?, MAX(data)) as days_since_last,
                    SUM(CASE WHEN data >= DATE_SUB(?, INTERVAL 90 DAY) AND data < ? THEN valor ELSE 0 END) as recent_revenue,
                    SUM(CASE WHEN data >= DATE_SUB(?, INTERVAL 180 DAY) AND data < DATE_SUB(?, INTERVAL 90 DAY) THEN valor ELSE 0 END) as previous_revenue
                FROM mak.hoje
                WHERE data < ?
                AND valor > 0
                GROUP BY idcli
            `, [refDate, refDate, refDate, refDate, refDate, refDate]);

            // 2. Identificar quem REALMENTE deu churn (não comprou nos 90 dias seguintes à refDate)
            const [realChurnersRows] = await db().execute(`
                SELECT DISTINCT idcli
                FROM mak.hoje
                WHERE data >= ? AND data < DATE_ADD(?, INTERVAL 90 DAY)
                AND valor > 0
            `, [refDate, refDate]);

            const activeFollowupSet = new Set(realChurnersRows.map(r => r.idcli));

            const predictions = stats.map(row => {
                let score = 0;
                if (row.days_since_last > 180) score += 60;
                else if (row.days_since_last > 90) score += 40;
                else if (row.days_since_last > 45) score += 20;

                if (row.previous_revenue > 0) {
                    const variation = (row.recent_revenue / row.previous_revenue) - 1;
                    if (variation < -0.5) score += 30;
                    else if (variation < -0.2) score += 15;
                }

                score = Math.max(0, Math.min(100, score));

                // Real Churn = Estava ativo no passado mas não comprou no futuro
                const isRealChurn = !activeFollowupSet.has(row.idcli);

                return { score, isRealChurn };
            });

            // 3. Calcular AUC
            // Ordenar por score decrescente
            predictions.sort((a, b) => b.score - a.score);

            const totalPositives = predictions.filter(p => p.isRealChurn).length;
            const totalNegatives = predictions.length - totalPositives;

            if (totalPositives === 0 || totalNegatives === 0) {
                return { auc: 0, message: 'Dados insuficientes para cálculo de AUC.' };
            }

            let tp = 0;
            let fp = 0;
            let lastFp = 0;
            let area = 0;

            for (const p of predictions) {
                if (p.isRealChurn) {
                    tp++;
                } else {
                    fp++;
                    // Adicionar retângulo ao AUC (regra do trapézio simplificada)
                    area += (tp / totalPositives) * (1 / totalNegatives);
                }
            }

            return {
                reference_date: refDate,
                total_customers: predictions.length,
                churn_rate: parseFloat(((totalPositives / predictions.length) * 100).toFixed(2)),
                auc: parseFloat(area.toFixed(4)),
                status: area > 0.75 ? 'EXCELLENT' : area > 0.65 ? 'ACCEPTABLE' : 'POOR'
            };

        } catch (error) {
            logger.error('Churn Validation Error:', error);
            throw error;
        }
    }

    /**
     * Busca o score de um cliente
     */
    async getScore(customerId) {
        const [rows] = await db().execute(
            'SELECT * FROM staging.customer_churn_scores WHERE customer_id = ?',
            [customerId]
        );
        return rows[0] || null;
    }
}

export const churnService = new ChurnService();
