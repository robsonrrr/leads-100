# 🤖 Guia de Comandos do Chatbot Inteligente

Este documento descreve as capacidades e comandos do Assistente de IA integrado ao sistema **Leads Agent**. O chatbot utiliza Processamento de Linguagem Natural (NLP) para entender suas solicitações e executar ações diretamente no sistema.

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

### 📈 Métricas de Performance
Acompanhamento rápido de resultados.

| Comando | O que faz | Exemplo de consulta |
|:---|:---|:---|
| `get_my_sales_metrics` | Resumo mensal vs. mês anterior. | "Quanto eu já vendi este mês?" |
| `get_daily_sales_metrics` | Total de vendas do dia atual ou específico. | "Qual meu total de hoje?" |

---

## 💡 Dicas para Melhores Resultados

1.  **Seja Específico**: Em vez de "quero um lead", diga "Crie um lead para o cliente 123 com 5 unidades do item 456".
2.  **Use IDs**: Se você souber o ID do cliente ou produto, a execução é mais rápida e precisa.
3.  **Encadeamento**: Você pode perguntar primeiro: "Busque o cliente La Tienda" e depois "Qual o risco de churn dele?". A IA manterá o contexto.
4.  **Linguagem Natural**: Não precisa decorar os nomes técnicos. A IA entende frases como "O Zé da Silva comprou algo este mês?" ou "Projeta minhas vendas".

---
*Documentação gerada para o Bloco 9 do Checklist Q2 2026.*
