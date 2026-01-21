import { getDatabase } from '../../../config/database.js';
import logger from '../../../config/logger.js';

const db = () => getDatabase();

/**
 * InventoryService - Gestão de Estoque de Máquinas
 * Meta 30.000 Máquinas/Ano
 * 
 * KPIs:
 * - Giro >= 6x/ano
 * - BAIXO_GIRO < 15%
 * - Rupturas S4-S5 = 0
 */
export class InventoryService {

    /**
     * Retorna visão geral do estoque de máquinas
     */
    async getOverview() {
        const database = db();

        logger.info('InventoryService: Getting inventory overview');

        try {
            // Resumo por status de estoque
            const [statusResult] = await database.execute(`
                SELECT 
                    status_estoque,
                    COUNT(*) as produtos,
                    SUM(estoque_atual) as unidades,
                    SUM(valor_total_fob) as valor_fob
                FROM mak.p_machines
                GROUP BY status_estoque
            `);

            // Resumo por sugestão de ação
            const [actionResult] = await database.execute(`
                SELECT 
                    sugestao_acao,
                    prioridade_acao,
                    COUNT(*) as produtos,
                    SUM(estoque_atual) as unidades,
                    SUM(valor_total_fob) as valor_fob
                FROM mak.p_machines
                GROUP BY sugestao_acao, prioridade_acao
                ORDER BY prioridade_acao DESC
            `);

            // Totais gerais
            const [totalsResult] = await database.execute(`
                SELECT 
                    COUNT(*) as total_skus,
                    SUM(estoque_atual) as total_unidades,
                    SUM(valor_total_fob) as total_valor_fob,
                    SUM(valor_total_custo) as total_valor_custo,
                    SUM(vendas_ultimos_30_dias) as vendas_30d,
                    SUM(vendas_ultimos_90_dias) as vendas_90d,
                    SUM(vendas_ultimos_12_meses) as vendas_12m,
                    AVG(cobertura_dias) as media_cobertura_dias
                FROM mak.p_machines
                WHERE estoque_atual > 0
            `);

            const totals = totalsResult[0] || {};

            // Calcular giro anualizado
            const vendas12m = parseFloat(totals.vendas_12m) || 0;
            const estoqueAtual = parseFloat(totals.total_unidades) || 1;
            const giroAnual = vendas12m / estoqueAtual;

            // Produtos com baixo giro (cobertura > 90 dias)
            const [lowTurnResult] = await database.execute(`
                SELECT 
                    COUNT(*) as low_turn_count,
                    SUM(estoque_atual) as low_turn_units,
                    SUM(valor_total_fob) as low_turn_value
                FROM mak.p_machines
                WHERE cobertura_dias > 90 AND estoque_atual > 0
            `);

            const lowTurn = lowTurnResult[0] || {};
            const lowTurnPercent = totals.total_unidades > 0
                ? Math.round((parseFloat(lowTurn.low_turn_units) / parseFloat(totals.total_unidades)) * 100)
                : 0;

            // Rupturas críticas (S4-S5)
            const [ruptureResult] = await database.execute(`
                SELECT COUNT(*) as critical_ruptures
                FROM mak.p_machines
                WHERE sugestao_acao IN ('Ruptura Crítica', 'Repor Urgente')
            `);

            const criticalRuptures = ruptureResult[0]?.critical_ruptures || 0;

            // Determinar status geral
            const targetGiro = 6; // Meta: 6x/ano
            const targetLowTurn = 15; // Meta: < 15%
            const targetRuptures = 0; // Meta: 0

            const giroStatus = giroAnual >= targetGiro ? 'ON_TARGET' : (giroAnual >= targetGiro * 0.8 ? 'WARNING' : 'CRITICAL');
            const lowTurnStatus = lowTurnPercent <= targetLowTurn ? 'ON_TARGET' : (lowTurnPercent <= targetLowTurn * 1.5 ? 'WARNING' : 'CRITICAL');
            const ruptureStatus = criticalRuptures === 0 ? 'ON_TARGET' : (criticalRuptures <= 5 ? 'WARNING' : 'CRITICAL');

            const statusPriority = { 'CRITICAL': 0, 'WARNING': 1, 'ON_TARGET': 2 };
            const overallStatus = [giroStatus, lowTurnStatus, ruptureStatus]
                .sort((a, b) => statusPriority[a] - statusPriority[b])[0];

            return {
                // Métricas principais
                kpis: {
                    giro_anual: {
                        current: Math.round(giroAnual * 10) / 10,
                        target: targetGiro,
                        status: giroStatus,
                        achievement_percent: Math.round((giroAnual / targetGiro) * 100)
                    },
                    low_turn_percent: {
                        current: lowTurnPercent,
                        target: targetLowTurn,
                        status: lowTurnStatus,
                        achievement_percent: lowTurnPercent <= targetLowTurn ? 100 : Math.round((targetLowTurn / lowTurnPercent) * 100)
                    },
                    critical_ruptures: {
                        current: criticalRuptures,
                        target: targetRuptures,
                        status: ruptureStatus
                    }
                },

                // Status geral
                overall_status: overallStatus,

                // Totais
                totals: {
                    skus: totals.total_skus || 0,
                    units: parseFloat(totals.total_unidades) || 0,
                    value_fob: parseFloat(totals.total_valor_fob) || 0,
                    value_cost: parseFloat(totals.total_valor_custo) || 0,
                    coverage_days_avg: Math.round(parseFloat(totals.media_cobertura_dias) || 0),
                    sales_30d: parseFloat(totals.vendas_30d) || 0,
                    sales_90d: parseFloat(totals.vendas_90d) || 0,
                    sales_12m: parseFloat(totals.vendas_12m) || 0
                },

                // Distribuição por status
                by_status: statusResult.map(s => ({
                    status: s.status_estoque,
                    products: s.produtos,
                    units: parseFloat(s.unidades) || 0,
                    value_fob: parseFloat(s.valor_fob) || 0
                })),

                // Distribuição por ação sugerida
                by_action: actionResult.map(a => ({
                    action: a.sugestao_acao,
                    priority: a.prioridade_acao,
                    products: a.produtos,
                    units: parseFloat(a.unidades) || 0,
                    value_fob: parseFloat(a.valor_fob) || 0
                })),

                // Low turn summary
                low_turn: {
                    products: lowTurn.low_turn_count || 0,
                    units: parseFloat(lowTurn.low_turn_units) || 0,
                    value_fob: parseFloat(lowTurn.low_turn_value) || 0,
                    percent_of_stock: lowTurnPercent
                }
            };
        } catch (error) {
            logger.error('InventoryService: Error getting overview', { error: error.message });
            throw error;
        }
    }

    /**
     * Retorna produtos de baixo giro
     */
    async getLowTurnProducts(options = {}) {
        const { limit = 50, minDays = 90, sortBy = 'valor_total_fob' } = options;
        const database = db();

        logger.info('InventoryService: Getting low-turn products', { limit, minDays });

        const validSortColumns = ['valor_total_fob', 'cobertura_dias', 'estoque_atual', 'dias_ultima_venda'];
        const orderBy = validSortColumns.includes(sortBy) ? sortBy : 'valor_total_fob';

        // Sanitizar valores numéricos para evitar erro de prepared statement
        const safeLimit = parseInt(limit) || 50;
        const safeMinDays = parseInt(minDays) || 90;

        const [results] = await database.query(`
            SELECT 
                produto_id,
                codigo,
                marca,
                descricao,
                estoque_atual,
                valor_total_fob,
                revenda,
                fob,
                cobertura_dias,
                dias_ultima_venda,
                vendas_ultimos_30_dias,
                vendas_ultimos_90_dias,
                classificacao_abc,
                status_estoque,
                sugestao_acao,
                prioridade_acao
            FROM mak.p_machines
            WHERE cobertura_dias > ${safeMinDays} AND estoque_atual > 0
            ORDER BY ${orderBy} DESC
            LIMIT ${safeLimit}
        `);

        return {
            min_coverage_days: minDays,
            count: results.length,
            products: results.map(p => ({
                id: p.produto_id,
                sku: p.codigo,
                brand: p.marca,
                name: p.descricao,
                stock: p.estoque_atual,
                value_fob: parseFloat(p.valor_total_fob) || 0,
                price: parseFloat(p.revenda) || 0,
                cost: parseFloat(p.fob) || 0,
                coverage_days: Math.round(parseFloat(p.cobertura_dias) || 0),
                days_since_sale: p.dias_ultima_venda,
                sales_30d: p.vendas_ultimos_30_dias,
                sales_90d: p.vendas_ultimos_90_dias,
                abc_class: p.classificacao_abc,
                status: p.status_estoque,
                suggested_action: p.sugestao_acao,
                priority: p.prioridade_acao
            }))
        };
    }

    /**
     * Retorna alertas de ruptura
     */
    async getStockoutAlerts() {
        const database = db();

        logger.info('InventoryService: Getting stockout alerts');

        // Produtos com ruptura ou alerta
        const [results] = await database.execute(`
            SELECT 
                produto_id,
                codigo,
                marca,
                descricao,
                estoque_atual,
                Matriz,
                BarraFunda,
                Blumenau,
                valor_total_fob,
                revenda,
                vendas_ultimos_30_dias,
                media_mensal_90d,
                status_estoque,
                sugestao_acao,
                prioridade_acao,
                segmento,
                categoria
            FROM mak.p_machines
            WHERE sugestao_acao IN ('Ruptura Crítica', 'Repor Urgente', 'Programar Reposição', 'Aguardar Reposição')
               OR status_estoque IN ('Crítico', 'Baixo', 'Aguardando Reposição')
            ORDER BY prioridade_acao DESC, media_mensal_90d DESC
            LIMIT 100
        `);

        // Buscar pedidos pendentes por produto (simplificado - verifica leads abertos)
        const productIds = results.map(p => p.produto_id);
        let pendingOrdersByProduct = {};

        if (productIds.length > 0) {
            try {
                const [pendingOrders] = await database.execute(`
                    SELECT 
                        li.prodid as produto_id,
                        COUNT(DISTINCT li.leadid) as pending_leads,
                        SUM(li.quantity) as pending_quantity
                    FROM staging.leads_items li
                    INNER JOIN staging.leads l ON l.id = li.leadid
                    WHERE l.cType != 2 
                      AND l.deleted_at IS NULL
                      AND li.prodid IN (${productIds.map(() => '?').join(',')})
                    GROUP BY li.prodid
                `, productIds);

                for (const order of pendingOrders) {
                    pendingOrdersByProduct[order.produto_id] = {
                        leads: order.pending_leads,
                        quantity: order.pending_quantity
                    };
                }
            } catch (err) {
                logger.warn('Could not fetch pending orders:', err.message);
            }
        }

        // Classificar por severidade (S1-S5)
        const classifiedPromises = results.map(async (p) => {
            let severity = 'S1';
            let severityLevel = 1;
            const pendingOrders = pendingOrdersByProduct[p.produto_id];

            if (p.sugestao_acao === 'Ruptura Crítica') {
                severity = 'S5';
                severityLevel = 5;
            } else if (p.sugestao_acao === 'Repor Urgente') {
                severity = 'S4';
                severityLevel = 4;
            } else if (p.status_estoque === 'Crítico') {
                severity = 'S3';
                severityLevel = 3;
            } else if (p.status_estoque === 'Baixo' || p.sugestao_acao === 'Programar Reposição') {
                severity = 'S2';
                severityLevel = 2;
            }

            // Upgrade to S4 if has pending orders and stock is zero
            if (pendingOrders && pendingOrders.quantity > 0 && p.estoque_atual <= 0 && severityLevel < 4) {
                severity = 'S4';
                severityLevel = 4;
            }

            // Find substitutes for critical items
            let substitutes = [];
            if (severityLevel >= 3) {
                substitutes = await this.suggestSubstitutes(p.produto_id, p.marca, p.segmento, 3);
            }

            return {
                id: p.produto_id,
                sku: p.codigo,
                brand: p.marca,
                name: p.descricao,
                stock_total: p.estoque_atual,
                stock_matrix: p.Matriz,
                stock_sp: p.BarraFunda,
                stock_sc: p.Blumenau,
                value_fob: parseFloat(p.valor_total_fob) || 0,
                price: parseFloat(p.revenda) || 0,
                sales_30d: p.vendas_ultimos_30_dias,
                avg_monthly: Math.round(parseFloat(p.media_mensal_90d) || 0),
                status: p.status_estoque,
                action: p.sugestao_acao,
                severity: severity,
                severity_level: severityLevel,
                pending_orders: pendingOrders || null,
                substitutes: substitutes
            };
        });

        const classified = await Promise.all(classifiedPromises);

        // Resumo por severidade
        const bySeverity = {
            S1: classified.filter(p => p.severity === 'S1').length,
            S2: classified.filter(p => p.severity === 'S2').length,
            S3: classified.filter(p => p.severity === 'S3').length,
            S4: classified.filter(p => p.severity === 'S4').length,
            S5: classified.filter(p => p.severity === 'S5').length
        };

        const critical = bySeverity.S4 + bySeverity.S5;
        const status = critical === 0 ? 'ON_TARGET' : (critical <= 5 ? 'WARNING' : 'CRITICAL');

        return {
            status: status,
            total_alerts: classified.length,
            critical_count: critical,
            by_severity: bySeverity,
            alerts: classified.sort((a, b) => b.severity_level - a.severity_level)
        };
    }

    /**
     * Sugere produtos substitutos para um produto em ruptura
     */
    async suggestSubstitutes(productId, brand, segment, limit = 3) {
        const database = db();

        try {
            const [substitutes] = await database.execute(`
                SELECT 
                    produto_id,
                    codigo,
                    marca,
                    descricao,
                    estoque_atual,
                    revenda,
                    vendas_ultimos_30_dias,
                    cobertura_dias
                FROM mak.p_machines
                WHERE estoque_atual > 5
                  AND (marca = ? OR segmento = ?)
                  AND produto_id != ?
                  AND cobertura_dias < 90
                ORDER BY vendas_ultimos_30_dias DESC
                LIMIT ?
            `, [brand, segment, productId, limit]);

            return substitutes.map(s => ({
                id: s.produto_id,
                sku: s.codigo,
                name: s.descricao,
                brand: s.marca,
                stock: s.estoque_atual,
                price: parseFloat(s.revenda) || 0,
                sales_30d: s.vendas_ultimos_30_dias
            }));
        } catch (error) {
            logger.warn('Error fetching substitutes:', error.message);
            return [];
        }
    }

    /**
     * Verifica alertas críticos e notifica COO
     * Usado pelo Scheduler para envio diário de alertas
     */
    async checkCriticalAlerts() {
        const alerts = await this.getStockoutAlerts();
        const criticalAlerts = alerts.alerts.filter(a => a.severity_level >= 4);

        return {
            has_critical: criticalAlerts.length > 0,
            critical_count: criticalAlerts.length,
            s4_count: alerts.by_severity.S4,
            s5_count: alerts.by_severity.S5,
            alerts: criticalAlerts.map(a => ({
                type: a.severity === 'S5' ? 'RUPTURE_CRITICAL' : 'RUPTURE_URGENT',
                severity: a.severity,
                product_id: a.id,
                product_sku: a.sku,
                product_name: a.name,
                stock: a.stock_total,
                pending_orders: a.pending_orders,
                substitutes_count: a.substitutes?.length || 0,
                message: `${a.severity}: ${a.sku} - ${a.name} (Estoque: ${a.stock_total}, Ação: ${a.action})`
            }))
        };
    }

    /**
     * Sugere bundles para produtos de baixo giro
     */
    async suggestBundles(options = {}) {
        const { limit = 20 } = options;
        const database = db();

        logger.info('InventoryService: Suggesting bundles');

        // Buscar produtos de baixo giro com estoque
        const [lowTurnProducts] = await database.execute(`
            SELECT 
                produto_id,
                codigo,
                marca,
                descricao,
                estoque_atual,
                valor_total_fob,
                revenda,
                fob,
                cobertura_dias,
                categoria,
                segmento
            FROM mak.p_machines
            WHERE cobertura_dias > 90 
              AND estoque_atual > 0
              AND revenda > 0
            ORDER BY valor_total_fob DESC
            LIMIT ?
        `, [limit]);

        // Para cada produto de baixo giro, buscar complementos de alto giro
        const bundles = [];

        for (const product of lowTurnProducts) {
            // Buscar produto complementar de alto giro (mesma categoria ou marca)
            const [complements] = await database.execute(`
                SELECT 
                    produto_id,
                    codigo,
                    marca,
                    descricao,
                    estoque_atual,
                    revenda,
                    fob,
                    vendas_ultimos_30_dias,
                    classificacao_abc
                FROM mak.p_machines
                WHERE cobertura_dias < 30 
                  AND estoque_atual > 0
                  AND vendas_ultimos_30_dias > 0
                  AND (marca = ? OR segmento = ?)
                  AND produto_id != ?
                ORDER BY vendas_ultimos_30_dias DESC
                LIMIT 3
            `, [product.marca, product.segmento, product.produto_id]);

            if (complements.length > 0) {
                const complement = complements[0];

                // Calcular desconto sugerido (5-15% baseado na cobertura)
                const coverageDays = parseFloat(product.cobertura_dias) || 90;
                let suggestedDiscount = 5;
                if (coverageDays > 180) suggestedDiscount = 15;
                else if (coverageDays > 120) suggestedDiscount = 10;
                else if (coverageDays > 90) suggestedDiscount = 7;

                const bundlePrice = parseFloat(product.revenda) + parseFloat(complement.revenda);
                const discountAmount = bundlePrice * (suggestedDiscount / 100);

                bundles.push({
                    bundle_id: `B-${new Date().getFullYear()}-${bundles.length + 1}`.padEnd(12, '0'),
                    low_turn_product: {
                        id: product.produto_id,
                        sku: product.codigo,
                        name: product.descricao,
                        brand: product.marca,
                        price: parseFloat(product.revenda),
                        stock: product.estoque_atual,
                        coverage_days: Math.round(coverageDays)
                    },
                    complement_product: {
                        id: complement.produto_id,
                        sku: complement.codigo,
                        name: complement.descricao,
                        brand: complement.marca,
                        price: parseFloat(complement.revenda),
                        stock: complement.estoque_atual,
                        sales_30d: complement.vendas_ultimos_30_dias
                    },
                    bundle_price_original: bundlePrice,
                    suggested_discount_percent: suggestedDiscount,
                    bundle_price_discounted: bundlePrice - discountAmount,
                    customer_savings: discountAmount,
                    margin_preserved: true // assumindo que respeita PRICE_FLOOR
                });
            }
        }

        return {
            count: bundles.length,
            target_monthly: 184, // Meta de bundles/mês
            bundles: bundles
        };
    }
}

export const inventoryService = new InventoryService();
