/**
 * Mock do módulo de banco de dados para testes
 * Simula conexões MySQL sem conexão real
 */

// Armazenamento em memória para simular banco
const mockData = {
  users: [],
  leads: [],
  cartItems: [],
  customers: [],
  products: []
}

// Mock do pool de conexões
const mockPool = {
  promise: () => ({
    query: jest.fn().mockImplementation(async (sql, params) => {
      // Simular queries básicas
      if (sql.includes('SELECT')) {
        return [[], []]
      }
      if (sql.includes('INSERT')) {
        return [{ insertId: Date.now(), affectedRows: 1 }, []]
      }
      if (sql.includes('UPDATE')) {
        return [{ affectedRows: 1, changedRows: 1 }, []]
      }
      if (sql.includes('DELETE')) {
        return [{ affectedRows: 1 }, []]
      }
      return [[], []]
    }),
    execute: jest.fn().mockImplementation(async (sql, params) => {
      return [[], []]
    }),
    getConnection: jest.fn().mockImplementation(async () => ({
      query: jest.fn().mockResolvedValue([[], []]),
      execute: jest.fn().mockResolvedValue([[], []]),
      release: jest.fn(),
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn()
    }))
  }),
  query: jest.fn().mockImplementation((sql, params, callback) => {
    if (callback) {
      callback(null, [], [])
    }
    return Promise.resolve([[], []])
  }),
  end: jest.fn().mockResolvedValue(undefined)
}

// Função para criar mock de resultado de query
export const createMockQueryResult = (rows, fields = []) => {
  return [rows, fields]
}

// Função para configurar retorno específico de query
export const mockQueryResult = (result) => {
  mockPool.promise().query.mockResolvedValueOnce(result)
}

// Função para configurar erro de query
export const mockQueryError = (error) => {
  mockPool.promise().query.mockRejectedValueOnce(error)
}

// Função para limpar dados mock
export const clearMockData = () => {
  Object.keys(mockData).forEach(key => {
    mockData[key] = []
  })
  jest.clearAllMocks()
}

// Função para adicionar dados mock
export const addMockData = (table, data) => {
  if (mockData[table]) {
    if (Array.isArray(data)) {
      mockData[table].push(...data)
    } else {
      mockData[table].push(data)
    }
  }
}

// Função para obter dados mock
export const getMockData = (table) => {
  return mockData[table] || []
}

// Mock pool export
export const pool = mockPool

export default {
  pool: mockPool,
  createMockQueryResult,
  mockQueryResult,
  mockQueryError,
  clearMockData,
  addMockData,
  getMockData
}
