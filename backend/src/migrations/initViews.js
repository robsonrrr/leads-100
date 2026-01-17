import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getDatabase } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Inicializa as views do banco de dados
 */
export async function initViews() {
  try {
    const db = getDatabase();
    const sqlPath = join(__dirname, 'create_leads_view.sql');
    const sql = readFileSync(sqlPath, 'utf8');
    
    // Executar o SQL da view
    // Dividir o SQL em comandos separados para garantir que DROP e CREATE sejam executados
    const commands = sql.split(';').filter(cmd => cmd.trim().length > 0);
    
    for (const command of commands) {
      if (command.trim()) {
        await db.execute(command.trim() + ';');
      }
    }
    
    console.log('✅ View staging.staging_queries criada/atualizada com sucesso');
  } catch (error) {
    // Se a view já existe, apenas logar (não é erro crítico)
    if (error.code === 'ER_TABLE_EXISTS' || error.message.includes('already exists')) {
      console.log('ℹ️  View staging.staging_queries já existe');
    } else {
      console.error('⚠️  Erro ao criar view (pode ser normal se já existir):', error.message);
    }
  }
}

