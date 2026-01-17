/**
 * Slack Notification Service - Q3.1 Alerting
 * Integração com Slack para envio de alertas
 */
import logger from '../config/logger.js';

// Configuração do Slack
const SLACK_CONFIG = {
    // Webhook URL - configurar via variável de ambiente
    webhookUrl: process.env.SLACK_WEBHOOK_URL || '',

    // Canal padrão para alertas
    defaultChannel: process.env.SLACK_ALERT_CHANNEL || '#alerts-performance',

    // Enabled flag
    enabled: process.env.SLACK_ALERTS_ENABLED === 'true',

    // Canais por tipo de alerta
    channels: {
        emergency: process.env.SLACK_CHANNEL_EMERGENCY || '#alerts-critical',
        critical: process.env.SLACK_CHANNEL_CRITICAL || '#alerts-critical',
        warning: process.env.SLACK_CHANNEL_WARNING || '#alerts-performance'
    }
};

// Cores por nível de alerta
const ALERT_COLORS = {
    emergency: '#DC143C', // Vermelho escuro
    critical: '#FF4444',  // Vermelho
    warning: '#FFAA00',   // Laranja
    info: '#2196F3'       // Azul
};

// Emojis por nível
const ALERT_EMOJIS = {
    emergency: '🚨',
    critical: '🔴',
    warning: '⚠️',
    info: 'ℹ️'
};

// Emojis por tipo
const TYPE_EMOJIS = {
    latency: '⏱️',
    error_rate: '❌',
    cache_hit_rate: '💾',
    slow_query: '🐌',
    memory: '🧠',
    database: '🗄️',
    default: '📊'
};

/**
 * Formata mensagem para Slack Block Kit
 */
function formatSlackMessage(alert) {
    const { level, type, message, details, timestamp } = alert;
    const color = ALERT_COLORS[level] || ALERT_COLORS.info;
    const emoji = ALERT_EMOJIS[level] || ALERT_EMOJIS.info;
    const typeEmoji = TYPE_EMOJIS[type] || TYPE_EMOJIS.default;

    // Formatar detalhes como campos
    const fields = [];
    if (details) {
        Object.entries(details).forEach(([key, value]) => {
            // Limitar tamanho do valor
            const displayValue = String(value).substring(0, 100);
            fields.push({
                type: 'mrkdwn',
                text: `*${formatFieldName(key)}:*\n${displayValue}`
            });
        });
    }

    // Estrutura do Block Kit
    const blocks = [
        {
            type: 'header',
            text: {
                type: 'plain_text',
                text: `${emoji} ${level.toUpperCase()} Alert`,
                emoji: true
            }
        },
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `${typeEmoji} *${message}*`
            }
        }
    ];

    // Adicionar campos se existirem
    if (fields.length > 0) {
        // Dividir campos em grupos de 2 para layout
        for (let i = 0; i < fields.length; i += 2) {
            blocks.push({
                type: 'section',
                fields: fields.slice(i, i + 2)
            });
        }
    }

    // Adicionar contexto com timestamp
    blocks.push({
        type: 'context',
        elements: [
            {
                type: 'mrkdwn',
                text: `🕐 ${new Date(timestamp).toLocaleString('pt-BR', {
                    timeZone: 'America/Sao_Paulo'
                })} | 🏷️ ${type} | 📍 leads-agent`
            }
        ]
    });

    // Adicionar divider
    blocks.push({ type: 'divider' });

    return {
        attachments: [
            {
                color,
                blocks
            }
        ]
    };
}

/**
 * Formata nome do campo para exibição
 */
function formatFieldName(key) {
    return key
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
        .trim();
}

/**
 * Envia mensagem para Slack via Webhook
 */
async function sendToSlackWebhook(payload, webhookUrl) {
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Slack API error: ${response.status} - ${text}`);
        }

        return true;
    } catch (error) {
        logger.error('Failed to send Slack message:', error);
        return false;
    }
}

/**
 * SlackService - Serviço de notificações Slack
 */
export const SlackService = {
    /**
     * Verifica se Slack está habilitado
     */
    isEnabled() {
        return SLACK_CONFIG.enabled && SLACK_CONFIG.webhookUrl;
    },

    /**
     * Envia alerta para Slack
     */
    async sendAlert(alert) {
        if (!this.isEnabled()) {
            logger.debug('Slack alerts disabled, skipping notification');
            return false;
        }

        try {
            const payload = formatSlackMessage(alert);

            // Adicionar canal baseado no nível
            const channel = SLACK_CONFIG.channels[alert.level] || SLACK_CONFIG.defaultChannel;
            payload.channel = channel;

            const success = await sendToSlackWebhook(payload, SLACK_CONFIG.webhookUrl);

            if (success) {
                logger.info(`Slack alert sent: ${alert.level} - ${alert.type}`);
            }

            return success;
        } catch (error) {
            logger.error('Error sending Slack alert:', error);
            return false;
        }
    },

    /**
     * Envia mensagem simples para Slack
     */
    async sendMessage(message, options = {}) {
        if (!this.isEnabled()) {
            return false;
        }

        try {
            const payload = {
                text: message,
                channel: options.channel || SLACK_CONFIG.defaultChannel,
                icon_emoji: options.emoji || ':robot_face:',
                username: options.username || 'Leads Agent Bot'
            };

            return await sendToSlackWebhook(payload, SLACK_CONFIG.webhookUrl);
        } catch (error) {
            logger.error('Error sending Slack message:', error);
            return false;
        }
    },

    /**
     * Envia resumo diário de performance
     */
    async sendDailySummary(metrics) {
        if (!this.isEnabled()) {
            return false;
        }

        const blocks = [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: '📊 Resumo Diário de Performance',
                    emoji: true
                }
            },
            {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*Total Requests:*\n${metrics.requests.toLocaleString()}`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Avg Response Time:*\n${metrics.avgResponseTime}ms`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Error Rate:*\n${metrics.errorRate}`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Cache Hit Rate:*\n${metrics.cacheHitRate}`
                    }
                ]
            },
            {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*Slow Queries:*\n${metrics.slowQueries}`
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Alerts Today:*\n${metrics.alertsCount}`
                    }
                ]
            },
            {
                type: 'context',
                elements: [
                    {
                        type: 'mrkdwn',
                        text: `🗓️ ${new Date().toLocaleDateString('pt-BR')} | 🏷️ leads-agent`
                    }
                ]
            }
        ];

        const statusEmoji = metrics.errorRate < 1 ? '✅' : '⚠️';

        const payload = {
            text: `${statusEmoji} Resumo diário de performance`,
            blocks,
            channel: SLACK_CONFIG.defaultChannel
        };

        return await sendToSlackWebhook(payload, SLACK_CONFIG.webhookUrl);
    },

    /**
     * Testa conexão com Slack
     */
    async testConnection() {
        if (!SLACK_CONFIG.webhookUrl) {
            return {
                success: false,
                error: 'SLACK_WEBHOOK_URL not configured'
            };
        }

        try {
            const payload = {
                text: '🔔 Test message from Leads Agent - Slack integration working!',
                channel: SLACK_CONFIG.defaultChannel
            };

            const success = await sendToSlackWebhook(payload, SLACK_CONFIG.webhookUrl);

            return {
                success,
                message: success ? 'Connection successful' : 'Failed to send test message'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Expor configuração para debug
    getConfig() {
        return {
            enabled: SLACK_CONFIG.enabled,
            hasWebhook: !!SLACK_CONFIG.webhookUrl,
            defaultChannel: SLACK_CONFIG.defaultChannel,
            channels: SLACK_CONFIG.channels
        };
    }
};

export default SlackService;
