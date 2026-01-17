import axios from 'axios';
import { getDatabase } from '../config/database.js';
import logger from '../config/logger.js';

const db = () => getDatabase();

const PRICING_API_URL = process.env.PRICING_API_URL || 'https://csuite.internut.com.br/pricing/run';
const PRICING_API_KEY = process.env.PRICING_API_KEY || 'eff0bf9efe8238b433f2587153c0c8209c4737e6a56fa90018308500678cafd5';

export class ExternalPricingService {
    /**
     * Resolva o brand_id a partir do nome da marca
     */
    async getBrandId(brandName) {
        try {
            if (!brandName) return 0;
            const [rows] = await db().execute(
                'SELECT brand_id FROM csuite_pricing.brands WHERE brand_name = ? OR brand_name LIKE ? LIMIT 1',
                [brandName, `%${brandName}%`]
            );
            return rows.length > 0 ? rows[0].brand_id : 0;
        } catch (error) {
            logger.error('Error resolving brand_id:', error);
            return 0;
        }
    }

    /**
     * Chama a API externa do CSuite Pricing
     */
    async calculate(payload) {
        try {
            logger.info('Calling External Pricing API', { sku_id: payload.sku_id, customer_id: payload.customer_id });

            const response = await axios.post(PRICING_API_URL, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': PRICING_API_KEY
                },
                timeout: 30000
            });

            return response.data;
        } catch (error) {
            logger.error('External Pricing API Error:', error.response?.data || error.message);
            throw error;
        }
    }
}

export const externalPricingService = new ExternalPricingService();
