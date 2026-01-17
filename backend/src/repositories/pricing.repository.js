import { getDatabase } from '../config/database.js'

const db = () => getDatabase()

export class PricingRepository {
  /**
   * Busca promoções ativas da tabela csuite_pricing.pricing_active_promotions
   */
  async getActivePromotions() {
    const query = `
      SELECT 
        pap.*,
        i.id as sku_id,
        i.modelo as product_model,
        i.marca as product_brand,
        i.nome as product_name,
        i.description as product_description
      FROM csuite_pricing.pricing_active_promotions pap
      LEFT JOIN inv i ON pap.sku_id = i.id
      WHERE pap.status = 'active'
      ORDER BY pap.created_at DESC
    `
    
    const [rows] = await db().execute(query)
    
    return rows.map(row => ({
      id: row.id,
      waveId: row.wave_id,
      skuId: row.sku_id,
      sku: row.sku_id,
      brand: row.product_brand || row.marca,
      model: row.product_model || row.modelo,
      productName: row.product_name || row.nome,
      originalPrice: parseFloat(row.original_price || 0),
      promoPrice: parseFloat(row.promo_price || 0),
      discount: parseFloat(row.discount || 0),
      stock: row.stock || 'unknown',
      timeRemaining: row.time_remaining || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      status: row.status
    }))
  }

  /**
   * Busca informações da última onda de promoções
   */
  async getLastWaveInfo() {
    const query = `
      SELECT 
        wave_id,
        MAX(created_at) as last_wave_date,
        COUNT(*) as product_count
      FROM csuite_pricing.pricing_active_promotions
      WHERE status = 'active'
      GROUP BY wave_id
      ORDER BY last_wave_date DESC
      LIMIT 1
    `
    
    const [rows] = await db().execute(query)
    
    if (rows.length === 0) {
      return null
    }
    
    const row = rows[0]
    return {
      waveId: row.wave_id,
      lastWaveDate: row.last_wave_date,
      productCount: row.product_count
    }
  }
}
