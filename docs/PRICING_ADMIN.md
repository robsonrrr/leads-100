# Documentação do Pricing Admin

## Visão Geral

O **Pricing Admin** é um módulo integrado ao Leads Agent que permite gerenciar todas as regras de precificação do sistema. Este módulo foi migrado do antigo Pricing Agent e oferece uma interface moderna e unificada.

## Acesso

- **URL Base**: `/admin/pricing`
- **Requisito de Acesso**: Nível de usuário >= 5 (Administrador)
- **Autenticação**: JWT via sistema de login do Leads Agent

---

## Páginas Disponíveis

### 1. Dashboard (`/admin/pricing`)
Hub central com visão geral de todas as funcionalidades.

**Funcionalidades:**
- Status de saúde da API de Pricing
- Navegação rápida para todas as seções
- Estatísticas resumidas

---

### 2. Configurações de Estrutura

#### 2.1 Marcas (`/admin/pricing/brands`)
Gerenciar marcas e seus papéis no sistema de pricing.

**Campos:**
| Campo | Descrição |
|-------|-----------|
| `brand_id` | Identificador único da marca |
| `brand_name` | Nome da marca |
| `brand_role` | Papel: REVENDA, PROPRIA, CONCORRENTE |
| `is_active` | Status ativo/inativo |

**Ações:** Listar, Criar, Editar, Excluir

#### 2.2 Perfis Cliente-Marca (`/admin/pricing/profiles`)
Associar clientes a marcas específicas com políticas diferenciadas.

**Campos:**
| Campo | Descrição |
|-------|-----------|
| `customer_id` | ID do cliente |
| `brand_id` | ID da marca |
| `profile_type` | Tipo de perfil |
| `discount_modifier` | Modificador de desconto |

#### 2.3 Tiers de Volume (`/admin/pricing/tiers`)
Configurar faixas de desconto por volume.

**Abas:**
- Volume Tiers (Global)
- Brand Role Tiers

**Campos:**
| Campo | Descrição |
|-------|-----------|
| `min_value` | Valor mínimo da faixa |
| `max_value` | Valor máximo da faixa |
| `discount_pct` | Percentual de desconto |

#### 2.4 Fatores de Ajuste (`/admin/pricing/factors`)
Gerenciar fatores de curva ABC e níveis de estoque.

**Abas:**
- Curva ABC (A, B, C, D)
- Níveis de Estoque (Alto, Médio, Baixo, Crítico)

---

### 3. Regras de Desconto

#### 3.1 Descontos por Quantidade - D4Q (`/admin/pricing/quantity-discounts`)
Descontos escalonados baseados na quantidade comprada.

**Exemplo:**
| Quantidade | Desconto |
|------------|----------|
| 1-9 | 0% |
| 10-49 | 5% |
| 50-99 | 10% |
| 100+ | 15% |

#### 3.2 Descontos por Valor - D4P (`/admin/pricing/value-discounts`)
Descontos escalonados pelo valor do pedido.

**Campos:**
| Campo | Descrição |
|-------|-----------|
| `min_value` | Valor mínimo do pedido |
| `max_value` | Valor máximo do pedido |
| `discount_pct` | Percentual de desconto |

#### 3.3 Bundles/Combos (`/admin/pricing/bundles`)
Kits de produtos com preços especiais.

**Funcionalidades:**
- Criar bundles com múltiplos itens
- Definir preço ou desconto do kit
- Gerenciar itens do bundle

---

### 4. Promoções (`/admin/pricing/promotions`)

Gerenciar promoções por segmento de mercado.

**Segmentos Disponíveis:**
- Máquinas
- Rolamentos
- Peças Têxteis
- Autopeças
- Motopeças

**Campos:**
| Campo | Descrição |
|-------|-----------|
| `name` | Nome da promoção |
| `segment_id` | Segmento de mercado |
| `sku` | SKU específico (opcional) |
| `discount_type` | Percentual ou Valor Fixo |
| `discount_value` | Valor do desconto |
| `start_date` | Início da promoção |
| `end_date` | Fim da promoção |
| `customer_id` | Cliente específico (opcional) |

**Ações:** Duplicar, Ativar/Desativar

---

### 5. Acordos e Proteções

#### 5.1 Preços Fixos (`/admin/pricing/fixed-prices`)
Preços específicos para combinações cliente-produto.

**Funcionalidades:**
- CRUD individual
- Importação em lote via CSV
- Exportação para CSV

**Formato CSV:**
```csv
customer_id,sku,fixed_price,start_date,end_date
12345,ABC-001,150.50,2024-01-01,2024-12-31
```

#### 5.2 Produtos em Lançamento (`/admin/pricing/launch-products`)
Proteção de margem para novos produtos.

**Campos:**
| Campo | Descrição |
|-------|-----------|
| `sku` | SKU do produto |
| `launch_date` | Data de lançamento |
| `end_date` | Fim da proteção |
| `protection_pct` | % de margem protegida |

#### 5.3 Proteção Regional (`/admin/pricing/regional-protection`)
Regras de preço por região/estado.

**Campos:**
| Campo | Descrição |
|-------|-----------|
| `customer_id` | Cliente (opcional) |
| `sku` | Produto (opcional) |
| `state` | Estado (UF) |
| `min_price` | Preço mínimo |
| `max_discount_pct` | Desconto máximo |

#### 5.4 Ancoragem de Preço (`/admin/pricing/last-price-rules`)
Limites de variação baseados em vendas anteriores.

**Tipos de Âncora:**
- Última Venda
- Média Últimas 3/6 Vendas
- Mínimo/Máximo Últimas 6 Vendas

**Campos:**
| Campo | Descrição |
|-------|-----------|
| `anchor_type` | Tipo de âncora |
| `max_increase_pct` | Aumento máximo permitido |
| `max_decrease_pct` | Redução máxima permitida |
| `lookback_days` | Período de análise (dias) |

---

### 6. Ferramentas de Diagnóstico

#### 6.1 Teste de Precificação (`/admin/pricing/test`)
Simulador individual do motor de pricing.

**Entrada:**
- Cliente
- Produto (SKU)
- Quantidade
- Condição de Pagamento

**Saída:**
- Preço Base
- Desconto Total
- Preço Final
- Regras Aplicadas (breakdown)
- JSON Completo da resposta

**Features:**
- Histórico de testes (localStorage)
- Link para Teste em Lote

#### 6.2 Teste em Lote (`/admin/pricing/test/batch`)
Execução de testes em massa via CSV.

**Funcionalidades:**
- Upload de arquivo CSV
- Múltiplos cenários para comparação
- Barra de progresso durante execução
- Sumário com totais e médias
- Exportação de resultados

**Formato CSV:**
```csv
customer_id,sku,quantity,payment_term
12345,ABC-001,10,a_vista
67890,XYZ-100,20,30_dias
```

---

## API Endpoints (Proxy)

Todos os endpoints são prefixados com `/api/admin/pricing/`

### Estrutura
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/brands` | Listar marcas |
| POST | `/brands` | Criar marca |
| PUT | `/brands/:id` | Atualizar marca |
| DELETE | `/brands/:id` | Excluir marca |

### Search
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/search/customers?q=` | Buscar clientes |
| GET | `/search/products?q=` | Buscar produtos |

### Teste
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/test` | Executar teste de pricing |

---

## Considerações de Segurança

1. **Autenticação**: Todas as rotas requerem token JWT válido
2. **Autorização**: Mínimo nível 5 (Admin) para acesso
3. **Auditoria**: Todas as operações são registradas no log de auditoria
4. **Validação**: Entrada é validada no frontend e backend

---

## Troubleshooting

### Erro: "API de Pricing indisponível"
- Verificar se o serviço Pricing Agent está rodando
- Confirmar URL no arquivo `.env` (`PRICING_API_URL`)

### Erro: "Acesso negado"
- Verificar nível do usuário logado (mínimo 5)
- Confirmar token JWT válido

### Testes não retornam resultados
- Verificar se cliente/produto existem no banco
- Confirmar formato dos dados de entrada

---

## Changelog

### v1.0.0 (2024-01-20)
- Migração inicial do Pricing Admin
- 16 páginas implementadas
- CRUD completo para todas as entidades
- Teste individual e em lote
- Importação/Exportação CSV
