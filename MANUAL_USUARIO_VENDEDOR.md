# 📘 Manual do Usuário - Vendedor (Level 1)

## Sistema de Gestão de Leads - Rolemak

**Versão:** 1.0  
**Última atualização:** Janeiro 2026

---

## 📋 Índice

1. [Introdução](#introdução)
2. [Acesso ao Sistema](#acesso-ao-sistema)
3. [Visão Geral da Interface](#visão-geral-da-interface)
4. [Dashboard](#dashboard)
5. [Gerenciamento de Leads](#gerenciamento-de-leads)
6. [Minha Carteira de Clientes](#minha-carteira-de-clientes)
7. [Analytics](#analytics)
8. [Promoções e Descontos](#promoções-e-descontos)
9. [Relatórios](#relatórios)
10. [Assistente de IA e Chatbot](#10-assistente-de-ia-e-chatbot)
11. [Simulação de Preços (Pricing Agent)](#11-simulação-de-preços-pricing-agent)
12. [Modo Offline](#12-modo-offline)
13. [Dicas e Boas Práticas](#13-dicas-e-boas-práticas)

---

## 1. Introdução

O **Sistema de Gestão de Leads** é uma ferramenta moderna para gerenciar cotações, acompanhar clientes e otimizar suas vendas. Como vendedor (Level 1), você tem acesso às funcionalidades essenciais para o seu dia a dia.

### O que você pode fazer:
- ✅ Criar e gerenciar leads/cotações
- ✅ Visualizar sua carteira de clientes
- ✅ Acompanhar métricas de vendas pessoais
- ✅ Consultar promoções e descontos
- ✅ Registrar interações com clientes
- ✅ Acompanhar follow-ups pendentes
- ✅ Gerar relatórios de suas vendas
- ✅ **Utilizar o Assistente de IA para consultas e ações rápidas**
- ✅ **Simular preços complexos com impostos (IPI/ST)**
- ✅ **Trabalhar offline com sincronização automática**

### Limitações do seu nível:
- ❌ Você só visualiza leads e clientes atribuídos a você
- ❌ Não tem acesso às metas gerais da empresa
- ❌ Não pode filtrar por outros vendedores

---

## 2. Acesso ao Sistema

### URL de Acesso
```
https://leads.internut.com.br/
```

### Como fazer login

1. Acesse a URL do sistema
2. Na tela de login, informe:
   - **Usuário:** Seu nome de usuário ou email
   - **Senha:** Sua senha pessoal
3. Clique em **Entrar**

> **Dica:** Se esqueceu sua senha, entre em contato com o administrador do sistema.

### Sessão e Segurança
- Sua sessão permanece ativa por **24 horas**
- Após esse período, será necessário fazer login novamente
- Para sair, clique no seu avatar no canto superior direito e selecione **Sair**

---

## 3. Visão Geral da Interface

### Menu Lateral (Sidebar)

O menu lateral contém todas as seções do sistema:

| Ícone | Menu | Descrição |
|-------|------|-----------|
| 📊 | **Dashboard** | Tela principal com seus leads e métricas |
| 👥 | **Minha Carteira** | Lista de clientes atribuídos a você |
| 📈 | **Analytics** | Gráficos e análises de vendas |
| 🏷️ | **Promoções** | Promoções ativas |
| 🏷️ | **Desconto por Quantidade** | Tabela de descontos progressivos |
| 🏷️ | **Lançamentos** | Produtos em lançamento |
| 📄 | **Relatórios** | Geração de relatórios |
| ➕ | **Novo Lead** | Criar nova cotação |

### Barra Superior

- **Nome do sistema:** "Gestão de Leads"
- **Seu nome/nick:** Exibido no canto direito
- **Avatar:** Clique para acessar seu perfil ou sair

---

## 4. Dashboard

O Dashboard é sua tela principal de trabalho.

### Métricas Pessoais

Na parte superior, você verá cards com suas métricas:

- **Vendas do Mês:** Total vendido no mês atual
- **Vendas do Ano:** Total acumulado no ano
- **Ticket Médio:** Valor médio dos seus pedidos
- **Leads Abertos:** Quantidade de cotações pendentes

### Widgets Informativos

#### Progresso de Metas
Mostra seu progresso em relação às metas definidas (se houver).

#### Follow-ups Pendentes
Lista de clientes que precisam de acompanhamento. **Atenção especial aos atrasados!**

#### Alertas
Notificações importantes sobre:
- Clientes inativos há muito tempo
- Cotações próximas do vencimento
- Oportunidades de venda

#### Clientes em Risco
Clientes que não compram há algum tempo e precisam de atenção.

### Lista de Leads

A tabela principal mostra seus leads com as colunas:

| Coluna | Descrição |
|--------|-----------|
| **ID** | Identificador único do lead |
| **Cliente** | Nome do cliente |
| **Data** | Data de criação |
| **# Pedido** | Número do pedido (se convertido) |
| **Total** | Valor total da cotação |
| **User** | Quem criou o lead |
| **Seller** | Vendedor responsável |
| **Segmento** | Segmento do cliente |
| **Status** | Lead ou Pedido |
| **Ações** | Botões de visualizar/editar |

#### Ordenação
Clique no cabeçalho de qualquer coluna para ordenar. Clique novamente para inverter a ordem.

#### Busca
Use o campo de busca para encontrar leads por:
- Nome do cliente
- Número do pedido
- ID do lead

#### Paginação
Use os controles na parte inferior para navegar entre páginas e ajustar quantos itens exibir por página.

---

## 5. Gerenciamento de Leads

### Criar Novo Lead

1. Clique no botão **Novo Lead** (no menu ou no Dashboard)
2. Preencha os campos obrigatórios:

#### Campos do Formulário

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| **Cliente** | ✅ Sim | Selecione o cliente (autocomplete) |
| **Segmento** | Não | Segmento do lead |
| **Unidade Emitente** | Não | Unidade que emitirá a NF |
| **Natureza de Operação** | Não | Tipo de operação fiscal |
| **Tipo de Pagamento** | Não | À Vista, Boleto, Cartão, PIX, etc. |
| **Condições de Pagamento** | Não | Ex: n:30:30 (30 dias + 30 dias) |
| **Frete** | Não | Valor do frete |
| **Tipo de Frete** | Não | CIF, FOB ou Terceiros |
| **Transportadora** | Não | Transportadora preferencial |
| **Data de Entrega** | Não | Previsão de entrega |
| **Comprador** | Não | Nome do comprador no cliente |
| **Pedido de Compra** | Não | Número do pedido de compra |

#### Observações
Você pode adicionar observações em diferentes categorias:
- **Financeiro:** Informações para o setor financeiro
- **Logística:** Instruções de entrega
- **NFE:** Observações para nota fiscal
- **Gerais:** Outras informações
- **Gerente:** Observações para aprovação

3. Clique em **Salvar Lead**

### Visualizar Lead

1. Na lista de leads, clique no ícone 👁️ (olho)
2. Você verá todos os detalhes do lead:
   - Informações do cliente
   - Itens do carrinho
   - Valores e impostos
   - Histórico de alterações

### Editar Lead

1. Na lista de leads, clique no ícone ✏️ (lápis)
2. Altere os campos necessários
3. Clique em **Salvar Alterações**

> **Nota:** Leads já convertidos em pedido não podem ser editados.

### Adicionar Produtos ao Lead

Na tela de detalhes do lead:

1. Use o campo de busca de produtos
2. Digite o código SKU ou nome do produto
3. Selecione o produto desejado
4. Informe a quantidade
5. O sistema calculará automaticamente:
   - Preço unitário
   - Descontos aplicáveis
   - Impostos (ICMS, IPI, ST)
   - Total do item

### Converter Lead em Pedido

Quando o cliente aprovar a cotação:

1. Abra o lead
2. Clique no botão **Converter em Pedido**
3. Confirme a conversão
4. O sistema gerará um número de pedido

---

## 6. Minha Carteira de Clientes

### Acessando a Carteira

Clique em **Minha Carteira** no menu lateral.

### Lista de Clientes

Você verá todos os clientes atribuídos a você com:
- Nome/Razão Social
- CNPJ
- Cidade/Estado
- Status (Ativo, Em Risco, Inativo)
- Último pedido
- Total no ano

### Status dos Clientes

| Status | Cor | Significado |
|--------|-----|-------------|
| 🟢 **Ativo** | Verde | Comprou recentemente |
| 🟡 **Em Risco** | Amarelo | Há algum tempo sem comprar |
| 🔴 **Inativo** | Vermelho | Muito tempo sem comprar |

### Detalhes do Cliente

Clique em um cliente para ver:

#### Aba Pedidos
Histórico de todos os pedidos do cliente.

#### Aba Cotações
Leads/cotações criadas para o cliente.

#### Aba Produtos Frequentes
Produtos que o cliente mais compra - útil para sugerir reposição!

#### Aba Interações
Histórico de contatos e anotações sobre o cliente.

### Registrar Interação

1. Na página do cliente, vá para aba **Interações**
2. Clique em **Nova Interação**
3. Selecione o tipo:
   - Ligação
   - Email
   - Visita
   - WhatsApp
   - Reunião
4. Descreva o contato
5. Se necessário, agende um **follow-up**
6. Salve a interação

---

## 7. Analytics

### Acessando Analytics

Clique em **Analytics** no menu lateral.

### Métricas Disponíveis

#### Cards de Resumo
- **Vendas do Ano:** Total vendido no ano atual
- **Pedidos do Ano:** Quantidade de pedidos
- **Ticket Médio:** Valor médio por pedido
- **Clientes Ativos:** Clientes que compraram recentemente

#### Gráfico de Vendas por Mês
Visualize a evolução das suas vendas mês a mês.

#### Top 5 Clientes
Seus maiores clientes no período.

#### Vendas por Dia da Semana
Identifique os melhores dias para vender.

#### Comparação Anual
Compare seu desempenho com o ano anterior.

### Inteligência Artificial no Analytics
O sistema agora conta com análises preditivas para te ajudar:

- **Previsão de Vendas (Forecast):** A IA projeta quanto você deve vender nos próximos 30 dias com base no seu histórico.
- **Desvio de Metas:** O sistema te avisa se você está acima ou abaixo do esperado para atingir seus objetivos.
- **Risco de Churn:** Identificação automática de clientes com alta probabilidade de parar de comprar, permitindo uma ação preventiva.
- **Recomendações:** Sugestões personalizadas de produtos para cada cliente (Reposição e Cross-sell).

---

## 8. Promoções e Descontos

### Promoções Ativas

Acesse **Promoções** no menu para ver:
- Produtos em promoção
- Período de validade
- Desconto aplicado
- Condições especiais

### Desconto por Quantidade

Acesse **Desconto por Quantidade** para consultar:
- Tabela de descontos progressivos
- Faixas de quantidade
- Percentuais de desconto

### Lançamentos

Acesse **Lançamentos** para ver:
- Novos produtos
- Condições especiais de lançamento
- Período promocional

---

## 9. Relatórios

### Acessando Relatórios

Clique em **Relatórios** no menu lateral.

### Tipos de Relatórios Disponíveis

- **Vendas por Período:** Resumo de vendas em um período
- **Clientes:** Lista de clientes e status
- **Leads:** Cotações criadas e status
- **Produtos:** Produtos mais vendidos

### Gerando um Relatório

1. Selecione o tipo de relatório
2. Defina o período (data inicial e final)
3. Aplique filtros adicionais se necessário
4. Clique em **Gerar Relatório**
5. Exporte em PDF ou Excel se desejar

---

## 10. Assistente de IA e Chatbot

> **Nota:** Esta funcionalidade está em fase de liberação gradual e pode não estar disponível para todos os usuários. Atualmente liberada para supervisores e contas selecionadas.

O **Leads Agent** possui um assistente inteligente disponível no canto inferior direito da tela (quando habilitado para sua conta).

### O que o Chatbot pode fazer por você:

- **Consultas Rápidas:** "Qual o estoque do produto 2050?", "Qual o CNPJ do cliente La Tienda?"
- **Criação de Leads:** "Crie um lead para o cliente 50 com 10 máquinas A4."
- **Registro de Interações:** "Anote que liguei para o cliente 123 e ele vai fechar amanhã."
- **Análise de Dados:** "Qual minha previsão de vendas para este mês?", "Quais produtos oferecer para o cliente X?"

### Como usar:
1. Clique no ícone do robô no canto inferior direito.
2. Digite sua dúvida ou comando em linguagem natural.
3. A IA executará a ação ou trará a informação instantaneamente.

---

## 11. Simulação de Preços (Pricing Agent)

Para negociações complexas, você pode usar o **Simulador de Preços** integrado com a nossa inteligência de custos.

1. No carrinho do Lead, utilize a opção de **Simular Preço**.
2. O sistema consultará o **Pricing Agent**, que considera:
   - Volume histórico do cliente.
   - Nível de estoque e curva do produto.
   - Prazos de pagamento selecionados.
3. O sistema retornará o **preço ótimo sugerido** e calculará automaticamente os **impostos (IPI e ST)** para o estado do cliente.

---

## 12. Modo Offline

Sabemos que nem sempre há internet estável em visitas a clientes. Por isso, o sistema possui o **Modo Offline**.

### Como funciona:
- Se você perder a conexão, um indicador **"Offline"** aparecerá na parte inferior da tela.
- Você ainda poderá pesquisar clientes básicos e **criar novos leads**.
- Quando você salva um lead offline, ele fica em uma **fila interna**.

### Sincronização:
- Assim que o seu dispositivo detectar internet novamente, o sistema iniciará a sincronização automática.
- Você verá um ícone de **Sincronização** girando até que todos os dados sejam enviados ao servidor.
- **Importante:** Não limpe o cache do navegador enquanto houver itens pendentes na fila de sincronização.

---

## 13. Dicas e Boas Práticas

### Para Aumentar suas Vendas

1. **Acompanhe os Follow-ups**
   - Verifique diariamente os follow-ups pendentes
   - Não deixe clientes esperando

2. **Monitore Clientes em Risco**
   - Entre em contato antes que fiquem inativos
   - Ofereça condições especiais

3. **Use os Produtos Frequentes**
   - Ao criar cotações, consulte o que o cliente mais compra
   - Sugira reposição de itens

4. **Aproveite as Promoções**
   - Conheça as promoções ativas
   - Comunique aos clientes

5. **Registre Todas as Interações**
   - Mantenha histórico de contatos
   - Facilita o acompanhamento

### Atalhos Úteis

| Ação | Como fazer |
|------|------------|
| Buscar lead | Use o campo de busca no Dashboard |
| Novo lead rápido | Botão "Novo Lead" no menu |
| Ver cliente | Clique no nome do cliente em qualquer lista |
| Ordenar tabela | Clique no cabeçalho da coluna |

### Solução de Problemas Comuns

#### "Não consigo ver um lead"
- Verifique se o lead foi criado por você ou atribuído a você
- Leads de outros vendedores não são visíveis

#### "Cliente não aparece na busca"
- O cliente pode não estar na sua carteira
- Entre em contato com seu gerente

#### "Erro ao salvar lead"
- Verifique se todos os campos obrigatórios estão preenchidos
- O cliente deve ser selecionado

#### "Sessão expirada"
- Faça login novamente
- Isso acontece após 24 horas de inatividade

---

## 📞 Suporte

Em caso de dúvidas ou problemas:

1. **Primeiro:** Consulte este manual
2. **Segundo:** Fale com seu gerente direto
3. **Terceiro:** Entre em contato com o suporte técnico

---

**© Rolemak - Sistema de Gestão de Leads**  
*Manual do Usuário - Vendedor (Level 1)*
