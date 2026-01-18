# 🔗 CHATBOT COMO NÓ DO CONTEXT GRAPH

## Integração Estrutural do Chatbot no Sistema de Decisão

**Versão:** 1.0  
**Criado em:** 17 de Janeiro 2026  
**Status:** Em Implementação 🔄

---

## 🎯 VISÃO GERAL

O chatbot deixa de ser uma **ferramenta isolada** e se torna um **componente estrutural** do sistema de decisão, integrado ao Context Graph como um nó inteligente que:

- ✅ Traduz linguagem humana → intenção estruturada
- ✅ Injeta contexto relevante (usuário, cliente, lead)
- ✅ Submete ações aos agentes especializados
- ✅ Verbaliza decisões, riscos e políticas
- ✅ Registra eventos conversacionais auditáveis

---

## 📐 POSIÇÃO NO GRAFO

### Arquitetura Atual
```
[Usuário Humano]
        ↓
   [Chatbot Interface]
        ↓
[Intent + Context Resolver]
        ↓
[Pricing Agent / CRM Core / IA]
        ↓
   [Decision Event]
        ↓
[Context Graph + Memory Bank]
```

### Fluxo Detalhado
```
1. Usuário → Comando natural ("dê 10% desconto")
2. Chatbot → Intent Resolution + Context Injection
3. Sistema → Policy Validation + Risk Assessment
4. Chatbot → Response Formatting (RISCO + POLÍTICA)
5. Context Graph → Event Storage + Learning
```

---

## 🔄 RESPONSABILIDADES NO GRAFO

### 1. Input Processing (Entrada)
- **Tradução**: Linguagem natural → intenção estruturada
- **Context Injection**: Adiciona usuário, cliente, lead atual
- **Entity Extraction**: Identifica entidades (IDs, valores, produtos)

### 2. Decision Routing (Roteamento)
- **Policy Check**: Valida contra regras vigentes
- **Agent Selection**: Escolhe agente apropriado (Pricing/CRM/IA)
- **Risk Assessment**: Classifica risco da ação

### 3. Response Formatting (Saída)
- **Structured Response**: Formato AÇÃO + RESULTADO + RISCO + POLÍTICA
- **Policy Reference**: Cita política específica aplicada
- **Next Steps**: Sugere ações seguintes baseadas no contexto

### 4. Event Generation (Auditoria)
- **Event Creation**: Gera ChatInteractionEvent estruturado
- **Context Linking**: Conecta com outros eventos do grafo
- **Learning Data**: Alimenta sistema de aprendizado

---

## 📊 EVENTOS GERADOS PELO CHATBOT

### ChatInteractionEvent (Principal)
```json
{
  "event_type": "ChatInteractionEvent",
  "event_id": "chat-uuid-123",
  "timestamp": "2026-01-17T14:30:00Z",

  "user_context": {
    "user_id": "user-456",
    "role": "vendedor|gerente|diretoria",
    "session_id": "session-789"
  },

  "intent_data": {
    "raw_input": "dê 10% desconto para cliente 123",
    "intent": "apply_discount",
    "confidence": 0.92,
    "entities": {
      "discount_percent": 10,
      "cliente_id": "123"
    }
  },

  "decision_context": {
    "linked_event_id": "decision-uuid-101",
    "policy_version": "v2.1",
    "risk_level": "HIGH",
    "approved": false
  },

  "response_data": {
    "response_format": "structured",
    "risk_explained": true,
    "policy_referenced": true
  },

  "metadata": {
    "processing_time_ms": 450,
    "model_version": "gpt-4-turbo",
    "policy_engine_version": "v1.2"
  }
}
```

### RiskAlertEvent (Quando risco ≥ MEDIUM)
```json
{
  "event_type": "RiskAlertEvent",
  "triggered_by": "chat-uuid-123",
  "risk_level": "HIGH",
  "alert_targets": ["user-456", "gerente-789"],
  "context": {
    "cliente_id": "123",
    "valor_original": 15000,
    "valor_solicitado": 13500,
    "margem_original": 25,
    "margem_resultante": 18
  }
}
```

### ContextUpdateEvent (Atualização de Contexto)
```json
{
  "event_type": "ContextUpdateEvent",
  "source": "chatbot",
  "updates": {
    "current_cliente": "123",
    "current_lead": "lead-456",
    "last_action": "discount_simulation",
    "risk_accumulated": "MEDIUM"
  }
}
```

---

## 🔗 CONEXÕES NO GRAFO

### Conexões de Entrada (Input Links)
```
Chatbot ← UserIntent (do usuário)
Chatbot ← UserRole (do sistema de auth)
Chatbot ← CurrentContext (do Context Graph)
Chatbot ← PolicyRules (do Policy Guardian)
```

### Conexões de Saída (Output Links)
```
Chatbot → DecisionAgent (Pricing/CRM/IA)
Chatbot → RiskEngine (classificação)
Chatbot → ContextGraph (atualização)
Chatbot → AuditLog (registro)
```

### Conexões Laterais (Cross Links)
```
Chatbot ↔ PricingAgent (simulações)
Chatbot ↔ CRMCore (dados de cliente/lead)
Chatbot ↔ IAAgent (insights e recomendações)
```

---

## 🧠 SISTEMA DE MEMÓRIA CONVERSACIONAL

### Context Window Management
```
Sessão ativa: 30 minutos
Máximo de turnos: 50
Contexto preservado:
- Cliente atual
- Lead atual
- Últimas 5 ações
- Risco acumulado da sessão
```

### Memory Injection Points
```
Antes da Intent Resolution:
- "Usuário é gerente, dar mais contexto de risco"
- "Cliente atual é VIP, cuidado com exceções"
- "Sessão tem 3 ações HIGH já, alertar"

Depois da Decision:
- "Registrar que usuário foi alertado sobre risco"
- "Atualizar contexto com decisão tomada"
- "Alimentar learning com padrão identificado"
```

---

## 🎭 ADAPTAÇÃO POR PERFIL

### Vendedor (Operacional)
**Context Injection:**
- "Usuário é vendedor, focar em execução"
- "Dar respostas práticas e diretas"
- "Mostrar próximos passos acionáveis"

**Memory Focus:**
- Próprias vendas e clientes
- Limites pessoais de desconto
- Histórico de próprias decisões

### Gerente (Decisório)
**Context Injection:**
- "Usuário é gerente, mostrar time e padrões"
- "Incluir métricas de equipe"
- "Permitir aprovações e rejeições"

**Memory Focus:**
- Time supervisionado
- Padrões de decisão da equipe
- Políticas ativas

### Diretoria (Estratégico)
**Context Injection:**
- "Usuário é diretoria, foco sistêmico"
- "Mostrar tendências e impacto global"
- "Incluir recomendações executivas"

**Memory Focus:**
- Métricas empresariais
- Tendências de mercado
- Políticas estratégicas

---

## 🔄 CICLO DE APRENDIZADO

### 1. Data Collection (Coleta)
- Todo ChatInteractionEvent é armazenado
- Contexto completo preservado
- Resultado da decisão registrado

### 2. Pattern Recognition (Reconhecimento)
- IA identifica padrões de risco
- Agrupa decisões similares
- Detecta comportamentos atípicos

### 3. Model Update (Atualização)
- Modelo de intent resolution aprimorado
- Thresholds de risco recalibrados
- Sugestões de política otimizadas

### 4. Feedback Loop (Retroalimentação)
- Novos padrões influenciam respostas
- Contexto mais inteligente injetado
- Respostas mais precisas geradas

---

## 📊 MÉTRICAS DE INTEGRAÇÃO

### Performance do Nó
- **Latência**: < 500ms para respostas simples
- **Acurácia**: > 95% de compreensão
- **Context Preservation**: > 98% de contexto mantido

### Qualidade de Integração
- **Event Generation**: 100% das ações geram eventos
- **Context Accuracy**: > 95% de contexto correto
- **Risk Classification**: > 90% de acurácia

### Impacto no Sistema
- **Decision Quality**: +15% em decisões informadas
- **Risk Awareness**: +200% em verbalização de risco
- **Policy Compliance**: +25% em aderência

---

## 🔧 IMPLEMENTAÇÃO TÉCNICA

### Componentes Necessários
```typescript
interface ChatbotNode {
  // Input processing
  processIntent(input: string, context: Context): IntentData

  // Decision routing
  routeToAgent(intent: IntentData): AgentResponse

  // Response formatting
  formatResponse(decision: DecisionData, risk: RiskLevel): StructuredResponse

  // Event generation
  generateEvents(interaction: InteractionData): Event[]
}

interface ContextInjector {
  injectUserContext(userId: string): UserContext
  injectBusinessContext(clienteId?: string, leadId?: string): BusinessContext
  injectSessionContext(sessionId: string): SessionContext
}

interface EventGenerator {
  createInteractionEvent(interaction: InteractionData): ChatInteractionEvent
  createRiskEvent(riskData: RiskData): RiskAlertEvent
  createContextEvent(updates: ContextUpdates): ContextUpdateEvent
}
```

### Integração com Context Graph
```typescript
class ChatbotContextGraphNode implements ContextGraphNode {
  async process(input: ChatInput): Promise<ChatOutput> {
    // 1. Inject context
    const fullContext = await this.contextInjector.inject(input)

    // 2. Process intent
    const intent = await this.intentResolver.resolve(input.text, fullContext)

    // 3. Route to appropriate agent
    const decision = await this.agentRouter.route(intent)

    // 4. Assess risk
    const risk = await this.riskAssessor.assess(decision, intent)

    // 5. Format response
    const response = await this.responseFormatter.format(decision, risk)

    // 6. Generate events
    const events = await this.eventGenerator.generate(input, intent, decision, risk)

    // 7. Update context graph
    await this.contextGraph.update(events)

    return response
  }
}
```

---

## 🚀 PRÓXIMOS PASSOS DE IMPLEMENTAÇÃO

### Fase 1: Core Integration (2 semanas)
- [ ] Implementar interfaces TypeScript
- [ ] Integrar com Context Graph existente
- [ ] Criar event generators

### Fase 2: Risk & Policy (2 semanas)
- [ ] Implementar risk assessment engine
- [ ] Integrar com Policy Guardian
- [ ] Criar response formatters

### Fase 3: Learning & Optimization (2 semanas)
- [ ] Implementar feedback loop
- [ ] Adicionar pattern recognition
- [ ] Otimizar performance

### Fase 4: Production & Monitoring (1 semana)
- [ ] Deploy em produção
- [ ] Configurar monitoring
- [ ] A/B testing com usuários

---

**© Rolemak - Sistema de Gestão de Leads**  
*Integração Context Graph v1.0*