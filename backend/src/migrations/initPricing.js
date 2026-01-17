import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getDatabase } from '../config/database.js';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Inicializa as tabelas do Pricing Agent V2
 */
export async function initPricing() {
    try {
        const db = getDatabase();
        const sqlPath = join(__dirname, 'create_pricing_tables.sql');
        const sql = readFileSync(sqlPath, 'utf8');

        // Dividir o SQL em comandos separados (por ;)
        const commands = sql.split(';').filter(cmd => cmd.trim().length > 0);

        logger.info('V2: Initializing pricing tables...');

        for (const command of commands) {
            if (command.trim()) {
                try {
                    await db.execute(command.trim() + ';');
                } catch (cmdError) {
                    // Ignorar erro se for apenas que a tabela já existe
                    if (cmdError.code !== 'ER_TABLE_EXISTS' && !cmdError.message.includes('already exists')) {
                        throw cmdError;
                    }
                }
            }
        }

        logger.info('✅ Pricing Agent tables initialized successfully');
    } catch (error) {
        logger.error('❌ Error initializing pricing tables:', { error: error.message });
        // Não travar o servidor se falhar a migration, mas registrar o erro
    }
}
