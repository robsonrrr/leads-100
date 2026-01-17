/**
 * Order Model
 * Representa um pedido do sistema (mak.hoje)
 */
export class Order {
  constructor(data) {
    // Dados principais do pedido (mak.hoje)
    this.pedido = data.id || data.pedido || null;
    this.data = data.data || new Date();
    this.nop = data.nop || null;
    this.idcli = data.idcli || null;
    this.idcom = data.idcom || 0;
    this.emissor = data.emissor || null;
    this.vendedor = data.vendedor || null;
    this.pg = data.pg || null;
    this.terms = data.terms || 0;
    this.fprazo = data.fprazo || null;
    this.prazo = data.prazo || 204;
    this.idtr = data.idtr || null;
    this.frete = data.frete || 0;
    this.EmissorPOID = data.EmissorPOID || null;
    this.UnidadeLogistica = data.UnidadeLogistica || null;
    this.datae = data.datae || new Date();
    this.crossover = data.crossover || 0;
    this.obs = data.obs || '';
    this.obsfinanc = data.obsfinanc || '';
    this.obslogistic = data.obslogistic || '';
    this.obsnfe = data.obsnfe || '';
    this.valor_base = data.valor_base || 0;
    this.valor_st = data.valor_st || 0;
    this.valor_ipi = data.valor_ipi || 0;
    this.valor = data.valor || 0;
    this.usvale = data.usvale || 0;
    this.comissao_revenda = data.comissao_revenda || 0;
    this.entrada = data.entrada || 0;
    this.spedido = data.spedido || 0;
    this.source = data.source || 0;

    // Relacionamentos (JOINs)
    this.customer = data.customer || null;
    this.transporter = data.transporter || null;
    this.emitUnity = data.emitUnity || null;
    this.items = data.items || [];
  }

  toJSON() {
    // Parsear observações do campo obs (formato: "obs1 | obs2 | obs3")
    const parseRemarks = (obsString) => {
      if (!obsString) return {};
      const parts = obsString.split('|').map(p => p.trim()).filter(p => p);
      return {
        finance: this.obsfinanc || '',
        logistic: this.obslogistic || '',
        nfe: this.obsnfe || '',
        obs: parts.join(' | ') || '',
        manager: ''
      };
    };

    return {
      id: this.pedido,
      orderWeb: this.pedido,
      createdAt: this.data,
      customerId: this.idcli,
      customer: this.customer || null,
      userId: this.emissor,
      sellerId: this.vendedor,
      paymentType: this.pg,
      paymentTerms: this.fprazo,
      freight: parseFloat(this.frete) || 0,
      freightType: null, // Não disponível em mak.hoje
      deliveryDate: this.datae,
      remarks: parseRemarks(this.obs),
      nop: this.nop,
      buyer: null, // Não disponível em mak.hoje
      purchaseOrder: null, // Não disponível em mak.hoje
      cEmitUnity: this.EmissorPOID,
      cLogUnity: this.UnidadeLogistica,
      transporter: this.transporter || null,
      subtotal: parseFloat(this.valor_base) || 0,
      totalIPI: parseFloat(this.valor_ipi) || 0,
      totalST: parseFloat(this.valor_st) || 0,
      total: parseFloat(this.valor) || 0,
      commission: this.comissao_revenda ? parseFloat(this.comissao_revenda) : null,
      items: this.items.map(item => item.toJSON ? item.toJSON() : item)
    };
  }
}
