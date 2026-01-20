# Plano de Migração: Pricing Admin → Leads Agent Admin

**Versão:** 1.0  
**Data:** 2026-01-19  
**Status:** Em Planejamento

---

## 1. Visão Geral

### 1.1 Objetivo
Migrar todas as funcionalidades do painel administrativo do **Pricing Agent** (localizado em `c-suite/agents/pricing`) para dentro do painel administrativo do **Leads Agent**, unificando a experiência do usuário em uma única interface React moderna.

### 1.2 Situação Atual

| Sistema | Tecnologia | URL de Produção | Localização |
|---------|-----------|----------------|-------------|
| **Pricing Admin** | Python/FastAPI + Jinja2 (monolítico) | `https://csuite.internut.com.br/pricing/admin` | `c-suite/agents/pricing/` |
| **Leads Admin** | React + Node.js/Express (SPA) | `http://54.232.49.52:5173/admin` | `leads-agent/` |

### 1.3 Benefícios da Migração
- ✅ Interface unificada e moderna (React + Material-UI)
- ✅ Melhor experiência de usuário (SPA com navegação fluida)
- ✅ Autenticação centralizada (mesmo sistema de login)
- ✅ Manutenção simplificada (um único frontend)
- ✅ Responsividade e acessibilidade melhoradas

---

## 2. Escopo da Migração

### 2.1 Funcionalidades do Pricing Admin a Migrar

#### 📦 Bloco 1: Configurações de Estrutura
| Funcionalidade | Descrição | Complexidade | Prioridade |
|----------------|-----------|--------------|------------|
| **Marcas (Brands)** | CRUD de marcas com role e configurações | Média | Alta |
| **Perfis Cliente-Marca** | Associação cliente → marca | Alta | Alta |
| **Tiers de Volume** | Níveis de desconto por volume | Média | Alta |
| **Brand Role Tiers** | Tiers por papel da marca | Média | Média |
| **Curva ABC (Curve Factors)** | Fatores de classificação ABC | Baixa | Média |
| **Stock Level Factors** | Fatores de nível de estoque | Baixa | Média |

#### 💰 Bloco 2: Regras de Desconto
| Funcionalidade | Descrição | Complexidade | Prioridade |
|----------------|-----------|--------------|------------|
| **D4Q (Desconto por Quantidade)** | Descontos escalonados por quantidade | Média | Alta |
| **D4P (Desconto por Valor)** | Descontos por valor total do pedido | Média | Alta |
| **Combos/Bundles** | Kits com produtos agrupados | Alta | Alta |

#### 🏷️ Bloco 3: Promoções por Segmento
| Funcionalidade | Descrição | Complexidade | Prioridade |
|----------------|-----------|--------------|------------|
| **Promo Máquinas** | Promoções para segmento de máquinas | Média | Média |
| **Promo Rolamentos** | Promoções para rolamentos | Média | Média |
| **Promo Peças Têxteis** | Promoções para peças têxteis | Média | Baixa |
| **Promo Autopeças** | Promoções para autopeças | Média | Baixa |
| **Promo Motopeças** | Promoções para motopeças | Média | Baixa |

#### 🔒 Bloco 4: Acordos e Proteções
| Funcionalidade | Descrição | Complexidade | Prioridade |
|----------------|-----------|--------------|------------|
| **Preços Fixos** | Preço específico por cliente/produto | Alta | Alta |
| **Produtos em Lançamento** | Regras para novos produtos | Média | Média |
| **Proteção Regional** | Restrições geográficas | Média | Baixa |
| **Regras de Último Preço** | Ancoragem de preço anterior | Média | Baixa |

#### 🧪 Bloco 5: Ferramentas de Diagnóstico
| Funcionalidade | Descrição | Complexidade | Prioridade |
|----------------|-----------|--------------|------------|
| **Página de Teste** | Simulação de precificação | Alta | Alta |
| **Batch Test** | Testes em lote | Alta | Média |

---

## 3. Arquitetura da Solução

### 3.1 Estratégia de Integração

```
┌─────────────────────────────────────────────────────────────┐
│                     LEADS AGENT FRONTEND                     │
│                        (React + MUI)                         │
├─────────────────────────────────────────────────────────────┤
│  /admin/pricing/brands       → PricingBrandsPage.jsx        │
│  /admin/pricing/profiles     → PricingProfilesPage.jsx      │
│  /admin/pricing/bundles      → PricingBundlesPage.jsx       │
│  /admin/pricing/discounts    → PricingDiscountsPage.jsx     │
│  /admin/pricing/promotions   → PricingPromotionsPage.jsx    │
│  /admin/pricing/fixed-prices → PricingFixedPricesPage.jsx   │
│  /admin/pricing/test         → PricingTestPage.jsx          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    LEADS AGENT BACKEND                       │
│                     (Node.js/Express)                        │
├─────────────────────────────────────────────────────────────┤
│  Nova rota: /api/pricing-admin/*                            │
│  → Proxy para Pricing Agent API                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    PRICING AGENT API                         │
│                   (Python/FastAPI) ✓ Existente               │
├─────────────────────────────────────────────────────────────┤
│  GET/POST/PUT/DELETE /api/v1/brands                         │
│  GET/POST/PUT/DELETE /api/v1/customer-brand-profiles        │
│  GET/POST/PUT/DELETE /api/v1/bundles                        │
│  GET/POST/PUT/DELETE /api/v1/quantity-discounts             │
│  GET/POST/PUT/DELETE /api/v1/fixed-prices                   │
│  POST /api/v1/engine/test                                    │
│  POST /api/v1/engine/batch-test                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Decisão de Arquitetura: Proxy vs Direct

**Opção escolhida: PROXY via Leads Agent Backend**

Motivos:
1. Centraliza autenticação no Leads Agent
2. Permite logging e auditoria unificados
3. Facilita controle de acesso por nível de usuário
4. Não expõe API do Pricing Agent diretamente ao frontend

---

## 4. Fases de Implementação

### 📌 Fase 1: Infraestrutura (1-2 dias)
1. Criar rotas de proxy no backend do Leads Agent
2. Configurar serviço de conexão com Pricing Agent API
3. Adicionar seção "Pricing" no menu lateral do Admin
4. Criar estrutura base de páginas

### 📌 Fase 2: Configurações de Estrutura (3-4 dias)
1. Página de Marcas (Brands)
2. Página de Perfis Cliente-Marca
3. Página de Tiers de Volume
4. Páginas de Fatores (Curva ABC, Stock Level)

### 📌 Fase 3: Regras de Desconto (3-4 dias)
1. Página de Descontos por Quantidade (D4Q)
2. Página de Descontos por Valor (D4P)
3. Página de Combos/Bundles (mais complexa)

### 📌 Fase 4: Promoções (2-3 dias)
1. Página unificada de Promoções com filtro por segmento
2. Formulário de criação/edição de promoções
3. Upload de imagens e configurações avançadas

### 📌 Fase 5: Acordos e Proteções (2-3 dias)
1. Página de Preços Fixos
2. Página de Preços Fixos em Lote
3. Páginas de Proteção Regional e Último Preço

### 📌 Fase 6: Ferramentas de Diagnóstico (2 dias)
1. Página de Teste de Precificação
2. Página de Teste em Lote (Batch Test)

### 📌 Fase 7: Polimento e Testes (2 dias)
1. Testes E2E de todas as funcionalidades
2. Ajustes de UX/UI
3. Documentação de uso

---

## 5. Estimativa de Esforço

| Fase | Descrição | Dias | Horas |
|------|-----------|------|-------|
| 1 | Infraestrutura | 2 | 16 |
| 2 | Configurações de Estrutura | 4 | 32 |
| 3 | Regras de Desconto | 4 | 32 |
| 4 | Promoções | 3 | 24 |
| 5 | Acordos e Proteções | 3 | 24 |
| 6 | Ferramentas de Diagnóstico | 2 | 16 |
| 7 | Polimento e Testes | 2 | 16 |
| **TOTAL** | | **20 dias** | **160 horas** |

---

## 6. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| API do Pricing Agent não documentada | Média | Alto | Analisar código fonte e criar docs |
| Inconsistência de dados | Baixa | Alto | Validação dupla (frontend + backend) |
| Performance de múltiplas chamadas | Média | Médio | Implementar cache Redis |
| Quebra de funcionalidade existente | Baixa | Alto | Manter Pricing Admin original como backup |

---

## 7. Dependências

### Dependências Técnicas
- ✅ Pricing Agent API funcionando (`https://csuite.internut.com.br/pricing/api/v1/`)
- ✅ Leads Agent rodando localmente
- ⚠️ Documentação da API do Pricing (criar se não existir)

### Dependências de Negócio
- Validação de fluxos com usuário final
- Decisão sobre depreciação do admin antigo

---

## 8. Próximos Passos Imediatos

1. [ ] Criar checklist detalhado (este documento acompanha)
2. [ ] Mapear todos os endpoints da API do Pricing Agent
3. [ ] Criar estrutura de pastas para as novas páginas
4. [ ] Implementar Fase 1 (Infraestrutura)

---

## Anexos

### A. Arquivos do Pricing Admin Original
- `c-suite/agents/pricing/templates/admin.html` (8972 linhas)
- `c-suite/agents/pricing/routes/crud.py` (2407 linhas)
- `c-suite/agents/pricing/routes/pages.py` (250 linhas)
- `c-suite/agents/pricing/repository.py` (241770 bytes)

### B. Estrutura de Pastas Proposta
```
leads-agent/
├── frontend/src/
│   ├── pages/admin/
│   │   └── pricing/
│   │       ├── PricingDashboard.jsx
│   │       ├── BrandsPage.jsx
│   │       ├── CustomerProfilesPage.jsx
│   │       ├── VolumeTiersPage.jsx
│   │       ├── DiscountsPage.jsx
│   │       ├── BundlesPage.jsx
│   │       ├── PromotionsPage.jsx
│   │       ├── FixedPricesPage.jsx
│   │       └── TestPage.jsx
│   └── services/
│       └── pricingAdmin.service.js
└── backend/src/
    ├── routes/
    │   └── pricing-admin.routes.js
    └── services/
        └── pricing-api.service.js
```
