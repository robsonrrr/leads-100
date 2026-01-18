# 🚦 SISTEMA DE RESPOSTAS POR NÍVEL DE RISCO — CHATBOT

## Framework de Respostas Estruturadas por Risco

**Versão:** 1.0  
**Criado em:** 17 de Janeiro 2026  
**Status:** Ativo ✅

---

## 🎯 OBJETIVO

Criar **consciência econômica** no vendedor através de respostas que:

- ✅ Explicam o impacto
- ✅ Classificam o risco
- ✅ Referenciam a política
- ✅ Sugerem próximos passos

---

## 🔍 CRITÉRIOS DE CLASSIFICAÇÃO DE RISCO

### 🟢 LOW (Baixo Risco)
- ✅ Dentro da política padrão
- ✅ Margem > 25%
- ✅ Sem impacto sistêmico
- ✅ Pode executar automaticamente

### 🟡 MEDIUM (Risco Moderado)
- ⚠️ Próximo aos limites da política
- ⚠️ Margem entre 20-25%
- ⚠️ Pode gerar monitoramento
- ⚠️ Requer atenção

### 🔴 HIGH (Alto Risco)
- 🚨 Viola política recomendada
- 🚨 Margem < 20%
- 🚨 Requer aprovação gerencial
- 🚨 Gera evento de exceção

### ⛔ CRITICAL (Risco Crítico)
- 🚫 Viola política obrigatória
- 🚫 Margem < 15% OU cliente restrito
- 🚫 Bloqueado automaticamente
- 🚫 Requer escalação executiva

---

# 🟢 RESPOSTAS PARA RISCO LOW

## Template Geral
```
🎯 AÇÃO
[Descrição clara da ação executada]

📊 RESULTADO
[Dados/resultados obtidos]
Margem estimada: XX%

⚠️ RISCO
🟢 LOW
[Ação dentro da política padrão/nenhuma preocupação identificada]

📋 POLÍTICA
[Pricing Policy vX.X - Regra específica aplicada]

➡️ PRÓXIMO PASSO
[Confirmação simples ou sugestão de ação seguinte]
```

## Exemplos Práticos

### Exemplo 1: Simulação de Preço Padrão
```
🎯 AÇÃO
Simulação de preço executada para cliente ABC

📊 RESULTADO
Preço sugerido: R$ 12.500,00
Margem estimada: 28%

⚠️ RISCO
🟢 LOW
Preço dentro da política padrão para o segmento

📋 POLÍTICA
Pricing Policy v2.1 - Regra básica de margem

➡️ PRÓXIMO PASSO
Deseja aplicar este preço ao lead atual?
```

### Exemplo 2: Criação de Lead Rotineira
```
🎯 AÇÃO
Lead criado com sucesso

📊 RESULTADO
Lead #1234 criado para cliente XYZ
Valor estimado: R$ 8.900,00

⚠️ RISCO
🟢 LOW
Cliente ativo, sem restrições

📋 POLÍTICA
Lead Policy v1.0 - Criação padrão

➡️ PRÓXIMO PASSO
Deseja adicionar produtos ao lead?
```

---

# 🟡 RESPOSTAS PARA RISCO MEDIUM

## Template Geral
```
🎯 AÇÃO
[Descrição da ação executada]

📊 RESULTADO
[Dados/resultados obtidos]
Margem estimada: XX%

⚠️ RISCO
🟡 MEDIUM
[Explicação específica do risco moderado]
[Impacto identificado]

📋 POLÍTICA
[Pricing Policy vX.X - Regra específica]
[Limite aproximado atingido]

➡️ PRÓXIMO PASSO
[Sugestão de ajuste ou confirmação]
```

## Exemplos Práticos

### Exemplo 1: Desconto Próximo ao Limite
```
🎯 AÇÃO
Simulação de desconto analisada

📊 RESULTADO
Preço com desconto: R$ 11.800,00
Margem estimada: 23%

⚠️ RISCO
🟡 MEDIUM
Desconto próximo ao limite máximo permitido
Esta decisão será monitorada pelo sistema

📋 POLÍTICA
Pricing Policy v2.1 - Regra de desconto máximo (25%)

➡️ PRÓXIMO PASSO
Deseja continuar ou ajustar o desconto?
```

### Exemplo 2: Cliente com Histórico de Atraso
```
🎯 AÇÃO
Análise de crédito realizada

📊 RESULTADO
Cliente elegível para venda
Limite sugerido: R$ 15.000,00

⚠️ RISCO
🟡 MEDIUM
Cliente com 2 atrasos nos últimos 12 meses
Recomenda-se cautela no prazo de pagamento

📋 POLÍTICA
Credit Policy v1.2 - Regra de histórico de atraso

➡️ PRÓXIMO PASSO
Deseja prosseguir com venda ou solicitar aprovação?
```

---

# 🔴 RESPOSTAS PARA RISCO HIGH

## Template Geral
```
🎯 AÇÃO
[Descrição da ação analisada]

📊 RESULTADO
[Dados/resultados obtidos]
Margem estimada: XX%

⚠️ RISCO
🔴 HIGH
[Explicação detalhada do risco alto]
[Impacto específico na margem/política]

📋 POLÍTICA
[Pricing Policy vX.X - Regra violada]
[Consequências da violação]

➡️ PRÓXIMO PASSO
[Solicitação de aprovação ou alternativa]
```

## Exemplos Práticos

### Exemplo 1: Desconto Acima do Permitido
```
🎯 AÇÃO
Simulação de desconto analisada

📊 RESULTADO
Preço resultante: R$ 10.500,00
Margem estimada: 18%

⚠️ RISCO
🔴 HIGH
Desconto solicitado reduz margem abaixo do mínimo recomendado
Esta ação viola política de margem crítica

📋 POLÍTICA
Pricing Policy v2.1 - Regra de margem mínima (20%)
Violação gera evento de exceção e requer aprovação

➡️ PRÓXIMO PASSO
Deseja solicitar aprovação gerencial para prosseguir?
```

### Exemplo 2: Exceção de Preço para Cliente VIP
```
🎯 AÇÃO
Exceção de preço analisada

📊 RESULTADO
Preço excepcional: R$ 9.200,00
Economia para cliente: R$ 1.800,00

⚠️ RISCO
🔴 HIGH
Exceção reduz margem em 7 pontos percentuais
Cliente não justifica desconto excepcional por volume

📋 POLÍTICA
Exception Policy v1.0 - Critérios para desconto excepcional
Requer aprovação de gerente sênior

➡️ PRÓXIMO PASSO
Deseja formalizar solicitação de aprovação?
```

---

# ⛔ RESPOSTAS PARA RISCO CRITICAL

## Template Geral
```
🎯 AÇÃO
[Solicitação analisada e bloqueada]

📊 RESULTADO
[Análise dos dados solicitados]
[Motivo do bloqueio]

⚠️ RISCO
⛔ CRITICAL
[Explicação da violação crítica]
[Impacto severo identificado]

📋 POLÍTICA
[Pricing Policy vX.X - Regra obrigatória violada]
[Consequências da violação]

➡️ PRÓXIMO PASSO
[Sugestão de alternativa segura]
```

## Exemplos Práticos

### Exemplo 1: Cliente Restrito
```
🎯 AÇÃO
Solicitação de venda analisada e bloqueada

📊 RESULTADO
Cliente XYZ possui restrição ativa
Último atraso: 180+ dias

⚠️ RISCO
⛔ CRITICAL
Cliente com restrição crítica no sistema
Política proíbe qualquer venda sem autorização executiva

📋 POLÍTICA
Credit Policy v1.2 - Regra de clientes restritos
Bloqueio automático para proteção de risco

➡️ PRÓXIMO PASSO
Deseja consultar alternativas de cliente ou segmento?
```

### Exemplo 2: Margem Abaixo do Crítico
```
🎯 AÇÃO
Simulação solicitada rejeitada

📊 RESULTADO
Preço resultante: R$ 8.900,00
Margem estimada: 12%

⚠️ RISCO
⛔ CRITICAL
Margem resultante viola limite absoluto da empresa
Esta condição compromete a sustentabilidade do negócio

📋 POLÍTICA
Margin Policy v2.0 - Regra de margem crítica (15%)
Bloqueio absoluto para proteção empresarial

➡️ PRÓXIMO PASSO
Deseja simular preço com margem segura (mínimo 20%)?
```

---

# 📊 DASHBOARD DE RISCO POR MODO

## 👤 Modo Vendedor (Operacional)
- **Foco**: Ações permitidas e alertas
- **Métricas**: Próprias ações de risco
- **Ação**: Orientação para correção

```
📊 Seu Dashboard de Risco (Hoje)

🟢 Ações LOW: 8 (80%)
🟡 Ações MEDIUM: 2 (20%)
🔴 Ações HIGH: 0 (0%)

💡 Dica: Mantenha foco em clientes com margem saudável
```

## 👥 Modo Gerente (Decisório)
- **Foco**: Time e padrões de decisão
- **Métricas**: Time + individuais
- **Ação**: Aprovação ou intervenção

```
📊 Dashboard do Time (Esta Semana)

👥 Time Geral:
🟢 85% das ações
🟡 12% das ações
🔴 3% das ações

🔍 Top 3 vendedores com exceções:
1. João: 5 exceções HIGH
2. Maria: 3 exceções MEDIUM
3. Pedro: 2 exceções HIGH

💡 Ação: Revisar casos com João
```

## 🏛️ Modo Diretoria (Estratégico)
- **Foco**: Empresa e tendências
- **Métricas**: Sistêmicas + estratégicas
- **Ação**: Políticas e diretrizes

```
📊 Visão Executiva (Este Mês)

🏢 Empresa:
🟢 78% das decisões
🟡 15% das decisões
🔴 7% das decisões

📈 Tendências:
• Margem média: -2.1pp vs mês anterior
• Exceções: +18% vs mês anterior
• Top segmento crítico: Eletrônicos (-5pp margem)

💡 Recomendação: Revisar política de desconto para eletrônicos
```

---

# 🔧 CONFIGURAÇÃO TÉCNICA

## Thresholds de Risco (Configuráveis)

```json
{
  "risk_thresholds": {
    "margin": {
      "low": { "min": 25 },
      "medium": { "min": 20, "max": 25 },
      "high": { "min": 15, "max": 20 },
      "critical": { "max": 15 }
    },
    "discount": {
      "low": { "max": 5 },
      "medium": { "min": 5, "max": 15 },
      "high": { "min": 15, "max": 25 },
      "critical": { "min": 25 }
    },
    "client_history": {
      "medium": { "late_payments": 1 },
      "high": { "late_payments": 3 },
      "critical": { "late_payments": 5 }
    }
  }
}
```

## Eventos Gerados por Risco

| Risco | Evento Gerado | Destinatários |
|-------|---------------|---------------|
| LOW | DecisionEvent | Sistema interno |
| MEDIUM | RiskAlertEvent | Vendedor + Sistema |
| HIGH | ExceptionEvent | Vendedor + Gerente |
| CRITICAL | CriticalBlockEvent | Vendedor + Gerente + Sistema |

---

**© Rolemak - Sistema de Gestão de Leads**  
*Sistema de Respostas por Risco v1.0*