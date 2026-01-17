import { getDatabase } from '../config/database.js';

const db = () => getDatabase();

export class TaxRepository {
    /**
     * Busca as regras de tributação para um produto/cliente
     */
    async getTaxRules(params) {
        const {
            state,        // UF do cliente
            peopleType,   // 'J' ou 'F'
            ncm,          // NCM do produto
            origin,       // Origem do produto (0-8)
            emitState     // UF do emitente (para selecionar a tabela)
        } = params;

        const tableName = `NFE.Tributacao${emitState || 'SP'}`;

        // Tentar buscar regra específica para NCM e Estado
        let query = `
      SELECT * FROM ${tableName}
      WHERE (ncm = ? OR ? LIKE CONCAT(ncm, '%'))
      AND (state = ? OR state = 'BR')
      AND (people_type = ? OR people_type = '*')
      ORDER BY LENGTH(ncm) DESC, state DESC
      LIMIT 1
    `;

        try {
            const [rows] = await db().execute(query, [ncm, ncm, state, peopleType]);

            if (rows.length === 0) return null;

            let rule = rows[0];

            // Aplicar regra de 4% (Resolução Senado 13/12)
            // Se interestadual, Jurídico e Origem Importada (1 ou 2)
            if (state !== emitState && peopleType === 'J' && (origin === 1 || origin === 2)) {
                rule.icms = 4.00;
                rule.reducao_icms = 0.00;

                // Usar MVA ajustado se disponível
                if (rule.indice_st_mva4 && rule.indice_st_mva4 > 0) {
                    rule.indice_st = rule.indice_st_mva4;
                } else if (rule.indice_st_mva_orig && rule.indice_st_mva_orig > 0) {
                    rule.indice_st = rule.indice_st_mva_orig;
                }
            }

            return rule;
        } catch (error) {
            console.error(`Error fetching tax from ${tableName}:`, error);
            return null;
        }
    }

    /**
     * Calcula impostos para um item
     */
    calculateItemTaxes(item, lead, rules) {
        if (!rules) return { ipi: 0, st: 0 };

        const {
            vProduct,
            qProduct,
            isento_st
        } = item;

        const customer = lead.customer || {};
        const subtotal = parseFloat(vProduct) * parseFloat(qProduct);

        // 1. Cálculo de IPI
        let ipiValue = 0;
        if (rules.ipi > 0) {
            // Regras de redução de IPI conforme K3
            let percentage = 35; // Redução padrão 35%

            const exceptions_25 = ['8714.10.00'];
            if (exceptions_25.includes(rules.ncm)) percentage = 25;

            const exceptions_0 = ['7326.90.90'];
            if (exceptions_0.includes(rules.ncm)) percentage = 0;

            const effectiveIPI = rules.ipi * (1 - (percentage / 100));
            ipiValue = (subtotal * effectiveIPI) / 100;
        }

        // 2. Cálculo de ST
        let stValue = 0;
        const isIsento = isento_st === 1 || customer.isento_st === 1;

        // Exceções para graxas e óleos que nunca são isentos (conforme K3)
        const alwaysTaxedNcm = ['2710.19.32', '2710.19.99', '3401.30.00'];
        const reallyIsento = isIsento && !alwaysTaxedNcm.includes(rules.ncm);

        if (!reallyIsento && rules.indice_st > 0) {
            const baseST = subtotal + ipiValue;
            const baseCalcST = baseST + (baseST * rules.indice_st / 100);

            // Alíquota ST (padrão 18% se não especificado)
            const aliquotaST = rules.aliquota_st || 18;
            const icmsRule = parseFloat(rules.icms) || 12;

            const icmsProprio = subtotal * (icmsRule / 100);
            stValue = (baseCalcST * aliquotaST / 100) - icmsProprio;

            if (stValue < 0) stValue = 0;
        }

        return {
            ipi: parseFloat(ipiValue.toFixed(2)),
            st: parseFloat(stValue.toFixed(2)),
            rules: {
                ipiRate: rules.ipi,
                stRate: rules.indice_st,
                icmsRate: rules.icms
            }
        };
    }
}
