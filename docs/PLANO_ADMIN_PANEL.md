# 🛠️ Plano do Painel Administrativo - Leads Agent

## 📋 Visão Geral

O painel administrativo será uma área restrita para gerentes (level ≥ 5) e administradores (level = 6) do sistema Leads Agent. Ele centralizará todas as configurações, gestão de usuários, monitoramento e ferramentas avançadas.

---

## 🎯 Objetivos

1. **Centralizar configurações** do sistema em um único local
2. **Gerenciar usuários** e permissões de acesso
3. **Monitorar** atividades e performance do sistema
4. **Configurar** integrações (WhatsApp, Chatbot, Webhooks)
5. **Auditar** ações e logs do sistema

---

## 📐 Arquitetura Proposta

```
/admin                          → Dashboard Admin
├── /users                      → Gestão de Usuários
│   ├── /new                    → Criar Usuário
│   └── /:id/edit               → Editar Usuário
├── /permissions                → Níveis e Permissões
├── /teams                      → Equipes de Vendas
├── /seller-phones              → Vinculação Vendedor ↔ Telefone
├── /whatsapp                   → Config WhatsApp/Superbot
│   ├── /webhook                → Status Webhook
│   ├── /chatbot                → Config Chatbot IA
│   └── /templates              → Templates de Mensagem
├── /integrations               → Integrações Externas
│   ├── /api-keys               → Chaves de API
│   └── /webhooks               → Webhooks de Saída
├── /logs                       → Logs do Sistema
│   ├── /audit                  → Auditoria de Ações
│   ├── /errors                 → Erros e Exceções
│   └── /api                    → Requisições API
├── /system                     → Configurações do Sistema
│   ├── /cache                  → Gestão de Cache
│   ├── /jobs                   → Jobs em Background
│   └── /health                 → Health Check
└── /reports                    → Relatórios Gerenciais
```

---

## 🖥️ Módulos Detalhados

### 1. 👥 Gestão de Usuários (`/admin/users`)

**Funcionalidades:**
- Listar todos usuários com filtros
- Criar novo usuário
- Editar usuário existente
- Desativar/reativar usuário
- Resetar senha
- Ver histórico de login

**Campos do Usuário:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | int | ID único |
| user | string | Login |
| nick | string | Nome de exibição |
| email | string | Email |
| level | int | Nível de acesso (1-6) |
| depto | string | Departamento |
| team_id | int | Equipe |
| active | bool | Ativo/Inativo |
| created_at | datetime | Data de criação |
| last_login | datetime | Último acesso |

**Níveis de Acesso:**
| Level | Descrição | Acessos |
|-------|-----------|---------|
| 1 | Vendedor Júnior | Leads próprios, WhatsApp filtrado |
| 2 | Vendedor Pleno | Leads próprios, WhatsApp filtrado |
| 3 | Vendedor Sênior | Leads próprios + equipe, WhatsApp filtrado |
| 4 | Supervisor | Todos leads, Analytics básico |
| 5 | Gerente | Tudo + Metas + Relatórios |
| 6 | Administrador | Tudo + Admin Panel |

---

### 2. 📞 Vinculação Vendedor ↔ Telefone (`/admin/seller-phones`)

**Funcionalidades:**
- Listar vinculações ativas
- Vincular telefone a vendedor
- Remover vinculação
- Ver histórico de conversas por telefone
- Transferir telefone entre vendedores

**Tabela `seller_phones`:**
```sql
CREATE TABLE seller_phones (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,           -- FK para mak.users
  phone_number VARCHAR(20) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT,
  UNIQUE KEY (phone_number)
);
```

**Interface:**
- DataGrid com vendedores e seus telefones
- Drag & Drop para transferir telefones
- Bulk actions para múltiplas vinculações
- Indicador de telefones sem vendedor

---

### 3. 🤖 Configuração do Chatbot (`/admin/whatsapp/chatbot`)

**Funcionalidades:**
- Ativar/Desativar chatbot globalmente
- Configurar respostas automáticas
- Gerenciar intenções e respostas
- Definir horário de funcionamento
- Configurar fallback humano

**Configurações:**
```yaml
chatbot:
  enabled: true
  working_hours:
    start: "08:00"
    end: "18:00"
    timezone: "America/Sao_Paulo"
  auto_reply:
    greeting: "Olá! Sou o assistente virtual da Rolemak..."
    away: "Nosso horário de atendimento é..."
  ai:
    model: "gpt-4o-mini"
    temperature: 0.7
    max_tokens: 500
  escalation:
    keywords: ["gerente", "humano", "reclamação"]
    max_attempts: 3
```

---

### 4. 📊 Dashboard Admin (`/admin`)

**Métricas em Tempo Real:**
- Usuários online
- Leads criados hoje
- Conversas WhatsApp ativas
- Taxa de resposta do chatbot
- Erros nas últimas 24h

**Cards:**
```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ 👥 12 Online    │ 📝 47 Leads     │ 💬 128 Convs    │ ⚠️ 3 Erros     │
│ +2 vs ontem     │ +15% vs ontem   │ 89% respondidas │ -5 vs ontem     │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

**Gráficos:**
- Timeline de atividades
- Performance por vendedor
- Uso do chatbot
- Health do sistema

---

### 5. 📋 Logs e Auditoria (`/admin/logs`)

**Tipos de Log:**
| Tipo | Descrição | Retenção |
|------|-----------|----------|
| audit | Ações de usuários | 90 dias |
| error | Erros e exceções | 30 dias |
| api | Requisições API | 7 dias |
| security | Login/Logout | 365 dias |

**Campos do Log de Auditoria:**
```json
{
  "id": "uuid",
  "timestamp": "2026-01-18T19:30:00Z",
  "user_id": 1,
  "action": "LEAD_CREATE",
  "entity": "leads",
  "entity_id": 12345,
  "changes": {
    "before": null,
    "after": { "status": "novo" }
  },
  "ip": "192.168.1.1",
  "user_agent": "Chrome/120"
}
```

---

### 6. 🔗 Integrações (`/admin/integrations`)

**APIs Configuráveis:**
| Integração | Descrição | Status |
|------------|-----------|--------|
| Superbot | WhatsApp Business | ✅ Ativo |
| C-Suite | Agentes IA | ✅ Ativo |
| OpenAI | ChatGPT/GPT-4 | ✅ Ativo |
| Google Cloud | Speech-to-Text | 🔄 Opcional |
| Slack | Notificações | 🔄 Opcional |

**Webhooks de Saída:**
- Novo lead criado
- Lead convertido
- Mensagem WhatsApp recebida
- Chatbot escalou para humano

---

### 7. ⚙️ Configurações do Sistema (`/admin/system`)

**Cache:**
- Limpar cache Redis
- Ver estatísticas de cache
- Configurar TTL

**Jobs:**
- Fila de jobs pendentes
- Jobs falhados
- Retry manual
- Histórico de execução

**Health Check:**
```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "up", "latency": "5ms" },
    "redis": { "status": "up", "latency": "1ms" },
    "superbot": { "status": "up", "latency": "120ms" },
    "openai": { "status": "up", "latency": "450ms" }
  },
  "uptime": "45d 12h 34m"
}
```

---

## 🗂️ Estrutura de Arquivos

```
frontend/src/
├── pages/
│   └── admin/
│       ├── AdminDashboard.jsx        # Dashboard principal
│       ├── UsersPage.jsx             # Lista de usuários
│       ├── UserFormPage.jsx          # Criar/Editar usuário
│       ├── SellerPhonesPage.jsx      # Vinculação telefones
│       ├── ChatbotConfigPage.jsx     # Config chatbot
│       ├── WebhookStatusPage.jsx     # Status webhook
│       ├── IntegrationsPage.jsx      # Integrações
│       ├── LogsPage.jsx              # Logs/Auditoria
│       └── SystemPage.jsx            # Config sistema
│
├── components/
│   └── admin/
│       ├── AdminLayout.jsx           # Layout com sidebar admin
│       ├── UserTable.jsx             # Tabela de usuários
│       ├── PhoneAssignmentCard.jsx   # Card vinculação
│       ├── ChatbotSettings.jsx       # Form chatbot
│       ├── LogViewer.jsx             # Visualizador de logs
│       ├── HealthStatus.jsx          # Status do sistema
│       └── MetricsCards.jsx          # Cards de métricas
│
└── services/
    └── admin.service.js              # API do admin
```

```
backend/src/
├── controllers/
│   └── admin.controller.js           # Controller admin
│
├── routes/
│   └── admin.routes.js               # Rotas /api/admin/*
│
├── services/
│   ├── admin.service.js              # Lógica de negócio
│   └── audit.service.js              # Auditoria
│
├── repositories/
│   ├── user.repository.js            # CRUD usuários
│   └── audit.repository.js           # Logs
│
└── middleware/
    └── adminAuth.js                  # Level >= 5 required
```

---

## 🔐 Segurança

### Middleware de Autenticação Admin
```javascript
const requireAdmin = (req, res, next) => {
  const userLevel = req.user?.level || 0
  
  if (userLevel < 5) {
    return res.status(403).json({
      success: false,
      error: 'Acesso negado. Nível de administrador necessário.'
    })
  }
  
  next()
}

// Para ações críticas (level 6 apenas)
const requireSuperAdmin = (req, res, next) => {
  if (req.user?.level !== 6) {
    return res.status(403).json({
      success: false,
      error: 'Acesso negado. Apenas administradores level 6.'
    })
  }
  next()
}
```

### Ações por Nível
| Ação | Level 5 | Level 6 |
|------|---------|---------|
| Ver usuários | ✅ | ✅ |
| Criar usuário | ✅ | ✅ |
| Editar usuário | ✅ | ✅ |
| Deletar usuário | ❌ | ✅ |
| Ver logs | ✅ | ✅ |
| Limpar logs | ❌ | ✅ |
| Config sistema | ❌ | ✅ |
| Gerenciar integrações | ❌ | ✅ |

---

## 📅 Roadmap de Implementação

### Fase 1 - Básico (1-2 semanas)
- [ ] Rota `/admin` com proteção de acesso
- [ ] Dashboard com métricas básicas
- [ ] Listagem de usuários
- [ ] Vinculação vendedor ↔ telefone

### Fase 2 - Gestão (2-3 semanas)
- [ ] CRUD completo de usuários
- [ ] Gestão de equipes
- [ ] Configuração do chatbot
- [ ] Status do webhook

### Fase 3 - Monitoramento (1-2 semanas)
- [ ] Sistema de logs/auditoria
- [ ] Health check dashboard
- [ ] Alertas automáticos

### Fase 4 - Avançado (2-3 semanas)
- [ ] Gestão de integrações
- [ ] Webhooks de saída
- [ ] Backup/Restore
- [ ] Relatórios personalizados

---

## 🎨 Design UI/UX

### Paleta de Cores Admin
```css
:root {
  --admin-primary: #1a237e;      /* Azul escuro */
  --admin-secondary: #5c6bc0;    /* Azul médio */
  --admin-accent: #ff5722;       /* Laranja (alertas) */
  --admin-success: #4caf50;      /* Verde */
  --admin-warning: #ff9800;      /* Amarelo */
  --admin-danger: #f44336;       /* Vermelho */
  --admin-bg: #f5f5f5;           /* Cinza claro */
  --admin-sidebar: #263238;      /* Cinza escuro */
}
```

### Layout
- Sidebar fixa à esquerda (260px)
- Header com breadcrumbs
- Área de conteúdo responsiva
- Notificações toast no canto

---

## 📊 Métricas de Sucesso

| Métrica | Meta |
|---------|------|
| Tempo de carregamento | < 2s |
| Usuários ativos/dia | 10+ admins |
| Erros não tratados | < 1% |
| Uptime do sistema | 99.5% |
| Satisfação do admin | NPS > 8 |

---

## 🚀 Próximos Passos

1. **Aprovar escopo** com stakeholders
2. **Criar branch** `feature/admin-panel`
3. **Implementar Fase 1** (2 semanas)
4. **Review e testes** internos
5. **Deploy para staging**
6. **Treinamento** equipe de gestão
7. **Go-live** em produção

---

*Documento criado em: 2026-01-18*
*Autor: Claude AI Assistant*
*Versão: 1.0*
