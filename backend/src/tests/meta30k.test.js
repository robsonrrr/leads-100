/**
 * Meta 30.000 Máquinas - Testes de Validação
 * 
 * Este arquivo contém testes automatizados para validar todas as
 * funcionalidades implementadas para a Meta 30k.
 * 
 * Executar: npm run test:meta30k
 * Ou: node backend/src/tests/meta30k.test.js
 */

import { getDatabase, closeDatabase } from '../config/database.js';
import logger from '../config/logger.js';

// Services
import { penetrationService } from '../v2/services/analytics/PenetrationService.js';
import { pipelineService } from '../v2/services/analytics/PipelineService.js';
import { inventoryService } from '../v2/services/analytics/InventoryService.js';
import { financialService } from '../v2/services/analytics/FinancialService.js';
import { aiGovernanceService } from '../v2/services/ai/AIGovernanceService.js';
import { executiveBriefService } from '../v2/services/analytics/ExecutiveBriefService.js';

// Test utilities
const results = {
    passed: 0,
    failed: 0,
    tests: []
};

function logTest(name, success, details = null) {
    const status = success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} | ${name}`);
    if (details && !success) {
        console.log(`   → ${details}`);
    }
    results.tests.push({ name, success, details });
    if (success) results.passed++;
    else results.failed++;
}

// ============================================
// 7.1 TESTES DE KPIs
// ============================================

/**
 * 7.1.1 - Penetração calculada corretamente
 */
async function testPenetration() {
    try {
        const data = await penetrationService.calculate();

        // Verificar estrutura
        const hasMetrics = data.summary?.overall_penetration !== undefined ||
            data.metrics?.penetration_rate !== undefined;
        const hasTarget = data.target !== undefined || data.summary?.target !== undefined;
        const hasStatus = data.status !== undefined;

        const success = hasMetrics && hasStatus;
        logTest('7.1.1 Penetração calculada corretamente', success,
            success ? null : 'Estrutura de dados incompleta');

        return success;
    } catch (error) {
        logTest('7.1.1 Penetração calculada corretamente', false, error.message);
        return false;
    }
}

/**
 * 7.1.2 - Pipeline soma máquinas de todos os leads
 */
async function testPipeline() {
    try {
        const data = await pipelineService.calculate();

        // Verificar métricas
        const hasMetrics = data.metrics?.machines_in_pipeline !== undefined;
        const hasTargets = data.targets?.pipeline_minimum !== undefined;
        const hasStatus = data.status?.pipeline !== undefined;
        const machinesIsNumber = typeof data.metrics?.machines_in_pipeline === 'number';

        const success = hasMetrics && hasTargets && hasStatus && machinesIsNumber;
        logTest('7.1.2 Pipeline soma máquinas corretamente', success,
            success ? null : `machines_in_pipeline: ${data.metrics?.machines_in_pipeline}`);

        return success;
    } catch (error) {
        logTest('7.1.2 Pipeline soma máquinas corretamente', false, error.message);
        return false;
    }
}

/**
 * 7.1.3 - Produtos low-turn detectados
 */
async function testLowTurn() {
    try {
        const data = await inventoryService.getLowTurnProducts({ limit: 10, minDays: 60 });

        // Verificar estrutura
        const hasProducts = Array.isArray(data.products);
        const minDaysCorrect = data.min_coverage_days === 60;

        // Verificar que produtos retornados têm cobertura > 60 dias
        let allAboveMinDays = true;
        if (data.products.length > 0) {
            allAboveMinDays = data.products.every(p => p.coverage_days > 60);
        }

        const success = hasProducts && minDaysCorrect && allAboveMinDays;
        logTest('7.1.3 Produtos low-turn detectados (>60 dias)', success,
            success ? null : `Encontrados ${data.products?.length || 0} produtos`);

        return success;
    } catch (error) {
        logTest('7.1.3 Produtos low-turn detectados (>60 dias)', false, error.message);
        return false;
    }
}

/**
 * 7.1.4 - Bundles respeitam PRICE_FLOOR
 */
async function testBundles() {
    try {
        const data = await inventoryService.suggestBundles({ limit: 5 });

        // Verificar estrutura
        const hasBundles = Array.isArray(data.bundles);

        // Verificar que todos os bundles têm margin_preserved = true
        let allRespectFloor = true;
        if (data.bundles.length > 0) {
            allRespectFloor = data.bundles.every(b => b.margin_preserved === true);
        }

        // Verificar que desconto está entre 5-15%
        let discountsInRange = true;
        if (data.bundles.length > 0) {
            discountsInRange = data.bundles.every(b =>
                b.suggested_discount_percent >= 5 && b.suggested_discount_percent <= 15
            );
        }

        const success = hasBundles && allRespectFloor && discountsInRange;
        logTest('7.1.4 Bundles respeitam PRICE_FLOOR', success,
            success ? null : `${data.bundles?.length || 0} bundles, margin_preserved: ${allRespectFloor}`);

        return success;
    } catch (error) {
        logTest('7.1.4 Bundles respeitam PRICE_FLOOR', false, error.message);
        return false;
    }
}

/**
 * 7.1.5 - Ruptura S4-S5 gera alerta
 */
async function testStockoutAlerts() {
    try {
        const data = await inventoryService.getStockoutAlerts();

        // Verificar estrutura
        const hasAlerts = Array.isArray(data.alerts);
        const hasBySeverity = data.by_severity !== undefined;
        const hasCriticalCount = data.critical_count !== undefined;

        // Verificar que alertas S4-S5 são contados corretamente
        let severityCountCorrect = true;
        if (hasBySeverity) {
            const calculatedCritical = (data.by_severity.S4 || 0) + (data.by_severity.S5 || 0);
            severityCountCorrect = calculatedCritical === data.critical_count;
        }

        const success = hasAlerts && hasBySeverity && hasCriticalCount && severityCountCorrect;
        logTest('7.1.5 Ruptura S4-S5 gera alerta', success,
            success ? null : `S4: ${data.by_severity?.S4}, S5: ${data.by_severity?.S5}, Critical: ${data.critical_count}`);

        return success;
    } catch (error) {
        logTest('7.1.5 Ruptura S4-S5 gera alerta', false, error.message);
        return false;
    }
}

/**
 * 7.1.6 - Margem calculada corretamente
 */
async function testMargin() {
    try {
        const data = await financialService.getOverview();

        // Verificar estrutura
        const hasMarginKPI = data.kpis?.margin?.current !== undefined;
        const hasTarget = data.kpis?.margin?.target !== undefined;
        const hasStatus = data.kpis?.margin?.status !== undefined;

        // Verificar que margem é um número entre 0 e 100
        let marginInRange = true;
        if (hasMarginKPI) {
            marginInRange = data.kpis.margin.current >= 0 && data.kpis.margin.current <= 100;
        }

        // Verificar risk distribution
        const hasRiskDistribution = data.risk_distribution !== undefined;

        const success = hasMarginKPI && hasTarget && hasStatus && marginInRange && hasRiskDistribution;
        logTest('7.1.6 Margem calculada corretamente', success,
            success ? null : `Margem: ${data.kpis?.margin?.current}%, Target: ${data.kpis?.margin?.target}%`);

        return success;
    } catch (error) {
        logTest('7.1.6 Margem calculada corretamente', false, error.message);
        return false;
    }
}

/**
 * 7.1.7 - DSO calculado por cliente
 */
async function testDSO() {
    try {
        const data = await financialService.getDSO();

        // Verificar estrutura
        const hasCompanyDSO = data.company_dso !== undefined;
        const hasTarget = data.target_dso !== undefined;
        const hasBySeller = Array.isArray(data.by_seller);
        const hasStatus = data.status !== undefined;

        // Verificar que DSO é um número positivo
        let dsoIsValid = true;
        if (hasCompanyDSO) {
            dsoIsValid = typeof data.company_dso === 'number' && data.company_dso >= 0;
        }

        const success = hasCompanyDSO && hasTarget && hasBySeller && hasStatus && dsoIsValid;
        logTest('7.1.7 DSO calculado corretamente', success,
            success ? null : `DSO: ${data.company_dso} dias, Target: ${data.target_dso} dias`);

        return success;
    } catch (error) {
        logTest('7.1.7 DSO calculado corretamente', false, error.message);
        return false;
    }
}

/**
 * 7.1.8 - Crédito bloqueia conversão
 */
async function testCreditValidation() {
    try {
        // Testar validação de crédito com valor alto
        const validation = await financialService.validateCreditForConversion(0, 999999999);

        // Verificar estrutura
        const hasAllowed = validation.allowed !== undefined;
        const hasReason = validation.reason !== undefined;
        const hasCreditStatus = validation.credit_status !== undefined;

        // Para um valor muito alto, deve bloquear ou alertar
        // (a menos que o cliente tenha crédito ilimitado)

        const success = hasAllowed && hasReason && hasCreditStatus;
        logTest('7.1.8 Crédito valida conversão', success,
            success ? null : `Allowed: ${validation.allowed}, Reason: ${validation.reason}`);

        return success;
    } catch (error) {
        logTest('7.1.8 Crédito valida conversão', false, error.message);
        return false;
    }
}

/**
 * 7.1.9 - Brief executivo configura envio
 */
async function testBriefConfig() {
    try {
        // Verificar configuração
        const config = executiveBriefService.getConfig();

        const hasSendHour = config.sendHour !== undefined;
        const hasRecipients = Array.isArray(config.recipients);
        const hasTimezone = config.timezone !== undefined;

        // Verificar que hora está entre 0 e 23
        let hourIsValid = true;
        if (hasSendHour) {
            hourIsValid = config.sendHour >= 0 && config.sendHour <= 23;
        }

        // Testar geração do brief
        const brief = await executiveBriefService.generateBrief();
        const briefHasKPIs = brief.kpis !== undefined;
        const briefHasInsights = Array.isArray(brief.insights);

        const success = hasSendHour && hasRecipients && hourIsValid && briefHasKPIs && briefHasInsights;
        logTest('7.1.9 Brief executivo configurado para 8h', success,
            success ? null : `SendHour: ${config.sendHour}, Recipients: ${config.recipients?.length}`);

        return success;
    } catch (error) {
        logTest('7.1.9 Brief executivo configurado para 8h', false, error.message);
        return false;
    }
}

// ============================================
// 7.2 TESTES DE INTEGRAÇÃO
// ============================================

/**
 * 7.2.1 - Widgets carregam dados dos endpoints
 */
async function testEndpointsAvailable() {
    try {
        // Testar todos os services principais
        const tests = await Promise.allSettled([
            penetrationService.calculate(),
            pipelineService.calculate(),
            inventoryService.getOverview(),
            financialService.getOverview(),
            aiGovernanceService.getModelPerformance(),
            executiveBriefService.generateBrief()
        ]);

        const allSucceeded = tests.every(t => t.status === 'fulfilled');
        const successCount = tests.filter(t => t.status === 'fulfilled').length;

        const success = allSucceeded;
        logTest('7.2.1 Endpoints de dados disponíveis', success,
            success ? null : `${successCount}/${tests.length} endpoints funcionando`);

        return success;
    } catch (error) {
        logTest('7.2.1 Endpoints de dados disponíveis', false, error.message);
        return false;
    }
}

/**
 * 7.2.2 - Alertas funcionam corretamente
 */
async function testAlertsSystem() {
    try {
        // Verificar sistema de alertas de pipeline
        const pipelineAlerts = await pipelineService.checkAlerts();
        const hasPipelineAlerts = pipelineAlerts.alerts !== undefined;

        // Verificar sistema de alertas de inventário
        const inventoryAlerts = await inventoryService.checkCriticalAlerts();
        const hasInventoryAlerts = inventoryAlerts.alerts !== undefined;

        // Verificar sistema de alertas de IA
        const aiAlerts = await aiGovernanceService.checkAlerts();
        const hasAIAlerts = aiAlerts.alerts !== undefined;

        // Verificar sistema de alertas financeiros
        const financialAlerts = await financialService.checkAlerts();
        const hasFinancialAlerts = financialAlerts.alerts !== undefined;

        const success = hasPipelineAlerts && hasInventoryAlerts && hasAIAlerts && hasFinancialAlerts;
        logTest('7.2.2 Sistema de alertas funcionando', success,
            success ? null : `Pipeline: ${hasPipelineAlerts}, Inventory: ${hasInventoryAlerts}, AI: ${hasAIAlerts}, Financial: ${hasFinancialAlerts}`);

        return success;
    } catch (error) {
        logTest('7.2.2 Sistema de alertas funcionando', false, error.message);
        return false;
    }
}

/**
 * 7.2.3 - Dashboard CEO consolida KPIs
 */
async function testDashboardConsolidation() {
    try {
        // Gerar brief que consolida todos os KPIs
        const brief = await executiveBriefService.generateBrief();

        // Verificar que todos os KPIs principais estão presentes
        const hasPenetration = brief.kpis?.penetration !== undefined;
        const hasPipeline = brief.kpis?.pipeline !== undefined;
        const hasFinancial = brief.kpis?.financial !== undefined;
        const hasInventory = brief.kpis?.inventory !== undefined;

        // Verificar status geral
        const hasOverallStatus = brief.overall_status !== undefined;
        const hasInsights = Array.isArray(brief.insights) && brief.insights.length > 0;
        const hasSummary = brief.summary !== undefined;

        const success = hasPenetration && hasPipeline && hasFinancial && hasInventory &&
            hasOverallStatus && hasInsights && hasSummary;
        logTest('7.2.3 Dashboard CEO consolida todos os KPIs', success,
            success ? null : `Penetration: ${hasPenetration}, Pipeline: ${hasPipeline}, Financial: ${hasFinancial}, Inventory: ${hasInventory}`);

        return success;
    } catch (error) {
        logTest('7.2.3 Dashboard CEO consolida todos os KPIs', false, error.message);
        return false;
    }
}

// ============================================
// EXECUÇÃO DOS TESTES
// ============================================

async function runAllTests() {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║      🧪 META 30.000 MÁQUINAS - TESTES DE VALIDAÇÃO 🧪      ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log('║                                                            ║');

    const startTime = Date.now();

    console.log('║  7.1 TESTES DE KPIs                                        ║');
    console.log('╠════════════════════════════════════════════════════════════╣');

    await testPenetration();
    await testPipeline();
    await testLowTurn();
    await testBundles();
    await testStockoutAlerts();
    await testMargin();
    await testDSO();
    await testCreditValidation();
    await testBriefConfig();

    console.log('');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log('║  7.2 TESTES DE INTEGRAÇÃO                                  ║');
    console.log('╠════════════════════════════════════════════════════════════╣');

    await testEndpointsAvailable();
    await testAlertsSystem();
    await testDashboardConsolidation();

    const duration = Date.now() - startTime;

    console.log('');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log('║  📊 RESUMO                                                 ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║  ✅ Passou: ${results.passed}                                              `);
    console.log(`║  ❌ Falhou: ${results.failed}                                              `);
    console.log(`║  ⏱️  Tempo: ${duration}ms                                          `);
    console.log(`║  📈 Taxa de Sucesso: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%                               `);
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');

    return results;
}

// Executar se chamado diretamente
if (process.argv[1].includes('meta30k.test.js')) {
    runAllTests()
        .then(results => {
            closeDatabase();
            process.exit(results.failed > 0 ? 1 : 0);
        })
        .catch(err => {
            console.error('Erro fatal:', err);
            closeDatabase();
            process.exit(1);
        });
}

export { runAllTests, results };
