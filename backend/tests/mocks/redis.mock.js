/**
 * Mock do módulo Redis para testes
 * Simula cache Redis em memória
 */

// Armazenamento em memória para simular cache
const mockCache = new Map()

// Mock do cliente Redis
const mockRedisClient = {
  isOpen: true,
  isReady: true,
  
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  quit: jest.fn().mockResolvedValue(undefined),
  
  get: jest.fn().mockImplementation(async (key) => {
    const value = mockCache.get(key)
    return value || null
  }),
  
  set: jest.fn().mockImplementation(async (key, value, options) => {
    mockCache.set(key, value)
    return 'OK'
  }),
  
  setEx: jest.fn().mockImplementation(async (key, seconds, value) => {
    mockCache.set(key, value)
    // Simular expiração (para testes, não expira realmente)
    return 'OK'
  }),
  
  del: jest.fn().mockImplementation(async (key) => {
    const existed = mockCache.has(key)
    mockCache.delete(key)
    return existed ? 1 : 0
  }),
  
  exists: jest.fn().mockImplementation(async (key) => {
    return mockCache.has(key) ? 1 : 0
  }),
  
  keys: jest.fn().mockImplementation(async (pattern) => {
    const regex = new RegExp(pattern.replace('*', '.*'))
    return Array.from(mockCache.keys()).filter(key => regex.test(key))
  }),
  
  flushAll: jest.fn().mockImplementation(async () => {
    mockCache.clear()
    return 'OK'
  }),
  
  expire: jest.fn().mockResolvedValue(1),
  ttl: jest.fn().mockResolvedValue(-1),
  
  hSet: jest.fn().mockImplementation(async (key, field, value) => {
    const hash = mockCache.get(key) || {}
    hash[field] = value
    mockCache.set(key, hash)
    return 1
  }),
  
  hGet: jest.fn().mockImplementation(async (key, field) => {
    const hash = mockCache.get(key)
    return hash ? hash[field] : null
  }),
  
  hGetAll: jest.fn().mockImplementation(async (key) => {
    return mockCache.get(key) || {}
  }),
  
  on: jest.fn(),
  once: jest.fn()
}

// Função para limpar cache mock
export const clearMockCache = () => {
  mockCache.clear()
  jest.clearAllMocks()
}

// Função para adicionar dados ao cache mock
export const setMockCache = (key, value) => {
  mockCache.set(key, typeof value === 'object' ? JSON.stringify(value) : value)
}

// Função para obter dados do cache mock
export const getMockCache = (key) => {
  return mockCache.get(key)
}

// Função para obter todo o cache
export const getAllMockCache = () => {
  return Object.fromEntries(mockCache)
}

// Mock do módulo redis
export const redisClient = mockRedisClient

export default {
  redisClient: mockRedisClient,
  clearMockCache,
  setMockCache,
  getMockCache,
  getAllMockCache
}
