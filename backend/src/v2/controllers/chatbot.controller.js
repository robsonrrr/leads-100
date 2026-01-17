import { getDatabase as db } from '../../config/database.js';
import { aiGateway } from '../services/ai/AIGateway.js';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../config/logger.js';
import { toolsRegistry } from '../services/ai/tools/index.js';

/**
 * ChatbotController - Gerencia conversas e fluxo de mensagens (Q2 2026)
 */
export class ChatbotController {

    /**
     * POST /api/v2/ai/chat
     * Envia uma mensagem e recebe resposta da IA
     */
    async sendMessage(req, res) {
        const { message, conversationId, context } = req.body;
        const userId = req.user.userId;

        if (!message) {
            return res.status(400).json({ success: false, error: 'Message is required' });
        }

        try {
            let activeConversationId = conversationId;

            // 1. Criar conversa se não existir
            if (!activeConversationId) {
                activeConversationId = uuidv4();
                await db().execute(
                    `INSERT INTO ai_conversations (id, user_id, title, context_type, context_id) 
           VALUES (?, ?, ?, ?, ?)`,
                    [
                        activeConversationId,
                        userId,
                        message.substring(0, 50) + '...', // Título provisório
                        context?.type || 'GENERAL',
                        context?.id || null
                    ]
                );
            } else {
                // Validar ownership
                const [rows] = await db().execute('SELECT id FROM ai_conversations WHERE id = ? AND user_id = ?', [activeConversationId, userId]);
                if (rows.length === 0) {
                    return res.status(404).json({ success: false, error: 'Conversation not found' });
                }
            }

            // 2. Salvar mensagem do usuário
            await db().execute(
                `INSERT INTO ai_messages (conversation_id, role, content) VALUES (?, 'user', ?)`,
                [activeConversationId, message]
            );

            // 3. Recuperar histórico recente (últimas 10 mensagens para contexto)
            const [history] = await db().execute(
                `SELECT role, content, tool_calls, tool_output FROM ai_messages 
         WHERE conversation_id = ? 
         ORDER BY id ASC`,
                [activeConversationId]
            );

            // 4. Preparar contexto do sistema
            const systemPrompt = {
                role: 'system',
                content: `Você é o Assistente Virtual da Rolemak, um sistema de gestão de vendas. 
        Você ajuda vendedores a consultarem pedidos, leads e suas métricas.
        O usuário atual é ID ${userId}.
        Data/Hora Atual: ${new Date().toLocaleString('pt-BR')}.
        
        Regras:
        - Seja profissional e direto.
        - Se não souber, diga que não sabe.
        - Respeite a privacidade dos dados.
        - Use a data atual para entender termos como "hoje", "amanhã", "mês passado".`
            };

            const messages = [
                systemPrompt,
                ...history.map(m => {
                    // Reconstruir mensagens no formato OpenAI
                    // Nota: Colunas JSON podem vir pré-parseadas dependendo do driver
                    if (m.role === 'tool') {
                        const toolData = typeof m.tool_output === 'string'
                            ? JSON.parse(m.tool_output || '{}')
                            : m.tool_output || {};
                        return {
                            role: 'tool',
                            tool_call_id: toolData.tool_call_id,
                            content: m.content
                        };
                    }
                    if (m.role === 'assistant' && (m.tool_calls || m.content)) {
                        return {
                            role: 'assistant',
                            content: m.content || '',
                            tool_calls: typeof m.tool_calls === 'string'
                                ? JSON.parse(m.tool_calls)
                                : m.tool_calls
                        };
                    }
                    return { role: m.role, content: m.content };
                })
            ];

            // 5. Loop de execução (Agentic Loop)
            let finalResponse = null;
            let turnCount = 0;
            const maxTurns = 5;
            const tools = toolsRegistry.getDefinitions();

            while (turnCount < maxTurns && !finalResponse) {
                // Chamar Gateway
                const aiResponse = await aiGateway.chatCompletion(messages, {
                    userId,
                    useCache: turnCount === 0,
                    tools: tools.length > 0 ? tools : undefined
                });

                // Adiciona mensagem do assistente ao histórico em memória
                messages.push({
                    role: aiResponse.role,
                    content: aiResponse.content,
                    tool_calls: aiResponse.tool_calls
                });

                // Salvar mensagem AI no DB
                await db().execute(
                    `INSERT INTO ai_messages (conversation_id, role, content, tool_calls, tokens_usage) VALUES (?, ?, ?, ?, ?)`,
                    [
                        activeConversationId,
                        aiResponse.role,
                        aiResponse.content,
                        aiResponse.tool_calls ? JSON.stringify(aiResponse.tool_calls) : null,
                        aiResponse.usage?.total_tokens || 0
                    ]
                );

                if (aiResponse.tool_calls && aiResponse.tool_calls.length > 0) {
                    logger.info(`Chatbot: Processing ${aiResponse.tool_calls.length} tool calls for user ${userId}`);

                    for (const toolCall of aiResponse.tool_calls) {
                        const functionName = toolCall.function.name;
                        let args = {};
                        try {
                            args = JSON.parse(toolCall.function.arguments);
                            // Injetar contexto automático (UserId e UserLevel para segurança)
                            args.userId = userId;
                            args.userLevel = req.user.level || 0;
                        } catch (e) {
                            logger.error(`Error parsing args for tool ${functionName}`, e);
                        }

                        const handler = toolsRegistry.getHandler(functionName);
                        let toolOutput = '';

                        if (handler) {
                            try {
                                logger.info(`Chatbot: Executing tool ${functionName}`, args);
                                toolOutput = await handler(args);
                            } catch (e) {
                                logger.error(`Tool execution error: ${functionName}`, e);
                                toolOutput = JSON.stringify({ error: `Error executing tool: ${e.message}` });
                            }
                        } else {
                            toolOutput = JSON.stringify({ error: `Tool ${functionName} not found` });
                        }

                        // Adicionar resultado ao histórico
                        messages.push({
                            role: 'tool',
                            tool_call_id: toolCall.id,
                            content: toolOutput
                        });

                        // Salvar output da tool no DB
                        // Nota: Precisamos armazenar o tool_call_id para reconstrução correta depois
                        await db().execute(
                            `INSERT INTO ai_messages (conversation_id, role, content, tool_output) VALUES (?, 'tool', ?, ?)`,
                            [
                                activeConversationId,
                                toolOutput,
                                JSON.stringify({ tool_call_id: toolCall.id })
                            ]
                        );
                    }
                    // Loop continua...
                } else {
                    // Resposta final
                    finalResponse = aiResponse;
                }

                turnCount++;
            }

            if (!finalResponse) {
                throw new Error('AI Loop limit exceeded without final response');
            }

            res.json({
                success: true,
                data: {
                    conversationId: activeConversationId,
                    message: finalResponse.content,
                    role: 'assistant'
                }
            });

        } catch (error) {
            logger.error('Chatbot Error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Internal AI Error'
            });
        }
    }

    /**
     * GET /api/v2/ai/conversations
     */
    async getConversations(req, res) {
        try {
            const [rows] = await db().execute(
                `SELECT id, title, created_at, context_type FROM ai_conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 20`,
                [req.user.userId]
            );
            res.json({ success: true, data: rows });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Database error' });
        }
    }

    /**
     * GET /api/v2/ai/conversations/:id
     */
    async getMessages(req, res) {
        try {
            const { id } = req.params;
            const [conv] = await db().execute('SELECT id FROM ai_conversations WHERE id = ? AND user_id = ?', [id, req.user.userId]);
            if (conv.length === 0) return res.status(404).json({ error: 'Not found' });

            const [messages] = await db().execute(
                `SELECT role, content, created_at, tool_calls, tool_output FROM ai_messages WHERE conversation_id = ? ORDER BY id ASC`,
                [id]
            );

            // Limpar campos técnicos para interface simples se necessário, ou mandar tudo
            res.json({ success: true, data: messages });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Database error' });
        }
    }
}

export const chatbotController = new ChatbotController();
