import { getDatabase } from '../config/database.js';
import logger from '../config/logger.js';

/**
 * Migration: Atualizar tabela seller_search_history para incluir contagem de resultados e filtros
 * Parte do Bloco 2.3 - Busca Inteligente & Analytics de Demanda
 */
export async function updateSearchHistoryTable() {
    const db = getDatabase();

    try {
        // Verificar se colunas já existem
        const [columns] = await db.query(`SHOW COLUMNS FROM seller_search_history LIKE 'results_count'`);

        if (columns.length === 0) {
            await db.execute(`
                ALTER TABLE seller_search_history
                ADD COLUMN results_count INT DEFAULT 0,
                ADD COLUMN filters_json TEXT,
                ADD INDEX idx_results_count (results_count);
            `);
            logger.info('✅ Tabela seller_search_history atualizada com novas colunas');
        } else {
            logger.info('ℹ️ Tabela seller_search_history já está atualizada');
        }

        return true;
    } catch (error) {
        // Se a tabela não existir, o initSearchHistory (create) irá rodar antes ou depois, mas idealmente garantimos a ordem
        // Se erro for tabela inexistente, pode ser que createSearchHistory não rodou ainda.
        logger.warn('⚠️ Erro ao atualizar tabela seller_search_history (pode não existir ainda):', error.message);
        return false;
    }
}
