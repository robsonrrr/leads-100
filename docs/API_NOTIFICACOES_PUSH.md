# 📨 API de Notificações Push - Leads Agent

## Visão Geral

Este documento descreve como enviar mensagens/notificações push para os usuários do Leads Agent a partir de sistemas externos.

---

## 🔐 Autenticação

As APIs de envio externo requerem uma das seguintes formas de autenticação:

### Opção 1: API Key (Recomendada para sistemas externos)

```bash
curl -X POST https://leads.internut.com.br/api/notifications/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: rolemak-leads-agent-2026" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{ ... }'
```

### Opção 2: JWT com nível admin (level >= 5)

Se o usuário autenticado tem nível admin, não precisa da API Key.

---

## 📬 Endpoints Disponíveis

### 1. Enviar para um usuário específico

**POST** `/api/notifications/send`

```json
{
  "userId": 107,
  "title": "🎉 Novo Lead Criado",
  "body": "O cliente João Silva criou um novo lead de máquinas.",
  "url": "/leads/12345",
  "category": "ORDER"
}
```

**Parâmetros:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `userId` | integer | ✅ | ID do usuário destinatário |
| `title` | string | ✅ | Título da notificação |
| `body` | string | ✅ | Corpo da mensagem |
| `url` | string | ❌ | URL para abrir ao clicar (default: "/") |
| `category` | string | ❌ | Categoria (ver lista abaixo) |
| `icon` | string | ❌ | URL do ícone personalizado |

**Categorias disponíveis:**
- `FOLLOW_UP` - Follow-ups pendentes
- `CHURN` - Alertas de risco de churn
- `GOAL` - Metas e objetivos
- `ORDER` - Pedidos e conversões
- `EXCEPTION` - Exceções de preço
- `GENERAL` - Geral (default)

**Resposta:**

```json
{
  "success": true,
  "data": {
    "sent": true
  }
}
```

---

### 2. Enviar usando template

**POST** `/api/notifications/send-template`

```json
{
  "userId": 107,
  "templateName": "FOLLOW_UP_TOMORROW",
  "variables": {
    "customer_name": "João Silva",
    "follow_up_date": "17/01/2026"
  }
}
```

**Templates disponíveis:** (verificar tabela `staging.notification_templates`)

---

### 3. Broadcast (todos os usuários)

**POST** `/api/notifications/broadcast`

```json
{
  "title": "📢 Manutenção Programada",
  "body": "O sistema ficará indisponível das 22h às 23h para manutenção.",
  "url": "/",
  "category": "GENERAL"
}
```

**Resposta:**

```json
{
  "success": true,
  "data": {
    "totalUsers": 15,
    "results": [
      { "userId": 1, "sent": true },
      { "userId": 2, "sent": true },
      { "userId": 3, "sent": false, "reason": "no_subscription" }
    ]
  }
}
```

---

## 🐍 Exemplos de Integração

### Python

```python
import requests

API_URL = "https://leads.internut.com.br/api/notifications/send"
API_KEY = "rolemak-leads-agent-2026"
JWT_TOKEN = "seu_jwt_token"  # Obter via login

def send_notification(user_id: int, title: str, body: str, url: str = "/"):
    response = requests.post(
        API_URL,
        headers={
            "Content-Type": "application/json",
            "X-API-Key": API_KEY,
            "Authorization": f"Bearer {JWT_TOKEN}"
        },
        json={
            "userId": user_id,
            "title": title,
            "body": body,
            "url": url,
            "category": "GENERAL"
        }
    )
    return response.json()

# Exemplo de uso
result = send_notification(
    user_id=107,
    title="🔔 Nova Venda!",
    body="Você vendeu 5 máquinas para Cliente XYZ",
    url="/leads/12345"
)
print(result)
```

### Shell/cURL

```bash
#!/bin/bash

API_KEY="rolemak-leads-agent-2026"
JWT_TOKEN="seu_jwt_token"
BASE_URL="https://leads.internut.com.br"

# Enviar notificação para usuário 107
curl -X POST "$BASE_URL/api/notifications/send" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "userId": 107,
    "title": "🎯 Meta Atingida!",
    "body": "Parabéns! Você atingiu 80% da meta do mês.",
    "url": "/metas-por-cliente"
  }'
```

### Node.js

```javascript
const axios = require('axios');

const API_URL = 'https://leads.internut.com.br/api/notifications/send';
const API_KEY = 'rolemak-leads-agent-2026';
const JWT_TOKEN = 'seu_jwt_token';

async function sendNotification(userId, title, body, url = '/') {
    const response = await axios.post(API_URL, {
        userId,
        title,
        body,
        url,
        category: 'GENERAL'
    }, {
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY,
            'Authorization': `Bearer ${JWT_TOKEN}`
        }
    });
    
    return response.data;
}

// Exemplo de uso
sendNotification(107, '📦 Pedido Enviado!', 'O pedido #12345 foi despachado.')
    .then(console.log)
    .catch(console.error);
```

---

## 🔧 Configuração do Sistema Externo

### 1. Obter JWT Token

Para autenticar nas APIs, você precisa de um JWT token válido:

```bash
curl -X POST https://leads.internut.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "seu_usuario",
    "password": "sua_senha"
  }'
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

### 2. Configurar API Key Personalizada (Produção)

Para maior segurança, defina uma API Key personalizada no ambiente:

```bash
# .env do backend
LEADS_AGENT_API_KEY=sua_chave_secreta_aqui
```

---

## 📊 Verificar Usuários com Push Ativado

Para verificar quais usuários têm push notifications ativadas:

```sql
SELECT DISTINCT user_id 
FROM staging.push_subscriptions;
```

---

## ⚠️ Notas Importantes

1. **Subscriptions expiram**: Se o usuário não acessar o app por muito tempo, a subscription pode expirar. O sistema remove automaticamente subscriptions inválidas.

2. **Preferências do usuário**: Mesmo que você envie uma notificação, ela pode não ser entregue se o usuário desativou aquela categoria nas preferências.

3. **Rate limiting**: Evite enviar muitas notificações seguidas para o mesmo usuário.

4. **Horário**: Considere o horário ao enviar notificações - evite madrugadas.

---

## 📍 URLs do Sistema

| Ambiente | URL |
|----------|-----|
| Produção | https://leads.internut.com.br |
| Dev/Local | http://18.229.23.153:3001 |

---

## 🆘 Suporte

Em caso de problemas:
1. Verifique se o usuário tem subscription ativa
2. Verifique as preferências do usuário
3. Consulte os logs: `tail -f /tmp/leads-agent-backend.log`
