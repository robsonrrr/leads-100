/**
 * Lead Model
 * Representa um lead/carrinho do sistema
 */
export class Lead {
  constructor(data) {
    this.cSCart = data.cSCart || null;
    this.dCart = data.dCart || new Date();
    this.cSegment = data.cSegment || null;
    this.cNatOp = data.cNatOp || 27; // Natureza de operação padrão
    this.cCustomer = data.cCustomer || null;
    this.cUser = data.cUser || null;
    this.cSeller = data.cSeller || data.cUser || null;
    this.cCC = data.cCC || 0;
    this.cPaymentType = data.cPaymentType || 1;
    this.vPaymentTerms = data.vPaymentTerms || 0;
    this.cPaymentTerms = data.cPaymentTerms || 'n:30:30';
    this.cTransporter = data.cTransporter || 9;
    this.vFreight = data.vFreight || 0.00;
    this.vFreightType = data.vFreightType || 1;
    this.cEmitUnity = data.cEmitUnity || 1;
    this.cLogUnity = data.cLogUnity || 1;
    this.cUpdated = data.cUpdated || 0;
    this.dDelivery = data.dDelivery || new Date();
    this.xRemarksFinance = data.xRemarksFinance || '';
    this.xRemarksLogistic = data.xRemarksLogistic || '';
    this.xRemarksNFE = data.xRemarksNFE || '';
    this.xRemarksOBS = data.xRemarksOBS || '';
    this.xRemarksManager = data.xRemarksManager || '';
    this.cOrderWeb = data.cOrderWeb || null;
    this.cType = data.cType || 1; // 1 = Lead/Consulta
    this.xBuyer = data.xBuyer || null;
    this.cPurchaseOrder = data.cPurchaseOrder || null;
    this.cAuthorized = data.cAuthorized || 0;
    this.cSource = data.cSource || 0;
    this.vComission = data.vComission || null;

    // Informações do cliente (do JOIN)
    this.customer = data.customer || null;
    this.customerName = data.customerName || null; // Nome do cliente para listagem
    this.totalValue = data.totalValue || null; // Valor total do lead
    this.sellerNick = data.sellerNick || data.seller_nick || null; // Nick do vendedor/usuário
    this.ownerNick = data.ownerNick || data.owner_nick || data.owner_user || null;
    this.customerPhone = data.customerPhone || data.customer_phone || null;
    this.segmentName = data.segmentName || data.segment_name || null;
    this.itemCount = data.itemCount || data.item_count || 0;
    this.pricedItemCount = data.pricedItemCount || data.priced_item_count || 0;
  }

  toJSON() {
    return {
      id: this.cSCart,
      createdAt: this.dCart,
      customerId: this.cCustomer,
      customer: this.customer || null,
      customerName: this.customerName || null,
      userId: this.cUser,
      sellerId: this.cSeller,
      paymentType: this.cPaymentType,
      paymentTerms: this.cPaymentTerms,
      vPaymentTerms: this.vPaymentTerms,
      freight: parseFloat(this.vFreight),
      freightType: this.vFreightType,
      deliveryDate: this.dDelivery,
      remarks: {
        finance: this.xRemarksFinance,
        logistic: this.xRemarksLogistic,
        nfe: this.xRemarksNFE,
        obs: this.xRemarksOBS,
        manager: this.xRemarksManager
      },
      type: this.cType,
      buyer: this.xBuyer,
      purchaseOrder: this.cPurchaseOrder,
      orderWeb: this.cOrderWeb,
      authorized: this.cAuthorized === 1,
      commission: this.vComission ? parseFloat(this.vComission) : null,
      totalValue: this.totalValue !== null ? parseFloat(this.totalValue) : null,
      cLogUnity: this.cLogUnity !== undefined && this.cLogUnity !== null ? this.cLogUnity : null,
      cEmitUnity: this.cEmitUnity !== undefined && this.cEmitUnity !== null ? this.cEmitUnity : null,
      cTransporter: this.cTransporter !== undefined && this.cTransporter !== null ? this.cTransporter : null,
      sellerNick: this.sellerNick || null,
      ownerNick: this.ownerNick || null,
      customerPhone: this.customerPhone || null,
      segment: this.cSegment || null,
      segmentName: this.segmentName || null,
      itemCount: this.itemCount || 0,
      pricedItemCount: this.pricedItemCount || 0
    };
  }
}

