import { getDatabase } from '../config/database.js';

const db = () => getDatabase();

class ClientOpportunitiesService {

    /**
     * Identifica oportunidades perdidas para um cliente.
     * Lógica: Produtos mais vendidos do segmento principal do cliente (ou geral)
     * que o cliente NÃO comprou nos últimos 12 meses.
     * Baseado no histórico de vendas dos últimos 6 meses da empresa.
     * 
     * @param {number} customerId - ID do cliente
     * @param {number} limit - Limite de sugestões
     */
    async getLostOpportunities(customerId, limit = 5) {
        try {
            // 1. Identificar Segmento Principal do cliente (baseado no histórico recente)
            const [segRows] = await db().execute(`
        SELECT p.segmento_id, p.segmento, COUNT(*) as qtd
        FROM mak.hoje h
        JOIN mak.hist hi ON h.id = hi.pedido
        JOIN mak.inv i ON hi.isbn = i.id
        JOIN mak.produtos p ON i.idcf = p.id
        WHERE h.idcli = ?
        GROUP BY p.segmento_id, p.segmento
        ORDER BY qtd DESC
        LIMIT 1
      `, [customerId]);

            let segmentId = null;
            if (segRows.length > 0) {
                segmentId = segRows[0].segmento_id;
            }

            // 2. Query de Oportunidades
            // Top Sellers (Globais ou do Segmento) - Excluindo compras do cliente
            // Janela de análise global: 6 meses
            // Janela de exclusão cliente: 12 meses
            let query = `
        SELECT 
            i.id, 
            i.modelo as model, 
            i.nome as name, 
            i.marca as brand,
            i.revenda as price,
            SUM(hi.quant) as global_sales
        FROM mak.hist hi
        JOIN mak.hoje h ON hi.pedido = h.id
        JOIN mak.inv i ON hi.isbn = i.id
        JOIN mak.produtos p ON i.idcf = p.id
        WHERE h.data >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        AND i.revenda > 0
      `;

            const params = [];

            if (segmentId) {
                query += ` AND p.segmento_id = ? `;
                params.push(segmentId);
            }

            query += `
        AND i.id NOT IN (
            SELECT DISTINCT hi2.isbn 
            FROM mak.hist hi2 
            JOIN mak.hoje h2 ON hi2.pedido = h2.id 
            WHERE h2.idcli = ? 
            AND h2.data >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        )
        GROUP BY i.id, i.modelo, i.nome, i.marca, i.revenda
        ORDER BY global_sales DESC
        LIMIT ?
      `;

            params.push(customerId, limit);

            const [rows] = await db().execute(query, params);

            // Formatar retorno para o padrão do frontend
            return rows.map(row => ({
                id: row.id,
                model: row.model,
                name: row.name,
                brand: row.brand,
                price: parseFloat(row.price),
                globalSales: parseInt(row.global_sales)
            }));

        } catch (error) {
            console.error('Error fetching lost opportunities:', error);
            return [];
        }
    }
}

export default new ClientOpportunitiesService();
