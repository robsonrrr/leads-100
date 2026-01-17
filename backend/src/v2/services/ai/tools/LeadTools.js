import { LeadRepository } from '../../../../repositories/lead.repository.js';
import { CartItemRepository } from '../../../../repositories/cartItem.repository.js';
import { ProductRepository } from '../../../../repositories/product.repository.js';
import { getDatabase as db } from '../../../../config/database.js';
import logger from '../../../../config/logger.js';
import { automationEngine } from '../../automation/AutomationEngine.js';

const leadRepository = new LeadRepository();
const cartItemRepository = new CartItemRepository();
const productRepository = new ProductRepository();

export const leadTools = {
    definitions: [
        {
            type: 'function',
            function: {
                name: 'search_leads',
                description: 'Search for leads (quotes) using filters like customer ID, status, or search term.',
                parameters: {
                    type: 'object',
                    properties: {
                        customerId: { type: 'integer', description: 'Filter by customer ID' },
                        sellerId: { type: 'integer', description: 'Filter by seller ID' },
                        search: { type: 'string', description: 'Search term (Lead ID, Order Web, or Customer Name)' },
                        status: { type: 'string', enum: ['open', 'converted', 'all'], default: 'all' },
                        startDate: { type: 'string', description: 'Filter by start date (YYYY-MM-DD)' },
                        endDate: { type: 'string', description: 'Filter by end date (YYYY-MM-DD)' },
                        limit: { type: 'integer', default: 5 }
                    }
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'get_lead_details',
                description: 'Get full details of a specific lead including its items.',
                parameters: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', description: 'The Lead ID (cSCart)' }
                    },
                    required: ['id']
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'create_lead',
                description: 'Create a new lead (quote) for a specific customer with a list of products. Ask for customer ID and products with quantities first if they were not provided.',
                parameters: {
                    type: 'object',
                    properties: {
                        customerId: { type: 'integer', description: 'The ID of the customer' },
                        items: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    productId: { type: 'integer', description: 'The product ID' },
                                    quantity: { type: 'integer', description: 'Quantity of the product' }
                                },
                                required: ['productId', 'quantity']
                            }
                        },
                        remarks: { type: 'string', description: 'Optional internal remarks/comments' }
                    },
                    required: ['customerId', 'items']
                }
            }
        }
    ],

    handlers: {
        async search_leads(args) {
            const { status, limit = 5, userId, userLevel, ...filters } = args;
            if (status === 'open') filters.type = 1;
            else if (status === 'converted') filters.type = 2;

            // SEGURANÇA: Vendedores (Level 1) só veem seus próprios leads
            if (userLevel <= 1) {
                filters.cSeller = userId;
            }

            try {
                const result = await leadRepository.findAll(filters, { page: 1, limit });
                return JSON.stringify(result.data.map(l => ({
                    id: l.cSCart,
                    date: l.dCart,
                    customer: l.customerName,
                    total: l.totalValue,
                    status: l.cOrderWeb ? `Convertido (Pedido ${l.cOrderWeb})` : 'Aberto',
                    buyer: l.xBuyer
                })));
            } catch (error) {
                logger.error('Tool Error search_leads:', error);
                return JSON.stringify({ error: error.message });
            }
        },

        async get_lead_details({ id }) {
            try {
                const lead = await leadRepository.findById(id);
                if (!lead) return JSON.stringify({ error: 'Lead not found' });

                const [items] = await db().execute(
                    `SELECT 
            i.isbn as product_id, 
            p.modelo as model, 
            p.produto as name, 
            i.quant as quantity, 
            i.valor as price,
            i.valor * i.quant as total
           FROM mak.iCart i
           LEFT JOIN mak.produtos_estoque p ON i.isbn = p.produto_id
           WHERE i.idSCart = ?`,
                    [id]
                );

                return JSON.stringify({
                    id: lead.cSCart,
                    date: lead.dCart,
                    customer: lead.customer,
                    status: lead.cOrderWeb ? `Convertido (Pedido ${lead.cOrderWeb})` : 'Aberto',
                    remarks: lead.xRemarksOBS,
                    items: items.map(i => ({
                        product: i.name || i.model || i.product_id,
                        quantity: i.quantity,
                        price: i.price,
                        total: i.total
                    }))
                });
            } catch (error) {
                logger.error('Tool Error get_lead_details:', error);
                return JSON.stringify({ error: error.message });
            }
        },

        async create_lead(args) {
            const { customerId, items, remarks, userId } = args;
            if (!userId) return JSON.stringify({ error: 'User authentication required' });

            try {
                // 1. Criar cabeçalho do Lead
                const lead = await leadRepository.create({
                    cCustomer: customerId,
                    cUser: userId,
                    cSeller: userId,
                    dCart: new Date(),
                    xRemarksOBS: remarks || 'Criado via Chatbot AI',
                    cType: 1 // Status Aberto/Lead
                });

                const createdItems = [];
                const errors = [];

                // 2. Adicionar Itens
                for (const itemRequest of items) {
                    const product = await productRepository.findById(itemRequest.productId);
                    if (!product) {
                        errors.push(`Produto ID ${itemRequest.productId} não encontrado.`);
                        continue;
                    }

                    const itemData = {
                        cSCart: lead.cSCart,
                        cProduct: product.id,
                        qProduct: itemRequest.quantity,
                        vProduct: product.revenda,
                        vProductCC: product.revenda,
                        vProductOriginal: product.revenda,
                        vIPI: (product.revenda * (product.ipi || 0)) / 100,
                        vCST: 0,
                        tProduct: 1,
                        dInquiry: new Date()
                    };

                    const createdItem = await cartItemRepository.create(itemData);
                    if (createdItem) {
                        createdItems.push({
                            product: product.nome || product.modelo,
                            quantity: itemRequest.quantity
                        });
                    }
                }

                // 3. Disparar Automação (Follow-up)
                await automationEngine.trigger({
                    type: 'LEAD_CREATED',
                    customerId,
                    userId,
                    referenceId: lead.cSCart
                });

                return JSON.stringify({
                    success: true,
                    message: 'Lead criado com sucesso!',
                    leadId: lead.cSCart,
                    items: createdItems,
                    errors: errors.length > 0 ? errors : undefined
                });
            } catch (error) {
                logger.error('Tool Error create_lead:', error);
                return JSON.stringify({ error: error.message });
            }
        }
    }
};
