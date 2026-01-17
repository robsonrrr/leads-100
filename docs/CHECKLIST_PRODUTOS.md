# ✅ CHECKLIST DE PRODUTOS — LEADS AGENT

## Sistema de Gestão de Leads - Rolemak

**Versão:** 1.1  
**Criado em:** 17 de Janeiro 2026  
**Atualizado em:** 17 de Janeiro 2026  
**Status:** Em Implementação 🔄

---

## 🎯 Objetivo

> **Transformar a experiência de produtos no Leads Agent, oferecendo visualização rica, busca inteligente e ferramentas que aceleram o processo de venda.**

---

## 📊 Métricas de Sucesso

| Métrica | Baseline | Meta |
|---------|----------|------|
| Tempo médio para encontrar produto | ~30s | < 10s |
| Uso de autocomplete | 70% | 95% |
| Taxa de erro de produto | 5% | < 1% |
| Uso de imagens | 0% | 100% |

---

# 🖼️ BLOCO 1 — VISUALIZAÇÃO DE PRODUTOS

## 1.1 Imagens de Produtos

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 1.1.1 | Thumbnail de produto na tabela de itens do carrinho | Frontend | ✅ |
| 1.1.2 | Modal de visualização ampliada ao clicar na imagem | Frontend | ✅ |
| 1.1.3 | Galeria de múltiplas imagens do produto (se disponíveis) | Frontend | ⏳ |
| 1.1.4 | Fallback para imagem padrão quando não encontrada | Frontend | ✅ |
| 1.1.5 | Lazy loading de imagens com Intersection Observer | Frontend | ⏳ |
| 1.1.6 | Cache de imagens no browser (Service Worker) | Frontend | ⏳ |

**URL Base:** `https://img.rolemak.com.br/id/h{altura}/{productId}.jpg`

**Critério de Aceite:**
```
✅ Imagens carregam em < 500ms
✅ Modal abre com imagem em alta resolução
✅ Fallback gracioso para produtos sem imagem
✅ Cache funciona offline (PWA)
```

---

## 1.2 Detalhes do Produto

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 1.2.1 | Componente ProductDetailModal | Frontend | ✅ |
| 1.2.2 | Exibir especificações técnicas | Frontend | ✅ |
| 1.2.3 | Exibir marca com logo | Frontend | ✅ |
| 1.2.4 | Exibir categoria/segmento | Frontend | ✅ |
| 1.2.5 | Exibir NCM e informações fiscais | Frontend | ✅ |
| 1.2.6 | Exibir preço de tabela e margem | Frontend | ✅ |
| 1.2.7 | Exibir estoque disponível em tempo real | Frontend | ✅ |
| 1.2.8 | Histórico de preços do produto (gráfico) | Frontend | ⏳ |

**Critério de Aceite:**
```
✅ Modal mostra todas as informações relevantes
✅ Estoque atualiza em tempo real (via cache Redis)
✅ Vendedor toma decisão informada sem sair da tela
```

---

# 🔍 BLOCO 2 — BUSCA E NAVEGAÇÃO

## 2.1 Autocomplete Aprimorado

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 2.1.1 | Busca por SKU/código de barras | Backend | ✅ |
| 2.1.2 | Busca por modelo | Backend | ✅ |
| 2.1.3 | Busca por descrição | Backend | ✅ |
| 2.1.4 | Busca por NCM | Backend | ✅ |
| 2.1.5 | Highlight de match nos resultados | Frontend | ✅ |
| 2.1.6 | Mostrar thumbnail no autocomplete | Frontend | ✅ |
| 2.1.7 | Mostrar estoque no autocomplete | Frontend | ✅ |
| 2.1.8 | Mostrar preço de tabela no autocomplete | Frontend | ✅ |
| 2.1.9 | Debounce otimizado (300ms) | Frontend | ✅ |
| 2.1.10 | Cache de buscas recentes | Frontend | ⏳ |

**Critério de Aceite:**
```
✅ Resultados aparecem em < 200ms
✅ Vendedor vê estoque antes de selecionar
✅ Buscas recentes acessíveis rapidamente
```

---

## 2.2 Página de Catálogo de Produtos

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 2.2.1 | Página /products com listagem | Frontend | ✅ |
| 2.2.2 | Filtro por categoria/segmento | Frontend | ✅ |
| 2.2.3 | Filtro por marca | Frontend | ⏳ |
| 2.2.4 | Filtro por faixa de preço | Frontend | ✅ |
| 2.2.5 | Filtro por disponibilidade (em estoque) | Frontend | ✅ |
| 2.2.6 | Ordenação por preço, nome, estoque | Frontend | ✅ |
| 2.2.7 | Visualização grid/lista | Frontend | ✅ |
| 2.2.8 | Paginação | Frontend | ✅ |
| 2.2.9 | Busca full-text (FULLTEXT MySQL) | Backend | ⏳ |
| 2.2.10 | Botão "Adicionar ao Lead" direto do catálogo | Frontend | ⏳ |

**Critério de Aceite:**
```
✅ Catálogo carrega em < 1s
✅ Filtros combinam sem lag
⏳ Vendedor adiciona produto ao lead em 2 cliques
```

---

## 2.3 Busca Inteligente

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 2.3.1 | Sugestões de busca (did you mean?) | Backend | ⏳ |
| 2.3.2 | Busca por sinônimos | Backend | ⏳ |
| 2.3.3 | Busca tolerante a erros de digitação | Backend | ⏳ |
| 2.3.4 | Histórico de buscas do vendedor | Backend | ⏳ |
| 2.3.5 | Produtos mais buscados (trending) | Backend | ⏳ |

---

# ⭐ BLOCO 3 — PERSONALIZAÇÃO

## 3.1 Favoritos do Vendedor

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 3.1.1 | Criar tabela `seller_favorite_products` | Backend | ✅ |
| 3.1.2 | Endpoint POST /api/products/:id/favorite | Backend | ✅ |
| 3.1.3 | Endpoint DELETE /api/products/:id/favorite | Backend | ✅ |
| 3.1.4 | Endpoint GET /api/products/favorites | Backend | ✅ |
| 3.1.5 | Botão de favoritar (coração) no produto | Frontend | ✅ |
| 3.1.6 | Seção "Meus Favoritos" no autocomplete | Frontend | ⏳ |
| 3.1.7 | Aba "Favoritos" na página de catálogo | Frontend | ⏳ |

**Estrutura da Tabela:**
```sql
CREATE TABLE seller_favorite_products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  seller_id INT NOT NULL,
  product_id INT NOT NULL,
  created_at DATETIME DEFAULT NOW(),
  UNIQUE KEY (seller_id, product_id),
  INDEX idx_seller (seller_id)
);
```

---

## 3.2 Produtos Recentes

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 3.2.1 | Rastrear produtos visualizados/adicionados | Backend | ⏳ |
| 3.2.2 | Endpoint GET /api/products/recent | Backend | ⏳ |
| 3.2.3 | Seção "Usados Recentemente" no autocomplete | Frontend | ⏳ |
| 3.2.4 | Limite de 20 produtos recentes por vendedor | Backend | ⏳ |

---

## 3.3 Produtos Frequentes do Cliente

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 3.3.1 | Analisar histórico de compras do cliente | Backend | ✅ |
| 3.3.2 | Endpoint GET /api/customers/:id/products | Backend | ✅ |
| 3.3.3 | Sugerir produtos frequentes ao criar lead | Frontend | ⏳ |
| 3.3.4 | Widget "Recompra Sugerida" no lead | Frontend | ⏳ |

---

# 📦 BLOCO 4 — ESTOQUE E DISPONIBILIDADE

## 4.1 Informações de Estoque

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 4.1.1 | Cache de estoque no Redis (TTL 2min) | Backend | ✅ |
| 4.1.2 | Exibir estoque na tabela de itens | Frontend | ✅ |
| 4.1.3 | Alerta visual quando estoque baixo (< 5) | Frontend | ✅ |
| 4.1.4 | Alerta visual quando sem estoque | Frontend | ✅ |
| 4.1.5 | Previsão de reposição (se disponível) | Backend | ⏳ |
| 4.1.6 | Invalidar cache ao atualizar estoque | Backend | ⏳ |

**Critério de Aceite:**
```
✅ Estoque sempre atualizado (max 2min delay)
✅ Vendedor vê claramente quando produto indisponível
✅ Alerta antes de adicionar produto sem estoque
```

---

## 4.2 Multi-Depósito

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 4.2.1 | Consultar estoque por depósito | Backend | ✅ |
| 4.2.2 | Exibir disponibilidade por local | Frontend | ✅ |
| 4.2.3 | Destacar unidade do lead (chip azul) | Frontend | ✅ |
| 4.2.4 | Alerta de estoque insuficiente na unidade | Frontend | ✅ |
| 4.2.5 | Bloquear conversão sem estoque na unidade | Frontend | ✅ |
| 4.2.6 | Calcular tempo de entrega por depósito | Backend | ⏳ |

**View SQL criada:** `produtos_estoque_por_unidades`
```sql
-- Consulta estoque normalizado por unidade
SELECT produto_id, unidade_id, unidade_fantasia, estoque_disponivel
FROM mak.produtos_estoque_por_unidades
WHERE produto_id = ?
```

**Endpoint:** `GET /api/products/:id/stock-by-warehouse`

---

# 🏷️ BLOCO 5 — PREÇOS E PROMOÇÕES

## 5.1 Informações de Preço

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 5.1.1 | Exibir preço de tabela (original) | Frontend | ✅ |
| 5.1.2 | Exibir preço sugerido (Pricing Agent) | Frontend | ✅ |
| 5.1.3 | Exibir desconto aplicado (%) | Frontend | ✅ |
| 5.1.4 | Exibir margem estimada | Frontend | ✅ |
| 5.1.5 | Histórico de preços (últimos 12 meses) | Backend | ⏳ |
| 5.1.6 | Gráfico de evolução de preço | Frontend | ⏳ |

---

## 5.2 Promoções

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 5.2.1 | Destacar produtos em promoção | Frontend | ✅ |
| 5.2.2 | Badge "Promoção" no autocomplete | Frontend | ✅ |
| 5.2.3 | Filtro de produtos em promoção | Frontend | ⏳ |
| 5.2.4 | Mostrar economia (preço original x promo) | Frontend | ✅ |
| 5.2.5 | Alertar quando promoção expirando | Frontend | ⏳ |

---

## 5.3 Badges de Pricing na Tabela de Itens

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 5.3.1 | Badge de Promoção na tabela (vermelho) | Frontend | ✅ |
| 5.3.2 | Badge de Lançamento (roxo) | Frontend | ✅ |
| 5.3.3 | Badge de Preço Fixo do cliente (laranja) | Frontend | ✅ |
| 5.3.4 | Badge de Combo/Bundle (verde outlined) | Frontend | ✅ |
| 5.3.5 | Badge de Desconto por Quantidade - SKU (azul) | Frontend | ✅ |
| 5.3.6 | Badge de Desconto por Quantidade - Família (azul) | Frontend | ✅ |
| 5.3.7 | Tooltip com detalhes em cada badge | Frontend | ✅ |
| 5.3.8 | Preço fixo do cliente no autocomplete | Frontend | ✅ |
| 5.3.9 | Aplicar preço fixo ao gravar item | Frontend | ✅ |

**Endpoints criados:**
```
GET /api/pricing/quantity-discounts - Descontos por quantidade
GET /api/pricing/launch-products - Produtos em lançamento
GET /api/pricing/customer-fixed-prices/:customerId - Preços fixos
GET /api/pricing/bundles - Combos/Bundles ativos
```

# 🔗 BLOCO 6 — PRODUTOS RELACIONADOS

## 6.1 Cross-Sell / Up-Sell

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 6.1.1 | Algoritmo de produtos relacionados | Backend | ⏳ |
| 6.1.2 | Endpoint GET /api/products/:id/related | Backend | ⏳ |
| 6.1.3 | Seção "Você também pode gostar" | Frontend | ⏳ |
| 6.1.4 | Acessórios e complementos | Backend | ⏳ |
| 6.1.5 | Produtos comprados juntos | Backend | ⏳ |

---

## 6.2 Comparador de Produtos

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 6.2.1 | Selecionar produtos para comparar | Frontend | ⏳ |
| 6.2.2 | Tabela comparativa lado a lado | Frontend | ⏳ |
| 6.2.3 | Destacar diferenças entre produtos | Frontend | ⏳ |
| 6.2.4 | Máximo 4 produtos por comparação | Frontend | ⏳ |

---

# 📱 BLOCO 7 — MOBILE E PWA

## 7.1 Experiência Mobile

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 7.1.1 | Leitor de código de barras (câmera) | Frontend | ⏳ |
| 7.1.2 | Busca por código de barras | Backend | ⏳ |
| 7.1.3 | Layout responsivo para catálogo | Frontend | ⏳ |
| 7.1.4 | Swipe para navegar imagens | Frontend | ⏳ |
| 7.1.5 | Touch-friendly para seleção | Frontend | ⏳ |

---

# 📈 BLOCO 8 — ANALYTICS DE PRODUTOS

## 8.1 Métricas de Produto

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 8.1.1 | Produtos mais vendidos (por período) | Backend | ⏳ |
| 8.1.2 | Produtos mais buscados | Backend | ⏳ |
| 8.1.3 | Taxa de conversão por produto | Backend | ⏳ |
| 8.1.4 | Margem média por produto | Backend | ⏳ |
| 8.1.5 | Dashboard de performance de produtos | Frontend | ⏳ |

---

# 📋 RESUMO

| Bloco | Tarefas | Concluídas | Pendentes |
|-------|---------|------------|-----------|
| 1. Visualização | 14 | 9 | 5 |
| 2. Busca | 20 | 9 | 11 |
| 3. Personalização | 14 | 7 | 7 |
| 4. Estoque | 12 | 9 | 3 |
| 5. Preços | 20 | 16 | 4 |
| 6. Relacionados | 9 | 0 | 9 |
| 7. Mobile | 5 | 0 | 5 |
| 8. Analytics | 5 | 0 | 5 |
| **Total** | **99** | **50** | **49** |

---

# 🗓️ CRONOGRAMA SUGERIDO

| Fase | Blocos | Semanas | Prioridade |
|------|--------|---------|------------|
| Fase 1 | 1.2 (Modal), 2.1 (Autocomplete) | 1-2 | 🔴 Alta |
| Fase 2 | 4.1 (Estoque), 3.1 (Favoritos) | 3-4 | 🟡 Média |
| Fase 3 | 2.2 (Catálogo), 5.2 (Promoções) | 5-6 | 🟡 Média |
| Fase 4 | 6.1 (Relacionados), 8.1 (Analytics) | 7-8 | 🟢 Baixa |
| Fase 5 | 7.1 (Mobile/PWA) | 9-10 | 🟢 Baixa |

---

# ⚠️ DEPENDÊNCIAS

## Dependências Técnicas
- ✅ API de imagens Rolemak
- ✅ Cache Redis configurado
- ⏳ MySQL FULLTEXT ativado
- ⏳ Service Worker para cache offline

## Dependências de Negócio
- ⏳ Definição de categorias a exibir
- ⏳ Regras de cross-sell/up-sell
- ⏳ Permissões de acesso ao catálogo

---

**© Rolemak - Sistema de Gestão de Leads**  
*Checklist de Produtos v1.0*
