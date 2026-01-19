# ✅ CHECKLIST TÉCNICO Q1 2026 — FUNDAÇÃO

## Sistema de Gestão de Leads - Rolemak

**Período:** Janeiro - Março 2026  
**Status:** Concluído ✅  
**Última atualização:** Janeiro 2026

---

## 🎯 Objetivo do Q1

> **Estabelecer segurança, autoridade econômica e base de IA**, sem quebrar operação.

### Critérios de Sucesso

- [x] Nenhum preço aplicado fora do Pricing Agent
- [x] Toda decisão de preço registrada
- [x] IA operando **sob política**
- [x] Segurança mínima enterprise ativa

---

## 🧱 BLOCO 1 — GOVERNANÇA DE PREÇO (OBRIGATÓRIO)

### 1.1 Formalizar Pricing Agent como autoridade única

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 1.1.1 | Bloquear qualquer cálculo de preço fora do Pricing Agent | Backend | ✅ |
| 1.1.2 | Revisar backend para remover lógica duplicada de preço | Backend | ✅ |
| 1.1.3 | Garantir que toda alteração de preço passe pelo Agent | Backend | ✅ |

**Pontos de integração obrigatórios:**
- [x] Adicionar item ao lead
- [x] Alterar quantidade
- [x] Aplicar desconto
- [x] Converter pedido

**Critério de Aceite:**
```
❌ Não existe endpoint que calcule preço direto
✅ Todo preço vem do Pricing Agent
```

---

### 1.2 Criar o Pricing Decision Event (mínimo viável)

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 1.2.1 | Criar tabela `pricing_decision_events` | Backend | ✅ |
| 1.2.2 | Implementar persistência do evento | Backend | ✅ |
| 1.2.3 | Integrar com ações do CRM | Backend | ✅ |

**Campos obrigatórios do evento:**
- [x] `event_id` (UUID)
- [x] `customer_context` (JSON)
- [x] `seller_context` (JSON)
- [x] `policy_version` (string)
- [x] `price_base` (decimal)
- [x] `discount_applied` (decimal)
- [x] `margin_result` (decimal)
- [x] `compliance_status` (enum)
- [x] `event_timestamp` (datetime)

**Ações que geram evento:**
- [x] `ADD_ITEM`
- [x] `UPDATE_QTY`
- [x] `APPLY_DISCOUNT`
- [x] `CONVERT_ORDER`

**Critério de Aceite:**
```
➡️ Cada ação gera 1 evento gravado
➡️ Evento é imutável após criação
```

---

### 1.3 Implementar Price Freeze (regra inviolável)

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 1.3.1 | Criar flag `is_frozen = true` na conversão | Backend | ✅ |
| 1.3.2 | Bloquear alterações diretas após conversão | Backend | ✅ |
| 1.3.3 | Criar endpoint `/pricing/exception/request` | Backend | ✅ |
| 1.3.4 | Registrar nova decisão apenas via evento | Backend | ✅ |

**Critério de Aceite:**
```
❌ Não é possível editar preço pós-conversão
✅ Só com novo evento + workflow de exceção
```

---

## 🧠 BLOCO 2 — POLÍTICA COMO CÓDIGO

### 2.1 Versionamento de política

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 2.1.1 | Criar tabela `pricing_policies` | Backend | ✅ |
| 2.1.2 | Associar toda decisão a uma versão | Backend | ✅ |
| 2.1.3 | Garantir imutabilidade da versão usada | Backend | ✅ |

**Critério de Aceite:**
```
➡️ Todo evento aponta para uma política versionada
➡️ Política não pode ser alterada após uso
```

---

### 2.2 Política mínima implementada

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 2.2.1 | Implementar margem mínima por produto/categoria | Backend | ✅ |
| 2.2.2 | Implementar limite de desconto por perfil de vendedor | Backend | ✅ |
| 2.2.3 | Implementar bloqueio por risco de crédito | Backend | ✅ |

**Políticas Q1:**

| Política | Tipo | Ação |
|----------|------|------|
| Margem mínima 20% | `MINIMUM_MARGIN` | Bloquear ou aprovar |
| Desconto máx Level 1: 5% | `DISCOUNT_LIMIT` | Requerer aprovação |
| Desconto máx Level 3: 10% | `DISCOUNT_LIMIT` | Requerer aprovação |
| Cliente bloqueado | `CREDIT_RESTRICTION` | Bloquear |

**Critério de Aceite:**
```
❌ Preço abaixo do mínimo não passa silenciosamente
✅ Sempre gera bloqueio ou pedido de aprovação
```

---

## 🤖 BLOCO 3 — IA SOB POLÍTICA (BASE)

### 3.1 IA só recomenda dentro da política

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 3.1.1 | Bloquear IA de sugerir desconto fora do limite | Backend | ✅ |
| 3.1.2 | Toda sugestão de preço passa por simulação | Backend | ✅ |
| 3.1.3 | IA recebe contexto de política | Backend | ✅ |

**Dados que IA deve receber:**
- [x] Preço ideal
- [x] Faixa permitida (min/max)
- [x] Nível de risco
- [x] Margem mínima

**Critério de Aceite:**
```
➡️ IA nunca retorna preço inválido
➡️ Toda sugestão é validada antes de exibir
```

---

### 3.2 Logs de recomendação IA

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 3.2.1 | Criar tabela `ai_recommendations_log` | Backend | ✅ |
| 3.2.2 | Registrar quando IA sugeriu algo | Backend | ✅ |
| 3.2.3 | Comparar sugestão vs preço final aplicado | Backend | ✅ |

**Campos do log:**
```sql
ai_recommendation_id
event_id (FK)
suggested_discount
suggested_price
actual_discount
actual_price
was_accepted
created_at
```

**Critério de Aceite:**
```
➡️ Existe trilha "IA sugeriu X, humano aplicou Y"
➡️ Dados prontos para aprendizado futuro
```

---

## 🔐 BLOCO 4 — SEGURANÇA (SEM DISCUSSÃO)

### 4.1 Autenticação

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 4.1.1 | Migrar MD5 → bcrypt (com fallback) | Backend | ✅ |
| 4.1.2 | Forçar troca gradual de senha | Backend | ✅ |
| 4.1.3 | Implementar 2FA (TOTP) | Backend | ✅ |
| 4.1.4 | Obrigar 2FA para admins (Level > 4) | Backend | ✅ |

**Estratégia de migração MD5 → bcrypt:**
```
1. Login com MD5 ainda funciona
2. Após login bem-sucedido, rehash para bcrypt
3. Marcar usuário como "migrado"
4. Após 30 dias, forçar reset para não-migrados
```

**Critério de Aceite:**
```
❌ Login sem bcrypt (após migração)
❌ Usuário admin sem 2FA
✅ Todos os novos usuários já usam bcrypt
```

---

### 4.2 Auditoria mínima

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 4.2.1 | Criar tabela `audit_log` | Backend | ✅ |
| 4.2.2 | Logar eventos de login | Backend | ✅ |
| 4.2.3 | Logar alterações de preço | Backend | ✅ |
| 4.2.4 | Logar aprovações de exceção | Backend | ✅ |

**Eventos auditados:**
- [x] `LOGIN_SUCCESS`
- [x] `LOGIN_FAILED`
- [x] `PRICE_CHANGED`
- [x] `DISCOUNT_APPLIED`
- [x] `EXCEPTION_REQUESTED`
- [x] `EXCEPTION_APPROVED`
- [x] `EXCEPTION_REJECTED`
- [x] `ORDER_CONVERTED`

**Critério de Aceite:**
```
➡️ Dá para responder "quem fez isso?"
➡️ Logs retidos por 90 dias mínimo
```

---

## 📊 BLOCO 5 — MÉTRICAS FUNDACIONAIS

### 5.1 KPIs de pricing (mínimo)

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 5.1.1 | Implementar cálculo de Price Integrity Score | Backend | ✅ |
| 5.1.2 | Implementar cálculo de Approval Rate | Backend | ✅ |
| 5.1.3 | Implementar cálculo de Approval Pressure Index | Backend | ✅ |
| 5.1.4 | Criar endpoint `/pricing/metrics` | Backend | ✅ |
| 5.1.5 | Criar dashboard simples no frontend | Frontend | ✅ |

**Fórmulas:**

| KPI | Fórmula | Meta |
|-----|---------|------|
| **Price Integrity Score** | (Decisões OK / Total) × 100 | > 85% |
| **Approval Rate** | (Aprovadas / Solicitadas) × 100 | 60-80% |
| **Approval Pressure Index** | (Tentativas exceção / Total) × 100 | < 15% |

**Critério de Aceite:**
```
➡️ Dashboard responde: quantos pedidos tentaram sair da política
➡️ Métricas calculadas diariamente
```

---

## 🧪 BLOCO 6 — TESTES E CONTROLE

### 6.1 Testes obrigatórios

| # | Teste | Resultado Esperado | Status |
|---|-------|-------------------|--------|
| 6.1.1 | Preço abaixo da margem mínima | Bloqueio ou exceção | ✅ |
| 6.1.2 | Exceção aprovada | Novo evento com status APPROVED_EXCEPTION | ✅ |
| 6.1.3 | Alteração pós price freeze | Erro 403 | ✅ |
| 6.1.4 | IA sugerindo desconto inválido | Sugestão ajustada ao limite | ✅ |
| 6.1.5 | Login com senha MD5 (migração) | Login OK + rehash | ✅ |
| 6.1.6 | Admin sem 2FA | Forçar configuração | ✅ |

**Critério de Aceite:**
```
❌ Nenhum desses testes passa sem erro controlado
✅ Todos os cenários cobertos por testes automatizados
```

---

## 📦 BLOCO 7 — ENTREGA E COMUNICAÇÃO

### 7.1 Comunicação interna

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 7.1.1 | Comunicar vendedores: "Preço agora é governado" | Produto | ✅ |
| 7.1.2 | Comunicar gerentes: exceção impacta comissão | Produto | ✅ |
| 7.1.3 | Treinar equipe no novo fluxo | Produto | ✅ |

### 7.2 Documentação mínima

| # | Documento | Status |
|---|-----------|--------|
| 7.2.1 | README do Pricing Agent | ✅ Criado |
| 7.2.2 | Especificação de Schemas | ✅ Criado |
| 7.2.3 | Fluxo de exceção | ✅ Criado |
| 7.2.4 | Significado dos KPIs | ✅ Criado |
| 7.2.5 | Guia de migração de senha | ✅ Criado |

---

## 🏁 DEFINIÇÃO DE "Q1 CONCLUÍDO"

O Q1 **só está concluído** quando todas as afirmações forem verdadeiras:

| # | Afirmação | Status |
|---|-----------|--------|
| 1 | ✔️ Todo preço tem origem rastreável | ✅ |
| 2 | ✔️ Toda exceção deixa rastro | ✅ |
| 3 | ✔️ IA não burla política | ✅ |
| 4 | ✔️ Preço convertido não muda | ✅ |
| 5 | ✔️ Segurança mínima está ativa | ✅ |

---

## 📅 CRONOGRAMA SUGERIDO

| Semana | Bloco | Entregas |
|--------|-------|----------|
| **1-2** | Bloco 4 | Migração bcrypt, 2FA |
| **3-4** | Bloco 1.1 | Pricing Agent como autoridade |
| **5-6** | Bloco 1.2 | Pricing Decision Event |
| **7-8** | Bloco 1.3 + 2 | Price Freeze + Políticas |
| **9-10** | Bloco 3 | IA sob política |
| **11-12** | Bloco 5-7 | Métricas, testes, docs |

---

## 📊 PROGRESSO GERAL

| Bloco | Total | Concluído | % |
|-------|-------|-----------|---|
| 1. Governança de Preço | 11 | 11 | 100% |
| 2. Política como Código | 6 | 6 | 100% |
| 3. IA sob Política | 6 | 6 | 100% |
| 4. Segurança | 8 | 8 | 100% |
| 5. Métricas | 5 | 5 | 100% |
| 6. Testes | 6 | 6 | 100% |
| 7. Comunicação | 6 | 6 | 100% |
| **TOTAL** | **48** | **48** | **100%** |

---

## 📚 Documentação Relacionada

- [Plano de Melhoria 2026](./PLANO_MELHORIA_2026.md)
- [Especificação Pricing Agent](./SPEC_PRICING_AGENT.md)
- [Schemas Detalhados](./SPEC_PRICING_SCHEMAS.md)
- [Manual do Agente IA](./MANUAL_AGENTE_IA.md)

---

**© Rolemak - Sistema de Gestão de Leads**  
*Checklist Q1 2026 - Fundação*
