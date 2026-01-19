import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, createTheme, CssBaseline, Box, CircularProgress } from '@mui/material'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import AuthChecker from './components/AuthChecker'
import { ManagerFilterProvider } from './contexts/ManagerFilterContext'
import { useSelector } from 'react-redux'

// Lazy loaded pages
const LoginPage = lazy(() => import('./pages/LoginPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const LeadsPage = lazy(() => import('./pages/LeadsPage'))
const LeadDetailPage = lazy(() => import('./pages/LeadDetailPage'))
const CreateLeadPage = lazy(() => import('./pages/CreateLeadPage'))
const EditLeadPage = lazy(() => import('./pages/EditLeadPage'))
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'))
const DiscountsPage = lazy(() => import('./pages/DiscountsPage'))
const MyCustomersPage = lazy(() => import('./pages/MyCustomersPage'))
const CustomerDetailPage = lazy(() => import('./pages/CustomerDetailPage'))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'))
const PromotionsPage = lazy(() => import('./pages/PromotionsPage'))
const QuantityDiscountsPage = lazy(() => import('./pages/QuantityDiscountsPage'))
const LaunchProductsPage = lazy(() => import('./pages/LaunchProductsPage'))
const GoalsPage = lazy(() => import('./pages/GoalsPage'))
const ReportsPage = lazy(() => import('./pages/ReportsPage'))
const SecurityPage = lazy(() => import('./pages/SecurityPage'))
const LeadMailView = lazy(() => import('./pages/LeadMailView'))
const CustomerGoalsPage = lazy(() => import('./pages/CustomerGoalsPage'))
const ProductsPage = lazy(() => import('./pages/ProductsPage'))
const WhatsAppPage = lazy(() => import('./pages/WhatsAppPage'))
const DailyTasksPage = lazy(() => import('./pages/DailyTasksPage'))
const HelpPage = lazy(() => import('./pages/HelpPage'))

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const UsersPage = lazy(() => import('./pages/admin/UsersPage'))
const UserFormPage = lazy(() => import('./pages/admin/UserFormPage'))
const SellerPhonesPage = lazy(() => import('./pages/admin/SellerPhonesPage'))
const ChatbotConfigPage = lazy(() => import('./pages/admin/ChatbotConfigPage'))
const LogsPage = lazy(() => import('./pages/admin/LogsPage'))
const CustomerLinksPage = lazy(() => import('./pages/admin/CustomerLinksPage'))

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
})

const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </Box>
)

function App() {
  const { isAuthenticated, user, token } = useSelector((state) => state.auth)

  const getJwtLevel = (jwt) => {
    try {
      if (!jwt) return 0
      const parts = jwt.split('.')
      if (parts.length < 2) return 0
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      const padded = base64.padEnd(base64.length + (4 - (base64.length % 4 || 4)) % 4, '=')
      const payload = JSON.parse(atob(padded))
      return payload?.level ?? 0
    } catch {
      return 0
    }
  }

  const userLevel = user?.level ?? user?.nivel ?? getJwtLevel(token) ?? 0
  const isRestricted = userLevel < 4
  const isLevelLessThan5 = userLevel < 5  // Para ocultar WhatsApp e Produtos

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ManagerFilterProvider>
        <AuthChecker>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout>
                      {isLevelLessThan5 ? <Navigate to="/tasks" replace /> : (isRestricted ? <Navigate to="/metas-por-cliente" replace /> : <DashboardPage />)}
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route path="/leads" element={<ProtectedRoute><Layout><LeadsPage /></Layout></ProtectedRoute>} />
              <Route path="/leads/new" element={<ProtectedRoute><Layout><CreateLeadPage /></Layout></ProtectedRoute>} />
              <Route path="/leads/:id" element={<ProtectedRoute><Layout><LeadDetailPage /></Layout></ProtectedRoute>} />
              <Route path="/leads/:id/edit" element={<ProtectedRoute><Layout><EditLeadPage /></Layout></ProtectedRoute>} />
              <Route path="/leads/:id/mail" element={<ProtectedRoute><LeadMailView /></ProtectedRoute>} />
              <Route path="/orders/:id" element={<ProtectedRoute><Layout><OrderDetailPage /></Layout></ProtectedRoute>} />
              <Route path="/discounts" element={<ProtectedRoute><Layout><DiscountsPage /></Layout></ProtectedRoute>} />
              <Route path="/customers" element={<ProtectedRoute><Layout><MyCustomersPage /></Layout></ProtectedRoute>} />
              <Route path="/customers/:id" element={<ProtectedRoute><Layout><CustomerDetailPage /></Layout></ProtectedRoute>} />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <Layout>
                      {isRestricted ? <Navigate to="/metas-por-cliente" replace /> : <AnalyticsPage />}
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route path="/promotions" element={<ProtectedRoute><Layout><PromotionsPage /></Layout></ProtectedRoute>} />
              <Route
                path="/products"
                element={
                  <ProtectedRoute>
                    <Layout>
                      {isLevelLessThan5 ? <Navigate to="/tasks" replace /> : <ProductsPage />}
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route path="/pricing/quantity-discounts" element={<ProtectedRoute><Layout><QuantityDiscountsPage /></Layout></ProtectedRoute>} />
              <Route path="/pricing/launch-products" element={<ProtectedRoute><Layout><LaunchProductsPage /></Layout></ProtectedRoute>} />
              <Route path="/goals" element={<ProtectedRoute><Layout><GoalsPage /></Layout></ProtectedRoute>} />
              <Route path="/analytics/customer-goals" element={<ProtectedRoute><Layout><CustomerGoalsPage /></Layout></ProtectedRoute>} />
              <Route path="/metas-por-cliente" element={<ProtectedRoute><Layout><CustomerGoalsPage /></Layout></ProtectedRoute>} />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <Layout>
                      {isRestricted ? <Navigate to="/metas-por-cliente" replace /> : <ReportsPage />}
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route path="/security" element={<ProtectedRoute><Layout><SecurityPage /></Layout></ProtectedRoute>} />
              <Route path="/tasks" element={<ProtectedRoute><Layout><DailyTasksPage /></Layout></ProtectedRoute>} />
              <Route path="/help" element={<ProtectedRoute><Layout><HelpPage /></Layout></ProtectedRoute>} />
              <Route
                path="/whatsapp"
                element={
                  <ProtectedRoute>
                    <Layout>
                      {isLevelLessThan5 ? <Navigate to="/tasks" replace /> : <WhatsAppPage />}
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/whatsapp/:phone"
                element={
                  <ProtectedRoute>
                    <Layout>
                      {isLevelLessThan5 ? <Navigate to="/tasks" replace /> : <WhatsAppPage />}
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes (level >= 5) */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Layout>
                      {userLevel >= 5 ? <AdminDashboard /> : <Navigate to="/" replace />}
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute>
                    <Layout>
                      {userLevel >= 5 ? <UsersPage /> : <Navigate to="/" replace />}
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users/new"
                element={
                  <ProtectedRoute>
                    <Layout>
                      {userLevel >= 5 ? <UserFormPage /> : <Navigate to="/" replace />}
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users/:id/edit"
                element={
                  <ProtectedRoute>
                    <Layout>
                      {userLevel >= 5 ? <UserFormPage /> : <Navigate to="/" replace />}
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/seller-phones"
                element={
                  <ProtectedRoute>
                    <Layout>
                      {userLevel >= 5 ? <SellerPhonesPage /> : <Navigate to="/" replace />}
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/customer-links"
                element={
                  <ProtectedRoute>
                    <Layout>
                      {userLevel >= 5 ? <CustomerLinksPage /> : <Navigate to="/" replace />}
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/chatbot"
                element={
                  <ProtectedRoute>
                    <Layout>
                      {userLevel >= 5 ? <ChatbotConfigPage /> : <Navigate to="/" replace />}
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/logs"
                element={
                  <ProtectedRoute>
                    <Layout>
                      {userLevel >= 5 ? <LogsPage /> : <Navigate to="/" replace />}
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AuthChecker>
      </ManagerFilterProvider>
    </ThemeProvider>
  )
}

export default App
