import logger from '../../config/logger.js';
import { pricingAgent } from '../services/pricing/PricingAgent.js';
import { query as dbQuery } from '../../config/database.js';

export const calculatePrice = async (req, res, next) => {
    try {
        const result = await pricingAgent.calculate({ ...req.body, action: 'CALCULATE' });
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const applyDiscount = async (req, res, next) => {
    try {
        const result = await pricingAgent.calculate({ ...req.body, action: 'APPLY_DISCOUNT' });
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const simulatePrice = async (req, res, next) => {
    try {
        const result = await pricingAgent.calculate({ ...req.body, action: 'SIMULATE' });
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const freezePrice = async (req, res, next) => {
    try {
        const { event_id } = req.body;
        const result = await pricingAgent.freeze(event_id);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const requestException = async (req, res, next) => {
    try {
        const { event_id, reason, seller_id } = req.body;
        const result = await pricingAgent.requestException(event_id, reason, seller_id);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const decideException = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, approver_id, notes } = req.body;
        const result = await pricingAgent.exceptionHandler.decide(id, status, approver_id, notes);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const getMetrics = async (req, res, next) => {
    try {
        const stats = await dbQuery(`
      SELECT 
        COUNT(*) as total_events,
        SUM(CASE WHEN is_within_policy = 1 THEN 1 ELSE 0 END) as within_policy,
        SUM(CASE WHEN is_within_policy = 0 THEN 1 ELSE 0 END) as violations,
        AVG(margin_percent) as avg_margin,
        SUM(discount_total) as total_discounts
      FROM pricing_decision_events
      WHERE event_timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

        res.json({ success: true, data: stats[0] });
    } catch (error) {
        next(error);
    }
};
