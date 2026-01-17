/**
 * Setup global para testes Jest
 * Este arquivo é executado antes de cada arquivo de teste
 */

// Configurar variáveis de ambiente para testes
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only'
process.env.JWT_EXPIRES_IN = '1h'
process.env.JWT_REFRESH_EXPIRES_IN = '7d'

// Silenciar console.log durante testes (comentar para debug)
// global.console.log = () => {}

// Cleanup após todos os testes
afterAll(async () => {
  // Aguardar um pouco para conexões fecharem
  await new Promise(resolve => setTimeout(resolve, 100))
})
