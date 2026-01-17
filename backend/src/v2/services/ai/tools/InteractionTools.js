import { getDatabase as db } from '../../../../config/database.js';
import logger from '../../../../config/logger.js';

export const interactionTools = {
    definitions: [
        {
            type: 'function',
            function: {
                name: 'create_interaction',
                description: 'Register a new interaction with a customer (call, visit, email, whatsapp, meeting, note) and optionally schedule a follow-up action.',
                parameters: {
                    type: 'object',
                    properties: {
                        customerId: { type: 'integer', description: 'The ID of the customer' },
                        type: { type: 'string', enum: ['call', 'visit', 'email', 'whatsapp', 'meeting', 'note'], description: 'Type of the interaction' },
                        description: { type: 'string', description: 'Detailed description of the interaction' },
                        nextActionDate: { type: 'string', description: 'Optional: Date for the next follow-up action (YYYY-MM-DD)' },
                        nextActionDescription: { type: 'string', description: 'Optional: Description for the next follow-up action' },
                        userId: { type: 'integer', description: 'User ID (auto-injected)' }
                    },
                    required: ['customerId', 'type', 'description']
                }
            }
        }
    ],

    handlers: {
        async create_interaction(args) {
            const { customerId, type, description, nextActionDate, nextActionDescription, userId } = args;

            if (!userId) {
                return JSON.stringify({ error: 'User authentication required' });
            }

            try {
                const query = `
          INSERT INTO staging.customer_interactions 
            (customer_id, user_id, type, description, next_action_date, next_action_description)
          VALUES (?, ?, ?, ?, ?, ?)
        `;

                const [result] = await db().execute(query, [
                    customerId,
                    userId,
                    type,
                    description,
                    nextActionDate || null,
                    nextActionDescription || null
                ]);

                return JSON.stringify({
                    success: true,
                    message: 'Interação registrada com sucesso!',
                    id: result.insertId,
                    next_action: nextActionDate ? `Agendada para ${nextActionDate}` : 'Nenhuma próxima ação agendada'
                });
            } catch (error) {
                logger.error('Tool Error create_interaction:', error);
                return JSON.stringify({ error: error.message });
            }
        }
    }
};
