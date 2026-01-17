# 🤖 Guia de Comandos do Chatbot Inteligente

Este documento descreve as capacidades e comandos do Assistente de IA integrado ao sistema **Leads Agent**. O chatbot utiliza Processamento de Linguagem Natural (NLP) para entender suas solicitações e executar ações diretamente no sistema.

## 🚀 Visão Geral Técnica

- **Processamento**: Respostas em < 2 segundos para comandos simples
- **Contexto**: Mantém histórico de conversa por até 30 minutos
- **Disponibilidade**: 99.9% uptime com fallback para modo offline
- **Segurança**: Autenticação OAuth 2.0 + encriptação end-to-end

---

## 🗂️ Categorias de Comandos

### 👥 Clientes
Utilize estes comandos para buscar informações sobre sua carteira.

| Comando | O que faz | Exemplo de consulta |
|:---|:---|:---|
| `search_customers` | Busca clientes por nome, CNPJ ou ID. | "Procure o cliente Rolemak" ou "Quem é o cliente 456?" |
| `get_customer_details` | Detalhes completos: endereço, contato e financeiro. | "Me dê os detalhes da La Tienda" |

---

### 📝 Leads (Cotações)
Gerenciamento de orçamentos e rascunhos de vendas.

| Comando | O que faz | Exemplo de consulta |
|:---|:---|:---|
| `search_leads` | Lista leads abertos ou convertidos. | "Quais são meus leads abertos?" ou "Mostre leads do cliente 123" |
| `get_lead_details` | Exibe itens, valores e observações de um lead. | "O que tem no lead 1025?" |
| `create_lead` | Cria um novo lead com produtos específicos. | "Crie um lead para o cliente 50 com 10 unidades do produto 100" |

---

### 📦 Pedidos e Estoque
Acompanhamento de vendas finalizadas e disponibilidade de produtos.

| Comando | O que faz | Exemplo de consulta |
|:---|:---|:---|
| `search_orders` | Busca pedidos finalizados na MakHoje. | "Quais pedidos eu fiz ontem?" ou "Histórico do pedido 190500" |
| `get_order_details` | Detalhes de um pedido (itens e pagamento). | "Detalhes do pedido 198500" |
| `search_products` | Busca produtos e consulta preços de tabela. | "Preço da linha Jack" ou "Buscar produto A4" |
| `get_product_stock` | Consulta saldo real em SP (Matriz/Filial) e SC. | "Qual o estoque do produto 2050?" |

---

### 💬 Interações e Follow-ups
Registro de contatos e agendamento de próximas ações.

| Comando | O que faz | Exemplo de consulta |
|:---|:---|:---|
| `create_interaction` | Registra chamadas, visitas, emails ou notas. | "Registrar que liguei para o cliente 10 e ele pediu para retornar amanhã" |

---

### 💰 Precificação Inteligente (Pricing Agent)
Simulações avançadas com impostos e descontos recomendados.

| Comando | O que faz | Exemplo de consulta |
|:---|:---|:---|
| `simulate_pricing` | Calcula preços com base em volume e impostos (IPI/ST). | "Simular preço de 10 máquinas A4 para o cliente 123 em 3x" |

---

### 📊 Analytics e Previsões (IA)
Ferramentas de inteligência de dados para suporte à decisão.

| Comando | O que faz | Exemplo de consulta |
|:---|:---|:---|
| `get_sales_forecast` | Previsão de vendas para os próximos 30 dias. | "Qual minha previsão de vendas para este mês?" |
| `get_customer_churn_risk` | Analisa risco de perda do cliente (Score 0-100). | "Qual o risco de churn do cliente 789?" |
| `check_sales_deviation` | Compara vendas reais vs. esperado pela IA. | "Como está meu desempenho esta semana?" |
| `get_product_recommendations` | Sugestões de compra (Reposição e Cross-sell). | "O que posso oferecer para o cliente 456?" |
| `get_discount_recommendation` | Sugestão de desconto ótimo para fechar negócio. | "Quanto de desconto posso dar no produto 100 para o cliente 10?" |

---

## 🔧 Referência Técnica (Para Desenvolvedores)

### APIs Subjacentes
Todos os comandos do chatbot mapeiam para endpoints REST documentados:

- **Base URL**: `https://api.leadsagent.com/v2`
- **Autenticação**: Bearer token via OAuth 2.0
- **Formato**: JSON com Content-Type: application/json

### Mapeamento de Comandos para APIs

| Comando | Endpoint | Método | Descrição |
|:---|:---|:---|:---|
| `search_customers` | `/customers/search` | GET | Busca com filtros |
| `create_lead` | `/leads` | POST | Criação de lead |
| `simulate_pricing` | `/pricing/simulate` | POST | Simulação de preços |
| `get_sales_forecast` | `/analytics/forecast` | GET | Previsões de IA |

### Limites e Performance
- **Rate Limit**: 100 requisições/minuto por usuário
- **Timeout**: 30 segundos para operações complexas
- **Cache**: Resultados em cache por 5 minutos
- **Batch Operations**: Suporte a até 50 itens por operação

### Recursos Avançados
- **Webhooks**: Notificações em tempo real para eventos importantes
- **Bulk Operations**: Processamento em lote para grandes volumes
- **Custom Fields**: Campos personalizados por cliente/empresa
- **Multi-tenant**: Isolamento completo entre empresas
- **Audit Logs**: Rastreamento completo de todas as operações

---

### 📈 Métricas de Performance
Acompanhamento rápido de resultados.

| Comando | O que faz | Exemplo de consulta |
|:---|:---|:---|
| `get_my_sales_metrics` | Resumo mensal vs. mês anterior. | "Quanto eu já vendi este mês?" |
| `get_daily_sales_metrics` | Total de vendas do dia atual ou específico. | "Qual meu total de hoje?" |

---

## ⚠️ Tratamento de Erros e Troubleshooting

### Códigos de Erro Comuns
| Código | Descrição | Solução |
|:---|:---|:---|
| `AUTH_401` | Token expirado ou inválido | Refaça login no sistema |
| `PERM_403` | Permissão insuficiente | Solicite acesso ao administrador |
| `NOT_FOUND_404` | Recurso não localizado | Verifique IDs e tente novamente |
| `RATE_LIMIT_429` | Muitas requisições | Aguarde 1 minuto e tente novamente |
| `TIMEOUT_504` | Sistema temporariamente indisponível | Tente novamente em alguns minutos |

### Cenários de Recuperação
- **Conexão perdida**: O chatbot tenta reconectar automaticamente por 3 minutos
- **Dados incorretos**: Use "corrigir" ou "editar" nos comandos seguintes
- **Comando não reconhecido**: O chatbot sugere alternativas similares

---

## 🔄 Exemplos de Fluxos Completos

### Fluxo de Venda Completo
```
1. "Buscar cliente Maria Silva" → Lista clientes encontrados
2. "Detalhes do cliente 123" → Informações completas
3. "Criar lead para cliente 123 com 5 impressoras" → Lead criado
4. "Simular preço do lead atual em 2x" → Cálculo com desconto
5. "Registrar que cliente pediu prazo de 30 dias" → Interação salva
```

### Fluxo de Análise de Performance
```
1. "Minhas vendas este mês" → Métricas atuais
2. "Comparar com mês passado" → Análise comparativa
3. "Quais clientes têm maior risco?" → Lista priorizada
4. "Recomendações para cliente 456" → Sugestões personalizadas
```

---

## 💡 Dicas para Melhores Resultados

1.  **Seja Específico**: Em vez de "quero um lead", diga "Crie um lead para o cliente 123 com 5 unidades do item 456".
2.  **Use IDs**: Se você souber o ID do cliente ou produto, a execução é mais rápida e precisa.
3.  **Encadeamento**: Você pode perguntar primeiro: "Busque o cliente La Tienda" e depois "Qual o risco de churn dele?". A IA manterá o contexto.
4.  **Linguagem Natural**: Não precisa decorar os nomes técnicos. A IA entende frases como "O Zé da Silva comprou algo este mês?" ou "Projeta minhas vendas".
5.  **Correção**: Se errar algo, diga "corrigir" seguido do que precisa mudar.
6.  **Contexto**: O chatbot lembra da conversa anterior por até 30 minutos.

---

## 📋 Checklist de Uso Eficaz

- [ ] Use IDs quando disponíveis para respostas mais rápidas
- [ ] Seja específico em quantidades e produtos
- [ ] Verifique permissões antes de operações críticas
- [ ] Use linguagem natural, evite jargões técnicos
- [ ] Teste comandos em ambiente de desenvolvimento primeiro

---
*Documentação atualizada para o Bloco 9 do Checklist Q2 2026 - v2.1*
