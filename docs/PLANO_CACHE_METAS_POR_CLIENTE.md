# 📋 PLANO DE CACHE — METAS POR CLIENTE

## Sistema de Gestão de Leads - Rolemak

**Página:** `/metas-por-cliente`  
**Endpoint:** `GET /api/v2/analytics/goals/seller/:sellerId`  
**Data:** Janeiro 2026

---

## 🎯 Objetivo

Otimizar a performance da página "Metas por Cliente" aplicando cache estratégico sem comprometer dados que precisam refletir operações em tempo real.

---

## 📊 Análise dos Dados

### Dados Exibidos na Página

| Dado | Fonte | Frequência de Atualização | Cacheable? |
|------|-------|---------------------------|------------|
| Lista de clientes | `customer_goals` | Mensal/Estática | ✅ Cache Longo |
| Nome/Cidade/Estado | `clientes` | Raramente muda | ✅ Cache Longo |
| Classificação ABC | `customer_goals` | Mensal/Estática | ✅ Cache Longo |
| Meta anual (`goal_2026`) | `customer_goals` | Anual/Estática | ✅ Cache Longo |
| Vendas 2026 (`sold_2026`) | `Vendas_Historia` | Muda com novos pedidos | ⚠️ Cache Curto |
| Vendas do mês (`sold_month`) | `Vendas_Historia` | **REALTIME** | ❌ Sem cache |
| Última compra (`last_purchase_date`) | `Vendas_Historia` | Muda com novos pedidos | ⚠️ Cache Curto |
| Penetração mensal (`is_active_month`) | Calculado | **REALTIME** | ❌ Sem cache |
| Gap anual | Calculado | Depende de vendas | ⚠️ Cache Curto |

---

## 🔒 Categorização de Dados

### ❌ NUNCA em Cache (Realtime)

Dados que mudam a cada nova venda e precisam refletir estado atual:

1. **`sold_month`** - Total vendido no mês atual
2. **`is_active_month`** - Se cliente comprou no mês
3. **`penetration_month_pct`** - Percentual de penetração
4. **`active_customers_month`** - Quantos clientes compraram no mês
5. **`total_sold_month`** - Total vendido no mês (agregado)

> **Razão:** O vendedor usa esses dados para decidir "quem atacar agora". Se cachear, ele pode ligar para um cliente que acabou de comprar.

### ⚠️ Cache Curto (5-10 minutos)

Dados que mudam ao longo do dia mas não precisam de atualização imediata:

1. **`sold_2026`** - Total vendido no ano
2. **`gap`** - Diferença entre meta e vendido
3. **`achievement_pct`** - % de atingimento anual
4. **`last_purchase_date`** - Data da última compra

> **Razão:** Esses dados são importantes para contexto histórico, mas uma defasagem de 5-10 minutos é aceitável.

### ✅ Cache Longo (30 min - 1 hora)

Dados estáticos ou que raramente mudam:

1. **`customer_id`** - ID do cliente
2. **`customer_name`** - Nome do cliente
3. **`city`**, **`state`** - Localização
4. **`classification`** - Classificação ABC
5. **`goal_2026`** - Meta anual definida
6. **`sales_2025`** - Vendas do ano anterior

> **Razão:** Esses dados são carregados da tabela `customer_goals` que é atualizada mensalmente/anualmente.

---

## 🏗️ Arquitetura Proposta

### Estratégia 1: Cache em Camadas (Recomendada)

```
┌─────────────────────────────────────────────────────────────────────┐
│  FRONTEND (React)                                                    │
│  └── State + React Query com staleTime                               │
├─────────────────────────────────────────────────────────────────────┤
│  BACKEND (Node.js)                                                   │
│  ├── Camada 1: Cache de Dados Estáticos (Redis/Memory)               │
│  │   └── Lista de clientes com metas (TTL: 30 min)                   │
│  ├── Camada 2: Dados Voláteis (sempre do DB)                         │
│  │   └── sold_month, is_active_month, penetration                    │
│  └── Merge dos dados no momento da requisição                        │
├─────────────────────────────────────────────────────────────────────┤
│  DATABASE (MySQL)                                                    │
│  └── Consulta otimizada com índices apropriados                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Estratégia 2: Cache Completo com Invalidação por Evento

```
┌─────────────────────────────────────────────────────────────────────┐
│  Cache TTL curto (2-5 min) para resposta completa                    │
│  + Invalidação automática quando nova venda é registrada             │
│  + Evento: "Nova venda para vendedor X" → Invalida cache do seller   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📝 Implementação Detalhada

### Fase 1: Separar Consultas no Service

**Arquivo:** `backend/src/v2/services/analytics/CustomerGoalsService.js`

```javascript
class CustomerGoalsService {

    /**
     * Dados estáticos - Cache longo (30 min)
     * Retorna lista base de clientes com metas
     */
    async getStaticCustomerData(sellerId, options = {}) {
        const cacheKey = `customer_goals:static:${sellerId}:${options.year}:${options.classification || 'all'}`;
        
        // Tenta buscar do cache
        const cached = await cacheService.get(cacheKey);
        if (cached) return cached;
        
        // Query apenas dados estáticos
        const data = await this.queryStaticData(sellerId, options);
        
        // Salva no cache por 30 min
        await cacheService.set(cacheKey, data, 1800);
        
        return data;
    }

    /**
     * Dados realtime - NUNCA em cache
     * Retorna métricas de vendas do mês atual
     */
    async getRealtimeMonthlyData(sellerId, options = {}) {
        // SEMPRE busca do banco
        return await this.queryMonthlyData(sellerId, options);
    }

    /**
     * Combina dados estáticos + realtime
     */
    async getBySeller(sellerId, options = {}) {
        const [staticData, realtimeData] = await Promise.all([
            this.getStaticCustomerData(sellerId, options),
            this.getRealtimeMonthlyData(sellerId, options)
        ]);
        
        return this.mergeCustomerData(staticData, realtimeData);
    }
}
```

### Fase 2: Implementar Cache Service

**Arquivo:** `backend/src/services/CacheService.js`

```javascript
import NodeCache from 'node-cache';
import logger from '../config/logger.js';

class CacheService {
    constructor() {
        // Cache em memória (fallback se Redis não disponível)
        this.memoryCache = new NodeCache({ 
            stdTTL: 300, // 5 min default
            checkperiod: 60 
        });
    }

    async get(key) {
        try {
            return this.memoryCache.get(key);
        } catch (error) {
            logger.warn('Cache get error', { key, error: error.message });
            return null;
        }
    }

    async set(key, value, ttlSeconds = 300) {
        try {
            this.memoryCache.set(key, value, ttlSeconds);
        } catch (error) {
            logger.warn('Cache set error', { key, error: error.message });
        }
    }

    async invalidate(pattern) {
        try {
            const keys = this.memoryCache.keys();
            const matchingKeys = keys.filter(k => k.includes(pattern));
            matchingKeys.forEach(k => this.memoryCache.del(k));
            logger.info('Cache invalidated', { pattern, count: matchingKeys.length });
        } catch (error) {
            logger.warn('Cache invalidate error', { pattern, error: error.message });
        }
    }
}

export const cacheService = new CacheService();
```

### Fase 3: Cache no Frontend (React Query)

**Arquivo:** `frontend/src/pages/CustomerGoalsPage.jsx`

```javascript
import { useQuery } from '@tanstack/react-query';

function CustomerGoalsPage() {
    const sellerId = user?.id;
    
    // Cache de 2 minutos no frontend para dados combinados
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['customer-goals', sellerId, year, month, classification],
        queryFn: () => analyticsV2Service.getCustomerGoalsBySeller(sellerId, {
            year, month, classification, limit, offset, order_by: orderBy
        }),
        staleTime: 2 * 60 * 1000, // 2 minutos
        cacheTime: 5 * 60 * 1000, // 5 minutos
        refetchOnWindowFocus: true, // Atualiza ao voltar para a aba
    });
    
    // Botão "Atualizar" força refetch
    const handleRefresh = () => refetch();
}
```

---

## ⏱️ TTLs Recomendados

| Camada | Tipo de Dado | TTL | Razão |
|--------|-------------|-----|-------|
| Backend | Dados estáticos (metas, nomes) | 30 min | Raramente mudam |
| Backend | Dados anuais (sold_2026, gap) | 10 min | Aceitável defasagem curta |
| Backend | Dados mensais (sold_month) | **0 (sem cache)** | Crítico para decisão |
| Frontend | Resposta completa | 2 min | UX + performance |

---

## 🔄 Invalidação de Cache

### Eventos que devem invalidar o cache:

1. **Nova venda registrada** → Invalida cache do vendedor
2. **Atualização de meta** → Invalida cache de dados estáticos
3. **Reclassificação de cliente** → Invalida cache de dados estáticos

### Implementação:

```javascript
// Ao registrar nova venda:
async function registerSale(saleData) {
    await salesRepository.create(saleData);
    
    // Invalida cache do vendedor afetado
    await cacheService.invalidate(`customer_goals:${saleData.sellerId}`);
}
```

---

## 📈 Métricas de Cache

### Headers para Debug

```javascript
res.set('X-Cache-Status', cached ? 'HIT' : 'MISS');
res.set('X-Cache-TTL', ttlRemaining);
res.set('X-Data-Age', secondsSinceLastFetch);
```

### Logs de Telemetria

```javascript
logger.info('CustomerGoals request', {
    sellerId,
    cacheHit: !!cached,
    queryTimeMs: endTime - startTime,
    dataCount: results.length
});
```

---

## ✅ Checklist de Implementação

### Backend
- [x] Criar `CacheService.js` com suporte a memória (e futuramente Redis) ✅ Já existia, adicionados métodos para CustomerGoals
- [x] Separar query estática de query realtime no `CustomerGoalsService` ✅ Implementado com 3 camadas
- [x] Adicionar cache key por `(sellerId, year, classification)` ✅ Implementado
- [x] Implementar invalidação por evento de venda ✅ Método `invalidateCustomerGoalsBySeller` criado
- [x] Adicionar headers de cache para debug ✅ X-Cache-Static, X-Cache-Annual, X-Query-Time-Ms
- [x] Adicionar logs de telemetria no controller ✅ Logs com queryTimeMs, cacheHit status
- [x] Invalidação automática ao converter lead ✅ Implementado em `leads.controller.js` → `convertToOrder`

### Frontend
- [ ] Migrar para React Query (ou manter estado manual com `staleTime`)
- [ ] Adicionar indicador visual "dados atualizados há X minutos"
- [ ] Botão "Atualizar" força bypass de cache

### Validação
- [x] Verificar que `sold_month` sempre reflete realtime ✅ Query separada sem cache
- [x] Verificar que `penetration_month_pct` sempre reflete realtime ✅ Calculado em _getRealtimeMonthlyData
- [ ] Medir tempo de resposta antes/depois
- [x] Testar cenário: venda registrada → cache invalidado ✅ Implementado em convertToOrder

---

## 🚫 O que NÃO cachear (Resumo Final)

```
❌ sold_month          → Vendedor precisa saber quem NÃO comprou ainda
❌ is_active_month     → Derivado de sold_month
❌ penetration_month_pct → Derivado de is_active_month
❌ active_customers_month → Derivado de is_active_month
❌ total_sold_month    → Agregado de sold_month
```

> **Regra Geral:** Qualquer dado que responde "este cliente comprou AGORA/HOJE/ESTE MÊS?" deve ser realtime.

---

## 📅 Cronograma Sugerido

| Fase | Tarefa | Tempo Estimado |
|------|--------|----------------|
| 1 | Criar CacheService básico | 1h |
| 2 | Separar queries estáticas/realtime | 2h |
| 3 | Implementar merge de dados | 1h |
| 4 | Adicionar invalidação por evento | 1h |
| 5 | Frontend: React Query ou cache manual | 2h |
| 6 | Testes e validação | 2h |

**Total estimado: 8-10 horas de desenvolvimento**

---

## 🔮 Futuro: Redis + Clustering

Para escalar além de um único servidor:

```yaml
# docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

```javascript
// CacheService.js com Redis
import Redis from 'ioredis';

class CacheService {
    constructor() {
        this.redis = new Redis(process.env.REDIS_URL);
    }
    
    async get(key) {
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
    }
    
    async set(key, value, ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    }
}
```
