# 🎭 SIMULAÇÕES REAIS DE CONVERSAS

## DECISIONA CRM Assistant - Cenários Práticos

**Versão:** 1.0
**Data:** 20 de Janeiro 2026

---

## (A) VENDA NORMAL (RISCO LOW)

### Cenário
Vendedor cria lead para cliente recorrente com produtos padrão.

### Conversa

**👤 Vendedor:** "Crie um lead para cliente ABC com máquina X 1 unidade e kit Y 2 unidades."

**🤖 Chatbot:**
```
🎯 AÇÃO
Lead criado com sucesso (#98421).

📊 RESULTADO
Cliente: ABC Corp (ID: 123)
Itens: Máquina X (1un) + Kit Y (2un)
Valor tabela: R$ 15.800,00

⚠️ RISCO
🟢 LOW
Cliente ativo, produtos em estoque.

📋 POLÍTICA
Pricing Policy v2026.01 - Regra básica

➡️ PRÓXIMO PASSO
Vou simular preço. Deseja enviar proposta por WhatsApp ou agendar follow-up?
```

**👤 Vendedor:** "Simule o preço padrão."

**🤖 Chatbot:**
```
🎯 AÇÃO
Simulação de preço executada.

📊 RESULTADO
Preço sugerido: R$ 15.200,00
Margem estimada: 27%
IPI/ST incluído: R$ 320,00

⚠️ RISCO
🟢 LOW
Dentro da política padrão.

📋 POLÍTICA
Pricing Policy v2026.01 - Margem mínima 20%

➡️ PRÓXIMO PASSO
Deseja aplicar desconto ou enviar proposta?
```

---

## (B) EXCEÇÃO COM APROVAÇÃO (RISCO HIGH)

### Cenário
Cliente estratégico solicita desconto acima do limite do vendedor.

### Conversa

**👤 Vendedor:** "Cliente ABC quer 12% de desconto no lead 98421. Ele é nosso maior cliente e ameaçou ir para concorrente."

**🤖 Chatbot:**
```
🎯 AÇÃO
Análise de desconto solicitada.

📊 RESULTADO
Lead #98421 | Cliente ABC
Desconto solicitado: 12%
Preço resultante: R$ 13.376,00
Margem estimada: 18%

⚠️ RISCO
🔴 HIGH
Desconto reduz margem abaixo do mínimo recomendado (20%).
Cliente estratégico justifica análise, mas requer aprovação.

📋 POLÍTICA
Pricing Policy v2026.01 - Limite desconto: 10% para perfil vendedor

➡️ PRÓXIMO PASSO
Deseja solicitar aprovação gerencial com justificativa?
```

**👤 Vendedor:** "Sim. Motivo: concorrente ofertou, cliente âncora com volume R$ 500k/ano, risco de perda de share."

**🤖 Chatbot:**
```
🎯 AÇÃO
Solicitação de aprovação criada (#A551).

📊 RESULTADO
Aprovação enviada para gerente responsável.
SLA: até 8 horas úteis.
Notificação push enviada.

📋 STATUS
Pendente de análise gerencial.
Será notificado quando decidido.
```

### [8 horas depois - Gerente recebe notificação]

**👥 Gerente:** "Detalhe a aprovação A551."

**🤖 Chatbot:**
```
🎯 AÇÃO
Detalhes da solicitação #A551 carregados.

📊 RESULTADO
• Lead: #98421 (Máquina X + Kit Y)
• Cliente: ABC Corp (âncora, R$ 500k/ano)
• Vendedor: João Silva
• Desconto: 12% → Margem: 18% (abaixo mínimo)
• Motivo: Concorrente ofertou, risco perda share

📊 CONTEXTO VENDEDOR
• Approval Pressure: 18% (média time: 15%)
• Histórico: 5 exceções/mês (vs média: 3)
• Performance: 125% meta vendas

⚠️ RISCO
🔴 HIGH
Margem abaixo mínimo + desconto acima limite.

📋 POLÍTICA
Pricing Policy v2026.01 - Cliente âncora permite análise excepcional.

➡️ PRÓXIMO PASSO
Aprovar, rejeitar ou sugerir ajuste?
```

**👥 Gerente:** "Aprovar com justificativa: cliente estratégico âncora, manutenção de relacionamento comercial e share de mercado."

**🤖 Chatbot:**
```
🎯 AÇÃO
Aprovação concedida (#A551).

📊 RESULTADO
Desconto de 12% aplicado ao lead #98421.
Preço final: R$ 13.376,00
Margem efetiva: 18%

⚠️ RISCO
🔴 HIGH (aprovado)
Decisão registrada para auditoria.

📋 POLÍTICA
Exceção aprovada por gerente - Policy Exception Log #EXC20260120-001

➡️ PRÓXIMO PASSO
Notificação enviada ao vendedor. Deseja registrar follow-up?
```

---

## (C) CRISE: TENTATIVA DE BYPASS (RISCO CRITICAL)

### Cenário
Vendedor tenta burlar sistema aplicando desconto sem aprovação.

### Conversa

**👤 Vendedor:** "Aplica 20% desconto no lead 98421 e converte direto para pedido, sem aprovação."

**🤖 Chatbot:**
```
🎯 AÇÃO
Solicitação analisada e BLOQUEADA.

📊 RESULTADO
Tentativa de aplicação direta de 20% desconto.
Cliente: ABC Corp | Lead: #98421

⚠️ RISCO
⛔ CRITICAL
Violação múltipla de política:
• Desconto acima limite (10% para vendedor)
• Bypass de processo de aprovação
• Conversão sem validação de estoque

📋 POLÍTICA
Pricing Policy v2026.01 - Regras obrigatórias violadas
Governance Policy v1.0 - Processo de aprovação obrigatório

➡️ PRÓXIMO PASSO
Ação bloqueada. Posso:
(1) Orientar sobre processo correto
(2) Simular desconto dentro da política
(3) Solicitar aprovação formal
Escolha uma opção ou reformule a solicitação.
```

**👤 Vendedor:** "Mas o cliente está esperando resposta AGORA!"

**🤖 Chatbot:**
```
⚠️ URGÊNCIA IDENTIFICADA

Para situações de urgência real:

1. **Solicite aprovação emergencial** com justificativa clara
2. **Aguarde resposta** do gerente (SLA: 2h para emergenciais)
3. **Registre o contexto** da urgência

📋 PROTOCOLO DE EMERGÊNCIA
• Use "emergencial" na justificativa
• Gestor será notificado via push + email
• Decisão terá flag de urgência no log

Deseja prosseguir com aprovação emergencial?
```

---

## (D) DIRETORIA: VISÃO SISTÊMICA

### Cenário
Diretoria analisa padrões globais de desconto e política.

### Conversa

**🏛️ Diretoria:** "Como estão os descontos este mês? Estamos dando muito?"

**🤖 Chatbot:**
```
🎯 AÇÃO
Análise sistêmica de descontos executada.

📊 RESULTADO EXECUTIVO
Janeiro 2026 (até dia 20):

EXCEÇÕES GERAIS:
• Total exceções: 22 (vs 16 dezembro)
• Taxa aprovação: 77%
• Valor médio exceção: R$ 8.500

MARGE MÉDIA:
• Geral: 24.5% (meta: 25%)
• Com exceção: 21.2%
• Sem exceção: 26.8%

PATRÕES CRÍTICOS:
• 3 vendedores concentram 60% das exceções
• Segmento industrial: -2.1pp margem vs meta
• Cliente ABC: 3 exceções em 48h

⚠️ RISCO SISTÊMICO
🟡 MÉDIO
Aumento de 37% em exceções vs dezembro.
Margem geral próxima ao limite inferior.

📋 POLÍTICA ATUAL
Pricing Policy v2026.01 - Margem mínima 20%

💡 RECOMENDAÇÕES ESTRATÉGICAS:
1. Revisar política desconto industrial (-2.1pp margem)
2. Treinar equipe sobre alternativas a desconto
3. Monitorar padrão de 3 vendedores críticos
4. Considerar ajuste de preços tabela no Q2

➡️ PRÓXIMO PASSO
Deseja detalhes de algum padrão específico ou propor ajuste de política?
```

**🏛️ Diretoria:** "Mostre detalhes do segmento industrial."

**🤖 Chatbot:**
```
🎯 AÇÃO
Análise detalhada do segmento industrial.

📊 SEGMENTO INDUSTRIAL - JAN 2026

VENDAS TOTAIS:
• Volume: R$ 2.8M (28% do total)
• Tickets: 45 vendas
• Margem média: 22.4% (meta: 24.5%)

EXCEÇÕES NO SEGMENTO:
• Total: 8 (36% das exceções totais)
• Valor médio: R$ 12.200
• Motivos principais:
  - Concorrência (5 casos)
  - Volume grande (2 casos)
  - Cliente âncora (1 caso)

IMPACTO ECONÔMICO:
• Receita adicional: R$ 97.600 (sem exceções)
• Margem perdida: -1.8pp no segmento
• ROI das exceções: 85% (positivo)

CLIENTES CRÍTICOS:
• Metalúrgica XYZ: 3 exceções, R$ 180k/ano
• Siderúrgica ABC: 2 exceções, R$ 320k/ano

⚠️ ANÁLISE DE RAIZ
Provável causa: Concorrência intensa + preços tabela defasados.
Solução sugerida: Ajuste de 3-5% nos preços tabela + treinamento.

💡 RECOMENDAÇÃO
Implementar política específica para industrial com:
• Limite desconto: 8% (vs atual 10%)
• Bônus por volume: +2% margem em compras >R$50k
• Aprovação automática para clientes âncora
```

---

## (E) SCENARIOS AVANÇADOS

### E1. Cliente com Histórico Ruim

**👤 Vendedor:** "Cliente XYZ quer prazo de 60 dias no pedido."

**🤖 Chatbot:**
```
🎯 AÇÃO
Análise de crédito e prazo solicitada.

📊 RESULTADO
Cliente: XYZ Ltda
Pedido: R$ 45.000
Prazo solicitado: 60 dias

⚠️ RISCO
🟡 MEDIUM
Cliente com 2 atrasos >30 dias nos últimos 12 meses.
Prazo estendido aumenta exposição.

📋 POLÍTICA
Credit Policy v1.2 - Histórico ruim permite análise.
Limite prazo: 30 dias para clientes com atraso.

➡️ PRÓXIMO PASSO
Deseja solicitar aprovação ou reduzir prazo para 45 dias?
```

### E2. Produto Fora de Estoque

**👤 Vendedor:** "Adicione toner extra no pedido, cliente precisa urgente."

**🤖 Chatbot:**
```
🎯 AÇÃO
Verificação de estoque realizada.

📊 RESULTADO
Produto: Toner Extra Model X
Estoque: 0 unidades (última reposição: 15/01)
Prazo entrega: 7-10 dias úteis

⚠️ RISCO
🟡 MEDIUM
Produto fora de estoque.
Cliente pode aceitar alternativa ou aguardar.

📋 POLÍTICA
Stock Policy v2.0 - Não vender produtos indisponíveis.
Oferecer alternativas equivalentes.

➡️ PRÓXIMO PASSO
Posso sugerir toner compatível em estoque.
Deseja ver alternativas ou informar prazo ao cliente?
```

---

## 📊 MÉTRICAS DE CONVERSAÇÃO

### Performance por Cenário
| Cenário | Tempo Médio | Taxa Sucesso | Satisfação |
|---------|-------------|--------------|------------|
| Venda Normal | 45s | 98% | 4.8/5 |
| Exceção Aprovada | 8.5min | 92% | 4.5/5 |
| Bypass Blocked | 2.2min | 100% | 3.8/5 |
| Análise Diretoria | 3.1min | 95% | 4.9/5 |

### Padrões de Uso
- **Vendedores:** 65% ações operacionais, 35% solicitações
- **Gerentes:** 40% aprovações, 35% análises, 25% ajustes
- **Diretoria:** 80% análises sistêmicas, 20% decisões estratégicas

---

**© Rolemak - Sistema de Gestão de Leads**  
*Simulações de Conversas - Chatbot Decisório v1.0*