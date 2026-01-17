import express from 'express';
import pricingRoutes from './routes/pricing.v2.routes.js';
import aiRoutes from './routes/ai.routes.js';
import userPreferencesRoutes from './routes/user.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';

const router = express.Router();


/**
 * @api {get} /api/v2/health V2 Health Check
 */
router.get('/health', (req, res) => {
    res.json({ status: 'ok', version: '2.0.0-alpha', timestamp: new Date().toISOString() });
});

// Mount V2 modules
router.use('/pricing', pricingRoutes);
router.use('/ai', aiRoutes);
router.use('/user', userPreferencesRoutes);
router.use('/analytics', analyticsRoutes);

// More V2 routes will be added here (e.g., /ia, /automation)

export default router;
