/**
 * Customer Model
 * Representa um cliente do sistema
 */
export class Customer {
  constructor(data) {
    this.id = data.id || null;
    this.cnpj = data.cnpj || '';
    this.nome = data.nome || '';
    this.fantasia = data.fantasia || '';
    this.ender = data.ender || '';
    this.nro = data.nro || '';
    this.xCpl = data.xCpl || '';
    this.bairro = data.bairro || '';
    this.cidade = data.cidade || '';
    this.estado = data.estado || '';
    this.cep = data.cep || '';
    this.inscr = data.inscr || '';
    this.email = data.email || '';
    this.ddd = data.ddd || '';
    this.fone = data.fone || '';
    this.tipo_pessoa = data.tipo_pessoa || '';
    this.tipo = data.tipo || '';
    this.regime_fiscal = data.regime_fiscal || 0;
    this.atenc = data.atenc || '';
    this.vendedor = data.vendedor || null;
    this.credito = data.credito || 0;
    this.limite = data.limite || 0;
  }

  toJSON() {
    return {
      id: this.id,
      cnpj: this.cnpj,
      name: this.nome,
      tradeName: this.fantasia,
      address: {
        street: this.ender,
        number: this.nro,
        complement: this.xCpl,
        neighborhood: this.bairro,
        city: this.cidade,
        state: this.estado,
        zipCode: this.cep
      },
      contact: {
        email: this.email,
        phone: this.ddd && this.fone ? `(${this.ddd}) ${this.fone}` : this.fone || '',
        attention: this.atenc
      },
      tax: {
        inscr: this.inscr,
        personType: this.tipo_pessoa,
        type: this.tipo,
        fiscalRegime: this.regime_fiscal
      },
      credit: {
        available: parseFloat(this.credito),
        limit: parseFloat(this.limite)
      },
      sellerId: this.vendedor
    };
  }

  toSimpleJSON() {
    return {
      id: this.id,
      name: this.nome,
      tradeName: this.fantasia,
      cnpj: this.cnpj,
      ender: this.ender,
      city: this.cidade,
      state: this.estado,
      limite: parseFloat(this.limite) || 0
    };
  }
}

