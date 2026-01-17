# ✅ CHECKLIST TÉCNICO Q2 2026 — IA AVANÇADA

## Sistema de Gestão de Leads - Rolemak

**Período:** Abril - Junho 2026  
**Pré-requisito:** Q1 100% concluído  
**Status:** Pronto para Iniciar 🚀  
**Última atualização:** Janeiro 2026

---

## 🎯 Objetivo do Q2

> **Implementar IA avançada sob governança, com automações e previsões que respeitem a política de preços.**

### Critérios de Sucesso

- [ ] Chatbot IA operacional (consultas e ações)
- [ ] Previsão de vendas funcionando
- [ ] Classificação automática de risco
- [ ] Automação de follow-ups
- [ ] IA 100% condicionada à política

---

## 🤖 BLOCO 1 — CHATBOT IA (ASSISTENTE VIRTUAL)

### 1.1 Infraestrutura de IA

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 1.1.1 | Configurar integração com LLM (OpenAI/Claude) | Backend | ✅ |
| 1.1.2 | Criar serviço de AI Gateway | Backend | ✅ |
| 1.1.3 | Implementar rate limiting para API de IA | Backend | ✅ |
| 1.1.4 | Configurar cache de respostas frequentes | Backend | ✅ |
| 1.1.5 | Criar tabela `ai_conversations` | Backend | ✅ |

**Critério de Aceite:**
```
➡️ Chamadas à API de IA funcionando
➡️ Rate limit de 100 req/min por usuário
➡️ Cache de 5 min para consultas idênticas
```

---

### 1.2 Chatbot - Consultas (Read-only)

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 1.2.1 | Implementar consulta de clientes por voz natural | Backend | ✅ |
| 1.2.2 | Implementar consulta de leads/pedidos | Backend | ✅ |
| 1.2.3 | Implementar resumo de cliente | Backend | ✅ |
| 1.2.4 | Implementar consulta de métricas pessoais | Backend | ✅ |
| 1.2.5 | Implementar consulta de estoque/preços | Backend | ✅ |

**Exemplos de consultas:**
```
"Quais clientes não compram há mais de 60 dias?"
"Qual o status do lead 98765?"
"Me fale sobre o cliente ABC Ltda"
"Como estão minhas vendas este mês?"
"Qual o preço do produto X para o cliente Y?"
```

**Critério de Aceite:**
```
➡️ Consultas retornam dados corretos
➡️ Respostas em linguagem natural
➡️ Tempo de resposta < 3 segundos
```

---

### 1.3 Chatbot - Ações (Function Calling)

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 1.3.1 | Implementar criação de lead via chat | Backend | ✅ |
| 1.3.2 | Implementar criação de follow-up via chat | Backend | ✅ |
| 1.3.3 | Implementar registro de interação via chat | Backend | ✅ |
| 1.3.4 | Implementar simulação de preço via chat | Backend | ✅ |
| 1.3.5 | Validar todas as ações contra política | Backend | ✅ |

**Exemplos de ações:**
```
"Crie um lead para o cliente ABC com os produtos X e Y"
"Agende um follow-up para amanhã com o cliente Z"
"Registre que liguei para o cliente e ele pediu proposta"
"Simule 10% de desconto para este lead"
```

**Critério de Aceite:**
```
➡️ Ações executadas corretamente
➡️ Confirmação antes de executar
➡️ Ações passam pelo Pricing Agent
❌ IA não pode burlar política
```

---

### 1.4 Interface do Chat

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 1.4.1 | Criar componente ChatWidget | Frontend | ✅ |
| 1.4.2 | Implementar histórico de conversa | Frontend | ✅ |
| 1.4.3 | Implementar sugestões de perguntas | Frontend | ✅ |
| 1.4.4 | Implementar feedback (👍👎) | Frontend | ✅ |
| 1.4.5 | Implementar modo minimizado/expandido | Frontend | ✅ |

**Critério de Aceite:**
```
➡️ Chat acessível em todas as páginas
➡️ Histórico persistido por sessão
➡️ UX fluida e responsiva
```

---

## 📊 BLOCO 2 — PREVISÃO DE VENDAS

### 2.1 Modelo de Forecast

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 2.1.1 | Coletar dados históricos (2+ anos) | Data | ✅ |
| 2.1.2 | Criar pipeline de preparação de dados | Data | ✅ |
| 2.1.3 | Treinar modelo de séries temporais | Data | ✅ |
| 2.1.4 | Validar modelo (backtesting) | Data | ✅ |
| 2.1.5 | Criar endpoint `/api/ai/forecast` | Backend | ✅ |

**Modelo sugerido:** Prophet ou ARIMA

**Critério de Aceite:**
```
➡️ MAPE (erro médio) < 15%
➡️ Previsão por vendedor/segmento
➡️ Atualização semanal do modelo
```

---

### 2.2 Dashboard de Previsões

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 2.2.1 | Criar widget de forecast no dashboard | Frontend | ✅ |
| 2.2.2 | Implementar comparativo previsto vs realizado | Frontend | ✅ |
| 2.2.3 | Implementar alertas de desvio | Backend | ✅ |
| 2.2.4 | Criar relatório de forecast mensal | Backend | ✅ |

**Critério de Aceite:**
```
➡️ Gerentes veem previsão da equipe
➡️ Vendedores veem própria previsão
➡️ Alerta quando desvio > 20%
```

---

## 🔴 BLOCO 3 — CLASSIFICAÇÃO DE RISCO

### 3.1 Risco de Churn

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 3.1.1 | Definir features de churn | Data | ✅ |
| 3.1.2 | Treinar modelo de classificação | Data | ✅ |
| 3.1.3 | Criar score diário por cliente | Backend | ✅ |
| 3.1.4 | Criar endpoint `/api/ai/churn-risk` | Backend | ✅ |
| 3.1.5 | Integrar score no contexto do Pricing Agent | Backend | ✅ |

**Features de churn:**
- Dias desde último pedido
- Variação do ticket médio
- Frequência de compra (tendência)
- Interações recentes (positivas/negativas)
- Reclamações ou devoluções

**Critério de Aceite:**
```
➡️ Score 0-100 por cliente
➡️ Atualização diária
➡️ AUC-ROC > 0.75
```

---

### 3.2 Risco Econômico (Pricing)

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 3.2.1 | Implementar classificação automática de risco | Backend | ✅ |
| 3.2.2 | Integrar risco no PricingDecisionEvent | Backend | ✅ |
| 3.2.3 | Criar alertas proativos de exceção | Backend | ✅ |
| 3.2.4 | Implementar sugestão de ação por risco | Backend | ✅ |

**Níveis de risco:**
| Nível | Critério | Ação |
|-------|----------|------|
| LOW | Margem > 25%, cliente OK | Aprovar automático |
| MEDIUM | Margem 20-25% ou cliente restrito | Monitorar |
| HIGH | Margem < 20% ou cliente risco | Requerer aprovação |
| CRITICAL | Margem < 15% ou cliente bloqueado | Bloquear |

**Critério de Aceite:**
```
➡️ Todo evento tem risk_level
➡️ Alertas enviados para gerentes
➡️ Dashboard mostra distribuição de risco
```

---

## 🔄 BLOCO 4 — AUTOMAÇÃO DE FOLLOW-UPS

### 4.1 Regras de Automação

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 4.1.1 | Criar tabela `automation_rules` | Backend | ✅ |
| 4.1.2 | Implementar engine de regras | Backend | ✅ |
| 4.1.3 | Criar regras padrão de follow-up | Backend | ✅ |
| 4.1.4 | Implementar scheduler de automações | Backend | ✅ |

**Regras padrão:**

| Trigger | Ação | Prazo |
|---------|------|-------|
| Lead criado | Follow-up de acompanhamento | +3 dias |
| Lead sem interação 7 dias | Alerta ao vendedor | Imediato |
| Cliente sem compra 45 dias | Follow-up de reativação | Imediato |
| Pedido convertido | Follow-up de satisfação | +7 dias |
| Cliente em risco de churn | Follow-up urgente | Imediato |

**Critério de Aceite:**
```
➡️ Regras executam automaticamente
➡️ Vendedor pode desativar por cliente
➡️ Log de automações executadas
```

---

### 4.2 Notificações Inteligentes

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 4.2.1 | Implementar push notifications (PWA) | Frontend | ✅ |
| 4.2.2 | Criar templates de notificação | Backend | ✅ |
| 4.2.3 | Implementar preferências de notificação | Backend | ✅ |
| 4.2.4 | Integrar com automações | Backend | ✅ |

**Tipos de notificação:**
- 📅 Follow-up vencido
- 🔴 Cliente em risco
- 🎯 Meta próxima (90%)
- 📦 Novo pedido do cliente
- ⚠️ Exceção pendente (gerentes)

**Critério de Aceite:**
```
➡️ Push funciona no PWA
➡️ Usuário controla preferências
➡️ Notificações não são spam
```

---

## 💡 BLOCO 5 — RECOMENDAÇÕES INTELIGENTES

### 5.1 Recomendação de Produtos

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 5.1.1 | Implementar algoritmo de recomendação (Cross-sell) | Backend | ✅ |
| 5.1.2 | Sugerir produtos baseados em histórico (Reposição) | Backend | ✅ |
| 5.1.3 | Criar endpoint de recomendações | Backend | ✅ |
| 5.1.4 | Exibir recomendações no Detalhe do Cliente | Frontend | ✅ |
| 5.1.5 | Exibir recomendações no Carrinho de Produtos | Frontend | ✅ |

**Tipos de recomendação:**
- Cross-sell: "Clientes que compraram X também compraram Y"
- Reposição: "Cliente costuma comprar X a cada 30 dias"
- Complementar: "Produto X combina com Y"

**Critério de Aceite:**
```
➡️ Recomendações relevantes
➡️ Respeita política de preços
➡️ Tracking de conversão ✅
```

---

### 5.2 Recomendação de Desconto

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 5.2.1 | Analisar histórico de descontos por perfil | Data | ✅ |
| 5.2.2 | Criar modelo de desconto ótimo | Data | ✅ |
| 5.2.3 | Integrar sugestão no fluxo de desconto | Frontend | ✅ |
| 5.2.4 | Validar sugestão contra política | Backend | ✅ |

**Critério de Aceite:**
```
➡️ Sugestão maximiza conversão dentro da política
➡️ Nunca sugere desconto inválido
➡️ Explica o raciocínio
```

---

## 📱 BLOCO 6 — PWA E MOBILE

### 6.1 Progressive Web App

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 6.1.1 | Configurar Service Worker | Frontend | ✅ |
| 6.1.2 | Implementar manifest.json | Frontend | ✅ |
| 6.1.3 | Configurar cache de assets | Frontend | ✅ |
| 6.1.4 | Implementar instalação (Add to Home) | Frontend | ✅ |
| 6.1.5 | Testar em iOS e Android | QA | ✅ |

**Critério de Aceite:**
```
➡️ App instalável no celular
➡️ Funciona offline (consultas básicas)
➡️ Push notifications funcionam
```

---

### 6.2 Otimizações Mobile

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 6.2.1 | Otimizar layout para mobile | Frontend | ✅ |
| 6.2.2 | Implementar gestos (swipe, pull-to-refresh) | Frontend | ✅ |
| 6.2.3 | Otimizar performance (lazy loading) | Frontend | ✅ |
| 6.2.4 | Implementar modo offline básico | Frontend | ✅ |

---

## 📊 BLOCO 7 — DASHBOARD CUSTOMIZÁVEL

### 7.1 Widgets Configuráveis

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 7.1.1 | Criar sistema de widgets | Frontend | ✅ |
| 7.1.2 | Implementar drag-and-drop | Frontend | ✅ |
| 7.1.3 | Criar biblioteca de widgets | Frontend | ✅ |
| 7.1.4 | Persistir configuração por usuário | Backend | ✅ |

**Widgets disponíveis:**
- Métricas de vendas
- Leads abertos
- Follow-ups pendentes
- Clientes em risco
- Meta do mês
- Últimos pedidos
- Recomendações IA

**Critério de Aceite:**
```
➡️ Usuário personaliza seu dashboard
➡️ Configuração salva no servidor
➡️ Widgets responsivos
```

---

## 🧪 BLOCO 8 — TESTES E VALIDAÇÃO

### 8.1 Testes de IA

| # | Teste | Resultado Esperado | Status |
|---|-------|-------------------|--------|
| 8.1.1 | Chatbot responde consultas corretamente | Dados corretos | ✅ |
| 8.1.2 | Chatbot executa ações com confirmação | Ação executada | ✅ |
| 8.1.3 | Chatbot não sugere desconto inválido | Erro ou ajuste | ✅ |
| 8.1.4 | Forecast tem erro < 15% | MAPE < 15% | ✅ |
| 8.1.5 | Churn score identifica clientes em risco | AUC > 0.75 | ✅ |
| 8.1.6 | Recomendações são relevantes | CTR > 5% | ✅ |

### 8.2 Testes de Integração

| # | Teste | Resultado Esperado | Status |
|---|-------|-------------------|--------|
| 8.2.1 | IA + Pricing Agent | IA respeita política | ✅ |
| 8.2.2 | Automação + Follow-up | Follow-ups criados | ✅ |
| 8.2.3 | Push + PWA | Notificações chegam | ✅ |
| 8.2.4 | Offline + Sync | Dados sincronizam | ✅ |

---

## 📦 BLOCO 9 — ENTREGA E COMUNICAÇÃO

### 9.1 Comunicação

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 9.1.1 | Treinar equipe no chatbot | Produto | ✅ |
| 9.1.2 | Documentar comandos do chatbot | Produto | ✅ |
| 9.1.3 | Comunicar novas automações | Produto | ✅ |
| 9.1.4 | Coletar feedback dos usuários | Produto | ✅ |

### 9.2 Documentação

| # | Documento | Status |
|---|-----------|--------|
| 9.2.1 | Guia do Chatbot IA | ✅ |
| 9.2.2 | Manual de Automações | ✅ |
| 9.2.3 | FAQ de IA | ✅ |

---

## 🏁 DEFINIÇÃO DE "Q2 CONCLUÍDO"

O Q2 **só está concluído** quando todas as afirmações forem verdadeiras:

| # | Afirmação | Status |
|---|-----------|--------|
| 1 | ✔️ Chatbot responde consultas e executa ações | ✅ |
| 2 | ✔️ Previsão de vendas funcionando | ✅ |
| 3 | ✔️ Classificação de risco automática | ✅ |
| 4 | ✔️ Follow-ups automatizados | ✅ |
| 5 | ✔️ IA nunca burla política | ✅ |
| 6 | ✔️ PWA instalável e funcional | ✅ |
| 7 | ✔️ Dashboard customizável | ✅ |

---

## 📅 CRONOGRAMA SUGERIDO

| Semana | Bloco | Entregas |
|--------|-------|----------|
| **1-2** | Bloco 1.1-1.2 | Infra IA, consultas chatbot |
| **3-4** | Bloco 1.3-1.4 | Ações chatbot, interface |
| **5-6** | Bloco 2 | Previsão de vendas |
| **7-8** | Bloco 3 | Classificação de risco |
| **9-10** | Bloco 4-5 | Automações, recomendações |
| **11-12** | Bloco 6-9 | PWA, dashboard, testes |

---

## 📊 PROGRESSO GERAL

| Bloco | Total | Concluído | % |
|-------|-------|-----------|---|
| 1. Chatbot IA | 20 | 20 | 100% |
| 2. Previsão de Vendas | 9 | 9 | 100% |
| 3. Classificação de Risco | 8 | 8 | 100% |
| 4. Automação Follow-ups | 8 | 8 | 100% |
| 5. Recomendações | 9 | 9 | 100% |
| 6. PWA/Mobile | 9 | 9 | 100% |
| 7. Dashboard Customizável | 4 | 4 | 100% |
| 8. Testes | 10 | 10 | 100% |
| 9. Comunicação | 7 | 7 | 100% |
| **TOTAL** | **84** | **84** | **100%** |

---

## 📚 Documentação Relacionada

- [Checklist Q1 2026](./CHECKLIST_Q1_2026.md) (pré-requisito)
- [Plano de Melhoria 2026](./PLANO_MELHORIA_2026.md)
- [API Pricing Agent](./API_PRICING_AGENT.md)
- [Especificação Pricing Agent](./SPEC_PRICING_AGENT.md)

---

## ⚠️ DEPENDÊNCIAS DO Q1

**O Q2 só pode iniciar se o Q1 estiver 100% concluído:**

- [x] Pricing Agent como autoridade única
- [x] Pricing Decision Event funcionando
- [x] Price Freeze implementado
- [x] Políticas versionadas
- [x] Segurança (bcrypt + 2FA)
- [x] Métricas de pricing

---

**© Rolemak - Sistema de Gestão de Leads**  
*Checklist Q2 2026 - IA Avançada*
