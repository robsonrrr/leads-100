import { CustomerRepository } from '../../../../repositories/customer.repository.js';
import logger from '../../../../config/logger.js';

const customerRepository = new CustomerRepository();

export const customerTools = {
    // Definição para OpenAI
    definitions: [
        {
            type: 'function',
            function: {
                name: 'search_customers',
                description: 'Search for customers by name, document (CNPJ/CPF) or ID. Use this to find a customer when the user provides a name or partial information.',
                parameters: {
                    type: 'object',
                    properties: {
                        query: {
                            type: 'string',
                            description: 'The search term (name, friendly name, document or ID)'
                        },
                        limit: {
                            type: 'integer',
                            description: 'Max number of results (default 5)',
                            default: 5
                        }
                    },
                    required: ['query']
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'get_customer_details',
                description: 'Get detailed information about a specific customer by their ID. Use this when you have the customer ID (e.g. from a search result) and need more details like address, financial status, etc.',
                parameters: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'The numeric ID of the customer (idcli)'
                        }
                    },
                    required: ['id']
                }
            }
        }
    ],

    // Implementação
    handlers: {
        async search_customers({ query, limit = 5, userId, userLevel }) {
            logger.info('Tool: search_customers', { query });
            try {
                const filters = {};
                // SEGURANÇA: Vendedores (Level 1) só veem sua própria carteira
                if (userLevel <= 1) {
                    filters.sellerId = userId;
                }

                // Busca usando o repository existente
                const result = await customerRepository.search(query, filters, {
                    limit,
                    page: 1
                });

                if (!result.data || result.data.length === 0) {
                    return JSON.stringify({ message: "Nenhum cliente encontrado." });
                }

                return JSON.stringify(result.data.map(c => ({
                    id: c.id,
                    name: c.nome,
                    fantasy: c.fantasia,
                    document: c.cnpj,
                    city: c.cidade,
                    state: c.estado
                })));
            } catch (error) {
                logger.error('Tool Error search_customers:', error);
                return JSON.stringify({ error: error.message });
            }
        },

        async get_customer_details({ id }) {
            logger.info('Tool: get_customer_details', { id });
            try {
                const customer = await customerRepository.findById(id);
                if (!customer) return JSON.stringify({ error: 'Cliente não encontrado' });

                return JSON.stringify({
                    id: customer.id,
                    name: customer.nome,
                    fantasy: customer.fantasia,
                    document: customer.cnpj,
                    email: customer.email,
                    phone: customer.ddd && customer.fone ? `(${customer.ddd}) ${customer.fone}` : customer.fone,
                    address: `${customer.ender}, ${customer.nro} - ${customer.bairro}`,
                    city: customer.cidade,
                    state: customer.estado,
                    financial: {
                        limit: customer.limite,
                        balance: customer.credito
                    }
                });
            } catch (error) {
                logger.error('Tool Error get_customer_details:', error);
                return JSON.stringify({ error: error.message });
            }
        }
    }
};
