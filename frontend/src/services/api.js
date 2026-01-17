import axios from 'axios'

// Garantir que a URL da API seja absoluta
let API_URL = import.meta.env.VITE_API_URL

// Se não estiver definida, detectar automaticamente
if (!API_URL) {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    const protocol = window.location.protocol

    // Em desenvolvimento local, usar localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      API_URL = 'http://localhost:3001/api'
    }
    // Em ambiente de produção/dev conhecido, usar o proxy via Traefik
    else if (hostname.includes('office.internut.com.br')) {
      API_URL = `${protocol}//${hostname}/leads/modern/api`
    }
    // Se for IP privado (10.x, 172.x, 192.x), tentar usar IP público conhecido
    else if (hostname.startsWith('10.') || hostname.startsWith('172.') || hostname.startsWith('192.168.')) {
      API_URL = `${protocol}//18.229.23.153:3001/api`
    }
    // Fallback para outros ambientes
    else {
      API_URL = `${protocol}//${hostname}:3001/api`
    }
  } else {
    API_URL = 'http://localhost:3001/api'
  }
}

// Se a URL não começar com http, adicionar o protocolo e host atual
if (typeof window !== 'undefined' && !API_URL.startsWith('http')) {
  API_URL = `${window.location.protocol}//${window.location.host}${API_URL}`
}

// Garantir que a URL seja absoluta (não relativa) e não termine com /
if (API_URL && API_URL.endsWith('/')) {
  API_URL = API_URL.slice(0, -1)
}

// Garantir que a URL seja absoluta (não relativa)
if (API_URL && !API_URL.startsWith('http')) {
  console.warn('API_URL deve ser uma URL absoluta:', API_URL)
}

// Criar instância do axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
})

// Log para debug (apenas em desenvolvimento)
if (import.meta.env.DEV) {
  console.log('🔧 API_URL configurada:', API_URL)
  if (typeof window !== 'undefined') {
    console.log('🌐 Hostname detectado:', window.location.hostname)
    console.log('📋 VITE_API_URL:', import.meta.env.VITE_API_URL)
  }
}

// Interceptor para adicionar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    } else {
      // Log para debug se não houver token
      if (import.meta.env.DEV) {
        console.warn('Token não encontrado no localStorage')
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para refresh token e tratamento de erros de autenticação
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Se for erro 401 (Unauthorized), tentar refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          })

          if (response.data.success) {
            const { accessToken } = response.data.data
            localStorage.setItem('token', accessToken)
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
            return api(originalRequest)
          }
        }
      } catch (refreshError) {
        // Se refresh falhar, limpar tokens e redirecionar para login
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }

    // Se for erro 401 (Unauthorized) sem refresh token, redirecionar para login.
    // Importante: 403 (Forbidden) NÃO significa sessão expirada; apenas falta de permissão.
    // Se tratarmos 403 como logout, usuários de level baixo são mandados ao /login indevidamente.
    if (error.response?.status === 401 &&
      !originalRequest._retry &&
      window.location.pathname !== '/login') {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

// Serviços de API
export const authService = {
  login: (username, password, twoFactorToken = null) =>
    api.post('/auth/login', { username, password, twoFactorToken }),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  setup2FA: () => api.post('/auth/2fa/setup'),
  enable2FA: (token) => api.post('/auth/2fa/enable', { token }),
  disable2FA: (token) => api.post('/auth/2fa/disable', { token }),
}

export const userService = {
  getPreferences: () => api.get('/v2/user/preferences'),
  updatePreferences: (data) => api.put('/v2/user/preferences', data),
}

export const leadsService = {
  getAll: (params) => api.get('/leads', { params }),
  getById: (id) => {
    // Validar ID e garantir que seja numérico
    const leadId = parseInt(id)
    if (isNaN(leadId) || leadId <= 0) {
      return Promise.reject(new Error('Invalid lead ID: must be a positive number'))
    }
    return api.get(`/leads/${leadId}`)
  },
  getSegments: () => api.get('/leads/segments'),
  create: (data) => api.post('/leads', data),
  update: (id, data) => api.put(`/leads/${id}`, data),
  delete: (id) => api.delete(`/leads/${id}`),
  getItems: (id) => api.get(`/leads/${id}/items`),
  addItem: (id, item) => api.post(`/leads/${id}/items`, item),
  updateItem: (id, itemId, item) => api.put(`/leads/${id}/items/${itemId}`, item),
  removeItem: (id, itemId) => api.delete(`/leads/${id}/items/${itemId}`),
  calculateTotals: (id) => api.get(`/leads/${id}/totals`),
  calculateTaxes: (id) => api.post(`/leads/${id}/taxes`),
  convertToOrder: (id, data) => api.post(`/leads/${id}/convert`, data),
  convert: (id, data) => api.post(`/leads/${id}/convert`, data),
  getNops: () => api.get('/leads/metadata/nops'),
  getPaymentTypes: () => api.get('/leads/metadata/payment-types'),
  getPaymentTerms: () => api.get('/leads/metadata/payment-terms'),
  getTransporters: () => api.get('/leads/metadata/transporters'),
  getUnits: () => api.get('/leads/metadata/units'),
  getCustomerTransporter: (customerId) => api.get('/leads/metadata/customer-transporter', { params: { customerId } }),
  // Exportação para Excel
  exportToExcel: (params) => api.get('/leads/export', { params, responseType: 'blob' }),
  exportLeadToExcel: (leadId) => api.get('/leads/export', { params: { leadId }, responseType: 'blob' }),
  // Histórico de alterações
  getHistory: (id) => api.get(`/leads/${id}/history`),
  // Envio de email
  sendEmail: (id, data) => api.post(`/leads/${id}/send-email`, data),
}

export const ordersService = {
  getById: (id) => {
    const orderId = parseInt(id)
    if (isNaN(orderId) || orderId <= 0) {
      return Promise.reject(new Error('Invalid order ID: must be a positive number'))
    }
    return api.get(`/orders/${orderId}`)
  },
  getItems: (id) => api.get(`/orders/${id}/items`)
}

export const customersService = {
  search: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  getByCnpj: (cnpj) => api.get(`/customers/cnpj/${cnpj}`),
  getRecent: (limit = 10) => api.get('/customers/recent', { params: { limit } }),
  getMyPortfolio: (params) => api.get('/customers/my-portfolio', { params }),
  getMyPortfolioSummary: (params) => api.get('/customers/my-portfolio/summary', { params }),
  exportPortfolio: (params) => api.get('/customers/my-portfolio/export', { params, responseType: 'blob' }),
  getSellers: (params) => api.get('/customers/sellers', { params }),
  getSellerSegments: () => api.get('/customers/sellers/segments'),
  // Fase 2: Histórico e Relacionamento
  getOrders: (id, params) => api.get(`/customers/${id}/orders`, { params }),
  getLeads: (id, params) => api.get(`/customers/${id}/leads`, { params }),
  getMetrics: (id) => api.get(`/customers/${id}/metrics`),
  getTopProducts: (id, limit = 10) => api.get(`/customers/${id}/products`, { params: { limit } }),
}

export const analyticsService = {
  getSellerSummary: (params) => api.get('/analytics/seller-summary', { params }),
  getTopCustomers: (params) => api.get('/analytics/top-customers', { params }),
  getAtRiskCustomers: (params) => api.get('/analytics/at-risk-customers', { params }),
  getSalesByPeriod: (params) => api.get('/analytics/sales-by-period', { params }),
  getDashboard: (params) => api.get('/analytics/dashboard', { params }),
  getTeamMetrics: (params) => api.get('/analytics/team-metrics', { params }),
  getSellerPerformance: (params) => api.get('/analytics/seller-performance', { params }),
  getSalesTrend: (params) => api.get('/analytics/sales-trend', { params }),
  getLeadsMetrics: (params) => api.get('/analytics/leads-metrics', { params }),
}

export const alertsService = {
  getMyAlerts: (params) => api.get('/alerts/my-alerts', { params }),
  getAtRiskCustomers: (params) => api.get('/alerts/at-risk-customers', { params }),
  getPendingLeads: (params) => api.get('/alerts/pending-leads', { params }),
}

export const interactionsService = {
  getByCustomer: (customerId, params) => api.get(`/interactions/customer/${customerId}`, { params }),
  create: (data) => api.post('/interactions', data),
  update: (id, data) => api.put(`/interactions/${id}`, data),
  delete: (id) => api.delete(`/interactions/${id}`),
  getFollowUps: (params) => api.get('/interactions/follow-ups', { params }),
  getFollowUpsCount: () => api.get('/interactions/follow-ups/count'),
}

export const goalsService = {
  getMyProgress: (params) => api.get('/goals/my-progress', { params }),
  getTeamProgress: (params) => api.get('/goals/team-progress', { params }),
  getSellerGoals: (sellerId, params) => api.get(`/goals/seller/${sellerId}`, { params }),
  getAll: (params) => api.get('/goals', { params }),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  delete: (id) => api.delete(`/goals/${id}`),
}

export const reportsService = {
  getTypes: () => api.get('/reports'),
  downloadPortfolio: (params) => api.get('/reports/portfolio', { params, responseType: 'blob' }),
  downloadLeads: (params) => api.get('/reports/leads', { params, responseType: 'blob' }),
  downloadPerformance: (params) => api.get('/reports/performance', { params, responseType: 'blob' }),
  downloadGoals: (params) => api.get('/reports/goals', { params, responseType: 'blob' }),
}

export const productsService = {
  search: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getDetails: (id) => api.get(`/products/${id}/details`),
  getStockByWarehouse: (productId) => api.get(`/products/${productId}/stock-by-warehouse`),
  getPriceHistory: (productId) => api.get(`/products/${productId}/price-history`),
  getCategories: () => api.get('/products/categories'),
  getSegments: () => api.get('/products/segments'),
  getByCategory: (category, limit = 50) => api.get(`/products/category/${category}`, { params: { limit } }),
  getBySegment: (segment, limit = 50) => api.get(`/products/segment/${segment}`, { params: { limit } }),
  // Favoritos
  getFavorites: () => api.get('/products/favorites'),
  addFavorite: (productId) => api.post(`/products/${productId}/favorite`),
  removeFavorite: (productId) => api.delete(`/products/${productId}/favorite`),
  // Recentes
  getRecent: (limit = 20) => api.get('/products/recent', { params: { limit } }),
}

export const pricingService = {
  calculate: (data) => api.post('/pricing/calculate', data),
  getQuantityDiscounts: () => api.get('/pricing/quantity-discounts'),
  getLaunchProducts: () => api.get('/pricing/launch-products'),
  getCustomerFixedPrices: (customerId) => api.get(`/pricing/customer-fixed-prices/${customerId}`),
  getBundles: () => api.get('/pricing/bundles'),
  getPromotions: () => api.get('/promotions/active'),
}

export const promotionsService = {
  getActive: (segment = null) => {
    const params = segment ? { segment } : {};
    return api.get('/promotions/active', { params });
  },
}

// Analytics V2 - Métricas da Meta 30.000 Máquinas/Ano
export const analyticsV2Service = {
  // Penetração (KPI-mãe)
  getPenetration: (params) => api.get('/v2/analytics/penetration', { params }),
  getPenetrationHistory: (params) => api.get('/v2/analytics/penetration/history', { params }),
  getInactiveCustomers: (params) => api.get('/v2/analytics/penetration/inactive', { params }),

  // Pipeline
  getPipeline: (params) => api.get('/v2/analytics/pipeline', { params }),
  getWeeklyPipeline: (params) => api.get('/v2/analytics/pipeline/weekly', { params }),
  getPipelineRanking: (params) => api.get('/v2/analytics/pipeline/ranking', { params }),
  getPipelineAlerts: () => api.get('/v2/analytics/pipeline/alerts'),

  // Resumo Executivo
  getSummary: (params) => api.get('/v2/analytics/summary', { params }),

  // Inventário (Bloco 3)
  getInventoryOverview: () => api.get('/v2/analytics/inventory'),
  getLowTurnProducts: (params) => api.get('/v2/analytics/inventory/low-turn', { params }),
  getStockoutAlerts: () => api.get('/v2/analytics/inventory/stockout-alerts'),
  getBundleSuggestions: (params) => api.get('/v2/analytics/inventory/bundles/suggest', { params }),

  // Financeiro (Bloco 4)
  getFinancialOverview: (params) => api.get('/v2/analytics/financial', { params }),

  // Metas por Cliente
  getCustomerGoalsBySeller: (sellerId, params) => api.get(`/v2/analytics/goals/seller/${sellerId}`, { params }),
  getCustomerGoal: (customerId, params) => api.get(`/v2/analytics/goals/customer/${customerId}`, { params }),
  getCustomerGoalsRanking: (params) => api.get('/v2/analytics/goals/ranking', { params }),
}

export default api

