# 🔗 Guia de Configuração do Webhook - SuperBot → Leads-Agent

Este documento descreve como configurar o SuperBot para enviar mensagens do WhatsApp para o leads-agent para análise de intenção e criação automática de leads.

## 📋 Visão Geral

```
┌─────────────┐     ┌────────────┐     ┌─────────────────┐
│   Cliente   │────▶│  SuperBot  │────▶│   Leads-Agent   │
│  (WhatsApp) │     │(midd-decisao)    │(Webhook Endpoint)│
│             │     │            │     │                 │
└─────────────┘     └────────────┘     └────────┬────────┘
                                                │
                                        ┌───────▼───────┐
                                        │   Análise IA  │
                                        │   (OpenAI)    │
                                        └───────┬───────┘
                                                │
                         ┌──────────────────────┼──────────────────────┐
                         ▼                      ▼                      ▼
                  ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
                  │ Criar Lead  │       │  Notificar  │       │  Registrar  │
                  │ Automático  │       │  Vendedor   │       │   Evento    │
                  └─────────────┘       └─────────────┘       └─────────────┘
```

## 🌐 Endpoint do Webhook

### URL Produção
```
https://leads.internut.com.br/api/superbot/webhook
```

### URL Desenvolvimento
```
http://54.232.49.52:3002/api/superbot/webhook
```

### Método
```
POST
```

### Headers
```http
Content-Type: application/json
X-Superbot-Signature: <HMAC-SHA256 signature>  # Obrigatório em produção
```

---

## 📦 Formato do Payload

### Campos Obrigatórios

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `message_id` | string | ID único da mensagem do WhatsApp |
| `session_id` | string | ID da sessão de conversa |
| `sender_phone` | string | Telefone do remetente (formato: 5511999999999) |
| `recipient_phone` | string | Telefone do destinatário (Rolemak) |
| `message_text` | string | Texto da mensagem |
| `direction` | string | `incoming` ou `outgoing` |
| `timestamp` | string | ISO 8601 timestamp |

### Campos Opcionais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `message_type` | string | `text`, `image`, `audio`, `video`, `document` |
| `media_url` | string | URL da mídia (se aplicável) |
| `transcription` | string | Transcrição do áudio (se aplicável) |

### Exemplo de Payload

```json
{
  "message_id": "WAB-MSG-20260118-001234",
  "session_id": "sess-551133331536-20260118",
  "sender_phone": "5511999999999",
  "recipient_phone": "551133331536",
  "message_text": "Preciso de cotação para 100 rolamentos 6205",
  "message_type": "text",
  "direction": "incoming",
  "timestamp": "2026-01-18T10:30:00Z"
}
```

---

## 🔐 Autenticação

### Em Produção

O webhook utiliza autenticação HMAC-SHA256 para validar que as requisições vêm do SuperBot.

#### Gerando a Assinatura

```javascript
const crypto = require('crypto');

const payload = JSON.stringify(messageData);
const secret = 'superbot-leads-webhook-secret-2026';

const signature = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

// Adicionar header: X-Superbot-Signature: <signature>
```

**Exemplo em Go (para o midd-decisao):**

```go
import (
    "crypto/hmac"
    "crypto/sha256"
    "encoding/hex"
)

func generateSignature(payload []byte, secret string) string {
    h := hmac.New(sha256.New, []byte(secret))
    h.Write(payload)
    return hex.EncodeToString(h.Sum(nil))
}
```

### Variáveis de Ambiente

**No SuperBot (.env):**
```env
LEADS_AGENT_WEBHOOK_URL=http://54.232.49.52:3002/api/superbot/webhook
LEADS_AGENT_WEBHOOK_SECRET=superbot-leads-webhook-secret-2026
```

**No Leads-Agent (.env):**
```env
SUPERBOT_WEBHOOK_SECRET=superbot-leads-webhook-secret-2026
```

---

## 📝 Resposta do Webhook

### Sucesso

```json
{
  "success": true,
  "data": {
    "message_id": "WAB-MSG-20260118-001234",
    "sender_phone": "5511999999999",
    "analysis": {
      "intent": "QUOTE_REQUEST",
      "confidence": 0.92,
      "sentiment": "neutral",
      "urgency": "medium",
      "entities": {
        "products": [
          {"query": "rolamentos 6205", "quantity": 100}
        ]
      },
      "summary": "Cliente solicita cotação para 100 rolamentos 6205"
    },
    "lead_created": {
      "success": true,
      "lead_id": 12345,
      "products_added": 1
    }
  }
}
```

### Erro

```json
{
  "success": false,
  "error": "Payload inválido"
}
```

---

## 🔧 Configuração no midd-decisao

### 1. Adicionar Configuração

Em `midds/midd-decisao/config.yaml`, adicionar:

```yaml
leads_agent:
  webhook_url: "${LEADS_AGENT_WEBHOOK_URL}"
  webhook_secret: "${LEADS_AGENT_WEBHOOK_SECRET}"
  enabled: true
  timeout_ms: 5000
  retry_count: 3
```

### 2. Adicionar Código de Integração

Em `midds/midd-decisao/src/integrations.go`, adicionar função:

```go
import (
    "bytes"
    "crypto/hmac"
    "crypto/sha256"
    "encoding/hex"
    "encoding/json"
    "net/http"
    "os"
    "time"
)

// LeadsAgentWebhook estrutura para configuração do webhook
type LeadsAgentWebhook struct {
    URL     string
    Secret  string
    Timeout time.Duration
}

// NewLeadsAgentWebhook cria uma nova instância do webhook
func NewLeadsAgentWebhook() *LeadsAgentWebhook {
    return &LeadsAgentWebhook{
        URL:     os.Getenv("LEADS_AGENT_WEBHOOK_URL"),
        Secret:  os.Getenv("LEADS_AGENT_WEBHOOK_SECRET"),
        Timeout: 5 * time.Second,
    }
}

// SendToLeadsAgent envia a mensagem para o leads-agent
func (law *LeadsAgentWebhook) SendToLeadsAgent(msg Message) error {
    if law.URL == "" {
        return nil // Webhook não configurado
    }

    // Criar payload
    payload := map[string]interface{}{
        "message_id":      msg.MessageID,
        "session_id":      msg.SessionID,
        "sender_phone":    msg.SenderPhone,
        "recipient_phone": msg.RecipientPhone,
        "message_text":    msg.Content,
        "message_type":    msg.Type,
        "direction":       "incoming",
        "timestamp":       time.Now().Format(time.RFC3339),
    }

    jsonPayload, err := json.Marshal(payload)
    if err != nil {
        return err
    }

    // Gerar assinatura
    signature := law.generateSignature(jsonPayload)

    // Fazer requisição
    client := &http.Client{Timeout: law.Timeout}
    req, err := http.NewRequest("POST", law.URL, bytes.NewBuffer(jsonPayload))
    if err != nil {
        return err
    }

    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("X-Superbot-Signature", signature)

    resp, err := client.Do(req)
    if err != nil {
        return err
    }
    defer resp.Body.Close()

    if resp.StatusCode >= 400 {
        return fmt.Errorf("webhook returned status %d", resp.StatusCode)
    }

    return nil
}

func (law *LeadsAgentWebhook) generateSignature(payload []byte) string {
    h := hmac.New(sha256.New, []byte(law.Secret))
    h.Write(payload)
    return hex.EncodeToString(h.Sum(nil))
}
```

### 3. Chamar Webhook no Fluxo de Processamento

No `main.go`, adicionar chamada ao processar mensagem:

```go
// Após processar a mensagem
go func() {
    if err := leadsWebhook.SendToLeadsAgent(msg); err != nil {
        log.Printf("Erro ao enviar para leads-agent: %v", err)
    }
}()
```

---

## 🧪 Testando o Webhook

### Usando cURL

```bash
curl -X POST http://54.232.49.52:3002/api/superbot/webhook \
  -H "Content-Type: application/json" \
  -H "X-Superbot-Signature: $(echo -n '{"message_id":"test-123","session_id":"sess-456","sender_phone":"5511999999999","message_text":"Preciso de cotação para 50 rolamentos 6205","direction":"incoming"}' | openssl dgst -sha256 -hmac 'superbot-leads-webhook-secret-2026' | cut -d' ' -f2)" \
  -d '{
    "message_id": "test-123",
    "session_id": "sess-456",
    "sender_phone": "5511999999999",
    "message_text": "Preciso de cotação para 50 rolamentos 6205",
    "direction": "incoming"
  }'
```

### Usando o Endpoint de Teste (Autenticado)

```bash
# Obter token
TOKEN=$(curl -s -X POST http://54.232.49.52:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.token')

# Testar webhook
curl -X POST http://54.232.49.52:3002/api/superbot/webhook/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "message_text": "Preciso de cotação para 50 rolamentos 6205",
    "sender_phone": "5511999999999"
  }'
```

---

## 📊 Monitoramento

### Verificar Status do Webhook

```bash
curl http://54.232.49.52:3002/api/superbot/webhook/status \
  -H "Authorization: Bearer $TOKEN"
```

Resposta:
```json
{
  "success": true,
  "data": {
    "queue_size": 0,
    "auto_create_leads": true,
    "min_confidence": 0.7,
    "debounce_ms": 5000,
    "ai_configured": true,
    "webhook_url": "http://54.232.49.52:3002/api/superbot/webhook",
    "status": "active"
  }
}
```

---

## 🔄 Fluxo de Integração Completo

1. **Cliente envia mensagem** no WhatsApp
2. **midd-bot** recebe e encaminha para **midd-decisao**
3. **midd-decisao** processa e chama webhook do **leads-agent**
4. **leads-agent** analisa intenção com **OpenAI**
5. Se detectar intenção de compra:
   - Cria lead automaticamente
   - Adiciona produtos ao carrinho
   - Notifica vendedor responsável
6. **leads-agent** retorna resultado ao **midd-decisao**
7. Opcionalmente, **midd-decisao** pode usar o resultado para personalizar resposta

---

## 📞 Suporte

Em caso de dúvidas sobre a integração:
- **Equipe leads-agent**: robson@vallery.com.br
- **Equipe SuperBot**: ti@rolemak.com.br

---

*Última atualização: 18 de Janeiro de 2026*
