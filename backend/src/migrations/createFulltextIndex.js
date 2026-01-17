import { getDatabase } from '../config/database.js';

/**
 * Migration: Criar índice FULLTEXT para busca de produtos
 * MySQL 8+ suporta FULLTEXT em InnoDB
 */
export async function createFulltextIndex() {
    const db = getDatabase();

    try {
        // Verificar se o índice já existe
        const [indexes] = await db.execute(`
      SELECT INDEX_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = 'mak' 
        AND TABLE_NAME = 'inv' 
        AND INDEX_NAME = 'ft_inv_search'
    `);

        if (indexes.length > 0) {
            console.log('ℹ️  Índice FULLTEXT ft_inv_search já existe');
            return true;
        }

        // Criar índice FULLTEXT nos campos de busca
        // Nota: modelo e nome são VARCHAR/TEXT compatíveis
        await db.execute(`
      ALTER TABLE mak.inv 
      ADD FULLTEXT INDEX ft_inv_search (modelo, nome)
    `);

        console.log('✅ Índice FULLTEXT ft_inv_search criado em mak.inv');
        return true;
    } catch (error) {
        // Se erro de permissão ou tabela não existe, apenas logar
        if (error.code === 'ER_TABLEACCESS_DENIED_ERROR' ||
            error.code === 'ER_NO_SUCH_TABLE' ||
            error.code === 'ER_DBACCESS_DENIED_ERROR') {
            console.warn('⚠️  Sem permissão para criar índice FULLTEXT - busca usará LIKE');
            return false;
        }
        // Se índice já existe com outro nome, ignorar
        if (error.code === 'ER_DUP_KEYNAME') {
            console.log('ℹ️  Índice FULLTEXT já existe');
            return true;
        }
        // Row size too large - problema de schema que requer DBA
        if (error.message?.includes('Row size too large')) {
            console.warn('⚠️  Tabela mak.inv requer otimização de schema para FULLTEXT - busca usará LIKE');
            return false;
        }
        console.error('❌ Erro ao criar índice FULLTEXT:', error.message);
        return false;
    }
}
