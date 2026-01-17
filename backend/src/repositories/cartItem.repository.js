import { getDatabase } from '../config/database.js';
import { CartItem } from '../models/CartItem.js';
import { CacheService } from '../services/cache.service.js';

const db = () => getDatabase();

export class CartItemRepository {
  /**
   * Busca todos os itens de um lead
   */
  async findByLeadId(leadId) {
    const query = `
      SELECT 
        i.*,
        inv.id as product_id,
        inv.modelo as product_model,
        inv.marca as product_brand,
        inv.nome as product_name,
        inv.description as product_description,
        p.segmento as product_segment,
        p.categoria as product_category,
        COALESCE(e.total_disponivel, 0) as product_stock,
        COALESCE(e.e09_disponivel, 0) as stock_109,
        COALESCE(e.e70_disponivel, 0) as stock_370,
        COALESCE(e.e13_disponivel, 0) as stock_613,
        COALESCE(e.e13_ttd_disponivel, 0) as stock_613_ttd,
        COALESCE(e.e85_disponivel, 0) as stock_885,
        COALESCE(e.e66_disponivel, 0) as stock_966
      FROM icart i
      LEFT JOIN inv inv ON i.cProduct = inv.id
      LEFT JOIN produtos p ON inv.idcf = p.id
      LEFT JOIN produtos_estoque e ON e.produto_id = inv.id
      WHERE i.cSCart = ?
      ORDER BY i.cCart ASC
    `;
    const [rows] = await db().execute(query, [leadId]);

    return rows.map(row => {
      const item = new CartItem(row);
      if (row.product_id) {
        item.product = {
          id: row.product_id,
          model: row.product_model,
          brand: row.product_brand,
          name: row.product_name,
          description: row.product_description,
          segment: row.product_segment,
          category: row.product_category,
          stock: parseInt(row.product_stock) || 0,
          stockByWarehouse: {
            '109': parseInt(row.stock_109) || 0,
            '370': parseInt(row.stock_370) || 0,
            '613': parseInt(row.stock_613) || 0,
            '613_TTD': parseInt(row.stock_613_ttd) || 0,
            '885': parseInt(row.stock_885) || 0,
            '966': parseInt(row.stock_966) || 0
          }
        };
      }
      return item;
    });
  }

  /**
   * Busca um item por ID
   */
  async findById(itemId) {
    const query = `
      SELECT 
        i.*,
        inv.id as product_id,
        inv.modelo as product_model,
        inv.marca as product_brand,
        inv.nome as product_name,
        inv.description as product_description
      FROM icart i
      LEFT JOIN inv inv ON i.cProduct = inv.id
      LEFT JOIN produtos p ON inv.idcf = p.id
      WHERE i.cCart = ?
    `;
    const [rows] = await db().execute(query, [itemId]);

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    const item = new CartItem(row);
    if (row.product_id) {
      item.product = {
        id: row.product_id,
        model: row.product_model,
        brand: row.product_brand,
        name: row.product_name,
        description: row.product_description
      };
    }
    return item;
  }

  async findByLeadIdAndProductId(leadId, productId) {
    const query = `
      SELECT 
        i.*,
        inv.id as product_id,
        inv.modelo as product_model,
        inv.marca as product_brand,
        inv.nome as product_name,
        inv.description as product_description
      FROM icart i
      LEFT JOIN inv inv ON i.cProduct = inv.id
      LEFT JOIN produtos p ON inv.idcf = p.id
      WHERE i.cSCart = ? AND i.cProduct = ?
      LIMIT 1
    `

    const [rows] = await db().execute(query, [leadId, productId])
    if (rows.length === 0) return null

    const row = rows[0]
    const item = new CartItem(row)
    if (row.product_id) {
      item.product = {
        id: row.product_id,
        model: row.product_model,
        brand: row.product_brand,
        name: row.product_name,
        description: row.product_description
      }
    }
    return item
  }

  async incrementQuantity(itemId, leadId, deltaQuantity) {
    const query = 'UPDATE icart SET qProduct = qProduct + ? WHERE cCart = ?'
    await db().execute(query, [deltaQuantity, itemId])

    if (leadId) {
      await this.invalidateCache(leadId)
    }

    return this.findById(itemId)
  }

  /**
   * Adiciona um item ao carrinho
   */
  async create(itemData) {
    const item = new CartItem(itemData);

    const query = `
      INSERT INTO icart (
        cSCart, cProduct, qProduct, vProduct, vProductCC,
        vProductOriginal, tProduct, vIPI, vCST, TTD, dInquiry, ai_decision_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      item.cSCart,
      item.cProduct,
      item.qProduct,
      item.vProduct,
      item.vProductCC,
      item.vProductOriginal,
      item.tProduct,
      item.vIPI,
      item.vCST,
      item.TTD,
      item.dInquiry,
      item.aiDecisionId
    ];

    const [result] = await db().execute(query, params);
    item.cCart = result.insertId;

    // Invalidar cache de totais
    await this.invalidateCache(item.cSCart);

    return this.findById(item.cCart);
  }

  /**
   * Atualiza um item do carrinho
   */
  async update(itemId, itemData) {
    const item = new CartItem(itemData);

    const query = `
      UPDATE icart SET
        cProduct = ?,
        qProduct = ?,
        vProduct = ?,
        vProductCC = ?,
        vProductOriginal = ?,
        tProduct = ?,
        vIPI = ?,
        vCST = ?,
        TTD = ?,
        ai_decision_id = ?
      WHERE cCart = ?
    `;

    const params = [
      item.cProduct,
      item.qProduct,
      item.vProduct,
      item.vProductCC,
      item.vProductOriginal,
      item.tProduct,
      item.vIPI,
      item.vCST,
      item.TTD,
      item.aiDecisionId,
      itemId
    ];

    await db().execute(query, params);

    // Invalidar cache (precisamos do leadId)
    const updated = await this.findById(itemId);
    if (updated) {
      await this.invalidateCache(updated.cSCart);
    }

    return updated;
  }

  /**
   * Remove um item do carrinho
   */
  async delete(itemId) {
    // Buscar item antes de deletar para obter leadId
    const item = await this.findById(itemId);
    const leadId = item?.cSCart;

    const query = 'DELETE FROM icart WHERE cCart = ?';
    await db().execute(query, [itemId]);

    // Invalidar cache
    if (leadId) {
      await this.invalidateCache(leadId);
    }

    return true;
  }

  /**
   * Remove todos os itens de um lead
   */
  async deleteByLeadId(leadId) {
    const query = 'DELETE FROM icart WHERE cSCart = ?';
    await db().execute(query, [leadId]);

    // Invalidar cache
    await this.invalidateCache(leadId);

    return true;
  }

  /**
   * Calcula totais do carrinho
   * Cached: 5 minutos
   */
  async calculateTotals(leadId) {
    return CacheService.getCartTotals(leadId, async () => {
      const query = `
        SELECT 
          COUNT(*) as itemCount,
          SUM(qProduct) as totalQuantity,
          SUM(qProduct * vProduct) as subtotal,
          SUM(qProduct * vProductCC) as consumerSubtotal,
          SUM(vIPI) as totalIPI,
          SUM(vCST) as totalST
        FROM icart
        WHERE cSCart = ?
      `;
      const [rows] = await db().execute(query, [leadId]);

      const totals = rows[0] || {
        itemCount: 0,
        totalQuantity: 0,
        subtotal: 0,
        totalIPI: 0,
        totalST: 0
      };

      const subtotal = parseFloat(totals.subtotal) || 0;
      const consumerSubtotal = parseFloat(totals.consumerSubtotal) || 0;
      const totalIPI = parseFloat(totals.totalIPI) || 0;
      const totalST = parseFloat(totals.totalST) || 0;
      const total = subtotal + totalIPI + totalST;
      const consumerTotal = consumerSubtotal + totalIPI + totalST;

      return {
        itemCount: parseInt(totals.itemCount) || 0,
        totalQuantity: parseFloat(totals.totalQuantity) || 0,
        subtotal,
        consumerSubtotal,
        totalIPI,
        totalST,
        total,
        consumerTotal
      };
    });
  }

  /**
   * Invalida cache de totais de um carrinho
   */
  async invalidateCache(leadId) {
    await CacheService.invalidateCart(leadId);
  }
}

