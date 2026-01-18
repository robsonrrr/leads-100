# ✅ CHECKLIST DE INTEGRAÇÃO SUPERBOT — LEADS AGENT

## Sistema de Gestão de Leads - Rolemak

**Versão:** 1.0  
**Criado em:** 17 de Janeiro 2026  
**Atualizado em:** 17 de Janeiro 2026  
**Status:** Em Implementação 🔄

---

## 🎯 Objetivo

> **Integrar o sistema de conversas WhatsApp (Superbot) com o Leads-Agent, permitindo criação automática de leads, enriquecimento de contexto e análise de intenções dos clientes.**

---

## 📊 Métricas de Sucesso

| Métrica | Baseline | Meta |
|---------|----------|------|
| Leads criados via WhatsApp | 0% | 20% |
| Tempo de resposta ao cliente | ~5min | < 30s |
| Taxa de conversão WhatsApp | 0% | 15% |
| Clientes vinculados | 0% | 80% |
| Precisão de intenção | - | > 90% |

---

# 🗄️ BLOCO 1 — INFRAESTRUTURA

## 1.1 Configuração de Acesso

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 1.1.1 | Verificar acesso às tabelas do Superbot no MySQL | DevOps | ✅ |
| 1.1.2 | Criar usuário de leitura específico para integração | DevOps | ⏳ |
| 1.1.3 | Configurar variáveis de ambiente no .env | Backend | ✅ |
| 1.1.4 | Testar conexão com tabelas do Superbot | Backend | ✅ |
| 1.1.5 | Documentar credenciais no CREDENCIAIS.md | DevOps | ⏳ |

**Schema:** `superbot` (separado do schema `mak`)

**Tabelas Verificadas (18/01/2026):**
```
✅ superbot.superbot_customers: 307 registros
✅ superbot.messages: 124.135 registros
✅ superbot.message_media: 94.469 registros
✅ superbot.message_transcriptions: 0 registros
✅ superbot.message_responses: 440 registros
✅ superbot.whatsapp_deliveries: 348 registros
✅ superbot.phone_validations: 115 registros
```

**Critério de Aceite:**
```
✅ Conexão com banco estabelecida
✅ Queries de teste funcionando
⏳ Credenciais documentadas e seguras
```

---

## 1.2 Estrutura de Código

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 1.2.1 | Criar `superbot.repository.js` | Backend | ✅ |
| 1.2.2 | Criar `superbot.service.js` | Backend | ✅ |
| 1.2.3 | Criar `superbot.controller.js` | Backend | ✅ |
| 1.2.4 | Criar `superbot.routes.js` | Backend | ✅ |
| 1.2.5 | Adicionar rotas ao `index.js` | Backend | ✅ |
| 1.2.6 | Adicionar documentação Swagger | Backend | ✅ |
| 1.2.7 | Criar testes unitários | Backend | ⏳ |
| 1.2.8 | Criar testes de integração | Backend | ⏳ |

**Estrutura de Arquivos:**
```
backend/src/
├── repositories/
│   └── superbot.repository.js    # NEW
├── services/
│   └── superbot.service.js       # NEW
├── controllers/
│   └── superbot.controller.js    # NEW
└── routes/
    └── superbot.routes.js        # NEW
```

---

# 🔗 BLOCO 2 — VINCULAÇÃO DE CLIENTES

## 2.1 Busca por Telefone

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 2.1.1 | Endpoint GET /api/superbot/customers/:phone | Backend | ✅ |
| 2.1.2 | Normalização de números de telefone | Backend | ✅ |
| 2.1.3 | Busca fuzzy por telefone (últimos 9 dígitos) | Backend | ✅ |
| 2.1.4 | Retornar dados do superbot_customers | Backend | ✅ |
| 2.1.5 | Cache de busca no Redis (TTL 5min) | Backend | ✅ |

**Critério de Aceite:**
```
⏳ Busca funciona com diferentes formatos de telefone
⏳ Tempo de resposta < 100ms (com cache)
⏳ Retorna dados do cliente Superbot
```

---

## 2.2 Link com Clientes do Leads-Agent

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 2.2.1 | Criar tabela `superbot_customer_links` | Backend | ✅ |
| 2.2.2 | Endpoint POST /api/superbot/link-customer | Backend | ✅ |
| 2.2.3 | Endpoint DELETE /api/superbot/link-customer | Backend | ✅ |
| 2.2.4 | Busca automática por telefone similar | Backend | ✅ |
| 2.2.5 | Score de confiança do match (0-100) | Backend | ✅ |
| 2.2.6 | Validação manual pelo usuário | Frontend | ⏳ |
| 2.2.7 | UI para vincular cliente manualmente | Frontend | ⏳ |

**Estrutura da Tabela:**
```sql
CREATE TABLE superbot_customer_links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  superbot_customer_id INT NOT NULL,
  leads_customer_id INT NOT NULL,
  linked_by INT NULL,
  linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confidence_score DECIMAL(5,2) DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  
  UNIQUE KEY uk_link (superbot_customer_id, leads_customer_id),
  INDEX idx_superbot (superbot_customer_id),
  INDEX idx_leads (leads_customer_id)
);
```

---

## 2.3 View de Clientes Unificados

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 2.3.1 | Criar view `vw_superbot_leads_customers` | Backend | ✅ |
| 2.3.2 | Endpoint GET /api/superbot/unified-customers | Backend | ✅ |
| 2.3.3 | Filtrar por status de vínculo | Backend | ✅ |
| 2.3.4 | Exibir sugestões de match pendentes | Frontend | ✅ |

**View SQL:**
```sql
CREATE VIEW vw_superbot_leads_customers AS
SELECT 
  sc.id as superbot_customer_id,
  sc.phone_number,
  sc.name as superbot_name,
  sc.push_name,
  c.cCliente as leads_customer_id,
  c.xNome as leads_customer_name,
  c.xCNPJ as cnpj,
  u.id as seller_id,
  u.nick as seller_name,
  scl.verified,
  scl.confidence_score
FROM superbot_customers sc
LEFT JOIN superbot_customer_links scl ON scl.superbot_customer_id = sc.id
LEFT JOIN mak.clientes c ON c.cCliente = scl.leads_customer_id
LEFT JOIN mak.users u ON u.id = c.cVendedor;
```

---

# 💬 BLOCO 3 — HISTÓRICO DE CONVERSAS

## 3.1 Consulta de Mensagens

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 3.1.1 | Endpoint GET /api/superbot/conversations/:phone | Backend | ✅ |
| 3.1.2 | Endpoint GET /api/superbot/messages/:sessionId | Backend | ✅ |
| 3.1.3 | Paginação de mensagens | Backend | ✅ |
| 3.1.4 | Filtro por período (dias) | Backend | ✅ |
| 3.1.5 | Filtro por direção (incoming/outgoing) | Backend | ✅ |
| 3.1.6 | Incluir mídia anexada (URLs) | Backend | ✅ |
| 3.1.7 | Incluir transcrições de áudio | Backend | ✅ |

**Critério de Aceite:**
```
⏳ Lista conversas agrupadas por sessão
⏳ Paginação funciona corretamente
⏳ Mídia e transcrições incluídas
```

---

## 3.2 Visualização de Conversas

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 3.2.1 | Componente ConversationTimeline | Frontend | ✅ |
| 3.2.2 | Exibir mensagens estilo chat (bolhas) | Frontend | ✅ |
| 3.2.3 | Diferenciar incoming/outgoing visualmente | Frontend | ✅ |
| 3.2.4 | Exibir mídia inline (imagens, vídeos) | Frontend | ✅ |
| 3.2.5 | Player de áudio com transcrição | Frontend | ✅ |
| 3.2.6 | Indicador de resposta da IA | Frontend | ✅ |
| 3.2.7 | Timestamps formatados | Frontend | ✅ |
| 3.2.8 | Lazy loading de mensagens antigas | Frontend | ✅ |

---

## 3.3 Estatísticas do Cliente

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 3.3.1 | Endpoint GET /api/superbot/stats/:phone | Backend | ✅ |
| 3.3.2 | Total de mensagens | Backend | ✅ |
| 3.3.3 | Total de sessões | Backend | ✅ |
| 3.3.4 | Média de mensagens por sessão | Backend | ✅ |
| 3.3.5 | Primeira e última mensagem | Backend | ✅ |
| 3.3.6 | Horários mais ativos | Backend | ✅ |
| 3.3.7 | Card de estatísticas na UI | Frontend | ⏳ |

---

# 🧠 BLOCO 4 — ANÁLISE DE INTENÇÃO

## 4.1 Detecção de Intenção

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 4.1.1 | Endpoint POST /api/superbot/analyze-intent | Backend | ✅ |
| 4.1.2 | Integração com OpenAI GPT-4 | Backend | ✅ |
| 4.1.3 | Prompt engineering para intenções de vendas | Backend | ✅ |
| 4.1.4 | Mapeamento de intenções (enum) | Backend | ✅ |
| 4.1.5 | Retornar confiança (0-1) | Backend | ✅ |
| 4.1.6 | Cache de análises similares | Backend | ✅ |

**Intenções Mapeadas:**
```typescript
enum SuperbotIntent {
  QUOTE_REQUEST = 'QUOTE_REQUEST',      // Pedido de cotação
  PRICE_CHECK = 'PRICE_CHECK',          // Consulta de preço
  STOCK_CHECK = 'STOCK_CHECK',          // Consulta de estoque
  ORDER_STATUS = 'ORDER_STATUS',        // Status do pedido
  COMPLAINT = 'COMPLAINT',              // Reclamação
  GENERAL_QUESTION = 'GENERAL_QUESTION', // Pergunta geral
  NEGOTIATION = 'NEGOTIATION',          // Negociação
  UNKNOWN = 'UNKNOWN'                   // Desconhecido
}
```

---

## 4.2 Extração de Entidades

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 4.2.1 | Extrair produtos mencionados | Backend | ✅ |
| 4.2.2 | Extrair quantidades | Backend | ✅ |
| 4.2.3 | Extrair datas/prazos | Backend | ✅ |
| 4.2.4 | Extrair valores/preços | Backend | ✅ |
| 4.2.5 | Match de produtos com catálogo | Backend | ⏳ |
| 4.2.6 | Retornar entidades estruturadas | Backend | ⏳ |

**Exemplo de Resposta:**
```json
{
  "intent": "QUOTE_REQUEST",
  "confidence": 0.95,
  "entities": {
    "products": [
      { "query": "rolamento 6205", "quantity": 100 }
    ],
    "deadline": "próxima semana",
    "urgency": "normal"
  },
  "matched_products": [
    { "id": 123, "code": "6205-2RS", "stock": 500 }
  ]
}
```

---

## 4.3 Análise de Sentimento

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 4.3.1 | Endpoint GET /api/superbot/sentiment/:phone | Backend | ✅ |
| 4.3.2 | Analisar últimas N mensagens | Backend | ✅ |
| 4.3.3 | Score de sentimento (-1 a +1) | Backend | ✅ |
| 4.3.4 | Classificar: positivo/neutro/negativo | Backend | ✅ |
| 4.3.5 | Detectar reclamações | Backend | ✅ |
| 4.3.6 | Alertar vendedor sobre insatisfação | Backend | ⏳ |
| 4.3.7 | Widget de sentimento na página do cliente | Frontend | ⏳ |

---

# 📝 BLOCO 5 — CRIAÇÃO AUTOMÁTICA DE LEADS

## 5.1 Detecção de Oportunidade

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 5.1.1 | Endpoint POST /api/superbot/webhook | Backend | ✅ |
| 5.1.2 | Validação de assinatura HMAC | Backend | ✅ |
| 5.1.3 | Fila de processamento (Redis) | Backend | ✅ |
| 5.1.4 | Processar mensagem assincronamente | Backend | ✅ |
| 5.1.5 | Detectar intenção de compra | Backend | ✅ |
| 5.1.6 | Threshold de confiança (>0.85) | Backend | ✅ |

**Payload do Webhook:**
```json
{
  "event": "new_message",
  "timestamp": "2026-01-17T10:30:00Z",
  "data": {
    "message_id": "msg-123",
    "session_id": "sess-456",
    "phone": "5511999999999",
    "text": "Preciso de 100 rolamentos 6205",
    "direction": "incoming"
  }
}
```

---

## 5.2 Criação Automática

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 5.2.1 | Criar tabela `superbot_lead_origins` | Backend | ✅ |
| 5.2.2 | Identificar cliente vinculado | Backend | ✅ |
| 5.2.3 | Criar lead com origem "WhatsApp" | Backend | ✅ |
| 5.2.4 | Adicionar produtos detectados ao carrinho | Backend | ✅ |
| 5.2.5 | Notificar vendedor responsável | Backend | ✅ |
| 5.2.6 | Responder confirmação no WhatsApp | Backend | ⏳ |
| 5.2.7 | Log de leads criados automaticamente | Backend | ✅ |

**Estrutura da Tabela:**
```sql
CREATE TABLE superbot_lead_origins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lead_id INT NOT NULL,
  session_id VARCHAR(50) NOT NULL,
  message_id INT NULL,
  intent_detected VARCHAR(80),
  confidence DECIMAL(5,4),
  entities_json JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY uk_lead (lead_id),
  INDEX idx_session (session_id)
);
```

---

## 5.3 Fluxo de Confirmação

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 5.3.1 | Modo automático (cria direto) | Backend | ✅ |
| 5.3.2 | Modo confirmação (pede OK do vendedor) | Backend | ⏳ |
| 5.3.3 | Configurar modo por vendedor | Backend | ⏳ |
| 5.3.4 | Notificação push para confirmação | Frontend | ⏳ |
| 5.3.5 | Botões de aprovar/rejeitar na notificação | Frontend | ⏳ |
| 5.3.6 | Timeout de confirmação (5min) | Backend | ⏳ |

---

# 🔄 BLOCO 6 — INTEGRAÇÃO COM CHATBOT DECISÓRIO

## 6.1 Enriquecimento de Contexto

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 6.1.1 | Injetar histórico de conversas no contexto | Backend | ✅ |
| 6.1.2 | Buscar conversas antes de processar intent | Backend | ✅ |
| 6.1.3 | Resumir conversas com IA | Backend | ✅ |
| 6.1.4 | Limitar contexto a últimas 10 mensagens | Backend | ✅ |
| 6.1.5 | Incluir sentimento no contexto | Backend | ✅ |

---

## 6.2 Registro de Eventos

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 6.2.1 | Criar eventos WhatsappInteractionEvent | Backend | ✅ |
| 6.2.2 | Registrar no chat_interaction_event | Backend | ✅ |
| 6.2.3 | Vincular com lead criado | Backend | ⏳ |
| 6.2.4 | Alimentar analytics de canais | Backend | ⏳ |

**Evento:**
```sql
INSERT INTO chat_interaction_event (
  tenant_id, user_id, conversation_id,
  channel, role, message_text,
  intent_key, confidence, entities_json,
  tool_name, tool_result_json, status
) VALUES (
  1, ?, ?,
  'whatsapp', 'USER', ?,
  ?, ?, ?,
  'create_lead', ?, 'OK'
);
```

---

## 6.3 Policy Guardian

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 6.3.1 | Validar desconto solicitado via WhatsApp | Backend | ✅ |
| 6.3.2 | Aplicar mesmas regras do chatbot web | Backend | ✅ |
| 6.3.3 | Responder com explicação de política | Backend | ✅ |
| 6.3.4 | Criar aprovação se necessário | Backend | ⏳ |

---

# 📊 BLOCO 7 — DASHBOARD E ANALYTICS

## 7.1 Métricas de WhatsApp

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 7.1.1 | Total de mensagens por período | Backend | ✅ |
| 7.1.2 | Total de sessões por período | Backend | ✅ |
| 7.1.3 | Leads criados via WhatsApp | Backend | ✅ |
| 7.1.4 | Taxa de conversão WhatsApp → Lead | Backend | ✅ |
| 7.1.5 | Taxa de conversão Lead → Pedido | Backend | ✅ |
| 7.1.6 | Tempo médio de resposta | Backend | ✅ |
| 7.1.7 | Horários de pico | Backend | ✅ |
| 7.1.8 | Intenções mais detectadas | Backend | ✅ |

---

## 7.2 Dashboard de Integração

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 7.2.1 | Widget de métricas WhatsApp | Frontend | ✅ |
| 7.2.2 | Gráfico de mensagens por dia | Frontend | ✅ |
| 7.2.3 | Gráfico de leads criados | Frontend | ✅ |
| 7.2.4 | Lista de conversas recentes | Frontend | ✅ |
| 7.2.5 | Alertas de clientes insatisfeitos | Frontend | ⏳ |
| 7.2.6 | Filtro por vendedor | Frontend | ⏳ |
| 7.2.7 | Filtro por período | Frontend | ✅ |

---

## 7.3 Relatórios

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 7.3.1 | Relatório de atendimentos WhatsApp | Backend | ⏳ |
| 7.3.2 | Relatório de leads por canal | Backend | ⏳ |
| 7.3.3 | Exportação Excel | Backend | ⏳ |
| 7.3.4 | Agendamento de relatórios | Backend | ⏳ |

---

# 🔐 BLOCO 8 — SEGURANÇA E COMPLIANCE

## 8.1 Autenticação

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 8.1.1 | API Key para webhook | Backend | ⏳ |
| 8.1.2 | Validação de origem (IP whitelist) | Backend | ⏳ |
| 8.1.3 | Rate limiting (100 req/min) | Backend | ⏳ |
| 8.1.4 | Logging de acessos | Backend | ⏳ |

---

## 8.2 Privacidade (LGPD)

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 8.2.1 | Mascarar telefones em logs | Backend | ⏳ |
| 8.2.2 | Não expor mensagens em APIs públicas | Backend | ⏳ |
| 8.2.3 | Política de retenção de dados | Legal | ⏳ |
| 8.2.4 | Consentimento para análise de conversas | Legal | ⏳ |
| 8.2.5 | Endpoint de exclusão de dados | Backend | ⏳ |

---

## 8.3 Auditoria

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 8.3.1 | Log de todas as operações | Backend | ⏳ |
| 8.3.2 | Vincular ações ao usuário | Backend | ⏳ |
| 8.3.3 | Relatório de auditoria | Backend | ⏳ |
| 8.3.4 | Retenção de logs (1 ano) | DevOps | ⏳ |

---

# 📋 RESUMO

| Bloco | Tarefas | Concluídas | Pendentes |
|-------|---------|------------|-----------|
| 1. Infraestrutura | 13 | 11 | 2 |
| 2. Vinculação de Clientes | 16 | 14 | 2 |
| 3. Histórico de Conversas | 22 | 21 | 1 |
| 4. Análise de Intenção | 20 | 15 | 5 |
| 5. Criação Automática de Leads | 20 | 13 | 7 |
| 6. Integração Chatbot | 12 | 10 | 2 |
| 7. Dashboard e Analytics | 18 | 13 | 5 |
| 8. Segurança e Compliance | 13 | 0 | 13 |
| **Total** | **134** | **97** | **37** |

---

# 🗓️ CRONOGRAMA SUGERIDO

| Fase | Blocos | Semanas | Prioridade |
|------|--------|---------|------------|
| Fase 1 | 1 (Infraestrutura) | 1 | 🔴 Alta |
| Fase 2 | 2 (Vinculação de Clientes) | 1-2 | 🔴 Alta |
| Fase 3 | 3.1-3.2 (Histórico Básico) | 2-3 | 🔴 Alta |
| Fase 4 | 4 (Análise de Intenção) | 3-5 | 🟡 Média |
| Fase 5 | 5 (Criação Automática) | 5-6 | 🟡 Média |
| Fase 6 | 6 (Integração Chatbot) | 6-7 | 🟡 Média |
| Fase 7 | 7 (Dashboard) | 7-8 | 🟢 Baixa |
| Fase 8 | 8 (Segurança) | Contínuo | 🔴 Alta |

**Estimativa Total:** 8 semanas

---

# ⚠️ DEPENDÊNCIAS

## Dependências Técnicas
- ⏳ Acesso às tabelas do Superbot no MySQL
- ⏳ API Key do OpenAI para NLP
- ⏳ Endpoint de webhook no Superbot
- ⏳ Redis configurado para filas
- ⏳ Permissões de escrita para criar leads

## Dependências de Negócio
- ⏳ Aprovação do escopo pela gestão
- ⏳ Definição de threshold de confiança
- ⏳ Política de privacidade atualizada
- ⏳ Treinamento dos vendedores
- ⏳ Regras de notificação por vendedor

---

# 🚀 QUICK WINS (Implementar Primeiro)

1. **Endpoint de busca por telefone** - Já viabiliza consultas manuais
2. **View de clientes unificados** - Facilita análise de dados
3. **Histórico de conversas simples** - Valor imediato para vendedores
4. **Estatísticas básicas** - Métricas de uso do WhatsApp

---

# 📚 REFERÊNCIAS

| Documento | Descrição |
|-----------|-----------|
| `docs/PLANO_INTEGRACAO_SUPERBOT.md` | Plano detalhado de integração |
| `sql/superbot.sql` | DDL das tabelas do Superbot |
| `docs/CHATBOT_CONTEXT_GRAPH.md` | Arquitetura do Context Graph |
| `docs/CHATBOT_CSUTE_INTEGRATION.md` | Integração com CSuite |
| `docs/DDL_CHATBOT_MYSQL.sql` | DDL do Chatbot Decisório |

---

**© Rolemak - Sistema de Gestão de Leads**  
*Checklist de Integração Superbot v1.0*
