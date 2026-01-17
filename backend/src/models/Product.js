/**
 * Product Model
 * Representa um produto do sistema
 */
export class Product {
  constructor(data) {
    // Campos de inv (tabela principal)
    this.id = data.id || null;
    this.modelo = data.modelo || '';
    this.nome = data.nome || '';
    this.descricao = data.description || data.descricao || '';
    this.codebar = data.codebar || '';
    this.marca = data.marca || '';
    this.revenda = data.revenda || 0;
    this.custo = data.custo || 0;

    // Campos de produtos (tabela auxiliar - segmento, NCM, impostos)
    this.segmento = data.segmento || '';
    this.segmento_id = data.segmento_id || 0;
    this.categoria = data.categoria || '';
    this.ncm = data.ncm || '';
    this.red = data.red || 5.00;
    this.cf = data.cf || '';
    this.frete = data.frete || 3.00;
    this.icms = data.icms || 18.00;
    this.ipi = data.ipi || 12.00;
    this.ii = data.ii || 16.00;
    this.pis = data.pis || 1.65;
    this.cofins = data.cofins || 7.60;
    this.outras = data.outras || 5.00;
    this.nf = data.nf || '';
    this.p_marca = data.p_marca || '';
    this.p_qualidade = data.p_qualidade || '';
    this.p_blindagem = data.p_blindagem || '';
    this.p_embalagem = data.p_embalagem || '';
    this.pc_contabil = data.pc_contabil || null;
    this.vip = data.vip || null;
    this.cclasstrib_padrao = data.cclasstrib_padrao || '0000001';

    // Estoque (da view produtos_estoque)
    this.estoque = parseInt(data.estoque) || 0;

    // Promoção (da view pricing_active_promotions)
    this.em_promocao = data.em_promocao === 1 || data.em_promocao === '1' || data.em_promocao === true;
    this.preco_promocao = parseFloat(data.preco_promocao) || null;
    this.desconto_promocao = parseFloat(data.desconto_promocao) || null;
  }

  toJSON() {
    return {
      id: this.id,
      model: this.modelo,
      name: this.nome,
      description: this.descricao,
      codebar: this.codebar,
      brand: this.marca,
      price: parseFloat(this.revenda) || 0,
      cost: parseFloat(this.custo) || 0,
      segment: {
        code: this.segmento,
        id: this.segmento_id
      },
      category: this.categoria,
      tax: {
        ncm: this.ncm,
        red: parseFloat(this.red),
        cf: this.cf,
        icms: parseFloat(this.icms),
        ipi: parseFloat(this.ipi),
        ii: parseFloat(this.ii),
        pis: parseFloat(this.pis),
        cofins: parseFloat(this.cofins),
        others: parseFloat(this.outras),
        defaultClass: this.cclasstrib_padrao
      },
      freight: parseFloat(this.frete),
      nf: this.nf,
      attributes: {
        brand: this.p_marca,
        quality: this.p_qualidade,
        shielding: this.p_blindagem,
        packaging: this.p_embalagem
      },
      accounting: {
        costCenter: this.pc_contabil,
        vip: this.vip
      },
      stock: this.estoque
    };
  }

  toSimpleJSON() {
    const result = {
      id: this.id,
      model: this.modelo,
      name: this.nome,
      brand: this.marca,
      category: this.categoria,
      segment: this.segmento,
      ncm: this.ncm,
      price: parseFloat(this.revenda) || 0,
      description: this.descricao,
      stock: this.estoque
    };

    // Adicionar campos de promoção se o produto está em promoção
    if (this.em_promocao) {
      result.onPromotion = true;
      result.promoPrice = this.preco_promocao;
      result.promoDiscount = this.desconto_promocao;
    }

    return result;
  }
}

