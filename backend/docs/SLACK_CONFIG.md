# Slack Alerting Configuration - Q3.1

Guia para configurar alertas via Slack.

## Variáveis de Ambiente

Adicione estas variáveis ao seu arquivo `.env`:

```env
# Habilitar notificações Slack
SLACK_ALERTS_ENABLED=false

# Webhook URL do Slack (obtenha em api.slack.com/messaging/webhooks)
SLACK_WEBHOOK_URL=

# Canal padrão para alertas
SLACK_ALERT_CHANNEL=#alerts-performance

# Canais por nível de alerta (opcional)
SLACK_CHANNEL_EMERGENCY=#alerts-critical
SLACK_CHANNEL_CRITICAL=#alerts-critical
SLACK_CHANNEL_WARNING=#alerts-performance

# Enviar warnings para Slack (default: false, só critical/emergency)
SLACK_ALERT_WARNINGS=false
```

## Como Configurar

1. Acesse [Slack API Apps](https://api.slack.com/apps)
2. Crie um novo app ou use existente
3. Ative "Incoming Webhooks"
4. Adicione um webhook para o canal desejado
5. Copie a URL do webhook para `SLACK_WEBHOOK_URL`
6. Defina `SLACK_ALERTS_ENABLED=true`

## Endpoints Disponíveis

```bash
# Testar conexão
POST /api/metrics/slack/test

# Ver configuração atual
GET /api/metrics/slack/config
```

## Níveis de Alerta

| Nível | Enviado para Slack | Canal |
|-------|-------------------|-------|
| Emergency | ✅ Sempre | #alerts-critical |
| Critical | ✅ Sempre | #alerts-critical |
| Warning | ⚙️ Se habilitado | #alerts-performance |

## Exemplo de Mensagem

Os alertas são formatados usando Slack Block Kit com:
- Cores por nível (vermelho, laranja, azul)
- Emojis por tipo de alerta
- Detalhes formatados em campos
- Timestamp em horário de Brasília
