/** @type {import('jest').Config} */
export default {
  // Usar experimental VM modules para ESM
  testEnvironment: 'node',
  
  // Transformar ESM
  transform: {},
  
  // Injetar globals (jest, expect, etc)
  injectGlobals: true,
  
  // Extensões de módulo
  moduleFileExtensions: ['js', 'json'],
  
  // Padrão de arquivos de teste
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // Ignorar node_modules
  testPathIgnorePatterns: ['/node_modules/'],
  
  // Cobertura de código
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/config/swagger.js',
    '!src/migrations/**'
  ],
  
  // Diretório de cobertura
  coverageDirectory: 'coverage',
  
  // Thresholds de cobertura (meta: 70%)
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Verbose output
  verbose: true,
  
  // Timeout para testes
  testTimeout: 10000,
  
  // Limpar mocks automaticamente
  clearMocks: true,
  
  // Detectar handles abertos
  detectOpenHandles: true,
  
  // Força saída após testes
  forceExit: true
}
