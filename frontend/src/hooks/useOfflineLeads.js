/**
 * Hook para leads offline (rascunhos)
 * 
 * Gerencia leads criados offline que ainda não foram sincronizados
 */

import { useState, useEffect, useCallback } from 'react'
import { sqliteService } from '../services/sqliteService'
import { leadsService } from '../services/api'
import { v4 as uuidv4 } from 'uuid'

export function useOfflineLeads({
    enabled = true
} = {}) {
    const [drafts, setDrafts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isOffline, setIsOffline] = useState(!navigator.onLine)

    useEffect(() => {
        const handleOnline = () => setIsOffline(false)
        const handleOffline = () => setIsOffline(true)

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    // Carregar rascunhos locais
    const loadDrafts = useCallback(async () => {
        if (!enabled) return

        try {
            setLoading(true)
            await sqliteService.init()

            const result = sqliteService.db.exec(
                "SELECT * FROM leads_draft WHERE synced = 0 ORDER BY updated_at DESC"
            )

            if (result[0]) {
                const columns = result[0].columns
                const rows = result[0].values.map(row => {
                    const obj = {}
                    columns.forEach((col, i) => {
                        obj[col] = row[i]
                    })
                    // Parse items JSON
                    if (obj.items) {
                        try {
                            obj.items = JSON.parse(obj.items)
                        } catch (e) {
                            obj.items = []
                        }
                    }
                    return obj
                })
                setDrafts(rows)
            } else {
                setDrafts([])
            }
        } catch (err) {
            console.error('Erro ao carregar rascunhos:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [enabled])

    useEffect(() => {
        loadDrafts()
    }, [loadDrafts])

    /**
     * Cria um novo rascunho de lead
     */
    const createDraft = useCallback(async (data) => {
        try {
            await sqliteService.init()

            const id = uuidv4()
            const now = new Date().toISOString()

            sqliteService.db.run(`
        INSERT INTO leads_draft (id, customer_id, customer_name, items, notes, status, created_at, updated_at, synced)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
      `, [
                id,
                data.customerId || null,
                data.customerName || '',
                JSON.stringify(data.items || []),
                data.notes || '',
                'draft',
                now,
                now
            ])

            await sqliteService.persist()
            await loadDrafts()

            return id
        } catch (err) {
            console.error('Erro ao criar rascunho:', err)
            throw err
        }
    }, [loadDrafts])

    /**
     * Atualiza um rascunho existente
     */
    const updateDraft = useCallback(async (id, data) => {
        try {
            await sqliteService.init()

            const now = new Date().toISOString()

            sqliteService.db.run(`
        UPDATE leads_draft 
        SET customer_id = ?, customer_name = ?, items = ?, notes = ?, updated_at = ?
        WHERE id = ?
      `, [
                data.customerId || null,
                data.customerName || '',
                JSON.stringify(data.items || []),
                data.notes || '',
                now,
                id
            ])

            await sqliteService.persist()
            await loadDrafts()
        } catch (err) {
            console.error('Erro ao atualizar rascunho:', err)
            throw err
        }
    }, [loadDrafts])

    /**
     * Remove um rascunho
     */
    const deleteDraft = useCallback(async (id) => {
        try {
            await sqliteService.init()

            sqliteService.db.run('DELETE FROM leads_draft WHERE id = ?', [id])

            await sqliteService.persist()
            await loadDrafts()
        } catch (err) {
            console.error('Erro ao remover rascunho:', err)
            throw err
        }
    }, [loadDrafts])

    /**
     * Adiciona um item ao rascunho
     */
    const addItemToDraft = useCallback(async (draftId, product, quantity = 1) => {
        try {
            const draft = drafts.find(d => d.id === draftId)
            if (!draft) throw new Error('Rascunho não encontrado')

            const items = draft.items || []
            const existingIndex = items.findIndex(i => i.productId === product.id)

            if (existingIndex >= 0) {
                items[existingIndex].quantity += quantity
            } else {
                items.push({
                    productId: product.id,
                    model: product.model || product.modelo,
                    brand: product.brand || product.marca,
                    name: product.name || product.nome,
                    price: product.price || product.preco_tabela || 0,
                    quantity
                })
            }

            await updateDraft(draftId, { ...draft, items })
        } catch (err) {
            console.error('Erro ao adicionar item:', err)
            throw err
        }
    }, [drafts, updateDraft])

    /**
     * Remove um item do rascunho
     */
    const removeItemFromDraft = useCallback(async (draftId, productId) => {
        try {
            const draft = drafts.find(d => d.id === draftId)
            if (!draft) throw new Error('Rascunho não encontrado')

            const items = (draft.items || []).filter(i => i.productId !== productId)

            await updateDraft(draftId, { ...draft, items })
        } catch (err) {
            console.error('Erro ao remover item:', err)
            throw err
        }
    }, [drafts, updateDraft])

    /**
     * Sincroniza um rascunho com o servidor
     */
    const syncDraft = useCallback(async (id) => {
        if (!navigator.onLine) {
            throw new Error('Sem conexão com internet')
        }

        try {
            const draft = drafts.find(d => d.id === id)
            if (!draft) throw new Error('Rascunho não encontrado')

            // Criar lead no servidor
            const response = await leadsService.create({
                customerId: draft.customer_id,
                items: draft.items,
                notes: draft.notes
            })

            if (response.data.success) {
                // Marcar como sincronizado
                await sqliteService.init()
                sqliteService.db.run(
                    'UPDATE leads_draft SET synced = 1 WHERE id = ?',
                    [id]
                )
                await sqliteService.persist()
                await loadDrafts()

                return response.data.data
            } else {
                throw new Error(response.data.error?.message || 'Erro ao sincronizar')
            }
        } catch (err) {
            console.error('Erro ao sincronizar rascunho:', err)
            throw err
        }
    }, [drafts, loadDrafts])

    /**
     * Sincroniza todos os rascunhos pendentes
     */
    const syncAllDrafts = useCallback(async () => {
        if (!navigator.onLine) {
            throw new Error('Sem conexão com internet')
        }

        const results = { success: 0, failed: 0 }

        for (const draft of drafts) {
            try {
                await syncDraft(draft.id)
                results.success++
            } catch (err) {
                results.failed++
            }
        }

        return results
    }, [drafts, syncDraft])

    return {
        drafts,
        loading,
        error,
        isOffline,
        pendingCount: drafts.length,
        createDraft,
        updateDraft,
        deleteDraft,
        addItemToDraft,
        removeItemFromDraft,
        syncDraft,
        syncAllDrafts,
        refresh: loadDrafts
    }
}

export default useOfflineLeads
