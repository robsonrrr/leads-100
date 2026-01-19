# 🤖 Manual do Agente de IA

## Sistema de Gestão de Leads - Rolemak

**Versão:** 1.0  
**Última atualização:** Janeiro 2026

---

## 📋 Índice

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Contexto de Negócio](#2-contexto-de-negócio)
3. [Arquitetura e Tecnologias](#3-arquitetura-e-tecnologias)
4. [Modelo de Dados](#4-modelo-de-dados)
5. [API REST - Referência Completa](#5-api-rest---referência-completa)
6. [Sistema de Permissões](#6-sistema-de-permissões)
7. [Fluxos de Negócio](#7-fluxos-de-negócio)
8. [Regras de Negócio](#8-regras-de-negócio)
9. [Padrões de Código](#9-padrões-de-código)
10. [Estrutura do Projeto](#10-estrutura-do-projeto)
11. [Guia de Desenvolvimento](#11-guia-de-desenvolvimento)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Visão Geral do Sistema

### 1.1 O que é o Leads Agent

O **Leads Agent** é um sistema moderno de gestão de leads/cotações comerciais para a empresa Rolemak. Permite que vendedores criem cotações, gerenciem clientes, acompanhem métricas e convertam leads em pedidos.

### 1.2 Propósito

- Substituir gradualmente o sistema legado K3
- Modernizar a interface de vendas
- Fornecer métricas em tempo real
- Aumentar produtividade dos vendedores

### 1.3 URLs Importantes

| Ambiente | Frontend | API | Docs |
|----------|----------|-----|------|
| Produção | https://leads.internut.com.br/ | /api | /api/docs |
| Dev | https://dev.office.internut.com.br/leads/modern/ | /api | /api/docs |

---

## 2. Contexto de Negócio

### 2.1 Usuários do Sistema

| Tipo | Level | Descrição | Permissões |
|------|-------|-----------|------------|
| **Vendedor** | 1-4 | Usuário operacional | Apenas próprios leads/clientes |
| **Gerente** | 5+ | Supervisão de equipe | Ver toda equipe, definir metas |
| **Admin** | 6 | Administrador | Acesso total |

### 2.2 Entidades Principais

| Entidade | Descrição |
|----------|-----------|
| **Lead** | Cotação/proposta comercial (tabela: sCart) |
| **Item** | Produto no carrinho (tabela: sCartItem) |
| **Cliente** | Empresa compradora (tabela: customers) |
| **Produto** | Item vendável (tabela: products) |
| **Pedido** | Lead convertido (tabela: orders) |
| **Meta** | Objetivo de vendas (tabela: goals) |
| **Interação** | Contato com cliente (tabela: interactions) |

### 2.3 Fluxo Principal

```
Cliente → Lead → Itens → Impostos → Conversão → Pedido
```

### 2.4 Segmentos de Negócio

A empresa opera com diferentes segmentos:
- **Rolemak** - Segmento principal
- **MakPrime** - Segmento premium
- Outros segmentos conforme configuração

---

## 3. Arquitetura e Tecnologias

### 3.1 Stack Backend

```
Node.js 20+ / Express 4.18
├── MySQL2 (driver)
├── JWT (autenticação)
├── Redis (cache/sessões)
├── Joi (validação)
├── Winston (logging)
├── Helmet (segurança)
├── Swagger (documentação)
└── Jest (testes)
```

### 3.2 Stack Frontend

```
React 18 / Vite 5
├── Material-UI 5 (componentes)
├── Redux Toolkit (estado)
├── React Router 6 (rotas)
├── Axios (HTTP)
├── Recharts (gráficos)
└── date-fns (datas)
```

### 3.3 Infraestrutura

```
Docker Compose
├── backend (Node.js :3001)
├── frontend (Vite :5173)
├── redis (Cache :6379)
└── nginx (Proxy :80/:443)

Database: AWS RDS MySQL (banco: mak)
```

### 3.4 Padrão Arquitetural

```
Request → Route → Controller → Repository → Database
                      ↓
                   Model
                      ↓
Response ← Controller ←
```

---

## 4. Modelo de Dados

### 4.1 Lead (sCart)

```sql
-- Tabela principal de leads/carrinhos
sCart (
  cSCart INT PRIMARY KEY,        -- ID do lead
  dCart DATETIME,                -- Data criação
  cCustomer INT,                 -- FK cliente
  cUser INT,                     -- FK criador
  cSeller INT,                   -- FK vendedor
  cSegment VARCHAR(50),          -- Segmento
  cNatOp INT,                    -- Natureza operação
  cEmitUnity INT,                -- Unidade emitente
  cLogUnity INT,                 -- Unidade logística
  cTransporter INT,              -- Transportadora
  cPaymentType INT,              -- Tipo pagamento
  cPaymentTerms VARCHAR(50),     -- Condições (ex: n:30:30)
  vFreight DECIMAL(10,2),        -- Valor frete
  vFreightType INT,              -- Tipo frete (1=CIF, 2=FOB)
  cType INT,                     -- 1=Lead, 2=Pedido
  cOrderWeb INT,                 -- Nº pedido (se convertido)
  xRemarksFinance TEXT,          -- Obs financeiro
  xRemarksLogistic TEXT,         -- Obs logística
  xRemarksNFE TEXT,              -- Obs NFE
  xRemarksOBS TEXT,              -- Obs gerais
  xRemarksManager TEXT,          -- Obs gerente
  xBuyer VARCHAR(100),           -- Comprador
  cPurchaseOrder VARCHAR(50),    -- Pedido de compra
  cAuthorized INT                -- Autorizado (0/1)
)
```

### 4.2 Item do Carrinho (sCartItem)

```sql
sCartItem (
  cSCartItem INT PRIMARY KEY,    -- ID do item
  cSCart INT,                    -- FK lead
  cProduct INT,                  -- FK produto
  nQtd DECIMAL(10,3),            -- Quantidade
  vPrice DECIMAL(10,4),          -- Preço unitário
  vDiscount DECIMAL(5,2),        -- Desconto %
  vIPI DECIMAL(10,2),            -- Valor IPI
  vST DECIMAL(10,2),             -- Valor ST
  vICMS DECIMAL(10,2),           -- Valor ICMS
  vTotal DECIMAL(10,2)           -- Total item
)
```

### 4.3 Cliente (customers)

```sql
customers (
  cCustomer INT PRIMARY KEY,
  xName VARCHAR(200),            -- Razão social
  xTradeName VARCHAR(200),       -- Nome fantasia
  xCNPJ VARCHAR(20),             -- CNPJ
  xAddress TEXT,                 -- Endereço
  xCity VARCHAR(100),
  xState VARCHAR(2),
  xPhone VARCHAR(20),
  xEmail VARCHAR(100),
  cSeller INT,                   -- Vendedor responsável
  vCreditLimit DECIMAL(12,2),    -- Limite crédito
  vCreditAvailable DECIMAL(12,2) -- Crédito disponível
)
```

### 4.4 Usuário (users)

```sql
users (
  id INT PRIMARY KEY,
  user VARCHAR(100),             -- Nome usuário
  nick VARCHAR(50),              -- Apelido
  email VARCHAR(100),
  newpassword VARCHAR(100),      -- Senha MD5
  level INT,                     -- Nível (1-6)
  depto VARCHAR(50),             -- Departamento
  segmento VARCHAR(50),          -- Segmento
  empresa VARCHAR(50)            -- Empresa
)
```

### 4.5 Relacionamentos

```
users (1) ──────── (N) sCart
                        │
customers (1) ──────────┘
                        │
sCart (1) ──────── (N) sCartItem
                        │
products (1) ───────────┘
```

---

## 5. API REST - Referência Completa

### 5.1 Autenticação

Todas as rotas (exceto login) requerem header:
```
Authorization: Bearer <jwt_token>
```

#### POST /api/auth/login
```json
// Request
{
  "username": "string",  // Nome, email ou email_interno
  "password": "string"
}

// Response 200
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "Nome",
      "nick": "Apelido",
      "email": "email@example.com",
      "level": 5,
      "depto": "Vendas",
      "segmento": "Rolemak",
      "empresa": "Rolemak"
    },
    "accessToken": "jwt...",
    "refreshToken": "jwt..."
  }
}
```

#### POST /api/auth/refresh
```json
// Request
{ "refreshToken": "jwt..." }

// Response 200
{ "success": true, "data": { "accessToken": "jwt..." } }
```

#### GET /api/auth/me
```json
// Response 200
{ "success": true, "data": { "user": {...} } }
```

### 5.2 Leads

#### GET /api/leads
Lista leads com paginação e filtros.

```
Query params:
- page (int, default: 1)
- limit (int, default: 20)
- customerId (int) - Filtrar por cliente
- userId (int) - Filtrar por criador (apenas gerentes)
- sellerId (int) - Filtrar por vendedor (apenas gerentes)
- type (int) - 1=Lead, 2=Pedido
- cSegment (string) - Filtrar por segmento
- dateFrom (date) - Data inicial
- dateTo (date) - Data final
- q (string) - Busca textual
- sort (string) - Campo ordenação (default: total)
- sortDir (string) - asc/desc (default: desc)
- sellerSegmento (string) - Segmento do vendedor (gerentes)
- filterSellerId (int) - Vendedor específico (gerentes)
```

```json
// Response 200
{
  "success": true,
  "data": [
    {
      "id": 123,
      "createdAt": "2026-01-14T09:00:00Z",
      "customerId": 456,
      "customerName": "Cliente LTDA",
      "userId": 1,
      "sellerId": 1,
      "paymentType": 2,
      "paymentTerms": "n:30:30",
      "freight": 150.00,
      "freightType": 1,
      "type": 1,
      "orderWeb": null,
      "totalValue": 5000.00,
      "sellerNick": "João",
      "ownerNick": "João",
      "segment": "Rolemak"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### GET /api/leads/:id
```json
// Response 200
{
  "success": true,
  "data": {
    "id": 123,
    "createdAt": "2026-01-14T09:00:00Z",
    "customer": {
      "id": 456,
      "name": "Cliente LTDA",
      "tradeName": "Cliente",
      "cnpj": "12.345.678/0001-90",
      "city": "São Paulo",
      "state": "SP"
    },
    "items": [...],
    "totals": {
      "subtotal": 4500.00,
      "ipi": 300.00,
      "st": 200.00,
      "freight": 150.00,
      "total": 5150.00
    },
    ...
  }
}
```

#### POST /api/leads
```json
// Request
{
  "customerId": 456,
  "userId": 1,
  "sellerId": 1,
  "cSegment": "Rolemak",
  "cNatOp": 27,
  "cEmitUnity": 1,
  "cLogUnity": 1,
  "cTransporter": 9,
  "paymentType": 2,
  "paymentTerms": "n:30:30",
  "freight": 150.00,
  "freightType": 1,
  "deliveryDate": "2026-01-20",
  "buyer": "João Comprador",
  "purchaseOrder": "PC-12345",
  "remarks": {
    "finance": "Obs financeiro",
    "logistic": "Obs logística",
    "nfe": "Obs NFE",
    "obs": "Obs gerais",
    "manager": "Obs gerente"
  }
}

// Response 201
{
  "success": true,
  "data": { "id": 124, ... },
  "message": "Lead criado com sucesso"
}
```

#### PUT /api/leads/:id
```json
// Request - mesmos campos do POST
// Response 200
{ "success": true, "data": {...}, "message": "Lead atualizado" }
```

#### DELETE /api/leads/:id
```json
// Response 200
{ "success": true, "message": "Lead removido" }
```

### 5.3 Itens do Carrinho

#### GET /api/leads/:id/items
```json
// Response 200
{
  "success": true,
  "data": [
    {
      "id": 1,
      "productId": 100,
      "productCode": "SKU001",
      "productName": "Produto X",
      "quantity": 10,
      "price": 50.00,
      "discount": 5.00,
      "ipi": 30.00,
      "st": 20.00,
      "icms": 45.00,
      "total": 525.00
    }
  ]
}
```

#### POST /api/leads/:id/items
```json
// Request
{
  "productId": 100,
  "quantity": 10,
  "price": 50.00,      // Opcional - usa preço do produto
  "discount": 5.00     // Opcional - desconto %
}

// Response 201
{ "success": true, "data": {...} }
```

#### PUT /api/leads/:id/items/:itemId
```json
// Request
{
  "quantity": 15,
  "price": 48.00,
  "discount": 10.00
}

// Response 200
{ "success": true, "data": {...} }
```

#### DELETE /api/leads/:id/items/:itemId
```json
// Response 200
{ "success": true, "message": "Item removido" }
```

#### GET /api/leads/:id/totals
```json
// Response 200
{
  "success": true,
  "data": {
    "subtotal": 4500.00,
    "totalIPI": 300.00,
    "totalST": 200.00,
    "totalICMS": 450.00,
    "freight": 150.00,
    "total": 5150.00,
    "itemsCount": 5
  }
}
```

#### POST /api/leads/:id/taxes
Calcula impostos para todos os itens.
```json
// Response 200
{
  "success": true,
  "data": [
    { "itemId": 1, "product": "SKU001", "ipi": 30.00, "st": 20.00 }
  ],
  "message": "Impostos calculados"
}
```

#### POST /api/leads/:id/convert
Converte lead em pedido.
```json
// Response 200
{
  "success": true,
  "data": { "orderId": 789 },
  "message": "Lead convertido em pedido #789"
}
```

### 5.4 Clientes

#### GET /api/customers/search
```
Query params:
- q (string) - Termo de busca (nome, CNPJ, código)
- limit (int, default: 20)
```

```json
// Response 200
{
  "success": true,
  "data": [
    {
      "id": 456,
      "name": "Cliente LTDA",
      "tradeName": "Cliente",
      "cnpj": "12.345.678/0001-90",
      "city": "São Paulo",
      "state": "SP",
      "sellerId": 1,
      "sellerName": "João"
    }
  ]
}
```

#### GET /api/customers/:id
```json
// Response 200
{
  "success": true,
  "data": {
    "id": 456,
    "name": "Cliente LTDA",
    "tradeName": "Cliente",
    "cnpj": "12.345.678/0001-90",
    "address": {...},
    "phone": "(11) 1234-5678",
    "email": "cliente@example.com",
    "creditLimit": 50000.00,
    "creditAvailable": 35000.00,
    "sellerId": 1
  }
}
```

#### GET /api/customers/:id/metrics
```json
// Response 200
{
  "success": true,
  "data": {
    "status": "active",           // active, at_risk, inactive
    "daysSinceOrder": 15,
    "year": {
      "total": 150000.00,
      "ordersCount": 25
    },
    "month": {
      "total": 12000.00,
      "ordersCount": 3
    },
    "lifetime": {
      "total": 500000.00,
      "ordersCount": 100,
      "avgTicket": 5000.00,
      "avgFrequency": 30,
      "firstOrderDate": "2020-01-15",
      "lastOrderDate": "2026-01-01"
    },
    "leads": {
      "openCount": 2,
      "openValue": 8000.00
    }
  }
}
```

#### GET /api/customers/:id/orders
```
Query params:
- page (int)
- limit (int)
- year (int) - Filtrar por ano
```

#### GET /api/customers/:id/leads
```
Query params:
- page (int)
- limit (int)
```

#### GET /api/customers/:id/top-products
```
Query params:
- limit (int, default: 10)
```

#### GET /api/customers/sellers
Lista vendedores (para filtros de gerentes).
```
Query params:
- segmento (string) - Filtrar por segmento
```

#### GET /api/customers/seller-segments
Lista segmentos de vendedores únicos.

### 5.5 Produtos

#### GET /api/products/search
```
Query params:
- q (string) - Busca por código ou nome
- limit (int, default: 20)
```

```json
// Response 200
{
  "success": true,
  "data": [
    {
      "id": 100,
      "code": "SKU001",
      "name": "Produto X",
      "description": "Descrição",
      "price": 50.00,
      "stock": 150,
      "unit": "UN",
      "ncm": "12345678",
      "ipiRate": 5.00
    }
  ]
}
```

#### GET /api/products/:id
#### GET /api/products/:id/stock
#### GET /api/products/:id/price

### 5.6 Analytics

#### GET /api/analytics/dashboard
```
Query params:
- sellerId (int) - Filtrar por vendedor (gerentes)
- sellerSegmento (string) - Filtrar por segmento (gerentes)
```

```json
// Response 200
{
  "success": true,
  "data": {
    "salesByMonth": [
      { "month": "Jan", "totalValue": 50000, "ordersCount": 10 }
    ],
    "salesByDay": [
      { "day": "Seg", "totalValue": 8000, "ordersCount": 2 }
    ],
    "yearComparison": {
      "current": { "year": 2026, "totalValue": 150000, "ordersCount": 30, "avgTicket": 5000 },
      "previous": { "year": 2025, "totalValue": 120000, "ordersCount": 25, "avgTicket": 4800 },
      "variation": 25
    }
  }
}
```

#### GET /api/analytics/top-customers
```
Query params:
- limit (int)
- period (string) - year, month
- sellerId (int)
- sellerSegmento (string)
```

#### GET /api/analytics/seller-summary
#### GET /api/analytics/team-metrics (apenas gerentes)

### 5.7 Metas (apenas gerentes)

#### GET /api/goals
#### POST /api/goals
```json
// Request
{
  "sellerId": 1,
  "year": 2026,
  "month": 1,           // null para meta anual
  "targetValue": 100000.00,
  "targetOrders": 20,   // opcional
  "notes": "Meta Q1"
}
```

#### PUT /api/goals/:id
#### DELETE /api/goals/:id

#### GET /api/goals/team-progress
```
Query params:
- year (int)
- month (int)
- segmento (string)
```

```json
// Response 200
{
  "success": true,
  "data": [
    {
      "sellerId": 1,
      "sellerName": "João",
      "segmento": "Rolemak",
      "monthly": {
        "target": 100000,
        "achieved": 75000,
        "progress": 75
      }
    }
  ]
}
```

### 5.8 Interações

#### GET /api/interactions/customer/:id
#### POST /api/interactions
```json
// Request
{
  "customerId": 456,
  "type": "call",       // call, email, visit, whatsapp, meeting
  "description": "Ligação de follow-up",
  "followUpDate": "2026-01-20",  // opcional
  "followUpNotes": "Retornar sobre proposta"
}
```

#### GET /api/interactions/follow-ups
#### GET /api/interactions/follow-ups/count

### 5.9 Alertas

#### GET /api/alerts
#### GET /api/alerts/at-risk-customers

### 5.10 Preços e Promoções

#### GET /api/pricing/quantity-discounts
#### GET /api/pricing/launch-products
#### GET /api/promotions

### 5.11 Relatórios

#### GET /api/reports/sales
#### GET /api/reports/customers
#### GET /api/reports/leads
#### POST /api/reports/generate

### 5.12 Metadata

#### GET /api/leads/segments
#### GET /api/leads/metadata/nops
#### GET /api/leads/metadata/transporters
#### GET /api/leads/metadata/units
#### GET /api/leads/metadata/customer-transporter?customerId=456

---

## 6. Sistema de Permissões

### 6.1 Níveis de Acesso

| Level | Tipo | Descrição |
|-------|------|-----------|
| 1-4 | Vendedor | Acesso restrito aos próprios recursos |
| 5+ | Gerente | Acesso a toda equipe |
| 6 | Admin | Acesso total |

### 6.2 Regras de Filtro Automático

Para usuários Level 1-4:
```javascript
// Leads: só vê onde é criador (cUser) ou vendedor (cSeller)
filters.userId = currentUserId;

// Clientes: só vê da sua carteira
filters.sellerId = currentUserId;

// Pedidos: só vê onde é vendedor
options.sellerId = currentUserId;
```

### 6.3 Funcionalidades por Nível

| Funcionalidade | Level 1-4 | Level 5+ |
|----------------|-----------|----------|
| Ver próprios leads | ✅ | ✅ |
| Ver leads da equipe | ❌ | ✅ |
| Filtrar por vendedor | ❌ | ✅ |
| Filtrar por segmento vendedor | ❌ | ✅ |
| Definir metas | ❌ | ✅ |
| Ver métricas da equipe | ❌ | ✅ |
| Página de Metas | ❌ | ✅ |
| Ver ranking vendedores | ❌ | ✅ |

### 6.4 Middleware de Autenticação

```javascript
// Uso nas rotas
authenticateToken       // Obrigatório em todas as rotas
optionalAuth           // Token opcional
requireLevel(n)        // Requer level >= n
requireAdmin           // Requer level > 4
checkResourceAccess()  // Verifica ownership
```

---

## 7. Fluxos de Negócio

### 7.1 Criar Lead Completo

```
1. POST /api/leads (criar lead vazio com cliente)
2. POST /api/leads/:id/items (adicionar produtos)
3. POST /api/leads/:id/taxes (calcular impostos)
4. GET /api/leads/:id/totals (verificar totais)
5. PUT /api/leads/:id (ajustar se necessário)
```

### 7.2 Converter Lead em Pedido

```
1. GET /api/leads/:id (verificar lead)
2. Validar: tem itens? cliente válido? crédito?
3. POST /api/leads/:id/convert
4. Resultado: cOrderWeb preenchido com nº pedido
```

### 7.3 Buscar Cliente e Criar Lead

```
1. GET /api/customers/search?q=termo
2. Selecionar cliente
3. GET /api/leads/metadata/customer-transporter?customerId=X
4. POST /api/leads com customerId e transportadora
```

### 7.4 Adicionar Produto ao Carrinho

```
1. GET /api/products/search?q=SKU
2. Selecionar produto
3. GET /api/products/:id/stock (verificar disponibilidade)
4. POST /api/leads/:id/items com productId e quantity
5. Impostos são calculados automaticamente
```

### 7.5 Fluxo de Metas (Gerente)

```
1. GET /api/customers/sellers (listar vendedores)
2. POST /api/goals (criar meta)
3. GET /api/goals/team-progress (acompanhar)
```

---

## 8. Regras de Negócio

### 8.1 Leads

- Lead deve ter cliente obrigatório
- Lead sem itens pode existir (rascunho)
- Lead convertido (cType=2) não pode ser editado
- cOrderWeb só é preenchido após conversão

### 8.2 Itens

- Quantidade deve ser > 0
- Preço pode ser sobrescrito (desconto manual)
- Impostos são calculados por item
- IPI e ST dependem do NCM do produto e UF do cliente

### 8.3 Clientes

- Cliente pode ter múltiplos leads abertos
- Crédito disponível = Limite - Pedidos em aberto
- Status calculado por dias desde último pedido:
  - Ativo: < 60 dias
  - Em Risco: 60-120 dias
  - Inativo: > 120 dias

### 8.4 Conversão

- Requer pelo menos 1 item
- Verifica crédito do cliente
- Gera número de pedido sequencial
- Atualiza cType para 2

### 8.5 Metas

- Podem ser mensais ou anuais
- Progresso = (Realizado / Meta) * 100
- Apenas gerentes podem criar/editar

---

## 9. Padrões de Código

### 9.1 Estrutura de Response

```javascript
// Sucesso
{
  "success": true,
  "data": {...},
  "message": "Opcional",
  "pagination": {...}  // Se aplicável
}

// Erro
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Descrição do erro",
    "details": [...]  // Opcional
  }
}
```

### 9.2 Códigos de Erro Comuns

| Código | HTTP | Descrição |
|--------|------|-----------|
| VALIDATION_ERROR | 400 | Dados inválidos |
| UNAUTHORIZED | 401 | Não autenticado |
| TOKEN_EXPIRED | 401 | Token expirado |
| FORBIDDEN | 403 | Sem permissão |
| NOT_FOUND | 404 | Recurso não encontrado |
| CONFLICT | 409 | Conflito (ex: já convertido) |
| INTERNAL_ERROR | 500 | Erro interno |

### 9.3 Padrão de Controller

```javascript
export async function getResource(req, res, next) {
  try {
    const { id } = req.params;
    const result = await repository.findById(id);
    
    if (!result) {
      return next(Errors.notFound('Resource'));
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}
```

### 9.4 Padrão de Repository

```javascript
export async function findById(id) {
  const [rows] = await db().execute(
    'SELECT * FROM table WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}
```

---

## 10. Estrutura do Projeto

### 10.1 Backend

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js      # Conexão MySQL
│   │   ├── redis.js         # Conexão Redis
│   │   ├── swagger.js       # Config Swagger
│   │   └── logger.js        # Config Winston
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── leads.controller.js
│   │   ├── customers.controller.js
│   │   ├── products.controller.js
│   │   ├── analytics.controller.js
│   │   ├── goals.controller.js
│   │   ├── interactions.controller.js
│   │   ├── alerts.controller.js
│   │   ├── pricing.controller.js
│   │   ├── promotions.controller.js
│   │   ├── orders.controller.js
│   │   └── reports.controller.js
│   ├── middleware/
│   │   ├── auth.js          # JWT validation
│   │   ├── errorHandler.js  # Error handling
│   │   ├── rateLimiter.js   # Rate limiting
│   │   └── notFoundHandler.js
│   ├── models/
│   │   ├── Lead.js
│   │   ├── CartItem.js
│   │   ├── Customer.js
│   │   └── Product.js
│   ├── repositories/
│   │   ├── lead.repository.js
│   │   ├── cartItem.repository.js
│   │   ├── customer.repository.js
│   │   ├── product.repository.js
│   │   ├── order.repository.js
│   │   ├── tax.repository.js
│   │   ├── stock.repository.js
│   │   ├── pricing.repository.js
│   │   └── promotion.repository.js
│   ├── routes/
│   │   └── *.routes.js
│   ├── services/
│   │   └── auditLog.service.js
│   ├── utils/
│   │   └── AppError.js
│   └── index.js             # Entry point
├── tests/
│   ├── unit/
│   └── integration/
└── package.json
```

### 10.2 Frontend

```
frontend/
├── src/
│   ├── components/
│   │   ├── Layout.jsx
│   │   ├── CustomerAutocomplete.jsx
│   │   ├── ProductAutocomplete.jsx
│   │   ├── CartItems.jsx
│   │   ├── MetricsCards.jsx
│   │   ├── ManagerMetricsWidget.jsx
│   │   ├── GoalProgressWidget.jsx
│   │   ├── RankingWidget.jsx
│   │   ├── AlertsWidget.jsx
│   │   ├── AtRiskCustomers.jsx
│   │   ├── FollowUpsWidget.jsx
│   │   ├── InteractionsTimeline.jsx
│   │   └── skeletons/
│   ├── contexts/
│   │   └── ToastContext.jsx
│   ├── hooks/
│   │   ├── useLeadData.js
│   │   ├── useMetadata.js
│   │   └── usePagination.js
│   ├── pages/
│   │   ├── DashboardPage.jsx
│   │   ├── CreateLeadPage.jsx
│   │   ├── EditLeadPage.jsx
│   │   ├── LeadDetailPage.jsx
│   │   ├── CustomerDetailPage.jsx
│   │   ├── AnalyticsPage.jsx
│   │   ├── GoalsPage.jsx
│   │   ├── DiscountsPage.jsx
│   │   ├── LaunchProductsPage.jsx
│   │   └── LoginPage.jsx
│   ├── services/
│   │   └── api.js           # Axios instance + services
│   ├── store/
│   │   └── slices/
│   │       └── authSlice.js
│   ├── utils/
│   │   └── index.js
│   ├── App.jsx
│   └── main.jsx
└── package.json
```

---

## 11. Guia de Desenvolvimento

### 11.1 Setup Local

```bash
# Clone
git clone <repo>
cd leads-agent

# Backend
cd backend
npm install
cp .env.example .env  # Configurar variáveis
npm run dev

# Frontend (outro terminal)
cd frontend
npm install
npm run dev
```

### 11.2 Docker

```bash
cd docker
docker-compose up -d
docker-compose logs -f
```

### 11.3 Variáveis de Ambiente

```env
# Backend (.env)
NODE_ENV=development
PORT=3001

DB_HOST=<host>
DB_USER=<user>
DB_PASSWORD=<password>
DB_NAME=mak
DB_PORT=3306

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=<secret>
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:5173
```

### 11.4 Testes

```bash
cd backend
npm test              # Todos os testes
npm run test:unit     # Apenas unitários
npm run test:integration  # Apenas integração
npm run test:coverage # Com cobertura
```

### 11.5 Comandos Úteis

```bash
# Backend
npm run dev          # Dev com hot reload
npm run lint         # Verificar código
npm run lint:fix     # Corrigir lint

# Frontend
npm run dev          # Dev server
npm run build        # Build produção
npm run preview      # Preview build
```

---

## 12. Troubleshooting

### 12.1 Erros Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| 401 Unauthorized | Token inválido/expirado | Fazer login novamente |
| 403 Forbidden | Sem permissão | Verificar level do usuário |
| 404 Not Found | Recurso não existe | Verificar ID |
| CORS Error | Origem não permitida | Verificar CORS_ORIGIN |
| DB Connection | Credenciais/rede | Verificar .env |

### 12.2 Debug

```javascript
// Logs no backend
import logger from './config/logger.js';
logger.info('Mensagem', { dados });
logger.error('Erro', { error });

// Console no frontend
console.log('Debug:', data);
```

### 12.3 Health Check

```bash
curl http://localhost:3001/health
# { "status": "ok", "timestamp": "..." }
```

### 12.4 Verificar Conexões

```bash
# Redis
redis-cli ping

# MySQL
mysql -h <host> -u <user> -p<password> -e "SELECT 1"
```

---

## 📚 Referências

- [Manual do Vendedor](./MANUAL_USUARIO_VENDEDOR.md)
- [Manual do Gerente](./MANUAL_USUARIO_GERENTE.md)
- [Manual Técnico PO](./MANUAL_TECNICO_PO.md)
- [README](./README.md)
- [Quick Start](./QUICK_START.md)
- [Swagger API Docs](/api/docs)

---

**© Rolemak - Sistema de Gestão de Leads**  
*Manual do Agente de IA v1.0*
