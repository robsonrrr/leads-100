import { getDatabase } from '../../../config/database.js';
import logger from '../../../config/logger.js';

const db = () => getDatabase();

export class ForecastService {
    /**
     * Calcula a previsão de vendas para os próximos dias
     * Baseia-se em:
     * 1. Sazonalidade anual (mesmo período no ano anterior)
     * 2. Tendência anual (crescimento/declínio dos últimos 6 meses vs período anterior)
     * 3. Fator de fim de semana
     */
    async predict(params) {
        const { sellerId, segment, days = 30 } = params;

        try {
            logger.info('Starting sales forecast calculation', { sellerId, segment, days });

            // Modelo Sazonal: Base = Mesmo período no ano passado * Tendência Anual
            const startDate = new Date();
            const lastYearStart = new Date(startDate);
            lastYearStart.setFullYear(startDate.getFullYear() - 1);

            const lastYearEnd = new Date(lastYearStart);
            lastYearEnd.setDate(lastYearStart.getDate() + days);

            const lastYearStartStr = lastYearStart.toISOString().split('T')[0];
            const lastYearEndStr = lastYearEnd.toISOString().split('T')[0];

            // 1. Obter base do ano passado
            const [baseRows] = await db().execute(`
                SELECT SUM(total_value) as total
                FROM staging.sales_history_daily
                WHERE sale_date BETWEEN ? AND ?
                ${sellerId ? 'AND seller_id = ?' : ''}
                ${segment ? 'AND segment = ?' : ''}
            `, [lastYearStartStr, lastYearEndStr, ...(sellerId ? [sellerId] : []), ...(segment ? [segment] : [])]);

            const lastYearTotal = parseFloat(baseRows[0]?.total) || 0;

            // 2. Calcular Tendência Anual (últimos 6 meses complete vs mesmo período anterior)
            const [trendRows] = await db().execute(`
                SELECT 
                    SUM(CASE WHEN sale_date >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 6 MONTH) AND sale_date < DATE_FORMAT(CURDATE(), '%Y-%m-01') THEN total_value ELSE 0 END) as current_6m,
                    SUM(CASE WHEN sale_date >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 18 MONTH) AND sale_date < DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 12 MONTH) THEN total_value ELSE 0 END) as last_6m
                FROM staging.sales_history_daily
                WHERE 1=1
                ${sellerId ? 'AND seller_id = ?' : ''}
                ${segment ? 'AND segment = ?' : ''}
            `, [...(sellerId ? [sellerId] : []), ...(segment ? [segment] : [])]);

            const current6m = parseFloat(trendRows[0]?.current_6m) || 0;
            const last6m = parseFloat(trendRows[0]?.last_6m) || 0;
            const trendRatio = last6m > 0 ? (current6m / last6m) : 1;

            // 3. Gerar previsão diária
            const dailyAvgLastYear = lastYearTotal / days;
            const forecast = [];

            for (let i = 1; i <= days; i++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);

                const dayOfWeek = date.getDay();
                let factor = 1.0;
                if (dayOfWeek === 0 || dayOfWeek === 6) factor = 0.2;

                forecast.push({
                    date: date.toISOString().split('T')[0],
                    predicted_value: parseFloat((dailyAvgLastYear * trendRatio * factor).toFixed(2))
                });
            }

            return {
                target_period: days,
                trend_ratio: parseFloat(trendRatio.toFixed(4)),
                historical_base_total: parseFloat(lastYearTotal.toFixed(2)),
                forecast
            };

        } catch (error) {
            logger.error('Forecast Service Error:', error);
            throw error;
        }
    }

    /**
     * Compara vendas previstas vs realizadas e calcula o desvio
     * Usado para alertas quando desvio > 20%
     */
    async analyzeDeviation(params = {}) {
        const { sellerId, days = 7 } = params;

        try {
            // 1. Buscar vendas realizadas nos últimos N dias
            let actualQuery = `
                SELECT 
                    DATE(h.data) as sale_date,
                    SUM(h.valor) as actual_value
                FROM mak.hoje h
                WHERE h.data >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                  AND h.data < CURDATE()
                  AND h.nop IN (27, 28, 51, 76)
                  AND h.valor > 0
            `;
            const queryParams = [days];

            if (sellerId) {
                actualQuery += ` AND h.vendedor = ?`;
                queryParams.push(sellerId);
            }

            actualQuery += ` GROUP BY sale_date ORDER BY sale_date`;
            const [actualData] = await db().execute(actualQuery, queryParams);

            // 2. Gerar previsão retroativa para o desvio
            // Usamos a mesma lógica do predict mas para os dias passados
            const analysis = [];
            for (const row of actualData) {
                const date = new Date(row.sale_date);
                const lastYearDate = new Date(date);
                lastYearDate.setFullYear(date.getFullYear() - 1);
                const lastYearStr = lastYearDate.toISOString().split('T')[0];

                const [lyRow] = await db().execute(`
                    SELECT SUM(total_value) as total
                    FROM staging.sales_history_daily
                    WHERE sale_date = ?
                    ${sellerId ? 'AND seller_id = ?' : ''}
                `, [lastYearStr, ...(sellerId ? [sellerId] : [])]);

                // Nota: se não houver dado exato do dia no ano passado, usamos a média do mês do ano passado
                let expected = parseFloat(lyRow[0]?.total) || 0;
                if (expected === 0) {
                    const [lyAvg] = await db().execute(`
                        SELECT AVG(total_value) as avg_d
                        FROM staging.sales_history_daily
                        WHERE DATE_FORMAT(sale_date, '%Y-%m') = DATE_FORMAT(?, '%Y-%m')
                        ${sellerId ? 'AND seller_id = ?' : ''}
                    `, [lastYearStr, ...(sellerId ? [sellerId] : [])]);
                    expected = parseFloat(lyAvg[0]?.avg_d) || 0;
                }

                // Aplicar tendência (calculada na data atual)
                const trendResult = await this.predict({ sellerId, days: 1 });
                const trendRatio = trendResult.trend_ratio;
                expected = expected * trendRatio;

                const actual = parseFloat(row.actual_value) || 0;
                const deviation = expected > 0 ? ((actual - expected) / expected) * 100 : 0;

                analysis.push({
                    date: row.sale_date,
                    actual_value: actual,
                    expected_value: parseFloat(expected.toFixed(2)),
                    deviation_percent: parseFloat(deviation.toFixed(2)),
                    status: Math.abs(deviation) > 20 ? 'ALERT' : 'OK'
                });
            }

            const totalActual = analysis.reduce((sum, d) => sum + d.actual_value, 0);
            const totalExpected = analysis.reduce((sum, d) => sum + d.expected_value, 0);
            const overallDeviation = totalExpected > 0 ? ((totalActual - totalExpected) / totalExpected) * 100 : 0;

            return {
                period_days: days,
                seller_id: sellerId || null,
                total_actual: parseFloat(totalActual.toFixed(2)),
                total_expected: parseFloat(totalExpected.toFixed(2)),
                overall_deviation_percent: parseFloat(overallDeviation.toFixed(2)),
                requires_attention: Math.abs(overallDeviation) > 20,
                daily_analysis: analysis
            };

        } catch (error) {
            logger.error('Deviation Analysis Error:', error);
            throw error;
        }
    }

    /**
     * Valida o modelo de previsão comparando dados históricos (Backtesting)
     * Calcula o MAPE (Mean Absolute Percentage Error)
     */
    async validateModel(params = {}) {
        const { months = 3, sellerId } = params;
        const limitMonths = parseInt(months);

        try {
            logger.info('Starting model validation (backtesting)', { months: limitMonths, sellerId });

            // 1. Obter meses COMPLETOS para teste
            const [testMonths] = await db().query(`
                SELECT DISTINCT DATE_FORMAT(sale_date, '%Y-%m') as month
                FROM staging.sales_history_daily
                WHERE sale_date < DATE_FORMAT(CURDATE(), '%Y-%m-01')
                ORDER BY month DESC
                LIMIT ${limitMonths}
            `);

            const results = [];

            for (const row of testMonths) {
                const targetMonth = row.month;

                // 2. Obter valor real do mês alvo
                const [actualRows] = await db().execute(`
                    SELECT SUM(total_value) as total
                    FROM staging.sales_history_daily
                    WHERE DATE_FORMAT(sale_date, '%Y-%m') = ?
                    ${sellerId ? 'AND seller_id = ?' : ''}
                `, sellerId ? [targetMonth, sellerId] : [targetMonth]);

                const actual = parseFloat(actualRows[0]?.total) || 0;

                // 3. Simular previsão usando modelo sazonal
                const lastYearMonth = `${parseInt(targetMonth.split('-')[0]) - 1}-${targetMonth.split('-')[1]}`;

                const [lastYearRows] = await db().execute(`
                    SELECT SUM(total_value) as total
                    FROM staging.sales_history_daily
                    WHERE DATE_FORMAT(sale_date, '%Y-%m') = ?
                    ${sellerId ? 'AND seller_id = ?' : ''}
                `, sellerId ? [lastYearMonth, sellerId] : [lastYearMonth]);

                const lastYearValue = parseFloat(lastYearRows[0]?.total) || 0;

                // Tendência (ratio de 6 meses antes do target vs ano anterior)
                const [trendRows] = await db().execute(`
                    SELECT 
                        SUM(CASE WHEN sale_date < STR_TO_DATE(CONCAT(?, '-01'), '%Y-%m-%d') AND sale_date >= DATE_SUB(STR_TO_DATE(CONCAT(?, '-01'), '%Y-%m-%d'), INTERVAL 6 MONTH) THEN total_value ELSE 0 END) as current_p,
                        SUM(CASE WHEN sale_date < DATE_SUB(STR_TO_DATE(CONCAT(?, '-01'), '%Y-%m-%d'), INTERVAL 12 MONTH) AND sale_date >= DATE_SUB(STR_TO_DATE(CONCAT(?, '-01'), '%Y-%m-%d'), INTERVAL 18 MONTH) THEN total_value ELSE 0 END) as last_p
                    FROM staging.sales_history_daily
                    WHERE 1=1 ${sellerId ? 'AND seller_id = ?' : ''}
                `, sellerId ? [targetMonth, targetMonth, targetMonth, targetMonth, sellerId] : [targetMonth, targetMonth, targetMonth, targetMonth]);

                const currentP = parseFloat(trendRows[0]?.current_p) || 0;
                const lastP = parseFloat(trendRows[0]?.last_p) || 0;
                const trendRatio = lastP > 0 ? (currentP / lastP) : 1;

                const predicted = lastYearValue * trendRatio;
                const absError = Math.abs(actual - predicted);
                const percentError = actual > 0 ? (absError / actual) * 100 : 0;

                results.push({
                    month: targetMonth,
                    actual,
                    predicted: parseFloat(predicted.toFixed(2)),
                    error_percent: parseFloat(percentError.toFixed(2))
                });
            }

            const totalError = results.reduce((sum, r) => sum + r.error_percent, 0);
            const mape = results.length > 0 ? totalError / results.length : 0;

            return {
                validation_period_months: limitMonths,
                mape: parseFloat(mape.toFixed(2)),
                status: mape < 15 ? 'EXCELLENT' : mape < 25 ? 'ACCEPTABLE' : 'POOR',
                details: results
            };

        } catch (error) {
            logger.error('Model Validation Error:', error);
            throw error;
        }
    }
}

export const forecastService = new ForecastService();
