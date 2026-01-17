import { getDatabase } from '../config/database.js';

/**
 * Migration: Criar tabela seller_search_history para histórico de buscas
 * Parte do Bloco 2.3 - Busca Inteligente
 */
export async function createSearchHistoryTable() {
    const db = getDatabase();

    try {
        // Criar tabela de histórico de buscas
        await db.execute(`
      CREATE TABLE IF NOT EXISTS seller_search_history (
        id INT PRIMARY KEY AUTO_INCREMENT,
        seller_id INT NOT NULL,
        search_term VARCHAR(255),
        product_id INT,
        searched_at DATETIME DEFAULT NOW(),
        INDEX idx_seller_id (seller_id),
        INDEX idx_searched_at (searched_at),
        INDEX idx_product_id (product_id),
        INDEX idx_term_date (search_term, searched_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

        console.log('✅ Tabela seller_search_history criada');
        return true;
    } catch (error) {
        // Se a tabela já existe, ignorar
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log('ℹ️  Tabela seller_search_history já existe');
            return true;
        }
        console.error('❌ Erro ao criar tabela seller_search_history:', error);
        throw error;
    }
}
