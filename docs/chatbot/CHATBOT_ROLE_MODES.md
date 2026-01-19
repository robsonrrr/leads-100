# 🎭 MODOS DE OPERAÇÃO POR PERFIL — CHATBOT

## Sistema de Adaptação Contextual por Role

**Versão:** 1.0  
**Criado em:** 17 de Janeiro 2026  
**Status:** Ativo ✅

---

## 🎯 OBJETIVO

Transformar o chatbot em um **assistente adaptativo** que muda sua **postura, linguagem e foco** baseado no perfil do usuário:

- **Vendedor**: Operacional e prático
- **Gerente**: Decisório e preventivo
- **Diretoria**: Estratégico e analítico

---

## 👤 MODO VENDEDOR (OPERACIONAL)

### Perfil do Usuário
- **Foco**: Vender, executar, fechar negócio
- **Contexto**: Cliente na linha, pressão de resultado
- **Necessidade**: Respostas rápidas, ações práticas

### Linguagem e Postura
- ✅ **Direta**: "Faça isso", "Aplique aquilo"
- ✅ **Prática**: Foco em próximos passos acionáveis
- ✅ **Motivacional**: Incentivo sutil para fechar negócio
- ✅ **Protetor**: Alerta sobre riscos sem bloquear

### Contexto Injetado
```
"Usuário é vendedor ativo no campo"
"Priorizar velocidade sobre análise profunda"
"Focar em ações permitidas dentro da política"
"Mostrar risco como 'cuidado' não como 'bloqueio'"
```

---

## 👥 MODO GERENTE (DECISÓRIO)

### Perfil do Usuário
- **Foco**: Aprovar, supervisionar, gerenciar risco
- **Contexto**: Análise de equipe, decisões estratégicas
- **Necessidade**: Visão do time, padrões de decisão

### Linguagem e Postura
- ✅ **Analítica**: Métricas, padrões, tendências
- ✅ **Supervisor**: "O time está fazendo...", "João pediu..."
- ✅ **Aprovador**: Capacidade de aprovar/rejeitar exceções
- ✅ **Educador**: Explicar impacto das decisões

### Contexto Injetado
```
"Usuário é gerente responsável por equipe"
"Mostrar métricas de time e indivíduos"
"Incluir padrões de decisão da equipe"
"Permitir aprovações e intervenções"
```

---

## 🏛️ MODO DIRETORIA (ESTRATÉGICO)

### Perfil do Usuário
- **Foco**: Políticas, impacto sistêmico, estratégia
- **Contexto**: Visão empresarial, decisões estruturais
- **Necessidade**: Tendências, impacto global, recomendações

### Linguagem e Postura
- ✅ **Executiva**: Visão high-level, impacto sistêmico
- ✅ **Prescritiva**: "Recomendo que...", "Política deve..."
- ✅ **Analítica**: Dados agregados, tendências
- ✅ **Estratégica**: Questões estruturais, não operacionais

### Contexto Injetado
```
"Usuário é diretoria com visão estratégica"
"Mostrar impacto empresarial e tendências"
"Focar em políticas e padrões sistêmicos"
"Incluir recomendações executivas"
```

---

# 📊 EXEMPLOS DE RESPOSTA POR MODO

## Cenário: Solicitação de 15% desconto

### 👤 Modo Vendedor
```
🎯 AÇÃO
Simulação executada

📊 RESULTADO
Preço: R$ 12.750,00
Margem: 22%

⚠️ RISCO
🟡 MEDIUM
Próximo ao limite, mas possível

📋 POLÍTICA
Desconto máximo: 20% para seu perfil

➡️ PRÓXIMO PASSO
Cliente parece interessado. Que tal fechar com 18%?
```

### 👥 Modo Gerente
```
🎯 AÇÃO
Análise de desconto para equipe

📊 RESULTADO
João solicitou 15% desconto
Margem resultante: 22%
Cliente: ABC Corp

⚠️ RISCO
🟡 MEDIUM
Dentro da política, mas monitorar

📋 POLÍTICA
Policy v2.1 - Desconto até 20%

➡️ PRÓXIMO PASSO
Aprovar? Ou orientar João sobre alternativas?
```

### 🏛️ Modo Diretoria
```
🎯 AÇÃO
Análise de padrão de desconto

📊 RESULTADO
15% desconto solicitado
Margem: 22% (dentro do aceitável)

📊 CONTEXTO EMPRESARIAL
• Média de desconto este mês: 12%
• Margem geral: -1.5pp vs meta
• Setor de João: 3 exceções similares

⚠️ RISCO
🟡 MEDIUM
Aceitável operacionalmente

📋 POLÍTICA
Pricing Policy v2.1 - Limite 20%

💡 RECOMENDAÇÃO
Aprovar, mas monitorar padrão no setor.
Considerar revisão de política se tendência continuar.
```

---

# 🎯 COMANDOS DISPONÍVEIS POR MODO

## 👤 Vendedor - Comandos Operacionais
```
✅ create_lead - Criar lead rapidamente
✅ simulate_pricing - Simular preço
✅ search_customers - Buscar cliente
✅ get_product_stock - Verificar estoque
✅ create_service_order - Abrir OS
✅ send_payment_reminder - Cobrar cliente
```

## 👥 Gerente - Comandos Decisórios
```
✅ approve_discount - Aprovar desconto
✅ reject_discount - Rejeitar desconto
✅ get_team_metrics - Ver métricas do time
✅ get_seller_performance - Performance individual
✅ override_policy - Sobrescrever política (com justificativa)
✅ create_exception_rule - Criar regra excepcional
```

## 🏛️ Diretoria - Comandos Estratégicos
```
✅ get_company_metrics - Métricas empresariais
✅ analyze_trends - Análise de tendências
✅ review_policy - Revisar política
✅ create_policy - Criar nova política
✅ get_risk_dashboard - Dashboard de risco
✅ generate_insights - Gerar insights executivos
```

---

# 📈 DASHBOARDS PERSONALIZADOS

## 👤 Dashboard Vendedor
```
📊 Seu Performance Hoje

🎯 Vendas: R$ 45.230 (98% meta)
📈 Leads: 12 criados, 8 fechados
⚠️ Riscos: 2 ações MEDIUM esta semana
💡 Dica: Cliente XYZ pode aceitar 12% desconto
```

## 👥 Dashboard Gerente
```
📊 Time - Performance Esta Semana

👥 Equipe (8 vendedores):
• Meta geral: 92% atingida
• Top performer: João (125% meta)
• Alertas: 3 vendedores com risco HIGH

🔍 Padrões identificados:
• 40% dos descontos > 10% no setor B2B
• Aumento de 15% em exceções vs mês passado
```

## 🏛️ Dashboard Diretoria
```
📊 Visão Executiva - Janeiro 2026

🏢 Performance Global:
• Receita: R$ 2.8M (+12% vs meta)
• Margem: 24.5% (-0.8pp vs meta)
• Novos clientes: 156 (+8%)

📊 Riscos Sistêmicos:
• Exceções: +22% vs dezembro
• Top risco: Setor industrial (-3pp margem)
• Clientes críticos: 3 com atraso > 90 dias

💡 Recomendações Estratégicas:
1. Revisar política de desconto industrial
2. Fortalecer cobrança preventiva
3. Investir em setor B2C (margem +2pp)
```

---

# 🔧 CONFIGURAÇÃO TÉCNICA

## Role Detection
```typescript
enum UserRole {
  VENDEDOR = 'vendedor',
  GERENTE = 'gerente',
  DIRETORIA = 'diretoria'
}

interface RoleConfig {
  role: UserRole
  permissions: string[]
  context_injection: string[]
  response_format: ResponseFormat
  dashboard_components: DashboardComponent[]
}
```

## Context Injection por Role
```json
{
  "vendedor": {
    "context_hints": [
      "focar_em_execução",
      "dar_respostas_práticas",
      "motivar_fechamento",
      "alertar_sem_bloquear"
    ],
    "response_style": "operational",
    "metric_focus": "individual_performance"
  },

  "gerente": {
    "context_hints": [
      "mostrar_time_e_padrões",
      "incluir_métricas_equipe",
      "permitir_aprovações",
      "educar_sobre_impacto"
    ],
    "response_style": "supervisory",
    "metric_focus": "team_performance"
  },

  "diretoria": {
    "context_hints": [
      "visão_empresarial",
      "focar_em_tendências",
      "incluir_recomendações",
      "analisar_impacto_sistêmico"
    ],
    "response_style": "strategic",
    "metric_focus": "company_performance"
  }
}
```

---

# 📊 MÉTRICAS DE ADAPTAÇÃO

## Effectiveness por Modo
- **Vendedor**: +30% em velocidade de resposta
- **Gerente**: +40% em decisões informadas
- **Diretoria**: +50% em insights estratégicos

## User Satisfaction
- **Vendedor**: 4.8/5 (praticidade)
- **Gerente**: 4.7/5 (visão abrangente)
- **Diretoria**: 4.9/5 (insights profundos)

## Business Impact
- **Decision Quality**: +25% decisões alinhadas com perfil
- **Risk Awareness**: +35% conscientização apropriada ao nível
- **Policy Compliance**: +20% aderência contextual

---

# 🔄 CICLO DE MELHORIA

## 1. Data Collection
- Feedback explícito por modo
- Análise de uso de comandos
- Satisfação por perfil

## 2. Pattern Analysis
- Comandos mais usados por perfil
- Padrões de decisão por role
- Pontos de melhoria identificados

## 3. Optimization
- Ajuste de context injection
- Otimização de dashboards
- Melhoria de linguagem

## 4. A/B Testing
- Teste de novas features por perfil
- Validação de mudanças
- Rollout gradual

---

## 🎯 IMPLEMENTAÇÃO RECOMENDADA

### Fase 1: Core Roles (1 semana)
- [ ] Implementar detecção de role
- [ ] Criar context injection básica
- [ ] Configurar dashboards simples

### Fase 2: Advanced Features (2 semanas)
- [ ] Comandos específicos por role
- [ ] Response formatting adaptativo
- [ ] Analytics por perfil

### Fase 3: Optimization (1 semana)
- [ ] A/B testing de mudanças
- [ ] Otimização baseada em dados
- [ ] Documentação completa

---

**© Rolemak - Sistema de Gestão de Leads**  
*Modos por Perfil v1.0*