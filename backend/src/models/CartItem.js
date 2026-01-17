/**
 * CartItem Model
 * Representa um item do carrinho (icart)
 */
export class CartItem {
  constructor(data) {
    this.cCart = data.cCart || null;
    this.cSCart = data.cSCart || null;
    this.cProduct = data.cProduct || null;
    this.qProduct = data.qProduct || 0;
    this.vProduct = data.vProduct || 0;
    this.vProductCC = data.vProductCC || 0; // Preço consumidor
    this.vProductOriginal = data.vProductOriginal || 0;
    this.tProduct = data.tProduct ?? 1; // Vezes
    this.vIPI = data.vIPI || 0;
    this.vCST = data.vCST || 0; // ST
    this.TTD = data.TTD || 0; // Tipo de depósito
    this.dInquiry = data.dInquiry || new Date();
    this.aiDecisionId = data.ai_decision_id || data.aiDecisionId || null;

    // Dados do produto (join opcional)
    this.product = data.product || null;
  }

  toJSON() {
    return {
      id: this.cCart,
      leadId: this.cSCart,
      productId: this.cProduct,
      quantity: parseFloat(this.qProduct),
      price: parseFloat(this.vProduct),
      consumerPrice: parseFloat(this.vProductCC),
      originalPrice: parseFloat(this.vProductOriginal),
      times: this.tProduct,
      ipi: parseFloat(this.vIPI),
      st: parseFloat(this.vCST),
      ttd: this.TTD,
      inquiryDate: this.dInquiry,
      aiDecisionId: this.aiDecisionId,
      product: this.product,
      subtotal: parseFloat(this.qProduct) * parseFloat(this.vProduct)
    };
  }
}

