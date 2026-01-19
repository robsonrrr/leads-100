# MAPA INTENTS → TOOL CALLS

## DECISIONA CRM Assistant - Roteamento de Intents

**Versão:** 1.0
**Data:** 20 de Janeiro 2026
**Baseado em:** CHATBOT_COMMANDS.md v2.1

---

## 🎯 METODOLOGIA DE MAPEAMENTO

### Regras de Roteamento
1. **Intent Key** = Nome do comando no guia de comandos
2. **Tool Call** = Endpoint correspondente na API
3. **Validação Policy-Bound** = Sempre aplicada antes da execução
4. **Confirmação Obrigatória** = Para ações críticas (marcadas com ✅)

### Critérios de Confirmação
- ✅ **WRITE_LEAD** - Criação/modificação de leads
- ✅ **APPLY_DISCOUNT** - Aplicação de descontos
- ✅ **CONVERT_ORDER** - Conversão para pedido
- ✅ **REQUEST_EXCEPTION** - Solicitações de exceção
- ✅ **APPROVE_EXCEPTION** - Aprovações de exceção

---

## 👥 1. CLIENTES

| Intent Key | Exemplos de Input | Tool Call | Confirmação | Descrição |
|------------|-------------------|-----------|-------------|-----------|
| `search_customers` | "Ache o cliente Rolemak"<br>"Buscar CNPJ 123456789" | `GET /customers/search` | ❌ | Busca clientes por nome, CNPJ ou ID |
| `get_customer_details` | "Detalhes do cliente 123"<br>"Me dê os dados da La Tienda" | `GET /customers/{id}` | ❌ | Detalhes completos: endereço, contato, financeiro |

---

## 📝 2. LEADS / COTAÇÕES

| Intent Key | Exemplos de Input | Tool Call | Confirmação | Descrição |
|------------|-------------------|-----------|-------------|-----------|
| `search_leads` | "Quais leads estão abertos?"<br>"Mostre leads do cliente 123" | `GET /leads/search` | ❌ | Lista leads abertos ou convertidos |
| `get_lead_details` | "O que tem no lead 1025?"<br>"Detalhes da cotação 789" | `GET /leads/{id}` | ❌ | Exibe itens, valores e observações |
| `create_lead` | "Crie lead para cliente 50 com 10 unidades produto 100" | `POST /leads` | ✅ | Cria novo lead com produtos específicos |

---

## 🛠️ 3. PÓS-VENDA E SUPORTE

| Intent Key | Exemplos de Input | Tool Call | Confirmação | Descrição |
|------------|-------------------|-----------|-------------|-----------|
| `create_service_order` | "Criar OS para cliente 123 - impressora com defeito" | `POST /service-orders` | ✅ | Cria ordem de serviço para conserto |
| `search_service_orders` | "Quais OS estão em aberto?"<br>"OS do cliente 456" | `GET /service-orders/search` | ❌ | Busca ordens de serviço por status/cliente |
| `get_service_order_details` | "Detalhes da OS 2024-001" | `GET /service-orders/{id}` | ❌ | Detalhes completos da OS (status, técnico, peças) |
| `update_service_order` | "Atualizar OS para 'em andamento' com técnico João" | `PUT /service-orders/{id}` | ✅ | Atualiza status, adiciona peças ou observações |
| `schedule_technical_visit` | "Agendar visita técnica amanhã às 10h" | `POST /service-orders/{id}/schedule` | ✅ | Agenda visita técnica com cliente |
| `get_warranty_info` | "Garantia do produto 789 para cliente 123?" | `GET /products/{id}/warranty` | ❌ | Consulta validade e cobertura de garantia |
| `create_support_ticket` | "Abrir chamado - cliente reclama de ruído" | `POST /support/tickets` | ✅ | Abre chamado de suporte técnico |
| `get_billing_info` | "Boletos em aberto do cliente 456" | `GET /billing/customer/{id}` | ❌ | Consulta boletos, pagamentos e pendências |
| `send_payment_reminder` | "Enviar cobrança para cliente 123 do boleto vencido" | `POST /billing/customer/{id}/reminders` | ✅ | Envia lembrete de pagamento por email/SMS |

---

## 💰 4. PRICING AGENT (NÚCLEO DE POLÍTICA)

| Intent Key | Exemplos de Input | Tool Call | Confirmação | Descrição |
|------------|-------------------|-----------|-------------|-----------|
| `simulate_pricing` | "Simule preço de 10 máquinas para cliente 123 em 3x"<br>"Qual preço do produto X para cliente Y?" | `POST /pricing/simulate` | ❌ | Calcula preços com impostos e descontos |
| `get_discount_recommendation` | "Quanto desconto posso dar no produto 100?" | `POST /pricing/recommend-discount` | ❌ | Sugestão de desconto ótimo para fechar negócio |

**Regra Crítica para Pricing:**
- Se resultado implicar **exceção de desconto** → Retornar `NEEDS_CONFIRMATION`
- Sempre aplicar Policy Guardian antes da execução
- Registrar Policy Decision Trace no `tool_result_json`

---

## 📊 5. ANALYTICS E INTELIGÊNCIA

| Intent Key | Exemplos de Input | Tool Call | Confirmação | Descrição |
|------------|-------------------|-----------|-------------|-----------|
| `get_sales_forecast` | "Qual minha previsão de vendas para este mês?" | `GET /analytics/forecast` | ❌ | Previsão de vendas para próximos 30 dias |
| `get_customer_churn_risk` | "Qual risco de churn do cliente 789?" | `GET /analytics/customers/{id}/churn-risk` | ❌ | Análise de risco de perda do cliente (Score 0-100) |
| `check_sales_deviation` | "Como está meu desempenho esta semana?" | `GET /analytics/performance/deviation` | ❌ | Compara vendas reais vs. esperado pela IA |
| `get_product_recommendations` | "O que posso oferecer para o cliente 456?" | `GET /analytics/customers/{id}/recommendations` | ❌ | Sugestões de compra (Reposição e Cross-sell) |
| `get_my_sales_metrics` | "Quanto eu já vendi este mês?" | `GET /analytics/sellers/{id}/metrics` | ❌ | Resumo mensal vs. mês anterior |
| `get_daily_sales_metrics` | "Qual meu total de hoje?" | `GET /analytics/sellers/{id}/daily-metrics` | ❌ | Total de vendas do dia atual ou específico |

---

## 📢 6. MARKETING E CAMPANHAS

| Intent Key | Exemplos de Input | Tool Call | Confirmação | Descrição |
|------------|-------------------|-----------|-------------|-----------|
| `create_campaign` | "Criar campanha 'Black Friday' para clientes de SP" | `POST /marketing/campaigns` | ✅ | Cria campanha de marketing com público-alvo |
| `search_campaigns` | "Quais campanhas estão rodando?"<br>"Campanhas do último trimestre" | `GET /marketing/campaigns/search` | ❌ | Lista campanhas ativas ou por período |
| `get_campaign_performance` | "Performance da campanha Black Friday" | `GET /marketing/campaigns/{id}/performance` | ❌ | Métricas detalhadas: cliques, conversões, ROI |
| `segment_customers` | "Segmentar clientes por região SP e volume > 10k" | `POST /marketing/segments` | ❌ | Segmenta clientes por perfil/demografia/comportamento |
| `send_marketing_email` | "Enviar newsletter para clientes inativos há 6 meses" | `POST /marketing/emails/send` | ✅ | Dispara email marketing para segmento específico |
| `schedule_social_post` | "Agendar post no LinkedIn para amanhã às 10h" | `POST /marketing/social/schedule` | ✅ | Agenda posts para redes sociais |
| `get_lead_sources` | "De onde vieram os leads desta semana?" | `GET /analytics/leads/sources` | ❌ | Análise de origem dos leads (orgânico, pago, indicação) |
| `create_landing_page` | "Criar LP para promoção de impressoras" | `POST /marketing/landing-pages` | ✅ | Gera landing page otimizada para conversão |

---

## 📦 7. PEDIDOS E ESTOQUE

| Intent Key | Exemplos de Input | Tool Call | Confirmação | Descrição |
|------------|-------------------|-----------|-------------|-----------|
| `search_orders` | "Quais pedidos eu fiz ontem?"<br>"Histórico do pedido 190500" | `GET /orders/search` | ❌ | Busca pedidos finalizados na MakHoje |
| `get_order_details` | "Detalhes do pedido 198500" | `GET /orders/{id}` | ❌ | Detalhes de um pedido (itens e pagamento) |
| `search_products` | "Preço da linha Jack"<br>"Buscar produto A4" | `GET /products/search` | ❌ | Busca produtos e consulta preços de tabela |
| `get_product_stock` | "Qual o estoque do produto 2050?" | `GET /products/{id}/stock` | ❌ | Consulta saldo real em SP (Matriz/Filial) e SC |

---

## 🤖 8. INTERAÇÕES E FOLLOW-UPS

| Intent Key | Exemplos de Input | Tool Call | Confirmação | Descrição |
|------------|-------------------|-----------|-------------|-----------|
| `create_interaction` | "Registrar que liguei para cliente 10 e ele pediu prazo" | `POST /interactions` | ✅ | Registra chamadas, visitas, emails ou notas |

---

## 🎭 9. APROVAÇÕES E GOVERNANÇA (NOVO)

| Intent Key | Exemplos de Input | Tool Call | Confirmação | Descrição |
|------------|-------------------|-----------|-------------|-----------|
| `request_discount_approval` | "Solicite aprovação de 12% desconto" | `POST /approvals/request` | ✅ | Solicita aprovação para desconto excepcional |
| `approve_discount` | "Aprovar desconto do lead 123" | `PUT /approvals/{id}/approve` | ✅ | Aprova solicitação de desconto (gerente/diretor) |
| `reject_discount` | "Rejeitar desconto do lead 123" | `PUT /approvals/{id}/reject` | ✅ | Rejeita solicitação de desconto |
| `get_pending_approvals` | "Quais aprovações estão pendentes?" | `GET /approvals/pending` | ❌ | Lista aprovações aguardando decisão |
| `get_approvals_history` | "Histórico de aprovações do mês" | `GET /approvals/history` | ❌ | Histórico de aprovações por período/filtros |

---

## 🔧 10. INFRAESTRUTURA E DEBUG

| Intent Key | Exemplos de Input | Tool Call | Confirmação | Descrição |
|------------|-------------------|-----------|-------------|-----------|
| `get_conversation_events` | "Mostrar histórico desta conversa" | `GET /chat/conversations/{id}/events` | ❌ | Audit trail de conversa (debug/admin) |
| `get_system_status` | "Status do sistema" | `GET /system/health` | ❌ | Status de saúde do chatbot |

---

## 📋 TABELA RESUMO DE ROTEAMENTO

| Categoria | Total Intents | Com Confirmação | Policy-Bound | Tool Calls |
|-----------|---------------|-----------------|--------------|------------|
| Clientes | 2 | 0 | ❌ | 2 |
| Leads | 3 | 1 | ❌ | 3 |
| Pós-Venda | 9 | 4 | ❌ | 9 |
| Pricing | 2 | 0 | ✅ | 2 |
| Analytics | 6 | 0 | ❌ | 6 |
| Marketing | 8 | 3 | ❌ | 8 |
| Pedidos | 4 | 0 | ❌ | 4 |
| Interações | 1 | 1 | ❌ | 1 |
| Aprovações | 5 | 4 | ✅ | 5 |
| Infra | 2 | 0 | ❌ | 2 |
| **TOTAL** | **42** | **13** | **2** | **42** |

---

## ⚠️ REGRAS DE VALIDAÇÃO POLICY-BOUND

### Aplicadas Automaticamente Antes de Tool Call

1. **Pricing Operations**
   - Validar contra Pricing Policy atual
   - Calcular risco econômico
   - Aplicar rule engine do Policy Guardian

2. **Write Operations** (✅ marcados)
   - Verificar permissões do usuário
   - Validar estado atual do objeto
   - Aplicar business rules

3. **Approval Operations**
   - Validar workflow de aprovação
   - Verificar SLAs por perfil
   - Aplicar matriz de responsabilidades

### Formato de Resposta com Validação

```json
{
  "verdict": "ALLOW|CONFIRM|REQUIRE_APPROVAL|BLOCK",
  "risk_level": "LOW|MEDIUM|HIGH|CRITICAL",
  "policy_version": "v2026.01",
  "reasons": ["DISCOUNT_ABOVE_LIMIT", "MARGIN_BELOW_MINIMUM"],
  "economic_impact": {
    "margin_current": 25.0,
    "margin_projected": 18.0,
    "gap_to_minimum": 7.0
  },
  "allowed_next_actions": ["REQUEST_APPROVAL", "SIMULATE_ALTERNATIVE"],
  "suggested_alternatives": [
    {
      "action": "ADJUST_DISCOUNT",
      "value": 9.0,
      "justification": "Within policy limits"
    }
  ]
}
```

---

## 🔄 WORKFLOW COMPLETO DE INTENT PROCESSING

```
1. Usuário Input
   ↓
2. NLP Processing → Intent + Entities
   ↓
3. Policy Guardian Validation
   ↓
4. Risk Assessment
   ↓
5. Tool Call Execution (se ALLOW)
   ↓
6. Response Formatting
   ↓
7. Event Logging (ChatInteractionEvent)
   ↓
8. Structured Response to User
```

---

## 🎯 IMPLEMENTAÇÃO RECOMENDADA

### Fase 1: Core Mapping (1 semana)
- [ ] Implementar 20 intents principais
- [ ] Configurar roteamento básico
- [ ] Testes unitários de mapeamento

### Fase 2: Policy Integration (2 semanas)
- [ ] Integrar Policy Guardian nos 13 intents confirmáveis
- [ ] Implementar validação pricing-bound
- [ ] Configurar approval workflow

### Fase 3: Advanced Features (1 semana)
- [ ] Comandos de debug/admin
- [ ] Analytics intents
- [ ] Otimização de performance

---

**© Rolemak - Sistema de Gestão de Leads**  
*Mapa Intents → Tool Calls v1.0*