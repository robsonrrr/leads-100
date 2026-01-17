/**
 * Fixtures de teste - dados de exemplo para testes
 */

// Usuários de teste
export const testUsers = [
  {
    id: 1,
    user: 'admin',
    pass: '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM1A8W9iqaG3vv1BD7WC', // password123
    nick: 'Admin',
    email: 'admin@test.com',
    level: 1
  },
  {
    id: 2,
    user: 'vendedor',
    pass: '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM1A8W9iqaG3vv1BD7WC', // password123
    nick: 'Vendedor Teste',
    email: 'vendedor@test.com',
    level: 5
  }
]

// Clientes de teste
export const testCustomers = [
  {
    id: 1001,
    name: 'Empresa Teste LTDA',
    tradeName: 'Teste Corp',
    document: '12345678000199',
    email: 'contato@teste.com',
    phone: '11999999999',
    city: 'São Paulo',
    state: 'SP',
    ender: 'Rua Teste, 123',
    limite: 50000.00
  },
  {
    id: 1002,
    name: 'Cliente Pessoa Física',
    tradeName: '',
    document: '12345678901',
    email: 'pf@teste.com',
    phone: '21888888888',
    city: 'Rio de Janeiro',
    state: 'RJ',
    ender: 'Av. Brasil, 456',
    limite: 10000.00
  }
]

// Produtos de teste
export const testProducts = [
  {
    id: 2001,
    model: 'ZJ-8700',
    name: 'Máquina de Costura Reta Industrial',
    brand: 'ZOJE',
    price: 2500.00,
    segment: 'machines',
    description: 'Máquina de costura reta industrial de alta velocidade'
  },
  {
    id: 2002,
    model: 'AGU-001',
    name: 'Agulha Industrial DB x 1',
    brand: 'SINGER',
    price: 15.00,
    segment: 'parts',
    description: 'Agulha para máquina de costura industrial'
  },
  {
    id: 2003,
    model: 'LIN-100',
    name: 'Linha de Costura 100% Poliéster',
    brand: 'COATS',
    price: 8.50,
    segment: 'supplies',
    description: 'Linha de costura industrial'
  }
]

// Leads de teste
export const testLeads = [
  {
    id: 5001,
    cSCart: 500001,
    cType: 1, // Lead
    cSeller: 1,
    cUser: 1,
    cCustomer: 1001,
    cSegment: 'machines',
    dCart: new Date('2025-01-10'),
    orderWeb: null,
    nPaymentType: 2,
    nFreight: 1,
    cNop: 5102,
    cLogUnity: 1
  },
  {
    id: 5002,
    cSCart: 500002,
    cType: 2, // Pedido
    cSeller: 2,
    cUser: 2,
    cCustomer: 1002,
    cSegment: 'parts',
    dCart: new Date('2025-01-09'),
    orderWeb: 'ORD-2025-001',
    nPaymentType: 1,
    nFreight: 2,
    cNop: 5101,
    cLogUnity: 2
  }
]

// Itens de carrinho de teste
export const testCartItems = [
  {
    id: 3001,
    cSCart: 500001,
    cProduct: 2001,
    qProduct: 2,
    vProduct: 2500.00,
    vConsumer: 2800.00,
    vOriginal: 2800.00,
    tProduct: 5,
    vIPI: 125.00,
    vST: 0,
    subtotal: 5000.00
  },
  {
    id: 3002,
    cSCart: 500001,
    cProduct: 2002,
    qProduct: 100,
    vProduct: 15.00,
    vConsumer: 18.00,
    vOriginal: 18.00,
    tProduct: 1,
    vIPI: 0,
    vST: 0,
    subtotal: 1500.00
  }
]

// Transportadoras de teste
export const testTransporters = [
  { id: 101, name: 'Transportadora ABC' },
  { id: 102, name: 'Logística XYZ' },
  { id: 103, name: 'Retira no Local' }
]

// Unidades logísticas de teste
export const testLogUnits = [
  { id: 1, name: 'CD São Paulo' },
  { id: 2, name: 'CD Rio de Janeiro' },
  { id: 3, name: 'CD Minas Gerais' }
]

// NOPs de teste
export const testNops = [
  { id: 5101, description: 'Venda de Produção' },
  { id: 5102, description: 'Venda de Mercadoria' },
  { id: 5405, description: 'Venda com ST' }
]

// Token JWT válido para testes
export const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTcwMDAwMzYwMH0.test'

// Helper para criar lead de teste
export const createTestLead = (overrides = {}) => ({
  id: Date.now(),
  cSCart: Date.now(),
  cType: 1,
  cSeller: 1,
  cUser: 1,
  cCustomer: 1001,
  cSegment: 'machines',
  dCart: new Date(),
  orderWeb: null,
  nPaymentType: 2,
  nFreight: 1,
  cNop: 5102,
  cLogUnity: 1,
  ...overrides
})

// Helper para criar item de carrinho de teste
export const createTestCartItem = (overrides = {}) => ({
  id: Date.now(),
  cSCart: 500001,
  cProduct: 2001,
  qProduct: 1,
  vProduct: 100.00,
  vConsumer: 120.00,
  vOriginal: 120.00,
  tProduct: 1,
  vIPI: 0,
  vST: 0,
  subtotal: 100.00,
  ...overrides
})

export default {
  testUsers,
  testCustomers,
  testProducts,
  testLeads,
  testCartItems,
  testTransporters,
  testLogUnits,
  testNops,
  validToken,
  createTestLead,
  createTestCartItem
}
