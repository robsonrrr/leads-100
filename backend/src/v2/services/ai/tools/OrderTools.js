import { OrderRepository } from '../../../../repositories/order.repository.js';
import { getDatabase as db } from '../../../../config/database.js';
import logger from '../../../../config/logger.js';

const orderRepository = new OrderRepository();

export const orderTools = {
    definitions: [
        {
            type: 'function',
            function: {
                name: 'search_orders',
                description: 'Search for finalized orders using customer ID, order ID, or date. Use this to track history or check status of a sale.',
                parameters: {
                    type: 'object',
                    properties: {
                        customerId: { type: 'integer', description: 'Filter by customer ID' },
                        orderId: { type: 'integer', description: 'Search for a specific Order ID (pedido)' },
                        limit: { type: 'integer', default: 5 }
                    }
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'get_order_details',
                description: 'Get full details of a finalized order including items and payment terms.',
                parameters: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', description: 'The Order ID (pedido)' }
                    },
                    required: ['id']
                }
            }
        }
    ],

    handlers: {
        async search_orders(args) {
            const { customerId, orderId, limit = 5, userId, userLevel } = args;

            try {
                let sql = `
          SELECT 
            h.id as id, 
            h.data as date, 
            h.idcli as customer_id, 
            c.nome as customer_name,
            h.valor as total,
            h.nop as operation
          FROM mak.hoje h
          LEFT JOIN clientes c ON h.idcli = c.id
          WHERE h.valor > 0 AND h.nop IN (27, 28, 51, 76)
        `;
                const params = [];

                if (orderId) {
                    sql += ' AND h.id = ?';
                    params.push(orderId);
                }
                if (customerId) {
                    sql += ' AND h.idcli = ?';
                    params.push(customerId);
                }

                // SEGURANÇA: Vendedores (Level 1) só veem seus próprios pedidos (vendedor na mak.hoje)
                if (userLevel !== undefined && userLevel <= 1) {
                    sql += ' AND h.vendedor = ?';
                    params.push(userId);
                }

                sql += ` ORDER BY h.data DESC LIMIT ${parseInt(limit)}`;

                logger.info('Executing search_orders query', { sql, params });
                const [rows] = await db().execute(sql, params);

                return JSON.stringify(rows.map(r => ({
                    id: r.id,
                    date: r.date,
                    customer: r.customer_name,
                    total: r.total,
                    operation: r.operation
                })));
            } catch (error) {
                logger.error('Tool Error search_orders:', error);
                return JSON.stringify({ error: error.message });
            }
        },

        async get_order_details({ id, userId, userLevel }) {
            try {
                const order = await orderRepository.findById(id);
                if (!order) return JSON.stringify({ error: 'Order not found' });

                // SEGURANÇA: Vendedores (Level 1) só veem seus próprios pedidos
                if (userLevel <= 1 && order.vendedor !== userId) {
                    return JSON.stringify({ error: 'Acesso negado: Este pedido pertence a outro vendedor.' });
                }

                return JSON.stringify({
                    id: order.pedido,
                    date: order.data,
                    customer: order.customer?.nome || order.idcli,
                    total: order.valor,
                    items: order.items.map(i => ({
                        product: i.product?.name || i.product?.model || i.cProduct,
                        quantity: i.qProduct,
                        price: i.vProduct,
                        total: (i.vProduct || 0) * (i.qProduct || 0)
                    })),
                    payment: {
                        type: order.pg,
                        terms: order.fprazo
                    }
                });
            } catch (error) {
                logger.error('Tool Error get_order_details:', error);
                return JSON.stringify({ error: error.message });
            }
        }
    }
};
