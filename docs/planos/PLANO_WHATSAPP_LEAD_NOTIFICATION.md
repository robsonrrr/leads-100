# Plano: Envio de WhatsApp Manual na Página do Lead

## Objetivo
Adicionar um botão na página de detalhes do lead para enviar mensagem WhatsApp para o cliente, usando o telefone do vendedor como remetente.

## Data de Criação
2026-01-21

---

## 1. Visão Geral

### 1.1 Fluxo Principal
```
[Vendedor abre Lead] 
       ↓
[Backend busca WhatsApp do cliente na view superbot]
       ↓
[Se encontrou: botão ativo | Se não: botão inativo]
       ↓
[Clica no botão "WhatsApp"]
       ↓
[Modal abre com preview da mensagem]
       ↓
[Vendedor confirma envio]
       ↓
[Backend envia via API WhatsApp]
       ↓
[Cliente recebe mensagem]
```

### 1.2 API WhatsApp (Destino)
```bash
POST https://dev.whatsapp.internut.com.br/api/sessions/{{seller_phone}}/send
Headers:
  - Content-Type: application/json
  - Authorization: Bearer {{WHATSAPP_API_TOKEN}}
Body:
{
    "to": "{{customer_phone}}",      # Telefone do cliente (formato: 55DDDNUMERO)
    "image": "{{image_url}}",        # Opcional - URL da imagem
    "message": "{{text}}"            # Texto da mensagem
}
```

---

## 2. Busca do Telefone WhatsApp do Cliente

### 2.1 View de Origem
```sql
SELECT superbot_phone 
FROM superbot.vw_superbot_leads_customers 
WHERE leads_customer_id = ?
```

### 2.2 Estrutura da View
| Campo | Descrição |
|-------|-----------|
| `leads_customer_id` | ID do cliente no leads-agent (cCliente) |
| `superbot_phone` | Telefone WhatsApp do cliente |
| `superbot_name` | Nome do cliente no WhatsApp |
| `link_status` | Status: `verified`, `linked`, `unlinked` |

### 2.3 Lógica do Botão
```
SE superbot_phone existe:
   → Botão ATIVO (verde)
SENÃO:
   → Botão INATIVO (cinza) com tooltip "Cliente sem WhatsApp vinculado"
```

---

## 3. Local do Botão

### 3.1 Arquivo
`frontend/src/pages/LeadDetailPage.jsx`

### 3.2 Posição
**Linha ~659** - Entre o botão "Enviar" (Email) e "Interação"

### 3.3 Estrutura Atual vs Proposta
```
ATUAL:   [Editar] [Imprimir] [Enviar Email] [Interação] [Converter] [Excluir]

PROPOSTA: [Editar] [Imprimir] [Enviar Email] [📱 WhatsApp] [Interação] [Converter] [Excluir]
```

### 3.4 Código do Botão
```jsx
<Button
  variant="contained"
  startIcon={<WhatsAppIcon />}
  onClick={() => setWhatsAppDialogOpen(true)}
  disabled={!customerWhatsApp}  // Desabilitado se não tem WhatsApp
  title={customerWhatsApp 
    ? `Enviar para ${customerWhatsApp}` 
    : 'Cliente sem WhatsApp vinculado'}
  sx={{
    bgcolor: customerWhatsApp ? '#25D366' : 'rgba(255,255,255,0.1)',
    color: 'white',
    '&:hover': { bgcolor: '#128C7E' },
    '&.Mui-disabled': { 
      bgcolor: 'rgba(255, 255, 255, 0.1)', 
      color: 'rgba(255, 255, 255, 0.5)' 
    }
  }}
>
  WhatsApp
</Button>
```

---

## 4. Componentes a Implementar

### 4.1 Backend

#### A. Repository: Buscar WhatsApp do Cliente
**Arquivo:** `repositories/customer.repository.js`

```javascript
/**
 * Busca telefone WhatsApp do cliente via view superbot
 * @param {number} customerId - ID do cliente (mak.clientes.id)
 * @returns {object|null} { phone, name, link_status }
 */
export async function getCustomerWhatsApp(customerId) {
  const [rows] = await db().execute(`
    SELECT 
      superbot_phone as phone,
      superbot_name as name,
      link_status
    FROM superbot.vw_superbot_leads_customers 
    WHERE leads_customer_id = ?
    LIMIT 1
  `, [customerId]);
  
  return rows[0] || null;
}
```

#### B. Incluir WhatsApp na resposta do Lead
**Arquivo:** `controllers/lead.controller.js` (método getById)

```javascript
// Após buscar o lead, adicionar info do WhatsApp
if (lead.customerId) {
  const whatsappInfo = await customerRepository.getCustomerWhatsApp(lead.customerId);
  lead.customerWhatsApp = whatsappInfo;  // { phone, name, link_status } ou null
}
```

#### C. Rota de Envio
**Arquivo:** `routes/leads.routes.js`
```javascript
router.post('/:id/whatsapp', authenticateToken, leadController.sendWhatsApp);
```

#### D. Controller de Envio
**Arquivo:** `controllers/lead.controller.js`
```javascript
export async function sendWhatsApp(req, res, next) {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const sellerId = req.user.id;
    
    // Buscar lead com dados do cliente
    const lead = await leadRepository.findById(id);
    if (!lead) {
      return res.status(404).json({ success: false, error: { message: 'Lead não encontrado' } });
    }
    
    // Buscar telefone WhatsApp do cliente
    const whatsappInfo = await customerRepository.getCustomerWhatsApp(lead.customerId);
    if (!whatsappInfo?.phone) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'Cliente sem WhatsApp vinculado' } 
      });
    }
    
    // Buscar telefone do vendedor
    const sellerPhone = await sellerRepository.getWhatsAppPhone(sellerId);
    if (!sellerPhone) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'Telefone WhatsApp do vendedor não configurado' } 
      });
    }
    
    // Enviar via serviço WhatsApp
    const result = await whatsAppService.sendMessage({
      sellerPhone,
      customerPhone: whatsappInfo.phone,
      message,
      leadId: id
    });
    
    // Registrar interação
    await interactionRepository.create({
      customerId: lead.customerId,
      type: 'whatsapp',
      description: `WhatsApp enviado: ${message.substring(0, 100)}...`,
      sellerId
    });
    
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
```

#### E. Serviço WhatsApp (NOVO)
**Arquivo:** `services/whatsapp.service.js`
```javascript
import axios from 'axios';
import logger from '../config/logger.js';

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://dev.whatsapp.internut.com.br/api';
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;

export async function sendMessage({ sellerPhone, customerPhone, message, imageUrl = null }) {
  const formattedPhone = formatPhone(customerPhone);
  const url = `${WHATSAPP_API_URL}/sessions/${sellerPhone}/send`;
  
  const payload = {
    to: formattedPhone,
    message,
    ...(imageUrl && { image: imageUrl })
  };
  
  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`
      },
      timeout: 30000
    });
    
    logger.info('WhatsApp message sent', { sellerPhone, to: formattedPhone });
    return response.data;
  } catch (error) {
    logger.error('WhatsApp send failed', { 
      error: error.message, 
      sellerPhone, 
      to: formattedPhone 
    });
    throw error;
  }
}

function formatPhone(phone) {
  if (!phone) return null;
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  return cleaned;
}

export default { sendMessage };
```

### 4.2 Frontend

#### A. Estado no LeadDetailPage.jsx
```jsx
// Adicionar aos estados (linha ~85)
const [whatsAppDialogOpen, setWhatsAppDialogOpen] = useState(false)
const [whatsAppMessage, setWhatsAppMessage] = useState('')
const [sendingWhatsApp, setSendingWhatsApp] = useState(false)

// customerWhatsApp virá do lead.customerWhatsApp (retornado pelo backend)
const customerWhatsApp = lead?.customerWhatsApp?.phone
```

#### B. Função de Envio
```jsx
const handleSendWhatsApp = async () => {
  setSendingWhatsApp(true)
  try {
    const response = await leadsService.sendWhatsApp(lead.id, {
      message: whatsAppMessage
    })
    
    if (response.data.success) {
      toast.success('Mensagem WhatsApp enviada com sucesso!')
      setWhatsAppDialogOpen(false)
      setWhatsAppMessage('')
    }
  } catch (err) {
    toast.error(err.response?.data?.error?.message || 'Erro ao enviar WhatsApp')
  } finally {
    setSendingWhatsApp(false)
  }
}
```

#### C. Modal de Confirmação
```jsx
{/* WhatsApp Dialog */}
<Dialog 
  open={whatsAppDialogOpen} 
  onClose={() => setWhatsAppDialogOpen(false)}
  maxWidth="sm"
  fullWidth
>
  <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <WhatsAppIcon sx={{ color: '#25D366' }} />
    Enviar WhatsApp
  </DialogTitle>
  <DialogContent>
    <Alert severity="info" sx={{ mb: 2 }}>
      Enviando para: <strong>{lead?.customerWhatsApp?.phone}</strong>
      {lead?.customerWhatsApp?.name && ` (${lead.customerWhatsApp.name})`}
    </Alert>
    
    <TextField
      fullWidth
      multiline
      rows={6}
      label="Mensagem"
      value={whatsAppMessage}
      onChange={(e) => setWhatsAppMessage(e.target.value)}
      placeholder="Digite sua mensagem..."
      sx={{ mt: 1 }}
    />
    
    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
      Lead #{lead.id} | Cliente: {lead.customer?.nome}
    </Typography>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setWhatsAppDialogOpen(false)}>
      Cancelar
    </Button>
    <Button 
      variant="contained"
      onClick={handleSendWhatsApp}
      disabled={sendingWhatsApp || !whatsAppMessage.trim()}
      startIcon={sendingWhatsApp ? <CircularProgress size={16} /> : <WhatsAppIcon />}
      sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#128C7E' } }}
    >
      {sendingWhatsApp ? 'Enviando...' : 'Enviar'}
    </Button>
  </DialogActions>
</Dialog>
```

#### D. API Service no Frontend
**Arquivo:** `services/api.js`
```javascript
// Adicionar ao leadsService
sendWhatsApp: (leadId, data) => api.post(`/leads/${leadId}/whatsapp`, data),
```

---

## 5. Variáveis de Ambiente

### Backend (.env)
```env
WHATSAPP_API_URL=https://dev.whatsapp.internut.com.br/api
WHATSAPP_API_TOKEN=eyJleHAiOm51bGwsImlhdCI6MTc2MzEzOTIxN30=._hZpGdoBiAEICKh3gpF9CrGyxWplwNOuKU_D_IgxAG4=
```

---

## 6. Checklist de Implementação

### Fase 1: Backend - Busca WhatsApp
- [x] Adicionar `getCustomerWhatsApp()` em `customer.repository.js`
- [x] Modificar `getById` do lead para incluir `customerWhatsApp`

### Fase 2: Backend - Envio
- [x] Criar `services/whatsapp.service.js`
- [x] Adicionar rota POST `/leads/:id/whatsapp`
- [x] Implementar controller `sendWhatsApp`
- [x] Adicionar variáveis de ambiente (WHATSAPP_API_URL, WHATSAPP_API_TOKEN)
- [ ] Testar envio via curl

### Fase 3: Frontend
- [x] Adicionar estados para WhatsApp dialog
- [x] Adicionar botão WhatsApp na barra de ações (linha ~659)
- [x] Implementar lógica de botão ativo/inativo baseado em `customerWhatsApp`
- [x] Implementar modal de confirmação
- [x] Implementar função `handleSendWhatsApp`
- [x] Adicionar `sendWhatsApp` ao `leadsService`
- [ ] Testar fluxo completo

---

## 7. Estimativa de Tempo

| Fase | Descrição | Tempo |
|------|-----------|-------|
| 1 | Backend - Busca WhatsApp | 20 min |
| 2 | Backend - Envio | 30 min |
| 3 | Frontend | 45 min |
| 4 | Testes | 15 min |
| **Total** | | **~2 horas** |

---

## 8. Preview Visual

### Botão Ativo (cliente com WhatsApp)
```
[📱 WhatsApp]  ← Verde (#25D366)
```

### Botão Inativo (cliente sem WhatsApp)
```
[📱 WhatsApp]  ← Cinza, desabilitado
    ↑
    Tooltip: "Cliente sem WhatsApp vinculado"
```

### Modal
```
┌─────────────────────────────────────────┐
│  📱 Enviar WhatsApp                     │
├─────────────────────────────────────────┤
│  ℹ️ Enviando para: +55 11 99999-9999    │
│     (João da Silva)                     │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ Digite sua mensagem...              ││
│  │                                     ││
│  └─────────────────────────────────────┘│
│                                         │
│  Lead #123456 | Cliente: XYZ Ltda       │
│                                         │
│              [Cancelar]  [📱 Enviar]    │
└─────────────────────────────────────────┘
```

