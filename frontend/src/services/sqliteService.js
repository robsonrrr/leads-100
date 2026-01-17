/**
 * SQLite Cache Service
 * 
 * Wrapper para sql.js que fornece cache local offline
 * com persistência no IndexedDB.
 */

import initSqlJs from 'sql.js'

// Versão do schema - incrementar ao alterar tabelas
const SCHEMA_VERSION = 1
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
        }
        stmt.free()

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
        }
        stmt.free()

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
        const result = this.db.exec("SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY created_at ASC")
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

        return {
            products,
            customers,
            pendingSync,
            schemaVersion: SCHEMA_VERSION
        }
    }
}

// Singleton
export const sqliteService = new SQLiteService()
export default sqliteService
