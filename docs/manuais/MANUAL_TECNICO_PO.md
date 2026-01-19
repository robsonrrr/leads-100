# 📘 Manual Técnico e de Administrador - Leads Agent

## Sistema de Gestão de Leads - Rolemak

**Versão:** 1.0  
**Última atualização:** Janeiro 2026

---

## 📋 Índice

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Arquitetura Técnica](#2-arquitetura-técnica)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Estrutura do Projeto](#4-estrutura-do-projeto)
5. [Modelo de Dados](#5-modelo-de-dados)
6. [API REST - Endpoints](#6-api-rest---endpoints)
7. [Sistema de Permissões](#7-sistema-de-permissões)
8. [Funcionalidades por Módulo](#8-funcionalidades-por-módulo)
9. [Integrações](#9-integrações)
10. [Infraestrutura e Deploy](#10-infraestrutura-e-deploy)
11. [Monitoramento e Logs](#11-monitoramento-e-logs)
12. [Roadmap e Backlog](#12-roadmap-e-backlog)
13. [Glossário Técnico](#13-glossário-técnico)

---

## 1. Visão Geral do Sistema

### 1.1 Propósito

O **Leads Agent** é um sistema moderno de gestão de leads/cotações desenvolvido para substituir gradualmente o sistema legado K3. Permite que vendedores criem cotações, gerenciem clientes e acompanhem métricas de vendas.

### 1.2 Objetivos de Negócio

| Objetivo | Descrição |
|----------|-----------|
| **Modernização** | Interface moderna e responsiva |
| **Produtividade** | Reduzir tempo de criação de cotações |
| **Visibilidade** | Métricas em tempo real para gestão |
| **Mobilidade** | Acesso via dispositivos móveis |
| **Integração** | Compatibilidade com sistema legado K3 |

### 1.3 Usuários do Sistema

| Tipo | Level | Descrição |
|------|-------|-----------|
| **Vendedor** | 1-4 | Cria e gerencia seus próprios leads |
| **Gerente** | 5+ | Supervisiona equipe, define metas |
| **Admin** | 6 | Acesso total ao sistema |

### 1.4 URLs de Acesso

| Ambiente | URL |
|----------|-----|
| **Produção** | https://leads.internut.com.br/ |
| **Desenvolvimento** | https://dev.office.internut.com.br/leads/modern/ |
| **API Docs** | https://leads.internut.com.br/api/docs |

---

## 2. Arquitetura Técnica

### 2.1 Visão Geral

```
┌─────────────────────────────────────────────────────────────┐
│                         NGINX                                │
│                    (Proxy Reverso)                          │
└─────────────────┬───────────────────────┬───────────────────┘
                  │                       │
                  ▼                       ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│       FRONTEND          │   │        BACKEND          │
│     React + Vite        │   │    Node.js + Express    │
│     (SPA - :5173)       │   │      (API - :3001)      │
└─────────────────────────┘   └───────────┬─────────────┘
                                          │
                              ┌───────────┴───────────┐
                              │                       │
                              ▼                       ▼
                    ┌─────────────────┐   ┌─────────────────┐
                    │     MySQL       │   │     Redis       │
                    │   (RDS AWS)     │   │    (Cache)      │
                    │   Banco: mak    │   │    (:6379)      │
                    └─────────────────┘   └─────────────────┘
```

### 2.2 Padrão de Arquitetura

O backend segue o padrão **MVC + Repository**:

```
Request → Route → Controller → Repository → Database
                      ↓
                   Model
                      ↓
Response ← Controller ←
```

### 2.3 Fluxo de Autenticação

```
1. Login (POST /api/auth/login)
   └─→ Valida credenciais (MD5 hash - legado)
   └─→ Gera JWT (access token + refresh token)
   └─→ Armazena refresh token no Redis

2. Requisições Autenticadas
   └─→ Header: Authorization: Bearer <token>
   └─→ Middleware valida JWT
   └─→ Extrai user info (userId, level, depto, segmento)

3. Refresh Token (POST /api/auth/refresh)
   └─→ Valida refresh token
   └─→ Gera novo access token
```

---

## 3. Stack Tecnológico

### 3.1 Backend

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **Node.js** | 20+ | Runtime JavaScript |
| **Express** | 4.18 | Framework web |
| **MySQL2** | 3.6 | Driver MySQL |
| **JWT** | 9.0 | Autenticação |
| **Redis** | 4.6 | Cache e sessões |
| **Joi** | 17.11 | Validação de dados |
| **Winston** | 3.19 | Logging |
| **Helmet** | 7.1 | Segurança HTTP |
| **Swagger** | 6.2 | Documentação API |
| **PDFKit** | 0.17 | Geração de PDFs |
| **Jest** | 29.7 | Testes |

### 3.2 Frontend

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **React** | 18.2 | Framework UI |
| **Vite** | 5.0 | Build tool |
| **Material-UI** | 5.15 | Componentes UI |
| **Redux Toolkit** | 2.0 | Estado global |
| **React Router** | 6.21 | Roteamento |
| **Axios** | 1.6 | HTTP client |
| **Recharts** | 3.6 | Gráficos |
| **date-fns** | 3.2 | Manipulação de datas |

### 3.3 Infraestrutura

| Componente | Tecnologia |
|------------|------------|
| **Containers** | Docker + Docker Compose |
| **Proxy** | Nginx |
| **Database** | AWS RDS MySQL |
| **Cache** | Redis 7 Alpine |
| **CI/CD** | (A definir) |

---

## 4. Estrutura do Projeto

### 4.1 Visão Geral

```
leads-agent/
├── backend/                    # API Node.js
│   ├── src/
│   │   ├── config/            # Configurações (DB, Redis, Swagger)
│   │   ├── constants/         # Constantes do sistema
│   │   ├── controllers/       # Lógica de negócio
│   │   ├── middleware/        # Auth, Error handling, Rate limit
│   │   ├── migrations/        # Scripts de migração/views
│   │   ├── models/            # Modelos de dados
│   │   ├── repositories/      # Acesso a dados
│   │   ├── routes/            # Definição de rotas
│   │   ├── services/          # Serviços auxiliares
│   │   └── utils/             # Utilitários
│   ├── tests/                 # Testes unitários e integração
│   └── package.json
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── components/        # Componentes reutilizáveis
│   │   ├── contexts/          # React Contexts
│   │   ├── hooks/             # Custom hooks
│   │   ├── pages/             # Páginas/Views
│   │   ├── services/          # API services
│   │   ├── store/             # Redux store
│   │   └── utils/             # Utilitários
│   └── package.json
├── docker/                     # Configurações Docker
├── nginx/                      # Configuração Nginx
└── docs/                       # Documentação
```

### 4.2 Backend - Detalhamento

#### Controllers (12 arquivos)
| Arquivo | Responsabilidade |
|---------|------------------|
| `auth.controller.js` | Login, logout, refresh token |
| `leads.controller.js` | CRUD de leads, itens do carrinho |
| `customers.controller.js` | Busca e métricas de clientes |
| `products.controller.js` | Busca de produtos |
| `orders.controller.js` | Visualização de pedidos |
| `analytics.controller.js` | Métricas e dashboards |
| `goals.controller.js` | Gestão de metas |
| `interactions.controller.js` | Interações com clientes |
| `alerts.controller.js` | Alertas e notificações |
| `pricing.controller.js` | Preços e descontos |
| `promotions.controller.js` | Promoções ativas |
| `reports.controller.js` | Geração de relatórios |

#### Repositories (9 arquivos)
| Arquivo | Tabelas Principais |
|---------|-------------------|
| `lead.repository.js` | sCart (leads/carrinhos) |
| `cartItem.repository.js` | sCartItem (itens) |
| `customer.repository.js` | customers, orders |
| `product.repository.js` | products, stock |
| `order.repository.js` | orders, orderItems |
| `tax.repository.js` | taxRules, taxConfig |
| `stock.repository.js` | stock, stockMovements |
| `pricing.repository.js` | priceRules |
| `promotion.repository.js` | promotions |

### 4.3 Frontend - Detalhamento

#### Pages (11 páginas)
| Página | Rota | Descrição |
|--------|------|-----------|
| `DashboardPage` | `/` | Tela principal com leads |
| `CreateLeadPage` | `/leads/new` | Criar novo lead |
| `EditLeadPage` | `/leads/:id/edit` | Editar lead |
| `LeadDetailPage` | `/leads/:id` | Detalhes do lead |
| `CustomerDetailPage` | `/customers/:id` | Detalhes do cliente |
| `AnalyticsPage` | `/analytics` | Gráficos e métricas |
| `GoalsPage` | `/goals` | Gestão de metas (gerente) |
| `DiscountsPage` | `/pricing/quantity-discounts` | Descontos por quantidade |
| `LaunchProductsPage` | `/pricing/launch-products` | Produtos em lançamento |
| `ReportsPage` | `/reports` | Relatórios |
| `LoginPage` | `/login` | Autenticação |

#### Componentes Principais
| Componente | Função |
|------------|--------|
| `Layout` | Estrutura com menu lateral |
| `CustomerAutocomplete` | Busca de clientes |
| `ProductAutocomplete` | Busca de produtos |
| `CartItems` | Lista de itens do carrinho |
| `MetricsCards` | Cards de métricas |
| `ManagerMetricsWidget` | Métricas para gerentes |
| `GoalProgressWidget` | Progresso de metas |
| `RankingWidget` | Ranking de vendedores |
| `InteractionsTimeline` | Timeline de interações |

---

## 5. Modelo de Dados

### 5.1 Entidades Principais

#### Lead (sCart)
```
┌─────────────────────────────────────────┐
│                 sCart                    │
├─────────────────────────────────────────┤
│ cSCart (PK)      - ID do lead           │
│ dCart            - Data de criação      │
│ cCustomer (FK)   - ID do cliente        │
│ cUser (FK)       - ID do criador        │
│ cSeller (FK)     - ID do vendedor       │
│ cSegment         - Segmento             │
│ cNatOp           - Natureza operação    │
│ cEmitUnity       - Unidade emitente     │
│ cLogUnity        - Unidade logística    │
│ cTransporter     - Transportadora       │
│ cPaymentType     - Tipo pagamento       │
│ cPaymentTerms    - Condições pgto       │
│ vFreight         - Valor frete          │
│ vFreightType     - Tipo frete           │
│ cType            - 1=Lead, 2=Pedido     │
│ cOrderWeb        - Nº pedido (se conv.) │
│ xRemarks*        - Observações          │
└─────────────────────────────────────────┘
```

#### Item do Carrinho (sCartItem)
```
┌─────────────────────────────────────────┐
│              sCartItem                   │
├─────────────────────────────────────────┤
│ cSCartItem (PK)  - ID do item           │
│ cSCart (FK)      - ID do lead           │
│ cProduct (FK)    - ID do produto        │
│ nQtd             - Quantidade           │
│ vPrice           - Preço unitário       │
│ vDiscount        - Desconto             │
│ vIPI             - Valor IPI            │
│ vST              - Valor ST             │
│ vICMS            - Valor ICMS           │
│ vTotal           - Total do item        │
└─────────────────────────────────────────┘
```

#### Cliente (customers)
```
┌─────────────────────────────────────────┐
│              customers                   │
├─────────────────────────────────────────┤
│ cCustomer (PK)   - ID do cliente        │
│ xName            - Razão social         │
│ xTradeName       - Nome fantasia        │
│ xCNPJ            - CNPJ                 │
│ xAddress         - Endereço             │
│ xCity            - Cidade               │
│ xState           - Estado               │
│ xPhone           - Telefone             │
│ xEmail           - Email                │
│ cSeller          - Vendedor responsável │
│ vCreditLimit     - Limite de crédito    │
│ vCreditAvailable - Crédito disponível   │
└─────────────────────────────────────────┘
```

#### Usuário (users)
```
┌─────────────────────────────────────────┐
│                users                     │
├─────────────────────────────────────────┤
│ id (PK)          - ID do usuário        │
│ user             - Nome de usuário      │
│ nick             - Apelido              │
│ email            - Email                │
│ newpassword      - Senha (MD5)          │
│ level            - Nível de acesso      │
│ depto            - Departamento         │
│ segmento         - Segmento             │
│ empresa          - Empresa              │
└─────────────────────────────────────────┘
```

### 5.2 Níveis de Usuário (level)

| Level | Tipo | Permissões |
|-------|------|------------|
| 1 | Vendedor | Apenas próprios leads/clientes |
| 2-4 | Vendedor Senior | Apenas próprios leads/clientes |
| 5 | Gerente | Ver toda equipe, definir metas |
| 6 | Admin | Acesso total |

### 5.3 Relacionamentos

```
users (1) ─────────────── (N) sCart (leads)
                              │
customers (1) ────────────────┘
                              │
sCart (1) ─────────────── (N) sCartItem
                              │
products (1) ─────────────────┘
```

---

## 6. API REST - Endpoints

### 6.1 Autenticação (`/api/auth`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/login` | Autenticar usuário |
| POST | `/refresh` | Renovar token |
| GET | `/me` | Dados do usuário atual |
| POST | `/logout` | Encerrar sessão |

### 6.2 Leads (`/api/leads`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/` | Listar leads (paginado) |
| GET | `/:id` | Obter lead por ID |
| POST | `/` | Criar novo lead |
| PUT | `/:id` | Atualizar lead |
| DELETE | `/:id` | Remover lead |
| GET | `/:id/items` | Listar itens do carrinho |
| POST | `/:id/items` | Adicionar item |
| PUT | `/:id/items/:itemId` | Atualizar item |
| DELETE | `/:id/items/:itemId` | Remover item |
| GET | `/:id/totals` | Calcular totais |
| POST | `/:id/taxes` | Calcular impostos |
| POST | `/:id/convert` | Converter em pedido |

### 6.3 Clientes (`/api/customers`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/search` | Buscar clientes |
| GET | `/:id` | Obter cliente |
| GET | `/:id/metrics` | Métricas do cliente |
| GET | `/:id/orders` | Pedidos do cliente |
| GET | `/:id/leads` | Leads do cliente |
| GET | `/:id/top-products` | Produtos mais comprados |
| GET | `/sellers` | Listar vendedores |
| GET | `/seller-segments` | Segmentos de vendedores |

### 6.4 Produtos (`/api/products`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/search` | Buscar produtos |
| GET | `/:id` | Obter produto |
| GET | `/:id/stock` | Verificar estoque |
| GET | `/:id/price` | Obter preço |

### 6.5 Analytics (`/api/analytics`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/dashboard` | Dados do dashboard |
| GET | `/top-customers` | Top clientes |
| GET | `/seller-summary` | Resumo do vendedor |
| GET | `/team-metrics` | Métricas da equipe |

### 6.6 Metas (`/api/goals`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/` | Listar metas |
| POST | `/` | Criar meta |
| PUT | `/:id` | Atualizar meta |
| DELETE | `/:id` | Remover meta |
| GET | `/team-progress` | Progresso da equipe |

### 6.7 Interações (`/api/interactions`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/customer/:id` | Interações do cliente |
| POST | `/` | Registrar interação |
| GET | `/follow-ups` | Follow-ups pendentes |
| GET | `/follow-ups/count` | Contagem de follow-ups |

### 6.8 Documentação da API

A documentação completa da API está disponível via Swagger:
- **URL:** `/api/docs`
- **JSON Spec:** `/api/docs.json`

---

## 7. Sistema de Permissões

### 7.1 Middleware de Autenticação

```javascript
// Autenticação obrigatória
authenticateToken(req, res, next)

// Autenticação opcional
optionalAuth(req, res, next)

// Requer nível mínimo
requireLevel(minLevel)

// Requer admin (level > 4)
requireAdmin(req, res, next)

// Verifica acesso ao recurso
checkResourceAccess(ownerIdField)
```

### 7.2 Regras de Acesso por Funcionalidade

| Funcionalidade | Level 1-4 | Level 5+ |
|----------------|-----------|----------|
| Ver próprios leads | ✅ | ✅ |
| Ver leads da equipe | ❌ | ✅ |
| Criar leads | ✅ | ✅ |
| Editar próprios leads | ✅ | ✅ |
| Editar leads de outros | ❌ | ✅ |
| Ver próprios clientes | ✅ | ✅ |
| Ver todos os clientes | ❌ | ✅ |
| Filtrar por vendedor | ❌ | ✅ |
| Definir metas | ❌ | ✅ |
| Ver métricas da equipe | ❌ | ✅ |
| Acessar página de Metas | ❌ | ✅ |

### 7.3 Filtros Automáticos

Para usuários Level 1-4, o sistema aplica filtros automáticos:

```javascript
// No controller de leads
if (userLevel <= 4) {
  filters.userId = currentUserId; // Só vê seus próprios leads
}

// No controller de clientes
if (userLevel === 1) {
  options.sellerId = currentUserId; // Só vê seus clientes
}
```

---

## 8. Funcionalidades por Módulo

### 8.1 Módulo de Leads

#### Funcionalidades
- Criar lead com cliente e configurações
- Adicionar/remover/editar itens do carrinho
- Calcular impostos (IPI, ST, ICMS)
- Calcular totais
- Converter lead em pedido
- Filtrar e ordenar leads
- Buscar leads por texto

#### Regras de Negócio
- Lead deve ter cliente obrigatório
- Itens devem ter quantidade > 0
- Preços são calculados automaticamente
- Impostos são calculados por item
- Conversão gera número de pedido único

### 8.2 Módulo de Clientes

#### Funcionalidades
- Buscar clientes (autocomplete)
- Ver detalhes do cliente
- Ver métricas (vendas, ticket médio, frequência)
- Ver histórico de pedidos
- Ver leads do cliente
- Ver produtos mais comprados
- Registrar interações

#### Métricas Calculadas
- Total no ano/mês
- Quantidade de pedidos
- Ticket médio
- Frequência de compra
- Dias desde último pedido
- Status (ativo/em risco/inativo)

### 8.3 Módulo de Analytics

#### Funcionalidades
- Dashboard com vendas por mês
- Comparação anual
- Top clientes
- Vendas por dia da semana
- Métricas da equipe (gerentes)

#### Filtros Disponíveis
- Por período
- Por vendedor (gerentes)
- Por segmento (gerentes)

### 8.4 Módulo de Metas

#### Funcionalidades (apenas gerentes)
- Definir metas por vendedor
- Metas mensais ou anuais
- Acompanhar progresso
- Visualizar ranking

#### Campos da Meta
- Vendedor
- Ano/Mês
- Valor alvo
- Quantidade de pedidos (opcional)
- Observações

### 8.5 Módulo de Interações

#### Funcionalidades
- Registrar contatos com clientes
- Tipos: Ligação, Email, Visita, WhatsApp, Reunião
- Agendar follow-ups
- Visualizar timeline
- Alertas de follow-ups pendentes

### 8.6 Módulo de Preços

#### Funcionalidades
- Consultar descontos por quantidade
- Ver produtos em lançamento
- Ver promoções ativas

---

## 9. Integrações

### 9.1 Sistema Legado K3

O sistema integra com o banco de dados do K3:

| Integração | Descrição |
|------------|-----------|
| **Autenticação** | Usa tabela `users` do K3 |
| **Clientes** | Lê da tabela `customers` |
| **Produtos** | Lê da tabela `products` |
| **Pedidos** | Grava na tabela `orders` |
| **Estoque** | Consulta tabela `stock` |

### 9.2 Banco de Dados

- **Host:** AWS RDS (vallery.catmgckfixum.sa-east-1.rds.amazonaws.com)
- **Database:** mak
- **Engine:** MySQL

### 9.3 Cache (Redis)

Usado para:
- Armazenar refresh tokens
- Cache de consultas frequentes
- Sessões de usuário

---

## 10. Infraestrutura e Deploy

### 10.1 Ambientes

| Ambiente | Descrição |
|----------|-----------|
| **Desenvolvimento** | Local com Docker Compose |
| **Staging** | dev.office.internut.com.br |
| **Produção** | leads.internut.com.br |

### 10.2 Docker Compose

Serviços configurados:
- **backend:** Node.js API (porta 3001)
- **frontend:** React SPA (porta 5173)
- **redis:** Cache (porta 6379)
- **nginx:** Proxy reverso (portas 80/443)

### 10.3 Variáveis de Ambiente

```env
# Backend
NODE_ENV=production
PORT=3001

# Database
DB_HOST=<host>
DB_USER=<user>
DB_PASSWORD=<password>
DB_NAME=mak
DB_PORT=3306

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT
JWT_SECRET=<secret>
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://leads.internut.com.br
```

### 10.4 Comandos de Deploy

```bash
# Desenvolvimento
cd docker
docker-compose up -d

# Produção
docker-compose -f docker-compose.traefik.yml up -d

# Logs
docker-compose logs -f backend

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

---

## 11. Monitoramento e Logs

### 11.1 Logging

O sistema usa **Winston** para logging estruturado:

```javascript
// Níveis de log
error   // Erros críticos
warn    // Avisos
info    // Informações gerais
debug   // Debug (desenvolvimento)
```

### 11.2 Logs de Auditoria

Eventos registrados:
- Login/logout de usuários
- Criação/edição de leads
- Conversão de leads em pedidos
- Alterações em metas

### 11.3 Health Check

Endpoint para monitoramento:
- `GET /health` ou `GET /api/health`
- Retorna: `{ status: 'ok', timestamp: '...' }`

### 11.4 Métricas de Performance

- Rate limiting configurado
- Compressão GZIP habilitada
- Connection pooling no MySQL
- Cache Redis para consultas frequentes

---

## 12. Roadmap e Backlog

### 12.1 Funcionalidades Implementadas ✅

- [x] Autenticação JWT com sistema legado
- [x] CRUD completo de leads
- [x] Carrinho de produtos com impostos
- [x] Busca de clientes e produtos
- [x] Conversão de lead em pedido
- [x] Dashboard com métricas
- [x] Analytics com gráficos
- [x] Sistema de metas (gerentes)
- [x] Interações com clientes
- [x] Follow-ups e alertas
- [x] Filtros por vendedor/segmento
- [x] Ranking de vendedores
- [x] Promoções e descontos
- [x] Relatórios básicos
- [x] **Motor de Automação (Regras de Follow-up e Alertas)**
- [x] **Inteligência Artificial (Chatbot, Forecast e Churn Risk)**
- [x] **PWA e Modo Offline com Sincronização**
- [x] **Integração com Pricing Agent (CSuite)**
- [x] **Cálculo Automático de Impostos (IPI/ST)**

### 12.2 Backlog e Melhorias Futuras 📋

#### Alta Prioridade
- [ ] Integração nativa com WhatsApp Business
- [ ] Dashboard customizável por usuário
- [ ] Workflow de aprovação de descontos acima da alçada

#### Média Prioridade
- [ ] Exportação de relatórios em Excel avançado
- [ ] Histórico de alterações em leads (auditoria fina)
- [ ] Comissionamento automático integrado ao financeiro

#### Baixa Prioridade
- [ ] Integração com CRM externo (Salesforce/Hubspot)
- [ ] Suporte a múltiplos idiomas

### 12.3 Débitos Técnicos

- [ ] Migrar senhas de MD5 para bcrypt
- [ ] Implementar testes E2E
- [ ] Documentar todas as APIs no Swagger
- [ ] Configurar CI/CD automatizado
- [ ] Implementar cache mais agressivo

---

## 13. Glossário Técnico

| Termo | Descrição |
|-------|-----------|
| **Lead** | Cotação/proposta comercial |
| **sCart** | Tabela de leads (shopping cart) |
| **sCartItem** | Item do carrinho/lead |
| **Level** | Nível de permissão do usuário |
| **NOP** | Natureza de Operação (fiscal) |
| **IPI** | Imposto sobre Produtos Industrializados |
| **ST** | Substituição Tributária |
| **ICMS** | Imposto sobre Circulação de Mercadorias |
| **CIF** | Cost, Insurance and Freight (frete pago pelo cliente) |
| **FOB** | Free on Board (frete pago pelo vendedor) |
| **JWT** | JSON Web Token (autenticação) |
| **K3** | Sistema legado da empresa |
| **Segmento** | Divisão comercial (ex: Rolemak, MakPrime) |

---

## 📞 Contatos

| Função | Responsável |
|--------|-------------|
| **Product Owner** | (A definir) |
| **Tech Lead** | (A definir) |
| **DevOps** | (A definir) |

---

## 📚 Documentação Relacionada

- [Manual do Vendedor](./MANUAL_USUARIO_VENDEDOR.md)
- [Manual do Gerente](./MANUAL_USUARIO_GERENTE.md)
- [README do Projeto](./README.md)
- [Quick Start](./QUICK_START.md)
- [API Docs (Swagger)](/api/docs)

---

**© Rolemak - Sistema de Gestão de Leads**  
*Manual Técnico - Product Owner*
