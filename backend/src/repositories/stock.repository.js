import { getDatabase } from '../config/database.js';
import logger from '../config/logger.js';

const db = () => getDatabase();

export class StockRepository {
    /**
     * Obtém o total de estoque disponível (Normal + TTD) para um produto e unidade
     */
    async getTotals(productId, emitId) {
        try {
            const tables = await this.getStockTables(emitId);

            const [normalRows] = await db().execute(
                `SELECT EstoqueDisponivel FROM ${tables.normal} WHERE ProdutoPOID = ?`,
                [productId]
            );

            const [ttdRows] = await db().execute(
                `SELECT EstoqueDisponivel FROM ${tables.ttd} WHERE ProdutoPOID = ?`,
                [productId]
            );

            const normal = normalRows[0]?.EstoqueDisponivel || 0;
            const ttd = ttdRows[0]?.EstoqueDisponivel || 0;

            return {
                total_disponivel: normal + ttd,
                normal,
                ttd
            };
        } catch (error) {
            logger.error(`Error getting stock totals for product ${productId} and unit ${emitId}:`, error);
            return { total_disponivel: 0, normal: 0, ttd: 0 };
        }
    }

    /**
     * Obtém o nome das tabelas de estoque baseadas no CNPJ da unidade
     */
    async getStockTables(emitId) {
        const [rows] = await db().execute(
            'SELECT CNPJ FROM mak.Emitentes WHERE EmitentePOID = ?',
            [emitId]
        );

        if (rows.length === 0) throw new Error('Unidade emitente não encontrada');

        const cnpj = rows[0].CNPJ;
        const suffix = cnpj.substring(10, 14);

        return {
            normal: `mak_${suffix}.Estoque`,
            ttd: `mak_${suffix}.Estoque_TTD_1`
        };
    }

    /**
     * Define de qual estoque (Normal ou TTD) deve ser retirado o produto
     */
    async defineStockSource(productId, quantity, tables) {
        // 1. Verificar estoque normal
        const [rowsNormal] = await db().execute(
            `SELECT EstoqueDisponivel FROM ${tables.normal} WHERE ProdutoPOID = ?`,
            [productId]
        );
        const stockNormal = rowsNormal[0]?.EstoqueDisponivel || 0;

        if (stockNormal >= quantity) return 0; // 0 = Normal

        // 2. Verificar estoque TTD
        const [rowsTtd] = await db().execute(
            `SELECT EstoqueDisponivel FROM ${tables.ttd} WHERE ProdutoPOID = ?`,
            [productId]
        );
        const stockTtd = rowsTtd[0]?.EstoqueDisponivel || 0;

        if (stockTtd >= quantity) return 1; // 1 = TTD

        // 3. Verificar soma dos dois
        if ((stockNormal + stockTtd) >= quantity) return 99; // 99 = Misto

        // Em desenvolvimento, permitir estoque negativo
        if (process.env.NODE_ENV === 'development') {
            console.warn(`[DEV] Bypassing stock check for product ${productId}. Available: ${stockNormal + stockTtd}, Required: ${quantity}`);
            return 0; // Default to Normal
        }

        return 999; // 999 = Sem estoque
    }

    /**
     * Atualiza o estoque físico descarregando a quantidade vendida
     */
    async updateStock(productId, quantity, source, tables, operator = '-') {
        let tableName = tables.normal;
        if (source === 1) tableName = tables.ttd;

        // Se for misto (99), a lógica do K3 original parece simplificar ou o usuário 
        // deve decidir, mas aqui vamos tentar descarregar do que tiver mais ou do normal primeiro.
        // No K3 original PHP action_update_stock, ele apenas checa se TTD == 1.

        const query = `
      UPDATE ${tableName} 
      SET EstoqueDisponivel = EstoqueDisponivel ${operator} ? 
      WHERE ProdutoPOID = ?
    `;

        await db().execute(query, [quantity, productId]);
    }
}
