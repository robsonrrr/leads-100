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

## 🔧 Pós-Venda e Suporte Técnico

Gestão completa do ciclo de vida pós-venda, desde ordens de serviço até suporte financeiro.

| Comando | O que faz | Exemplo de consulta |
|:---|:---|:---|
| `create_service_order` | Cria ordem de serviço para conserto/manutenção. | "Criar OS para cliente 123 - impressora com defeito de impressão" |
| `search_service_orders` | Busca ordens de serviço por status, cliente ou período. | "Quais OS estão em aberto?" ou "OS do cliente 456" |
| `get_service_order_details` | Detalhes completos da OS (status, técnico, peças). | "Detalhes da OS 2024-001" |
| `update_service_order` | Atualiza status, adiciona peças ou observações. | "Atualizar OS 2024-001 para 'em andamento' com técnico João" |
| `schedule_technical_visit` | Agenda visita técnica com cliente. | "Agendar visita para cliente 123 amanhã às 14h" |
| `get_warranty_info` | Consulta validade e cobertura de garantia. | "Garantia do produto 789 para cliente 123?" |
| `create_support_ticket` | Abre chamado de suporte técnico. | "Abrir chamado - cliente reclama de ruído na máquina" |
| `get_billing_info` | Consulta boletos, pagamentos e pendências. | "Boletos em aberto do cliente 456" |
| `send_payment_reminder` | Envia lembrete de pagamento por email/SMS. | "Enviar cobrança para cliente 123 do boleto vencido" |
| `get_maintenance_schedule` | Agenda preventivo de equipamentos. | "Quando é a próxima manutenção do cliente 789?" |

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

## 🧠 RECURSOS DECISÓRIOS AVANÇADOS

### Sistema de Risco e Política
O chatbot agora opera como **interface conversacional do sistema de decisão**, com:

- ✅ **Classificação automática de risco** (LOW/MEDIUM/HIGH/CRITICAL)
- ✅ **Referência explícita à política** aplicada
- ✅ **Verbalização de impacto econômico**
- ✅ **Modos adaptativos por perfil** (Vendedor/Gerente/Diretoria)
- ✅ **Integração completa ao Context Graph**

### Respostas Estruturadas por Risco
Todas as respostas seguem formato padronizado:

```
🎯 AÇÃO
[Descrição da ação executada]

📊 RESULTADO
[Dados/resultados obtidos]

⚠️ RISCO
[Nível: LOW/MEDIUM/HIGH/CRITICAL]
[Explicação do risco identificado]

📋 POLÍTICA
[Referência à política aplicável]

➡️ PRÓXIMO PASSO
[Recomendação de ação seguinte]
```

### Modos Operacionais por Perfil

| Perfil | Foco | Exemplos de Comandos |
|:---|:---|:---|
| **👤 Vendedor** | Operacional e prático | `create_lead`, `simulate_pricing`, `get_product_stock` |
| **👥 Gerente** | Decisório e supervision | `approve_discount`, `get_team_metrics`, `override_policy` |
| **🏛️ Diretoria** | Estratégico e analítico | `get_company_metrics`, `review_policy`, `analyze_trends` |

---

## 📢 Marketing e Campanhas

Ferramentas completas para gestão de marketing digital, campanhas e geração de leads.

| Comando | O que faz | Exemplo de consulta |
|:---|:---|:---|
| `create_campaign` | Cria campanha de marketing com público-alvo. | "Criar campanha 'Black Friday' para clientes de SP" |
| `search_campaigns` | Lista campanhas ativas ou por período. | "Quais campanhas estão rodando?" ou "Campanhas do último trimestre" |
| `get_campaign_performance` | Métricas detalhadas: cliques, conversões, ROI. | "Performance da campanha Black Friday" |
| `segment_customers` | Segmenta clientes por perfil/demografia/comportamento. | "Segmentar clientes por região e volume de compra" |
| `send_marketing_email` | Dispara email marketing para segmento específico. | "Enviar newsletter para clientes inativos há 6 meses" |
| `schedule_social_post` | Agenda posts para redes sociais. | "Agendar post no LinkedIn para amanhã às 10h" |
| `get_lead_sources` | Análise de origem dos leads (orgânico, pago, indicação). | "De onde vieram os leads deste mês?" |
| `create_landing_page` | Gera landing page otimizada para conversão. | "Criar LP para promoção de impressoras" |
| `get_marketing_roi` | Calcula retorno sobre investimento de campanhas. | "ROI da campanha Google Ads do mês passado" |
| `generate_content_ideas` | Sugestões de conteúdo baseadas em dados. | "Ideias de posts para LinkedIn sobre sustentabilidade" |

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
| `create_service_order` | `/service-orders` | POST | Criação de OS |
| `search_service_orders` | `/service-orders/search` | GET | Busca de OS |
| `get_billing_info` | `/billing/customer/{id}` | GET | Informações financeiras |
| `schedule_technical_visit` | `/service-orders/{id}/schedule` | POST | Agendamento de visita |
| `create_campaign` | `/marketing/campaigns` | POST | Criação de campanha |
| `get_campaign_performance` | `/marketing/campaigns/{id}/performance` | GET | Métricas de campanha |
| `segment_customers` | `/marketing/segments` | POST | Criação de segmento |
| `send_marketing_email` | `/marketing/emails/send` | POST | Disparo de email |

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
- **Risk Engine**: Classificação automática de risco em tempo real
- **Policy Guardian**: Validação automática contra políticas vigentes
- **Context Graph**: Integração estrutural com sistema de decisão
- **Role-Based Modes**: Adaptação contextual por perfil de usuário

### Métricas de Marketing
- **CAC (Customer Acquisition Cost)**: Custo por cliente conquistado
- **LTV (Lifetime Value)**: Valor do cliente ao longo do tempo
- **Conversion Rate**: Taxa de conversão por canal/campanha
- **ROI por Canal**: Retorno sobre investimento segmentado
- **Engagement Rate**: Taxa de engajamento em redes sociais

### Integrações Pós-Venda
- **Gateway de Pagamento**: Integração com bancos para boletos e PIX
- **Sistema de OS**: Sincronização com software de gestão de serviços
- **Email/SMS**: Disparos automáticos de lembretes e confirmações
- **Calendário**: Sincronização com Google Calendar/Outlook
- **ERP**: Integração com sistemas de gestão empresarial

### Integrações de Marketing
- **Google Ads/Facebook Ads**: Importação automática de dados de campanhas
- **Mailchimp/SendGrid**: Sincronização de listas e automações
- **LinkedIn/Instagram**: Agendamento e análise de posts sociais
- **Google Analytics**: Métricas de tráfego e conversão
- **HubSpot/RD Station**: CRM e automação de marketing integrada

### Documentação Técnica Relacionada
- **📄 [CHATBOT_POLICY_PROMPT.md](CHATBOT_POLICY_PROMPT.md)**: Prompt oficial e regras invioláveis
- **📄 [CHATBOT_RISK_RESPONSES.md](CHATBOT_RISK_RESPONSES.md)**: Sistema de respostas por nível de risco
- **📄 [CHATBOT_CONTEXT_GRAPH.md](CHATBOT_CONTEXT_GRAPH.md)**: Integração como nó do Context Graph
- **📄 [CHATBOT_ROLE_MODES.md](CHATBOT_ROLE_MODES.md)**: Modos adaptativos por perfil

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
- **OS duplicada**: Sistema detecta automaticamente e sugere mesclar

### SLA e Prioridades no Pós-Venda
| Prioridade | Tempo de Resposta | Descrição |
|:---|:---|:---|
| 🔴 **Crítica** | Imediata (< 2h) | Equipamento parado, produção interrompida |
| 🟡 **Alta** | 4 horas | Problema funcional significativo |
| 🟠 **Média** | 24 horas | Problema menor, trabalho alternativo possível |
| 🟢 **Baixa** | 72 horas | Consultoria, melhoria ou manutenção preventiva |

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

### Fluxo de Pós-Venda Completo
```
1. "Cliente 123 ligou reclamando da impressora" → Registrar interação
2. "Criar OS para cliente 123 - defeito de impressão" → OS criada automaticamente
3. "Agendar visita técnica amanhã às 10h" → Visita agendada
4. "Verificar garantia do produto 456" → Status de garantia consultado
5. "Atualizar OS para 'concluída' com peças trocadas" → OS finalizada
6. "Enviar lembrete de pagamento para cliente 123" → Cobrança enviada
```

### Fluxo de Marketing Completo
```
1. "Segmentar clientes por região SP e volume > 10k" → Lista de prospects criada
2. "Criar campanha 'Q4 2024' para segmento acima" → Campanha configurada
3. "Gerar ideias de conteúdo sobre eficiência energética" → Sugestões de posts
4. "Agendar post no LinkedIn para quinta-feira" → Publicação programada
5. "Criar landing page para promoção especial" → Página otimizada gerada
6. "Enviar email marketing para segmento inativo" → Campanha disparada
7. "Performance da campanha Q4 até agora" → Métricas em tempo real
8. "De onde vieram os leads desta semana?" → Análise de origens
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
7.  **Pós-Venda**: Para suporte técnico, use "OS" para ordens de serviço e seja específico sobre sintomas/problemas.
8.  **Urgência**: Use palavras como "urgente" ou "emergência" para priorizar atendimentos.
9.  **Marketing**: Use termos como "campanha", "segmento", "ROI" para comandos de marketing. Seja específico sobre públicos-alvo e canais.
10. **Risco e Política**: O chatbot sempre classifica risco e referencia política. Use isso para tomar decisões informadas.
11. **Modos por Perfil**: Vendedores veem ações práticas, gerentes supervision e diretoria análises estratégicas.
12. **Decisões Consientes**: Sempre leia o nível de risco antes de prosseguir com ações críticas.

---

## 📋 Checklist de Uso Eficaz

- [ ] Use IDs quando disponíveis para respostas mais rápidas
- [ ] Seja específico em quantidades e produtos
- [ ] Verifique permissões antes de operações críticas
- [ ] Use linguagem natural, evite jargões técnicos
- [ ] Teste comandos em ambiente de desenvolvimento primeiro

---
*Documentação atualizada para o Bloco 9 do Checklist Q2 2026 - v2.1*
