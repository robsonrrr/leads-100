import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { connectDatabase } from './config/database.js';
import { connectRedis } from './config/redis.js';
import { initViews } from './migrations/initViews.js';
import { initPricing } from './migrations/initPricing.js';
import { initSecurity } from './migrations/initSecurity.js';
import { createSearchHistoryTable } from './migrations/createSearchHistory.js';
import { updateSearchHistoryTable } from './migrations/updateSearchHistory.js';
import { createFulltextIndex } from './migrations/createFulltextIndex.js';
import { initSuperbotIntegration } from './migrations/initSuperbot.js';
import logger from './config/logger.js';
import { requestLoggerMiddleware } from './middleware/requestLogger.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { auditLog } from './services/auditLog.service.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import leadsRoutes from './routes/leads.routes.js';
import customersRoutes from './routes/customers.routes.js';
import productsRoutes from './routes/products.routes.js';
import pricingRoutes from './routes/pricing.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import promotionsRoutes from './routes/promotions.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import alertsRoutes from './routes/alerts.routes.js';
import interactionsRoutes from './routes/interactions.routes.js';
import goalsRoutes from './routes/goals.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import metricsRoutes from './routes/metrics.routes.js';
import syncRoutes from './routes/sync.routes.js';
import superbotRoutes from './routes/superbot.routes.js';
import v2Routes from './v2/index.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const isProduction = process.env.NODE_ENV === 'production';

// Configurar CORS para permitir acesso do frontend
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requisições sem origin (mobile apps, Postman, etc)
    if (!origin) return callback(null, true);

    // Lista de origens permitidas
    const allowedOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://18.229.23.153:5173',
      'http://54.232.49.52:5173',
      'https://dev.office.internut.com.br',
      process.env.CORS_ORIGIN
    ].filter(Boolean); // Remove valores undefined/null

    // Em desenvolvimento, permitir qualquer origem local ou do IP remoto
    if (process.env.NODE_ENV !== 'production') {
      if (origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.includes('18.229.23.153') ||
        origin.includes('54.232.49.52') ||
        origin.includes('dev.office.internut.com.br')) {
        return callback(null, true);
      }
    }

    // Verificar se a origem está na lista permitida
    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      logger.warn('CORS bloqueado para origem', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization']
};

// Importante: CORS precisa vir antes de middlewares que podem encerrar a resposta (ex: rate limit)
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Rate limiting geral (antes de outros middlewares)
app.use(generalLimiter);

// Configuração do Helmet - headers de segurança
app.use(helmet({
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://validator.swagger.io"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  } : false, // Desabilitar CSP em desenvolvimento para Swagger UI
  hsts: isProduction ? {
    maxAge: 31536000, // 1 ano
    includeSubDomains: true,
    preload: true
  } : false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  originAgentCluster: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
  noSniff: true,
  ieNoOpen: true,
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  permittedCrossDomainPolicies: { permittedPolicies: 'none' }
}));

// Desabilitar header X-Powered-By
app.disable('x-powered-by');

app.use(compression());
app.use(morgan(isProduction ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (após body parser)
app.use(requestLoggerMiddleware);

// Swagger UI - Documentação da API
const swaggerOptions = {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Leads Agent API - Docs',
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'list',
    filter: true,
    showRequestDuration: true,
  },
  // Importante: usar caminhos relativos para CSS/JS
  customCssUrl: undefined,
  customJs: undefined,
};

// Usar serveStatic para garantir que os assets sejam servidos corretamente
app.use('/api/docs', swaggerUi.serve);
app.get('/api/docs', swaggerUi.setup(swaggerSpec, swaggerOptions));

// Swagger JSON spec endpoint
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Health check (também em /api/health para compatibilidade)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API root - informações da API
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Leads Modern API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      leads: '/api/leads',
      customers: '/api/customers',
      products: '/api/products',
      pricing: '/api/pricing',
      orders: '/api/orders',
      analytics: '/api/analytics',
      superbot: '/api/superbot',
      health: '/api/health',
      docs: '/api/docs'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/promotions', promotionsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/interactions', interactionsRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/superbot', superbotRoutes);

// API V2 Routes (Plan 2026)
app.use('/api/v2', v2Routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize connections and start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connected');

    // Initialize views
    await initViews();

    // Initialize Pricing Agent V2 tables
    await initPricing();

    // Initialize Security Q1 2026 updates
    await initSecurity();

    // Initialize Search History (Q3 2026 - Bloco 2.3)
    await createSearchHistoryTable();
    await updateSearchHistoryTable();

    // Initialize FULLTEXT Index (Q3 2026 - Bloco 2.2.9)
    await createFulltextIndex();

    // Initialize Superbot Integration (Q1 2026)
    await initSuperbotIntegration();

    // Start Automation Scheduler (Q2 2026)
    const { automationScheduler } = await import('./v2/services/automation/Scheduler.js');
    automationScheduler.start();

    // Connect to Redis (opcional em desenvolvimento)
    const redisClient = await connectRedis();
    if (redisClient) {
      logger.info('Redis connected');
    } else {
      // Em desenvolvimento, Redis é opcional
      if (process.env.NODE_ENV === 'production') {
        logger.warn('Redis não disponível em produção - isso pode afetar performance');
      } else {
        logger.warn('Redis não disponível - continuando sem cache');
      }
    }

    // Start server - aceitar conexões de qualquer IP
    app.listen(PORT, '0.0.0.0', () => {
      logger.info('Server started', {
        port: PORT,
        environment: process.env.NODE_ENV,
        url: `http://0.0.0.0:${PORT}`,
        docs: `http://localhost:${PORT}/api/docs`
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

startServer();

export default app;
