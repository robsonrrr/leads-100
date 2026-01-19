# 📋 Plano de Implementação - Endpoints de Pedidos

## Objetivo
Implementar endpoints REST para buscar pedidos (orders) do sistema, buscando dados das tabelas `mak.hoje` e `mak.hist`.

## Estrutura das Tabelas

### `mak.hoje` (Pedido Principal)
- `pedido` (PK) - ID do pedido
- `data` - Data de criação
- `nop` - Natureza de operação
- `idcli` - ID do cliente
- `idcom` - ID da comissão
- `emissor` - ID do usuário emissor
- `vendedor` - ID do vendedor
- `pg` - Tipo de pagamento
- `terms` - Condições de pagamento
- `fprazo` - Forma de prazo
- `prazo` - Prazo
- `idtr` - ID da transportadora
- `frete` - Valor do frete
- `EmissorPOID` - Unidade emitente
- `UnidadeLogistica` - Unidade logística
- `datae` - Data de entrega
- `crossover` - Crossover
- `obs` - Observações gerais
- `obsfinanc` - Observações financeiras
- `obslogistic` - Observações logísticas
- `obsnfe` - Observações NFE
- `valor_base` - Valor base
- `valor_st` - Valor ST
- `valor_ipi` - Valor IPI
- `valor` - Valor total
- `usvale` - Usvale
- `comissao_revenda` - Comissão de revenda
- `entrada` - Entrada
- `spedido` - Status do pedido
- `source` - Origem

### `mak.hist` (Itens do Pedido)
- `id` (PK) - ID do item
- `pedido` (FK) - ID do pedido (referência a mak.hoje)
- `quant` - Quantidade
- `vezes` - Vezes
- `valor` - Valor total do item
- `valor_base` - Valor base
- `vProduct` - Valor do produto
- `vProductCC` - Valor consumidor
- `aliquota_ipi` - Alíquota IPI
- `valor_ipi` - Valor IPI
- `valor_st` - Valor ST
- `entrada` - Entrada
- `tabela` - Tabela de preço
- `idcli` - ID do cliente
- `isbn` - ID do produto
- `estoque` - Estoque
- `obs` - Observações
- `TTD` - Tipo de depósito

## Implementação

### 1. Model: `models/Order.js`
- Representar pedido com dados de `mak.hoje`
- Incluir relacionamento com cliente (JOIN)
- Incluir relacionamento com transportadora (JOIN)
- Método `toJSON()` para serialização

### 2. Repository: `repositories/order.repository.js`
- Método `findById(orderId)`:
  - Buscar pedido em `mak.hoje` por `pedido = orderId`
  - JOIN com `clientes` para dados do cliente
  - JOIN com `transportadora` para dados da transportadora
  - JOIN com `Emitentes` para dados da unidade emitente
  - Buscar itens em `mak.hist` onde `pedido = orderId`
  - JOIN com `inv` e `produtos` para dados dos produtos
  - Retornar Order com array de items

### 3. Controller: `controllers/orders.controller.js`
- `getOrderById(req, res, next)`:
  - Validar ID do pedido
  - Chamar `orderRepository.findById()`
  - Retornar JSON com estrutura padronizada
  - Tratar erros (404, 400, 500)

### 4. Routes: `routes/orders.routes.js`
- `GET /api/orders/:id`:
  - Autenticação obrigatória
  - Documentação Swagger
  - Chamar `ordersController.getOrderById()`

### 5. Index: `index.js`
- Importar `ordersRoutes`
- Registrar em `/api/orders`

## Estrutura de Resposta JSON

```json
{
  "success": true,
  "data": {
    "id": 12345,
    "orderWeb": 12345,
    "createdAt": "2024-01-10T10:00:00.000Z",
    "customer": {
      "id": 100,
      "nome": "Cliente Exemplo",
      "cnpj": "12345678000190",
      "ender": "Rua Exemplo, 123",
      "cidade": "São Paulo",
      "estado": "SP"
    },
    "freight": 50.00,
    "freightType": 1,
    "deliveryDate": "2024-01-20T00:00:00.000Z",
    "paymentType": 1,
    "paymentTerms": "n:30:30",
    "transporter": {
      "id": 9,
      "name": "Transportadora Exemplo"
    },
    "remarks": {
      "finance": "Observação financeira",
      "logistic": "Observação logística",
      "nfe": "Observação NFE",
      "obs": "Observação geral"
    },
    "subtotal": 1000.00,
    "totalIPI": 100.00,
    "totalST": 50.00,
    "total": 1200.00,
    "items": [
      {
        "id": 1,
        "productId": 500,
        "product": {
          "id": 500,
          "model": "MODEL-001",
          "brand": "Marca",
          "name": "Produto Exemplo"
        },
        "quantity": 10,
        "price": 100.00,
        "subtotal": 1000.00,
        "ipi": 100.00,
        "st": 50.00
      }
    ]
  }
}
```

## Ordem de Implementação

1. ✅ Criar `models/Order.js` - **CONCLUÍDO**
2. ✅ Adicionar `findById()` em `repositories/order.repository.js` - **CONCLUÍDO**
3. ✅ Criar `controllers/orders.controller.js` - **CONCLUÍDO**
4. ✅ Criar `routes/orders.routes.js` - **CONCLUÍDO**
5. ✅ Registrar rotas em `index.js` - **CONCLUÍDO**

## Status da Implementação

✅ **TODAS AS TAREFAS CONCLUÍDAS**

### Arquivos Criados/Modificados:
- ✅ `backend/src/models/Order.js` - Modelo de pedido
- ✅ `backend/src/repositories/order.repository.js` - Método `findById()` adicionado
- ✅ `backend/src/controllers/orders.controller.js` - Controller criado
- ✅ `backend/src/routes/orders.routes.js` - Rotas criadas
- ✅ `backend/src/index.js` - Rotas registradas

### Endpoint Disponível:
- ✅ `GET /api/orders/:id` - Busca pedido por ID
  - Autenticação: Obrigatória (Bearer Token)
  - Documentação: Swagger disponível em `/api/docs`
  - Resposta: JSON com dados completos do pedido e itens

### Próximos Passos (Opcional):
- [ ] Testar endpoint com pedido real
- [ ] Adicionar endpoint de listagem de pedidos
- [ ] Adicionar filtros e paginação
- [ ] Adicionar endpoint para atualizar status do pedido
