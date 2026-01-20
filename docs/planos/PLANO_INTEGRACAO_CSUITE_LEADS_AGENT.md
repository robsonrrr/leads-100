# Plano de Integração: C-Suite Ecosystem & Leads Agent

**Status:** Rascunho Inicial
**Data:** 2026-01-19
**Objetivo:** Transformar o **Leads Agent** (Operacional) na interface executiva conectada ao **C-Suite Ecosystem** (Estratégico/Autônomo).

---

## 1. Visão Geral

O objetivo deste plano é estabelecer as conexões funcionais entre a camada de inteligência autônoma (`c-suite`) e a camada operacional humana (`leads-agent`).
Atualmente, o `leads-agent` possui lógica simplificada. O objetivo é substituir/enriquecer essa lógica delegando decisões complexas aos Agentes C-Suite.

### Arquitetura Alvo
*   **Cérebro (Strategy):** C-Suite Agents (Pricing, Sales, Risk, CEO/CRO).
*   **Corpo (Execution):** Leads Agent (Interface Frontend React + Backend Express).

---

## 2. Áreas de Integração e Fases

### Fase 1: Motor de Precificação e Promoções (Prioridade Alta)
*Substituir a lógica estática de preços por chamadas ao Pricing Agent.*

1.  **Criação de Orçamentos (Quoting):**
    *   **Atual:** O `leads-agent` calcula preço base - desconto manual.
    *   **Novo:** O backend faz uma chamada POST para `c-suite/agents/pricing`.
    *   **Payload:** Cliente, Produto, Volume, Histórico.
    *   **Retorno:** Preço Aprovado, Desconto Máximo (Elasticidade), Margem.
2.  **Validação de Promoções:**
    *   Utilizar o módulo `promotions.py` do Pricing Agent para validar se os cupons ou campanhas aplicados são válidos para aquele perfil de cliente segundo a estratégia atual.

**Dependência:** `MIGRACAO_PRICING_ADMIN.md` (Em andamento - prepara a UI para configurar isso).

### Fase 2: Segurança Financeira e Risco (Order to Cash)
*Integrar o Risk Agent no fluxo de checkout.*

1.  **Pré-Checkout (Validação de Pedido):**
    *   Antes de criar um pedido (`orders.routes.js`), consultar o `Risk Agent`.
    *   **Ação:** Enviar dados do carrinho e cliente.
    *   **Retorno:** `RISK.GREEN` (Prosseguir), `RISK.YELLOW` (Requer aprovação gerente), `RISK.RED` (Bloquear - ex: inadimplência ou fraude).
2.  **Bloqueio Inteligente:**
    *   Exibir alertas claros no Frontend: *"Pedido bloqueado pelo Departamento de Risco: Score de crédito abaixo do limite para este volume."*

### Fase 3: Sales Co-Pilot (Inteligência de Vendas)
*Transformar o CRM passivo em um assistente proativo.*

1.  **Next Best Action (Próxima Melhor Ação):**
    *   Na Dashboard do Lead, integrar com o `Sales Agent`.
    *   O agente analisa o histórico e sugere: "Agendar Follow-up", "Oferecer Desconto de 5%", "Enviar Case de Sucesso".
2.  **Priorização de Leads:**
    *   Substituir a ordenação padrão por um "Score de Propensão de Compra" calculado pelo Sales Agent baseado em interações recentes.

### Fase 4: Inteligência de Mercado (Market Data)
*Enriquecer a visão do vendedor com dados externos.*

1.  **Dados de Competidores na Ponta:**
    *   Na tela de detalhes do produto, consumir o serviço `csuite-market-intelligence`.
    *   Exibir: Preço médio do concorrente e tendências de mercado.
    *   *Objetivo:* Dar argumentos de negociação para o vendedor humano.

### Fase 5: Alinhamento Estratégico (Top-Down)
*Conectar a estratégia da diretoria à operação diária.*

1.  **Notifications Feed:**
    *   O `CEO Agent` e `CRO Agent` podem publicar "Diretrizes" que aparecem no topo do Leads Agent.
    *   Exemplo: *"Atenção Vendas: Foco total na queima de estoque da linha X nesta semana."* (Gerado automaticamente quando o C-Suite detecta estoque parado).

---

## 3. Roteiro de Implementação Técnica

### Passo 1: Gateway de Comunicação (Infrastructure)
Como os agentes são serviços Python (frequentemente com endpoints FastAPI ou scripts de execução) e o Leads Agent é Node.js:
- [ ] Criar um Service Wrapper / Adapter no backend do `leads-agent` (`src/services/csuite-adapter.service.js`).
- [ ] Padronizar a autenticação entre os serviços.

### Passo 2: Protótipo de Precificação (Integration Pilot)
- [ ] Modificar `backend/src/controllers/pricing.controller.js` para chamar o Pricing Agent como teste.
- [ ] Validar latência e tratamento de erros (fallback se o agente estiver offline).

### Passo 3: UI Updates (Frontend)
- [ ] **Lead Dashboard:** Adicionar componente "AI Insights".
- [ ] **Checkout:** Adicionar step de validação de risco.
- [ ] **Notifications:** Criar tipo de notificação "Strategic Alert".

---

## 4. Próximos Passos Imediatos

1.  Aprovar este plano de integração.
2.  Mapear os endpoints exatos dos Agentes (que hoje podem estar apenas como classes Python e precisam ser expostos via API se ainda não estiverem).
3.  Iniciar a **Fase 1** em paralelo com a migração do Admin de Pricing.
