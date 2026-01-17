# Auditoria de Performance de Queries (Q3 2026)

## Visão Geral
Auditoria realizada em 17/01/2026 visando identificar gargalos de performance e otimizar o uso de índices.

## Tabelas Críticas Identificadas

### 1. `mak.hoje` (Pedidos/Vendas)
- **Volume:** Alto (> 1M linhas estimadas)
- **Uso:** Agregações de vendas por período, vendedor e cliente.
- **Problema:** Uso extensivo de funções nas colunas de data (`YEAR(data)`, `MONTH(data)`), impedindo uso eficiente de índices B-Tree padrão.
- **Solução Proposta:** 
  1. Reescrever queries para usar range `BETWEEN`.
  2. Adicionar índice composto `(data, valor, nop, vendedor)`.

### 2. `staging.staging_queries` (Leads)
- **Volume:** Médio
- **Uso:** Contagem de leads abertos/convertidos por vendedor.
- **Problema:** Queries N+1 detectadas em relatórios de performance de vendedores.
- **Solução Proposta:**
  1. Eliminar subqueries correlacionadas (Feito ✅).
  2. Adicionar índice `(cSeller, cType)` e `(cType)`.

### 3. `mak.clientes`
- **Volume:** Médio
- ** Problema:** Busca de "Clientes em Risco" faz full scan ou join pesado com `mak.hoje`.
- **Solução Proposta:** Índice em `vendedor` e `ultimo_pedido` (se existir) ou otimizar a subquery de `last_order`.

## Análise EXPLAIN (Simulação)

### Query: Dashboard Sales (Original)
```sql
SELECT ... FROM mak.hoje h WHERE YEAR(h.data) = 2026 ...
```
- **Type:** ALL (Full Table Scan) ou INDEX (Full Index Scan)
- **Rows:** ~1M
- **Custo:** Alto

### Query: Dashboard Sales (Otimizada)
```sql
SELECT ... FROM mak.hoje h WHERE h.data BETWEEN '2026-01-01' AND '2026-12-31' ...
```
- **Type:** RANGE
- **Key:** idx_data
- **Rows:** ~100k (apenas linhas do ano)
- **Custo:** Baixo

## Ações Realizadas

1. **Eliminação de N+1:** Removida subquery correlacionada em `getSellerPerformance`.
2. **Refatoração de Datas:** Queries de dashboard migradas para range search.
3. **Criação de Índices:** Script SQL gerado para DBA aplicar.

## Script de Índices Sugeridos

```sql
-- mak.hoje
CREATE INDEX idx_hoje_data_nop_valor ON mak.hoje (data, nop, valor);
CREATE INDEX idx_hoje_vendedor_data ON mak.hoje (vendedor, data);

-- staging.staging_queries
CREATE INDEX idx_staging_seller_type ON staging.staging_queries (cSeller, cType);

-- rolemak_users
CREATE INDEX idx_users_depto_segmento ON rolemak_users (depto, segmento);
```
