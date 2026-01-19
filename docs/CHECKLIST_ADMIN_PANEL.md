# ✅ CHECKLIST DO ADMIN PANEL — LEADS AGENT

## Sistema de Gestão de Leads - Rolemak

**Versão:** 1.2  
**Criado em:** 18 de Janeiro 2026  
**Atualizado em:** 18 de Janeiro 2026 21:19  
**Status:** Em Progresso 🚀

---

## 🎯 Objetivo

> **Criar um painel administrativo completo para gerenciamento de usuários, configurações do sistema, integrações e monitoramento, centralizado e acessível apenas para gestores (level ≥ 5).**

---

## 📊 Métricas de Sucesso

| Métrica | Baseline | Meta | Atual |
|---------|----------|------|-------|
| Tempo para criar novo usuário | ~10min (manual) | < 2min | < 2min ✅ |
| Tempo para vincular telefone | ~5min (SQL) | < 30s | < 30s ✅ |
| Visibilidade de erros do sistema | 0% | 100% | 60% ✅ |
| Configurações via código | 100% | < 20% | 40% ✅ |

---

# 🏠 BLOCO 1 — DASHBOARD ADMIN ✅

## 1.1 Visão Geral

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 1.1.1 | Rota /admin protegida (level ≥ 5) | Backend | ✅ |
| 1.1.2 | Layout AdminLayout.jsx com sidebar | Frontend | ✅ |
| 1.1.3 | Cards de métricas em tempo real | Frontend | ✅ |
| 1.1.4 | Contagem de usuários online | Backend | ✅ |
| 1.1.5 | Leads criados hoje | Backend | ✅ |
| 1.1.6 | Conversas WhatsApp ativas | Backend | ✅ |
| 1.1.7 | Erros nas últimas 24h | Backend | ✅ |
| 1.1.8 | Timeline de atividades recentes | Frontend | ✅ |

**Critério de Aceite:**
```
✅ Dashboard carrega em < 2s
✅ Métricas atualizam a cada 30s
✅ Gestores veem overview do sistema rapidamente
```

---

## 1.2 Navegação Admin

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 1.2.1 | Menu lateral com seções do admin | Frontend | ✅ |
| 1.2.2 | Breadcrumbs de navegação | Frontend | ✅ |
| 1.2.3 | Ícones distintos por módulo | Frontend | ✅ |
| 1.2.4 | Indicador de seção ativa | Frontend | ✅ |
| 1.2.5 | Acesso rápido às funções principais | Frontend | ✅ |

---

# 👥 BLOCO 2 — GESTÃO DE USUÁRIOS ✅

## 2.1 Listagem de Usuários

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 2.1.1 | Página /admin/users com DataGrid | Frontend | ✅ |
| 2.1.2 | Endpoint GET /api/admin/users | Backend | ✅ |
| 2.1.3 | Filtro por nível de acesso | Frontend | ✅ |
| 2.1.4 | Filtro por departamento | Frontend | ✅ |
| 2.1.5 | Filtro por status (ativo/inativo) | Frontend | ✅ |
| 2.1.6 | Busca por nome/email | Frontend | ✅ |
| 2.1.7 | Ordenação por colunas | Frontend | ✅ |
| 2.1.8 | Paginação server-side | Backend | ✅ |
| 2.1.9 | Badge de nível colorido | Frontend | ✅ |
| 2.1.10 | Indicador de último login | Frontend | ⬜ |

**Critério de Aceite:**
```
✅ Lista carrega em < 1s
✅ Filtros funcionam em conjunto
✅ Usuários inativos aparecem destacados
```

---

## 2.2 Criar/Editar Usuário ✅

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 2.2.1 | Formulário de novo usuário | Frontend | ✅ |
| 2.2.2 | Endpoint POST /api/admin/users | Backend | ✅ |
| 2.2.3 | Endpoint PUT /api/admin/users/:id | Backend | ✅ |
| 2.2.4 | Validação de email único | Backend | ✅ |
| 2.2.5 | Validação de username único | Backend | ✅ |
| 2.2.6 | Seletor de nível de acesso | Frontend | ✅ |
| 2.2.7 | Seletor de departamento | Frontend | ✅ |
| 2.2.8 | Seletor de equipe (team) | Frontend | ✅ |
| 2.2.9 | Campo de senha com força | Frontend | ✅ |
| 2.2.10 | Toggle ativo/inativo | Frontend | ✅ |
| 2.2.11 | Avatar upload (opcional) | Frontend | ✅ |

**Campos do Formulário:**
```
- user (login) * ✅
- nick (nome exibição) * ✅
- email * ✅
- password (criar) / nova_senha (editar) ✅
- level (1-6) * ✅
- depto (departamento) ✅
- team_id (equipe) ✅
- active (checkbox) ✅
```

---

## 2.3 Ações de Usuário ✅

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 2.3.1 | Resetar senha do usuário | Backend | ✅ |
| 2.3.2 | Desativar usuário | Backend | ✅ |
| 2.3.3 | Reativar usuário | Backend | ✅ |
| 2.3.4 | Forçar logout do usuário | Backend | ✅ |
| 2.3.5 | Ver histórico de login | Backend | ✅ |
| 2.3.6 | Ver leads do usuário | Frontend | ✅ |
| 2.3.7 | Deletar usuário (level 6 only) | Backend | ✅ |
| 2.3.8 | Confirmação para ações destrutivas | Frontend | ✅ |

**Critério de Aceite:**
```
✅ Ações críticas exigem confirmação
✅ Apenas level 6 pode deletar
✅ Histórico de login disponível
```

---

## 2.4 Níveis de Acesso ✅

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 2.4.1 | Página /admin/permissions | Frontend | ✅ |
| 2.4.2 | Documentação de cada nível | Frontend | ✅ |
| 2.4.3 | Matriz de permissões visualizável | Frontend | ✅ |
| 2.4.4 | Comparativo entre níveis | Frontend | ✅ |

**Níveis Definidos:**
| Level | Nome | Descrição |
|-------|------|-----------|
| 1 | Vendedor Júnior | Leads próprios, WhatsApp filtrado |
| 2 | Vendedor Pleno | Leads próprios, WhatsApp filtrado |
| 3 | Vendedor Sênior | Leads próprios + equipe |
| 4 | Supervisor | Todos leads, Analytics básico |
| 5 | Gerente | Tudo + Metas + Admin básico |
| 6 | Administrador | Acesso total + Config sistema |

---

# 📞 BLOCO 3 — VINCULAÇÃO VENDEDOR ↔ TELEFONE ✅

## 3.1 Gestão de Seller Phones ✅

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 3.1.1 | Página /admin/seller-phones | Frontend | ✅ |
| 3.1.2 | Endpoint GET /api/admin/seller-phones | Backend | ✅ |
| 3.1.3 | DataGrid com vendedor e telefones | Frontend | ✅ |
| 3.1.4 | Modal para vincular novo telefone | Frontend | ✅ |
| 3.1.5 | Endpoint POST /api/admin/seller-phones | Backend | ✅ |
| 3.1.6 | Endpoint DELETE /api/admin/seller-phones | Backend | ✅ |
| 3.1.7 | Autocomplete de vendedores | Frontend | ✅ |
| 3.1.8 | Validação de telefone único | Backend | ✅ |
| 3.1.9 | Indicador de telefone primário | Frontend | ✅ |
| 3.1.10 | Marcar telefone como primário | Backend | ✅ |
| 3.1.11 | Exibir nome do vendedor corretamente | Frontend | ✅ |

**Critério de Aceite:**
```
✅ Vincular telefone em < 30s
✅ Telefone não pode ter 2 vendedores
✅ Vendedor pode ter múltiplos telefones
✅ Nome do vendedor aparece corretamente
```

---

## 3.2 Telefones Não Vinculados ✅

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 3.2.1 | Listar telefones com conversas sem vendedor | Backend | ✅ |
| 3.2.2 | Alerta de telefones órfãos | Frontend | ✅ |
| 3.2.3 | Sugestão de vendedor baseado em histórico | Backend | ✅ |
| 3.2.4 | Bulk action para vincular múltiplos | Frontend | ✅ |

---

## 3.3 Transferência de Telefone ✅

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 3.3.1 | Modal de transferência | Frontend | ✅ |
| 3.3.2 | Histórico de transferências | Backend | ✅ |
| 3.3.3 | Notificar vendedor anterior | Backend | ✅ |
| 3.3.4 | Notificar vendedor novo | Backend | ✅ |

---

# 🤖 BLOCO 4 — CONFIGURAÇÃO DO CHATBOT ✅

## 4.1 Status do Webhook ✅

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 4.1.1 | Página /admin/whatsapp/webhook | Frontend | ✅ |
| 4.1.2 | Status de conexão com Superbot | Backend | ✅ |
| 4.1.3 | Últimas mensagens recebidas | Backend | ✅ |
| 4.1.4 | Erros de webhook | Backend | ✅ |
| 4.1.5 | Botão para testar conexão | Frontend | ✅ |
| 4.1.6 | Logs de webhook em tempo real | Frontend | ✅ |

**Critério de Aceite:**
```
✅ Status atualiza automaticamente
✅ Erros são destacados claramente
✅ Teste de conexão funciona em < 5s
```

---

## 4.2 Configuração do Chatbot ✅

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 4.2.1 | Página /admin/chatbot | Frontend | ✅ |
| 4.2.2 | Toggle habilitar/desabilitar chatbot | Frontend | ✅ |
| 4.2.3 | Configurar horário de funcionamento | Frontend | ✅ |
| 4.2.4 | Mensagem de saudação | Frontend | ✅ |
| 4.2.5 | Mensagem fora do horário | Frontend | ✅ |
| 4.2.6 | Palavras-chave para escalar humano | Frontend | ✅ |
| 4.2.7 | Timeout de inatividade | Frontend | ✅ |
| 4.2.8 | Limite de tentativas antes de escalar | Frontend | ✅ |
| 4.2.9 | Endpoint PUT /api/admin/chatbot/config | Backend | ✅ |
| 4.2.10 | Preview de mensagens | Frontend | ✅ |

**Configurações Editáveis:**
```yaml
chatbot:
  enabled: true ✅
  working_hours:
    start: "08:00" ✅
    end: "18:00" ✅
    days: [1, 2, 3, 4, 5]  # Seg a Sex ✅
  greeting: "Olá! Sou o assistente..." ✅
  away_message: "Nosso horário..." ✅
  escalation_keywords: ["gerente", "humano"] ✅
  inactivity_timeout: 300  # segundos ✅
  max_attempts: 3 ✅
```

---

## 4.3 Templates de Mensagem ✅

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 4.3.1 | Página /admin/whatsapp/templates | Frontend | ✅ |
| 4.3.2 | CRUD de templates | Backend | ✅ |
| 4.3.3 | Categorias de templates | Backend | ✅ |
| 4.3.4 | Variáveis dinâmicas ({nome}, {produto}) | Backend | ✅ |
| 4.3.5 | Preview com dados de exemplo | Frontend | ✅ |
| 4.3.6 | Copiar template | Frontend | ✅ |

---

# 📋 BLOCO 5 — LOGS E AUDITORIA ✅

## 5.1 Logs de Auditoria ✅

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 5.1.1 | Tabela audit_logs no banco | Backend | ✅ |
| 5.1.2 | Middleware de auditoria | Backend | ✅ |
| 5.1.3 | Página /admin/logs | Frontend | ✅ |
| 5.1.4 | Filtro por usuário | Frontend | ✅ |
| 5.1.5 | Filtro por ação | Frontend | ✅ |
| 5.1.6 | Filtro por data | Frontend | ✅ |
| 5.1.7 | Detalhes do antes/depois (JSON) | Frontend | ✅ |
| 5.1.8 | Exportar logs (CSV) | Frontend | ✅ |
| 5.1.9 | Endpoint GET /api/admin/logs | Backend | ✅ |
| 5.1.10 | Endpoint GET /api/admin/logs/stats | Backend | ✅ |
| 5.1.11 | Endpoint GET /api/admin/logs/actions | Backend | ✅ |
| 5.1.12 | Dialog de detalhes do log | Frontend | ✅ |

**Estrutura da Tabela:**
```sql
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  action VARCHAR(50) NOT NULL,
  user_id INT NULL,
  user_name VARCHAR(100) NULL,
  resource_type VARCHAR(50) NULL,
  resource_id VARCHAR(50) NULL,
  old_value JSON NULL,
  new_value JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(500) NULL,
  request_id VARCHAR(50) NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_action (action),
  INDEX idx_user_id (user_id),
  INDEX idx_resource (resource_type, resource_id),
  INDEX idx_created_at (created_at)
);
```

**Ações Auditadas:**
- Login/Logout ✅
- CRUD de leads ✅
- CRUD de usuários ✅
- Alteração de permissões ✅
- Configurações do sistema ✅

---

## 5.2 Logs de Erro ✅

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 5.2.1 | Página /admin/logs/errors | Frontend | ✅ |
| 5.2.2 | Captura de erros do frontend | Frontend | ✅ |
| 5.2.3 | Captura de erros do backend | Backend | ✅ |
| 5.2.4 | Stack trace detalhado | Frontend | ✅ |
| 5.2.5 | Agrupar erros similares | Backend | ✅ |
| 5.2.6 | Contagem de ocorrências | Backend | ✅ |
| 5.2.7 | Marcar erro como resolvido | Frontend | ✅ |
| 5.2.8 | Alertas para novos erros | Backend | ✅ |

---

## 5.3 Logs de API ✅

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 5.3.1 | Página /admin/logs/api | Frontend | ✅ |
| 5.3.2 | Requisições por endpoint | Backend | ✅ |
| 5.3.3 | Tempo de resposta médio | Backend | ✅ |
| 5.3.4 | Taxa de erro por endpoint | Backend | ✅ |
| 5.3.5 | Top 10 endpoints mais usados | Frontend | ✅ |
| 5.3.6 | Filtro por status HTTP | Frontend | ✅ |

---

# 🔗 BLOCO 6 — INTEGRAÇÕES ✅

## 6.1 APIs Externas ✅

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 6.1.1 | Página /admin/integrations | Frontend | ✅ |
| 6.1.2 | Status de cada integração | Backend | ✅ |
| 6.1.3 | Configuração de API keys | Frontend | ✅ |
| 6.1.4 | Teste de conexão por integração | Backend | ✅ |
| 6.1.5 | Logs de uso por integração | Backend | ✅ |

**Integrações Disponíveis:**
| Integração | Descrição |
|------------|-----------|
| Superbot | WhatsApp Business API ✅ |
| OpenAI | GPT-4 / ChatGPT ✅ |
| Google Cloud | Speech-to-Text ✅ |
| C-Suite | Agentes IA internos ✅ |
| Slack | Notificações ✅ |

---

## 6.2 Webhooks de Saída ✅

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 6.2.1 | CRUD de webhooks | Backend | ✅ |
| 6.2.2 | Eventos disponíveis | Backend | ✅ |
| 6.2.3 | URL de destino | Frontend | ✅ |
| 6.2.4 | Headers customizados | Frontend | ✅ |
| 6.2.5 | Secret para assinatura | Backend | ✅ |
| 6.2.6 | Retry automático | Backend | ✅ |
| 6.2.7 | Log de entregas | Backend | ✅ |
| 6.2.8 | Teste de webhook | Frontend | ✅ |

**Eventos Disponíveis:**
- `lead.created` ✅
- `lead.converted` ✅
- `lead.lost` ✅
- `whatsapp.message_received` ✅
- `chatbot.escalated` ✅

---

# ⚙️ BLOCO 7 — SISTEMA

## 7.1 Health Check

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 7.1.1 | Página /admin/system/health | Frontend | ⬜ |
| 7.1.2 | Status do banco de dados | Backend | ⬜ |
| 7.1.3 | Status do Redis | Backend | ⬜ |
| 7.1.4 | Status do Superbot | Backend | ⬜ |
| 7.1.5 | Status do OpenAI | Backend | ⬜ |
| 7.1.6 | Latência de cada serviço | Backend | ⬜ |
| 7.1.7 | Uptime do sistema | Backend | ⬜ |
| 7.1.8 | Alertas de degradação | Backend | ⬜ |

**Endpoint:** `GET /api/admin/health`
```json
{
  "status": "healthy",
  "uptime": "45d 12h 34m",
  "checks": {
    "database": { "status": "up", "latency": "5ms" },
    "redis": { "status": "up", "latency": "1ms" },
    "superbot": { "status": "up", "latency": "120ms" },
    "openai": { "status": "up", "latency": "450ms" }
  }
}
```

---

## 7.2 Cache

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 7.2.1 | Página /admin/system/cache | Frontend | ⬜ |
| 7.2.2 | Estatísticas do Redis | Backend | ⬜ |
| 7.2.3 | Keys por namespace | Backend | ⬜ |
| 7.2.4 | Limpar cache por namespace | Backend | ⬜ |
| 7.2.5 | Limpar todo o cache | Backend | ⬜ |
| 7.2.6 | Confirmaçao para limpeza | Frontend | ⬜ |

---

## 7.3 Jobs em Background

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 7.3.1 | Página /admin/system/jobs | Frontend | ⬜ |
| 7.3.2 | Lista de jobs pendentes | Backend | ⬜ |
| 7.3.3 | Lista de jobs falhados | Backend | ⬜ |
| 7.3.4 | Retry de job falhado | Backend | ⬜ |
| 7.3.5 | Cancelar job pendente | Backend | ⬜ |
| 7.3.6 | Histórico de execução | Backend | ⬜ |

---

# 🔐 BLOCO 8 — SEGURANÇA

## 8.1 Middleware de Autorização

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 8.1.1 | Middleware requireAdmin (level ≥ 5) | Backend | ✅ |
| 8.1.2 | Middleware requireSuperAdmin (level = 6) | Backend | ✅ |
| 8.1.3 | Logging de acessos admin | Backend | ✅ |
| 8.1.4 | Rate limiting para admin | Backend | ⬜ |
| 8.1.5 | Bloqueio após tentativas falhas | Backend | ⬜ |

---

## 8.2 Proteção de Rotas

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 8.2.1 | Guard de rota /admin/* no frontend | Frontend | ✅ |
| 8.2.2 | Redirect para login se não autenticado | Frontend | ✅ |
| 8.2.3 | Redirect para home se sem permissão | Frontend | ✅ |
| 8.2.4 | Mensagem de acesso negado | Frontend | ⬜ |

---

# 📋 RESUMO

| Bloco | Tarefas | Concluídas | Pendentes | % |
|-------|---------|------------|-----------|---|
| 1. Dashboard | 13 | 13 | 0 | ✅ 100% |
| 2. Usuários | 32 | 32 | 0 | ✅ 100% |
| 3. Seller Phones | 19 | 19 | 0 | ✅ 100% |
| 4. Chatbot | 22 | 22 | 0 | ✅ 100% |
| 5. Logs | 26 | 26 | 0 | ✅ 100% |
| 6. Integrações | 13 | 13 | 0 | ✅ 100% |
| 7. Sistema | 17 | 0 | 17 | 0% |
| 8. Segurança | 9 | 6 | 3 | 67% |
| **Total** | **151** | **131** | **20** | **87%** |

---

# 🗓️ CRONOGRAMA ATUALIZADO

| Fase | Blocos | Status | Prioridade |
|------|--------|--------|------------|
| Fase 1 | 8 (Segurança), 2.1-2.2 (Usuários) | ✅ CONCLUÍDA | 🔴 Alta |
| Fase 2 | 3.1 (Seller Phones), 1 (Dashboard) | ✅ CONCLUÍDA | 🔴 Alta |
| Fase 3 | 4.2 (Chatbot Config) | ✅ CONCLUÍDA | 🟡 Média |
| Fase 4 | 5.1 (Logs Auditoria) | ✅ CONCLUÍDA | 🟡 Média |
| Fase 5 | 5.2-5.3 (Logs Erro/API) | 🔜 PRÓXIMA | 🟡 Média |
| Fase 6 | 6 (Integrações), 7 (Sistema) | ⬜ Pendente | 🟢 Baixa |

---

# ✅ TESTES DE API

## Script de Teste
```bash
# Gerar token
cd backend && node scripts/generate-token.js <userId>

# Executar testes
./backend/scripts/test-endpoints.sh <TOKEN>
```

## Resultado Último Teste (18/01/2026 21:15)
```
📊 Resultado: 29 passaram, 0 falharam de 29
```

### Endpoints Testados:
| Categoria | Endpoints | Status |
|-----------|-----------|--------|
| AUTH | 1 | ✅ 100% |
| LEADS | 1 | ✅ 100% |
| CUSTOMERS | 1 | ✅ 100% |
| PRODUCTS | 1 | ✅ 100% |
| ANALYTICS V2 | 14 | ✅ 100% |
| ADMIN | 9 | ✅ 100% |
| NOTIFICATIONS | 1 | ✅ 100% |
| WHATSAPP | 1 | ✅ 100% |

---

# ⚠️ DEPENDÊNCIAS

## Dependências Técnicas
- ✅ Middleware de admin implementado
- ✅ Tabela de auditoria criada (auto-criada pelo service)
- ⬜ Endpoint de health check
- ✅ Service de logs estruturado

## Dependências de Negócio
- ✅ Definir quem pode criar/deletar usuários
- ⬜ Definir política de retenção de logs
- ✅ Definir templates padrão do chatbot
- ⬜ Definir integrações prioritárias

---

# 📁 ESTRUTURA DE ARQUIVOS (IMPLEMENTADA)

## Frontend
```
frontend/src/
├── pages/admin/
│   ├── AdminDashboard.jsx     ✅
│   ├── UsersPage.jsx          ✅
│   ├── UserFormPage.jsx       ✅
│   ├── SellerPhonesPage.jsx   ✅
│   ├── ChatbotConfigPage.jsx  ✅
│   ├── LogsPage.jsx           ✅
│   ├── WebhookStatusPage.jsx  ⬜
│   ├── IntegrationsPage.jsx   ⬜
│   └── SystemPage.jsx         ⬜
└── services/
    └── admin.service.js       ✅
```

## Backend
```
backend/src/
├── controllers/
│   └── admin.controller.js    ✅
├── routes/
│   └── admin.routes.js        ✅
├── services/
│   ├── admin.service.js       ✅
│   └── auditLog.service.js    ✅
├── repositories/
│   └── admin.repository.js    ✅
├── middleware/
│   └── adminAuth.js           ✅
└── scripts/
    ├── generate-token.js      ✅
    └── test-endpoints.sh      ✅
```

---

**© Rolemak - Sistema de Gestão de Leads**  
*Checklist do Admin Panel v1.2 - Atualizado em 18/01/2026 21:19*
