import { ProductRepository } from '../../../../repositories/product.repository.js';
import { StockRepository } from '../../../../repositories/stock.repository.js';
import logger from '../../../../config/logger.js';

const productRepository = new ProductRepository();
const stockRepository = new StockRepository();

export const stockTools = {
    definitions: [
        {
            type: 'function',
            function: {
                name: 'search_products',
                description: 'Search for products by name, model or category to check prices and general info.',
                parameters: {
                    type: 'object',
                    properties: {
                        query: { type: 'string', description: 'Search term (product name or model)' },
                        limit: { type: 'integer', default: 5 }
                    },
                    required: ['query']
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'get_product_stock',
                description: 'Check stock levels for a specific product by ID across different warehouses/units.',
                parameters: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', description: 'Product ID' }
                    },
                    required: ['id']
                }
            }
        }
    ],

    handlers: {
        async search_products({ query, limit = 5 }) {
            try {
                const result = await productRepository.search(query, {}, { page: 1, limit });
                return JSON.stringify(result.data.map(p => ({
                    id: p.id,
                    model: p.modelo || p.model,
                    name: p.nome || p.name,
                    description: p.descricao || p.description,
                    sale_price: p.revenda,
                    cost_price: p.custo,
                    brand: p.marca,
                    category: p.categoria || p.category,
                    segment: p.segmento || p.segment
                })));
            } catch (error) {
                logger.error('Tool Error search_products:', error);
                return JSON.stringify({ error: error.message });
            }
        },

        async get_product_stock({ id }) {
            try {
                // Unidades Rolemak:
                // SP: 1 (Matriz), 2 (Depósito), 8 (Barra Funda)
                // SC: 9 (Depósito SC)

                const [stk1, stk2, stk8, stk9] = await Promise.all([
                    stockRepository.getTotals(id, 1),
                    stockRepository.getTotals(id, 2),
                    stockRepository.getTotals(id, 8),
                    stockRepository.getTotals(id, 9)
                ]);

                return JSON.stringify({
                    id,
                    stock: {
                        sp: (stk1.total_disponivel || 0) + (stk2.total_disponivel || 0) + (stk8.total_disponivel || 0),
                        sc: stk9.total_disponivel || 0,
                        details: {
                            matriz_sp: stk1.total_disponivel || 0,
                            deposito_sp: stk2.total_disponivel || 0,
                            barrafunda_sp: stk8.total_disponivel || 0,
                            deposito_sc: stk9.total_disponivel || 0
                        }
                    }
                });
            } catch (error) {
                logger.error('Tool Error get_product_stock:', error);
                return JSON.stringify({ error: error.message });
            }
        }
    }
};
