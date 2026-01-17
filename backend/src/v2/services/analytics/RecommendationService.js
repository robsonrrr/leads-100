import { getDatabase } from '../../../config/database.js';
import logger from '../../../config/logger.js';
import { fourCService } from '../ai/FourCService.js';

const db = () => getDatabase();

export class RecommendationService {
    /**
     * Obtém recomendações de produtos para um cliente específico
     * Integrado com 4C Intelligence para 'Next Best Action'
     */
    async getForCustomer(customerId, limit = 5, sellerId = null) {
        try {
            let segmentId = null;

            // Se tiver sellerId, buscar o segmento (segid) do vendedor
            if (sellerId) {
                const [seller] = await db().query('SELECT segid FROM vendedores WHERE userid = ? LIMIT 1', [sellerId]);
                if (seller.length > 0) {
                    segmentId = seller[0].segid;
                    logger.info('Filtering recommendations by segment', { sellerId, segmentId });
                }
            }

            // 1. Obter Candidatos do Inventário (Produtos com estoque e boa margem)
            // Filtrado por segmento se disponível
            let inventoryQuery = `
                SELECT i.id, i.modelo as name, i.revenda as price, i.marca
                FROM inv i
                LEFT JOIN produtos p ON i.idcf = p.id
                WHERE i.revenda > 0
            `;
            const inventoryParams = [];
            if (segmentId) {
                // Filtrar pelo segmento_id do vendedor (ex: 1 para máquinas)
                inventoryQuery += ` AND (p.segmento_id = ? OR i.idgrupo = ?) `;
                inventoryParams.push(segmentId, segmentId);
            }
            inventoryQuery += ` LIMIT 40 `;

            const [inventory] = await db().query(inventoryQuery, inventoryParams);

            // 2. Chamar 4C Intelligence para a "Próxima Melhor Ação"
            const fourCResponse = await fourCService.decide(customerId, inventory);
            let nextBestAction = null;

            if (fourCResponse.success && fourCResponse.data?.recommendation) {
                nextBestAction = {
                    ...fourCResponse.data.recommendation,
                    decision_id: fourCResponse.data.decision_id,
                    justification: fourCResponse.data.natural_justification,
                    source: '4C Intelligence'
                };
            } else if (process.env.NODE_ENV !== 'production' && inventory.length > 0) {
                // Mock para desenvolvimento local (verificar UI)
                nextBestAction = {
                    productId: inventory[0]?.id,
                    name: inventory[0]?.name,
                    price: inventory[0]?.price,
                    justification: "Sugerimos este produto baseado na alta recorrência de compras similares no seu segmento e o estoque estratégico no momento.",
                    suggested_channel: "WhatsApp",
                    source: "4C Intelligence (Mock)"
                };
            }

            // 3. Recomendar produtos que o cliente já compra frequentemente (Reposição)
            let replenishmentQuery = `
                SELECT 
                    m.productId, m.productCode, m.productName,
                    m.orders_count,
                    m.total_qty,
                    m.lastOrderDate as last_buy,
                    i.revenda as preco_venda
                FROM staging.customer_product_metrics m
                JOIN inv i ON m.productId = i.id
                LEFT JOIN produtos p ON i.idcf = p.id
                WHERE m.customerId = ?
            `;
            const replenishmentParams = [Number(customerId)];
            if (segmentId) {
                replenishmentQuery += ` AND (p.segmento_id = ? OR i.idgrupo = ?) `;
                replenishmentParams.push(segmentId, segmentId);
            }
            replenishmentQuery += ` ORDER BY m.orders_count DESC, m.total_qty DESC LIMIT ? `;
            replenishmentParams.push(parseInt(limit) || 5);

            const [frequent] = await db().query(replenishmentQuery, replenishmentParams);

            // 4. Cross-sell: Sugestões baseadas em produtos populares que o cliente ainda não compra
            let crossSellQuery = `
                SELECT i.id, i.modelo as codigo, i.nome as descricao, i.revenda as preco_venda
                FROM inv i
                LEFT JOIN produtos p ON i.idcf = p.id
                JOIN (
                    SELECT sku, COUNT(DISTINCT order_id) as orders_count
                    FROM staging.staging_order_items
                    GROUP BY sku
                    ORDER BY orders_count DESC
                    LIMIT 200
                ) popular ON i.id = popular.sku
                WHERE i.id NOT IN (SELECT productId FROM staging.customer_product_metrics WHERE customerId = ?)
                  AND i.habilitado = '1'
                  AND i.revenda > 0
            `;
            const crossSellParams = [Number(customerId)];
            if (segmentId) {
                crossSellQuery += ` AND (p.segmento_id = ? OR i.idgrupo = ?) `;
                crossSellParams.push(segmentId, segmentId);
            }
            crossSellQuery += ` ORDER BY popular.orders_count DESC LIMIT ? `;
            crossSellParams.push(parseInt(limit) || 5);

            const [crossSell] = await db().query(crossSellQuery, crossSellParams);

            return {
                ai_next_best_action: nextBestAction,
                replenishment: frequent,
                cross_sell: crossSell,
                blocked_by_governance: fourCResponse.blocked ? fourCResponse.reasons : null,
                segment_filtered: segmentId ? true : false
            };
        } catch (error) {
            logger.error('Recommendation Service Error (Customer):', error);
            throw error;
        }
    }

    /**
     * Obtém recomendações baseadas no conteúdo atual do carrinho (Frequently Bought Together)
     */
    async getForCart(productIds, limit = 5) {
        if (!productIds || productIds.length === 0) return [];

        try {
            // Buscar produtos que aparecem nos mesmos pedidos que os itens do carrinho
            const placeholders = productIds.map(() => '?').join(',');
            const [recommendations] = await db().query(`
                SELECT 
                    i.id, i.modelo as codigo, i.nome as descricao, i.revenda as preco_venda,
                    COUNT(DISTINCT soi.order_id) as co_occurrence
                FROM inv i
                JOIN staging.staging_order_items soi ON i.id = soi.sku
                WHERE soi.order_id IN (
                    SELECT order_id 
                    FROM staging.staging_order_items 
                    WHERE sku IN (${placeholders})
                )
                AND i.id NOT IN (${placeholders})
                AND i.habilitado = '1'
                AND i.revenda > 0
                GROUP BY i.id
                ORDER BY co_occurrence DESC
                LIMIT ?
            `, [...productIds, ...productIds, limit]);

            return recommendations;
        } catch (error) {
            logger.error('Recommendation Service Error (Cart):', error);
            throw error;
        }
    }

    /**
     * Obtém sugestão de desconto baseado no histórico
     */
    async getDiscountRecommendation(customerId, productId) {
        try {
            // 1. Média de desconto para este CLIENTE e PRODUTO
            const [custProd] = await db().query(`
                SELECT avg_discount, orders_count
                FROM staging.customer_product_metrics
                WHERE customerId = ? AND productId = ?
            `, [customerId, productId]);

            // 2. Média de desconto para este PRODUTO (Geral)
            const [prodAvg] = await db().query(`
                SELECT AVG(discount_pct) as avg_discount, COUNT(*) as sample_size
                FROM staging.staging_order_items
                WHERE sku = ?
            `, [productId]);

            // 3. Média de desconto para o SEGMENTO deste produto
            const [segmentAvg] = await db().query(`
                SELECT AVG(soi.discount_pct) as avg_discount
                FROM staging.staging_order_items soi
                JOIN produtos p ON soi.sku = p.id
                WHERE p.segmento = (SELECT segmento FROM produtos WHERE id = (SELECT idcf FROM inv WHERE id = ? LIMIT 1) LIMIT 1)
            `, [productId]);

            const personalAvg = custProd[0]?.avg_discount || null;
            const globalAvg = prodAvg[0]?.avg_discount || 0;
            const segmentAvgVal = segmentAvg[0]?.avg_discount || 0;

            // Lógica de recomendação:
            // - Se o cliente já comprou com desconto, sugerir a média dele.
            // - Caso contrário, sugerir a média global do produto ajustada.
            let suggestedDiscount = personalAvg || (globalAvg > 0 ? globalAvg : segmentAvgVal);

            // Arredondar para 1 casa decimal
            suggestedDiscount = Math.round(suggestedDiscount * 10) / 10;

            return {
                suggested_discount: suggestedDiscount,
                rationale: personalAvg
                    ? `Baseado no histórico deste cliente para este produto (média de ${personalAvg.toFixed(1)}% em ${custProd[0].orders_count} pedidos).`
                    : `Baseado na média de mercado para este produto (${globalAvg.toFixed(1)}%).`,
                comparisons: {
                    customer_avg: personalAvg,
                    product_global_avg: globalAvg,
                    segment_avg: segmentAvgVal
                }
            };
        } catch (error) {
            logger.error('Recommendation Service Error (Discount):', error);
            throw error;
        }
    }

    /**
     * Valida a relevância das recomendações (Backtesting de Hit Rate)
     */
    async validateModel(referenceDate = null) {
        try {
            // Se não informar data, usar 6 meses atrás
            const refDate = referenceDate || new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0];
            logger.info('Starting recommendations validation', { refDate });

            // 1. Pegar uma amostra de clientes ativos ANTES e DEPOIS da data de referência
            // (Para garantir que temos quem recomendar e quem observar a compra posterior)
            const [customers] = await db().query(`
                SELECT DISTINCT h1.customer_id
                FROM staging.staging_order_items h1
                JOIN staging.staging_order_items h2 ON h1.customer_id = h2.customer_id
                WHERE h1.order_date_original < ?
                AND h2.order_date_original >= ? 
                AND h2.order_date_original < DATE_ADD(?, INTERVAL 90 DAY)
                LIMIT 100
            `, [refDate, refDate, refDate]);

            if (customers.length === 0) {
                return { hit_rate: 0, message: 'Clientes insuficientes para validação.' };
            }

            let totalHits = 0;
            let totalRecommendations = 0;

            for (const cust of customers) {
                const customerId = cust.customer_id;

                // 2. Gerar recomendações para este cliente baseadas em dados APENAS ANTES da refDate
                // (Simulando o replenishment do getForCustomer na data refDate)
                const [recommendations] = await db().query(`
                    SELECT sku as productId
                    FROM staging.staging_order_items
                    WHERE customer_id = ? AND order_date_original < ?
                    GROUP BY sku
                    ORDER BY COUNT(DISTINCT order_id) DESC
                    LIMIT 5
                `, [customerId, refDate]);

                if (recommendations.length === 0) continue;

                const recIds = recommendations.map(r => r.productId);
                totalRecommendations += recIds.length;

                // 3. Verificar se o cliente comprou algum desses produtos APÓS a refDate
                const placeholders = recIds.map(() => '?').join(',');
                const [hits] = await db().query(`
                    SELECT COUNT(DISTINCT h.sku) as hits
                    FROM staging.staging_order_items h
                    WHERE h.customer_id = ? 
                    AND h.order_date_original >= ? AND h.order_date_original < DATE_ADD(?, INTERVAL 90 DAY)
                    AND h.sku IN (${placeholders})
                `, [customerId, refDate, refDate, ...recIds]);

                totalHits += (hits[0]?.hits || 0);
            }

            const hitRate = totalRecommendations > 0 ? (totalHits / totalRecommendations) * 100 : 0;

            return {
                reference_date: refDate,
                customers_analyzed: customers.length,
                total_recommendations: totalRecommendations,
                total_hits: totalHits,
                hit_rate: parseFloat(hitRate.toFixed(2)),
                status: hitRate > 5 ? 'EXCELLENT' : hitRate > 2 ? 'ACCEPTABLE' : 'POOR'
            };

        } catch (error) {
            logger.error('Recommendation Validation Error:', error);
            throw error;
        }
    }
}

export const recommendationService = new RecommendationService();
