import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getDatabase } from '../config/database.js';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Inicializa as tabelas e colunas de segurança Q1 2026
 */
export async function initSecurity() {
    try {
        const db = getDatabase();
        const sqlPath = join(__dirname, 'update_security_users.sql');
        const sql = readFileSync(sqlPath, 'utf8');

        const commands = sql.split(';').filter(cmd => cmd.trim().length > 0);

        logger.info('V2: Initializing security updates...');

        for (const command of commands) {
            if (command.trim()) {
                try {
                    await db.execute(command.trim() + ';');
                } catch (cmdError) {
                    // Ignorar erro se a coluna já existir
                    if (!cmdError.message.includes('Duplicate column name') &&
                        !cmdError.message.includes('already exists')) {
                        throw cmdError;
                    }
                }
            }
        }

        logger.info('✅ Security updates initialized successfully');
    } catch (error) {
        logger.error('❌ Error initializing security updates:', { error: error.message });
    }
}
