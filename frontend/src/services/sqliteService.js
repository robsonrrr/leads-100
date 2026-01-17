/**
 * SQLite Cache Service
 * 
 * Wrapper para sql.js que fornece cache local offline
 * com persistência no IndexedDB.
 */

import initSqlJs from 'sql.js'

// Versão do schema - incrementar ao alterar tabelas
const SCHEMA_VERSION = 2
const DB_NAME = 'leads_agent_cache'

class SQLiteService {
    constructor() {
        this.db = null
        this.SQL = null
        this.isReady = false
        this.initPromise = null
    }

    /**
     * Inicializa o banco de dados
     */
    async init() {
        if (this.initPromise) return this.initPromise

        this.initPromise = this._doInit()
        return this.initPromise
    }

    async _doInit() {
        try {
            // Carregar sql.js com WASM
            this.SQL = await initSqlJs({
                locateFile: file => `https://sql.js.org/dist/${file}`
            })

            // Tentar carregar DB existente do IndexedDB
            const savedDb = await this._loadFromIndexedDB()

            if (savedDb) {
                this.db = new this.SQL.Database(savedDb)
                console.log('📦 SQLite: Cache carregado do IndexedDB')
            } else {
                this.db = new this.SQL.Database()
                console.log('📦 SQLite: Novo banco criado')
            }

            // Aplicar migrations
            await this._runMigrations()

            this.isReady = true
            console.log('✅ SQLite Service pronto')

            return true
        } catch (error) {
            console.error('❌ Erro ao inicializar SQLite:', error)
            throw error
        }
    }

    /**
     * Executa migrations do schema
     */
    async _runMigrations() {
        // Criar tabela de versão
        this.db.run(`
      CREATE TABLE IF NOT EXISTS _schema_version (
        version INTEGER PRIMARY KEY,
        applied_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)

        // Verificar versão atual
        const result = this.db.exec('SELECT MAX(version) as v FROM _schema_version')
        const currentVersion = result[0]?.values[0]?.[0] || 0

        if (currentVersion < SCHEMA_VERSION) {
            console.log(`📦 SQLite: Atualizando schema de v${currentVersion} para v${SCHEMA_VERSION}`)

            // Migrations
            if (currentVersion < 1) {
                await this._migrationV1()
            }
            if (currentVersion < 2) {
                await this._migrationV2()
            }

            // Registrar versão
            this.db.run('INSERT INTO _schema_version (version) VALUES (?)', [SCHEMA_VERSION])
            await this._saveToIndexedDB()
        }
    }

    /**
     * Migration V1 - Schema inicial
     */
    async _migrationV1() {
        // Tabela de produtos
        this.db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY,
        model TEXT,
        brand TEXT,
        name TEXT,
        description TEXT,
        segment TEXT,
        category TEXT,
        ncm TEXT,
        price REAL DEFAULT 0,
        image_url TEXT,
        updated_at TEXT,
        is_active INTEGER DEFAULT 1
      )
    `)

        // Índices para busca rápida
        this.db.run('CREATE INDEX IF NOT EXISTS idx_products_model ON products(model)')
        this.db.run('CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand)')
        this.db.run('CREATE INDEX IF NOT EXISTS idx_products_segment ON products(segment)')
        this.db.run('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)')

        // Tabela de segmentos
        this.db.run(`
      CREATE TABLE IF NOT EXISTS segments (
        id INTEGER PRIMARY KEY,
        name TEXT,
        seo TEXT,
        updated_at TEXT
      )
    `)

        // Tabela de categorias
        this.db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY,
        name TEXT,
        segment_id INTEGER,
        seo TEXT,
        updated_at TEXT,
        FOREIGN KEY (segment_id) REFERENCES segments(id)
      )
    `)

        // Tabela de clientes
        this.db.run(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY,
        name TEXT,
        fantasy_name TEXT,
        cnpj TEXT,
        city TEXT,
        state TEXT,
        phone TEXT,
        email TEXT,
        seller_id INTEGER,
        updated_at TEXT
      )
    `)

        // Índices para clientes
        this.db.run('CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name)')
        this.db.run('CREATE INDEX IF NOT EXISTS idx_customers_cnpj ON customers(cnpj)')
        this.db.run('CREATE INDEX IF NOT EXISTS idx_customers_city ON customers(city)')
        this.db.run('CREATE INDEX IF NOT EXISTS idx_customers_seller ON customers(seller_id)')

        // Tabela de leads rascunho (offline)
        this.db.run(`
      CREATE TABLE IF NOT EXISTS leads_draft (
        id TEXT PRIMARY KEY,
        customer_id INTEGER,
        customer_name TEXT,
        items TEXT,
        notes TEXT,
        status TEXT DEFAULT 'draft',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0
      )
    `)

        // Fila de sincronização
        this.db.run(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT,
        entity TEXT,
        entity_id TEXT,
        payload TEXT,
        attempts INTEGER DEFAULT 0,
        last_attempt TEXT,
        status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)

        // Metadados de sync
        this.db.run(`
      CREATE TABLE IF NOT EXISTS sync_metadata (
        entity TEXT PRIMARY KEY,
        last_sync TEXT,
        count INTEGER DEFAULT 0
      )
    `)

        console.log('📦 SQLite: Migration V1 aplicada')
    }

    /**
     * Migration V2 - Tabelas auxiliares
     */
    async _migrationV2() {
        // Imagens de produtos
        this.db.run(`
      CREATE TABLE IF NOT EXISTS product_images (
        product_id INTEGER,
        url TEXT,
        display_order INTEGER DEFAULT 0,
        PRIMARY KEY (product_id, url)
      )
    `)
        this.db.run('CREATE INDEX IF NOT EXISTS idx_prod_images ON product_images(product_id)')

        // Endereços de clientes
        this.db.run(`
      CREATE TABLE IF NOT EXISTS customer_addresses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        address TEXT,
        number TEXT,
        neighborhood TEXT,
        city TEXT,
        state TEXT,
        zipcode TEXT
      )
    `)
        this.db.run('CREATE INDEX IF NOT EXISTS idx_cust_addr ON customer_addresses(customer_id)')

        console.log('📦 SQLite: Migration V2 aplicada')
    }

    /**
     * Salva o banco no IndexedDB
     */
    async _saveToIndexedDB() {
        return new Promise((resolve, reject) => {
            const data = this.db.export()
            const request = indexedDB.open(DB_NAME, 1)

            request.onupgradeneeded = (event) => {
                const db = event.target.result
                if (!db.objectStoreNames.contains('database')) {
                    db.createObjectStore('database')
                }
            }

            request.onsuccess = (event) => {
                const db = event.target.result
                const tx = db.transaction('database', 'readwrite')
                const store = tx.objectStore('database')
                store.put(data, 'sqlite')
                tx.oncomplete = () => resolve()
                tx.onerror = () => reject(tx.error)
            }

            request.onerror = () => reject(request.error)
        })
    }

    /**
     * Carrega o banco do IndexedDB
     */
    async _loadFromIndexedDB() {
        return new Promise((resolve) => {
            const request = indexedDB.open(DB_NAME, 1)

            request.onupgradeneeded = (event) => {
                const db = event.target.result
                if (!db.objectStoreNames.contains('database')) {
                    db.createObjectStore('database')
                }
            }

            request.onsuccess = (event) => {
                const db = event.target.result
                const tx = db.transaction('database', 'readonly')
                const store = tx.objectStore('database')
                const getRequest = store.get('sqlite')

                getRequest.onsuccess = () => {
                    resolve(getRequest.result || null)
                }
                getRequest.onerror = () => resolve(null)
            }

            request.onerror = () => resolve(null)
        })
    }

    /**
     * Persiste mudanças no IndexedDB
     */
    async persist() {
        if (!this.isReady) await this.init()
        await this._saveToIndexedDB()
    }

    // ==========================================
    // PRODUTOS
    // ==========================================

    /**
     * Salva produtos no cache
     */
    async saveProducts(products) {
        if (!this.isReady) await this.init()

        const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO products 
      (id, model, brand, name, description, segment, category, ncm, price, image_url, updated_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

        const stmtImg = this.db.prepare(`
            INSERT INTO product_images (product_id, url, display_order)
            VALUES (?, ?, ?)
        `)

        for (const p of products) {
            stmt.run([
                p.id,
                p.model || p.modelo,
                p.brand || p.marca,
                p.name || p.nome,
                p.description || p.descricao,
                p.segment || p.segmento,
                p.category || p.categoria,
                p.ncm,
                p.price || p.preco_tabela || 0,
                p.image_url || `https://img.rolemak.com.br/id/h180/${p.id}.jpg`,
                new Date().toISOString(),
                1
            ])

            // Salvar imagem
            this.db.run('DELETE FROM product_images WHERE product_id = ?', [p.id])
            const mainImage = p.image_url || `https://img.rolemak.com.br/id/h180/${p.id}.jpg`
            if (mainImage) {
                stmtImg.run([p.id, mainImage, 0])
            }
        }
        stmt.free()
        stmtImg.free()

        await this.persist()
        console.log(`📦 SQLite: ${products.length} produtos salvos no cache`)
    }

    /**
     * Busca produtos no cache
     */
    async searchProducts({ search, segment, category, brand, limit = 50, offset = 0 }) {
        if (!this.isReady) await this.init()

        let sql = 'SELECT * FROM products WHERE is_active = 1'
        const params = []

        if (search) {
            sql += ' AND (model LIKE ? OR brand LIKE ? OR name LIKE ?)'
            const term = `%${search}%`
            params.push(term, term, term)
        }

        if (segment) {
            sql += ' AND segment = ?'
            params.push(segment)
        }

        if (category) {
            sql += ' AND category = ?'
            params.push(category)
        }

        if (brand) {
            sql += ' AND brand = ?'
            params.push(brand)
        }

        sql += ' ORDER BY model ASC LIMIT ? OFFSET ?'
        params.push(limit, offset)

        const result = this.db.exec(sql, params)
        return this._resultToObjects(result)
    }

    /**
     * Retorna contagem de produtos
     */
    async getProductsCount() {
        if (!this.isReady) await this.init()
        const result = this.db.exec('SELECT COUNT(*) as count FROM products WHERE is_active = 1')
        return result[0]?.values[0]?.[0] || 0
    }

    /**
     * Retorna segmentos únicos
     */
    async getSegments() {
        if (!this.isReady) await this.init()
        const result = this.db.exec('SELECT DISTINCT segment FROM products WHERE segment IS NOT NULL AND segment != "" ORDER BY segment')
        return result[0]?.values.map(v => v[0]) || []
    }

    /**
     * Retorna categorias únicas
     */
    async getCategories() {
        if (!this.isReady) await this.init()
        const result = this.db.exec('SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != "" ORDER BY category')
        return result[0]?.values.map(v => v[0]) || []
    }

    /**
     * Retorna marcas únicas
     */
    async getBrands() {
        if (!this.isReady) await this.init()
        const result = this.db.exec('SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL AND brand != "" ORDER BY brand')
        return result[0]?.values.map(v => v[0]) || []
    }

    // ==========================================
    // CLIENTES
    // ==========================================

    /**
     * Salva clientes no cache
     */
    async saveCustomers(customers) {
        if (!this.isReady) await this.init()

        const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO customers 
      (id, name, fantasy_name, cnpj, city, state, phone, email, seller_id, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

        const stmtAddr = this.db.prepare(`
            INSERT INTO customer_addresses (customer_id, address, number, neighborhood, city, state, zipcode)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `)

        for (const c of customers) {
            stmt.run([
                c.id,
                c.name || c.razao_social,
                c.fantasy_name || c.fantasia,
                c.cnpj,
                c.city || c.cidade,
                c.state || c.uf,
                c.phone || c.telefone,
                c.email,
                c.seller_id || c.vendedor_id,
                new Date().toISOString()
            ])

            // Salvar endereço
            this.db.run('DELETE FROM customer_addresses WHERE customer_id = ?', [c.id])

            if (c.address || c.endereco) {
                stmtAddr.run([
                    c.id,
                    c.address || c.endereco,
                    c.number || c.numero || '',
                    c.neighborhood || c.bairro || '',
                    c.city || c.cidade || '',
                    c.state || c.uf || '',
                    c.zipcode || c.cep || ''
                ])
            }
        }
        stmt.free()
        stmtAddr.free()

        await this.persist()
        console.log(`📦 SQLite: ${customers.length} clientes salvos no cache`)
    }

    /**
     * Busca clientes no cache
     */
    async searchCustomers({ search, sellerId, limit = 50, offset = 0 }) {
        if (!this.isReady) await this.init()

        let sql = 'SELECT * FROM customers WHERE 1=1'
        const params = []

        if (search) {
            sql += ' AND (name LIKE ? OR fantasy_name LIKE ? OR cnpj LIKE ? OR city LIKE ?)'
            const term = `%${search}%`
            params.push(term, term, term, term)
        }

        if (sellerId) {
            sql += ' AND seller_id = ?'
            params.push(sellerId)
        }

        sql += ' ORDER BY name ASC LIMIT ? OFFSET ?'
        params.push(limit, offset)

        const result = this.db.exec(sql, params)
        return this._resultToObjects(result)
    }

    // ==========================================
    // SYNC QUEUE
    // ==========================================

    /**
     * Adiciona item à fila de sincronização
     */
    async addToSyncQueue(action, entity, entityId, payload) {
        if (!this.isReady) await this.init()

        this.db.run(`
      INSERT INTO sync_queue (action, entity, entity_id, payload)
      VALUES (?, ?, ?, ?)
    `, [action, entity, entityId, JSON.stringify(payload)])

        await this.persist()
    }

    /**
     * Retorna itens pendentes na fila
     */
    async getPendingSyncItems() {
        if (!this.isReady) await this.init()
        // Buscar pendentes e erros (para retry)
        const result = this.db.exec("SELECT * FROM sync_queue WHERE status IN ('pending', 'error') ORDER BY created_at ASC")
        return this._resultToObjects(result)
    }

    /**
     * Marca item como sincronizado
     */
    async markSynced(id) {
        if (!this.isReady) await this.init()
        this.db.run("UPDATE sync_queue SET status = 'synced' WHERE id = ?", [id])
        await this.persist()
    }

    /**
     * Marca item como erro
     */
    async markSyncError(id) {
        if (!this.isReady) await this.init()
        this.db.run(`
      UPDATE sync_queue 
      SET status = 'error', attempts = attempts + 1, last_attempt = ?
      WHERE id = ?
    `, [new Date().toISOString(), id])
        await this.persist()
    }

    // ==========================================
    // METADATA
    // ==========================================

    /**
     * Atualiza metadados de sync
     */
    async updateSyncMetadata(entity, count) {
        if (!this.isReady) await this.init()
        this.db.run(`
      INSERT OR REPLACE INTO sync_metadata (entity, last_sync, count)
      VALUES (?, ?, ?)
    `, [entity, new Date().toISOString(), count])
        await this.persist()
    }

    /**
     * Retorna data do último sync
     */
    async getLastSync(entity) {
        if (!this.isReady) await this.init()
        const result = this.db.exec('SELECT last_sync FROM sync_metadata WHERE entity = ?', [entity])
        return result[0]?.values[0]?.[0] || null
    }

    // ==========================================
    // UTILS
    // ==========================================

    /**
     * Converte resultado do sql.js para array de objetos
     */
    _resultToObjects(result) {
        if (!result[0]) return []

        const columns = result[0].columns
        return result[0].values.map(row => {
            const obj = {}
            columns.forEach((col, i) => {
                obj[col] = row[i]
            })
            return obj
        })
    }

    /**
     * Limpa todo o cache
     */
    async clearCache() {
        if (!this.isReady) await this.init()

        this.db.run('DELETE FROM products')
        this.db.run('DELETE FROM customers')
        this.db.run('DELETE FROM sync_queue')
        this.db.run('DELETE FROM sync_metadata')

        await this.persist()
        console.log('🗑️ SQLite: Cache limpo')
    }

    /**
     * Retorna estatísticas do cache
     */
    async getStats() {
        if (!this.isReady) await this.init()

        const products = this.db.exec('SELECT COUNT(*) FROM products')[0]?.values[0]?.[0] || 0
        const customers = this.db.exec('SELECT COUNT(*) FROM customers')[0]?.values[0]?.[0] || 0
        const pendingSync = this.db.exec("SELECT COUNT(*) FROM sync_queue WHERE status = 'pending'")[0]?.values[0]?.[0] || 0
        const drafts = this.db.exec("SELECT COUNT(*) FROM leads_draft WHERE synced = 0")[0]?.values[0]?.[0] || 0

        // Estimar tamanho do banco
        let dbSize = 0
        try {
            const exported = this.db.export()
            dbSize = exported.length
        } catch (e) {
            console.warn('Não foi possível calcular tamanho do DB')
        }

        return {
            products,
            customers,
            pendingSync,
            drafts,
            schemaVersion: SCHEMA_VERSION,
            dbSizeBytes: dbSize,
            dbSizeMB: (dbSize / 1024 / 1024).toFixed(2)
        }
    }

    /**
     * Verifica quota de armazenamento disponível
     */
    async checkStorageQuota() {
        if (navigator.storage && navigator.storage.estimate) {
            const { usage, quota } = await navigator.storage.estimate()
            const percentUsed = ((usage / quota) * 100).toFixed(2)
            return {
                usage,
                quota,
                available: quota - usage,
                percentUsed,
                isNearLimit: percentUsed > 80
            }
        }
        return { available: null, isNearLimit: false }
    }

    /**
     * Limpa dados antigos usando estratégia LRU
     * Remove registros não acessados há mais de X dias
     */
    async cleanOldData(daysOld = 30) {
        if (!this.isReady) await this.init()

        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - daysOld)
        const cutoff = cutoffDate.toISOString()

        // Limpar produtos antigos
        const deletedProducts = this.db.exec(
            `DELETE FROM products WHERE updated_at < ? AND id NOT IN (
                SELECT DISTINCT product_id FROM leads_draft WHERE synced = 0
            )`,
            [cutoff]
        )

        // Limpar sync queue processados
        this.db.run("DELETE FROM sync_queue WHERE status = 'synced' AND created_at < ?", [cutoff])

        // Limpar leads sincronizados antigos
        this.db.run("DELETE FROM leads_draft WHERE synced = 1 AND updated_at < ?", [cutoff])

        await this.persist()
        console.log(`🗑️ SQLite: Dados antigos (>${daysOld} dias) removidos`)
    }

    /**
     * Logs de erro para debug
     */
    /**
     * Logs de erro para debug
     */
    logError(operation, error) {
        // Implementação simplificada de log (pode ser expandida para tabela separada se necessário)
        console.error(`[SQLite Error] ${operation}:`, error)
    }

    /**
     * Retorna itens com erro na fila de sync (usado para notificações)
     */
    async getErrorLogs() {
        if (!this.isReady) await this.init()
        const result = this.db.exec("SELECT * FROM sync_queue WHERE status = 'error' ORDER BY last_attempt DESC")
        const items = this._resultToObjects(result)

        // Mapear para formato esperado pelo componente de notificação
        return items.map(item => ({
            id: item.id,
            message: `Erro ao sincronizar ${item.entity} (${item.action})`,
            error: `Tentativa ${item.attempts} falhou.`,
            timestamp: item.last_attempt,
            entity: item.entity,
            action: item.action
        }))
    }

    /**
     * Limpa logs de erro (reseta items para status pending ou remove)
     * Aqui opto por remover items com erro se usuário pedir limpar, 
     * OU melhor, resetar para 'pending' para tentar de novo?
     * O componente diz "Limpar", o que sugere remover da lista visual.
     * Mas se removermos da fila, perdemos o dado.
     * Vou interpretar "Limpar" como "Reconhecer erro e parar de tentar por enquanto" ou "Excluir".
     * Dado que são dados de leads, excluir é perigoso. 
     * Vou mudar status para 'cancelled' (preciso suportar esse status).
     * Ou deletar. O usuário tem botão "Excluir" no rascunho.
     * O componente SyncErrorNotifications tem "Limpar" que chama clearErrorLogs.
     * Vou implementar clearErrorLogs deletando os logs? Não, sync_queue é a fila de trabalho.
     * Vou resetar attempts para 0 e status para 'pending' (retry manual).
     */
    async clearErrorLogs() {
        if (!this.isReady) await this.init()
        // Resetar itens com erro para pending (retry manual forçado)
        this.db.run("UPDATE sync_queue SET status = 'pending', attempts = 0 WHERE status = 'error'")
        await this.persist()
    }


    /**
     * Métricas de performance
     */
    async getPerformanceMetrics() {
        if (!this.isReady) await this.init()

        // Medir tempo de busca
        const startSearch = performance.now()
        await this.searchProducts({ search: 'test', limit: 10 })
        const searchTime = performance.now() - startSearch

        // Medir tempo de contagem
        const startCount = performance.now()
        await this.getProductsCount()
        const countTime = performance.now() - startCount

        return {
            searchTimeMs: searchTime.toFixed(2),
            countTimeMs: countTime.toFixed(2),
            isReady: this.isReady,
            schemaVersion: SCHEMA_VERSION
        }
    }
}

// Singleton
export const sqliteService = new SQLiteService()
export default sqliteService
