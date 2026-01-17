import { getDatabase } from '../config/database.js';
import { StockRepository } from './stock.repository.js';
import { Order } from '../models/Order.js';
import { CartItem } from '../models/CartItem.js';

const db = () => getDatabase();
const stockRepository = new StockRepository();

export class OrderRepository {
  /**
   * Busca um pedido por ID (mak.hoje + mak.hist)
   */
  async findById(orderId) {
    // 1. Buscar pedido principal em mak.hoje
    const orderQuery = `
      SELECT 
        h.*,
        c.id as customer_id,
        c.nome as customer_nome,
        c.cnpj as customer_cnpj,
        c.cpf as customer_cpf,
        c.ender as customer_ender,
        c.cidade as customer_cidade,
        c.estado as customer_estado,
        c.email as customer_email,
        c.fone as customer_fone,
        t.id as transporter_id,
        t.nome as transporter_name,
        e.EmitentePOID as emit_id,
        e.nome as emit_name
      FROM mak.hoje h
      LEFT JOIN clientes c ON h.idcli = c.id
      LEFT JOIN transportadora t ON h.idtr = t.id
      LEFT JOIN mak.Emitentes e ON h.EmissorPOID = e.EmitentePOID
      WHERE h.id = ?
    `;

    const [orderRows] = await db().execute(orderQuery, [orderId]);

    if (orderRows.length === 0) {
      return null;
    }

    const orderRow = orderRows[0];

    // 2. Buscar itens do pedido em mak.hist
    const itemsQuery = `
      SELECT 
        hist.*,
        inv.id as product_id,
        inv.modelo as product_model,
        inv.marca as product_brand,
        inv.nome as product_name,
        inv.description as product_description,
        p.segmento as product_segment,
        p.categoria as product_category
      FROM mak.hist hist
      LEFT JOIN inv inv ON hist.isbn = inv.id
      LEFT JOIN produtos p ON inv.idcf = p.id
      WHERE hist.pedido = ?
      ORDER BY hist.id ASC
    `;

    const [itemRows] = await db().execute(itemsQuery, [orderId]);

    // 3. Construir objeto Order
    const order = new Order(orderRow);

    // Adicionar dados do cliente
    if (orderRow.customer_id) {
      order.customer = {
        id: orderRow.customer_id,
        nome: orderRow.customer_nome,
        cnpj: orderRow.customer_cnpj,
        cpf: orderRow.customer_cpf,
        ender: orderRow.customer_ender,
        cidade: orderRow.customer_cidade,
        estado: orderRow.customer_estado,
        email: orderRow.customer_email,
        phone: orderRow.customer_fone
      };
    }

    // Adicionar dados da transportadora
    if (orderRow.transporter_id) {
      order.transporter = {
        id: orderRow.transporter_id,
        name: orderRow.transporter_name
      };
    }

    // Adicionar dados da unidade emitente
    if (orderRow.emit_id) {
      order.emitUnity = {
        id: orderRow.emit_id,
        name: orderRow.emit_name
      };
    }

    // Adicionar itens
    order.items = itemRows.map(row => {
      const item = new CartItem({
        cCart: row.id,
        cSCart: null, // Não aplicável para pedidos
        cProduct: row.isbn,
        qProduct: row.quant,
        vProduct: row.vProduct || row.valor_base,
        vProductCC: row.vProductCC || row.vProduct || row.valor_base,
        vProductOriginal: row.tabela || row.valor_base,
        tProduct: row.vezes || 1,
        vIPI: row.valor_ipi || 0,
        vCST: row.valor_st || 0,
        TTD: row.TTD || 0,
        dInquiry: row.entrada || new Date()
      });

      // Adicionar dados do produto
      if (row.product_id) {
        item.product = {
          id: row.product_id,
          model: row.product_model,
          brand: row.product_brand,
          name: row.product_name,
          description: row.product_description,
          segment: row.product_segment,
          category: row.product_category
        };
      }

      return item;
    });

    return order;
  }

  /**
   * Converte um lead para pedido (hoje/hist)
   */
  async createFromLead(lead, items, userId) {
    const connection = await db().getConnection();

    try {
      await connection.beginTransaction();

      // 1. Calcular totais se não estiverem no lead
      let subtotal = 0;
      let totalIPI = 0;
      let totalST = 0;
      let totalQuantity = 0;

      items.forEach(item => {
        subtotal += parseFloat(item.vProduct) * parseFloat(item.qProduct);
        totalIPI += parseFloat(item.vIPI) || 0;
        totalST += parseFloat(item.vCST) || 0;
        totalQuantity += parseFloat(item.qProduct);
      });

      const grandTotal = subtotal + totalIPI + totalST;
      const freight = parseFloat(lead.vFreight) || 0;
      const totalOrder = grandTotal + freight;

      // 2. Inserir no mak.hoje
      const hojeQuery = `
        INSERT INTO mak.hoje (
          data, nop, idcli, idcom, emissor, vendedor, pg, terms, fprazo, prazo,
          idtr, frete, EmissorPOID, UnidadeLogistica, datae, crossover, obs,
          obsfinanc, obslogistic, obsnfe, valor_base, valor_st, valor_ipi,
          valor, usvale, comissao_revenda, entrada, spedido, source
        ) VALUES (
          NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, 
          ?, ?, ?, ?, ?, ?, ?, 
          ?, ?, ?, ?, ?, ?, 
          ?, ?, ?, ?, ?, ?
        )
      `;

      // Maquiagem de Unidade Logística (conforme K3)
      const unilog = lead.cLogUnity === 99 ? 1 : lead.cLogUnity;

      const hojeParams = [
        lead.cNatOp || null,              // nop
        lead.cCustomer || null,           // idcli
        lead.cCC || 0,                    // idcom
        userId || null,                   // emissor (usuário logado)
        lead.cSeller || userId || null,   // vendedor
        lead.cPaymentType || null,        // pg
        lead.vPaymentTerms || 0,          // terms
        lead.cPaymentTerms || null,       // fprazo
        204,                              // prazo (padrão K3)
        lead.cTransporter || 9,           // idtr
        freight || 0,                     // frete
        unilog || null,                   // EmissorPOID
        unilog || null,                   // UnidadeLogistica
        lead.dDelivery || new Date(),     // datae
        lead.cOrderWeb || 0,              // crossover
        [
          lead.xRemarksFinance || '',
          lead.xRemarksLogistic || '',
          lead.xRemarksNFE || '',
          lead.xRemarksOBS || '',
          lead.xRemarksManager || ''
        ].filter(r => r.trim()).join(' | '), // obs
        lead.xRemarksFinance || '',        // obsfinanc
        lead.xRemarksLogistic || '',       // obslogistic
        lead.xRemarksNFE || '',            // obsnfe
        subtotal || 0,                    // valor_base
        totalST || 0,                     // valor_st
        totalIPI || 0,                    // valor_ipi
        totalOrder || 0,                  // valor
        totalOrder || 0,                  // usvale (K3 usa igual ao valor)
        lead.vComission || 0,             // comissao_revenda
        0,                                // entrada
        lead.cOrderWeb || 0,              // spedido
        lead.cSource || 0                 // source
      ];

      const [hojeResult] = await connection.execute(hojeQuery, hojeParams);
      const orderId = hojeResult.insertId;

      // 3. Inserir no mak.hist e Atualizar Estoque
      const tables = await stockRepository.getStockTables(lead.cEmitUnity || 1);

      for (const item of items) {
        // Determinar origem do estoque (Normal ou TTD)
        // item.productId ou item.cProduct dependendo de como o CartItem model expõe
        const prodId = item.productId || item.cProduct || item.id;
        const stockSource = await stockRepository.defineStockSource(prodId, item.qProduct, tables);

        if (stockSource === 999) {
          throw new Error(`Produto ${item.productName || prodId} sem estoque disponível!`);
        }

        const histQuery = `
          INSERT INTO mak.hist (
            quant, vezes, valor, valor_base, vProduct, vProductCC,
            aliquota_ipi, valor_ipi, valor_st, entrada, tabela,
            pedido, idcli, isbn, estoque, obs, TTD
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const histParams = [
          item.qProduct || 0,             // quant
          item.tProduct || 1,             // vezes
          (item.vProduct || 0) * (item.qProduct || 0),  // valor
          item.vProduct || 0,             // valor_base
          item.vProduct || 0,             // vProduct
          item.vProductCC || item.vProduct || 0, // vProductCC
          0,                              // aliquota_ipi
          item.vIPI || 0,                 // valor_ipi
          item.vCST || 0,                 // valor_st
          0,                              // entrada
          item.vProductOriginal || item.vProduct || 0, // tabela
          orderId || null,                // pedido
          lead.cCustomer || null,         // idcli
          prodId || null,                 // isbn
          0,                              // estoque
          '',                             // obs
          stockSource === 99 ? 0 : stockSource // TTD
        ];

        await connection.execute(histQuery, histParams);

        // Atualizar Estoque Físico (assumindo saída)
        await stockRepository.updateStock(prodId, item.qProduct, stockSource, tables, '-');
      }

      // 4. Marcar lead como convertido (ou deletar conforme K3)
      // No K3 original (PHP action_clean), ele deleta.
      // Aqui vamos marcar como tipo 2 (Pedido) e salvar o orderId
      const updateLeadQuery = `
        UPDATE mak.sCart SET 
          cType = 2, 
          cOrderWeb = ?, 
          cUpdated = 1 
        WHERE cSCart = ?
      `;
      await connection.execute(updateLeadQuery, [orderId, lead.cSCart]);

      await connection.commit();
      return orderId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
