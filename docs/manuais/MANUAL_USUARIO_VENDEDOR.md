# 📘 Manual do Usuário - Vendedor (Level 1-4)

## Sistema de Gestão de Leads - Rolemak

**Versão:** 1.6.3  
**Última atualização:** Janeiro 2026

---

## 📋 Índice

1. [Introdução](#introdução)
2. [Acesso ao Sistema](#acesso-ao-sistema)
3. [Visão Geral da Interface](#visão-geral-da-interface)
4. [Dashboard](#dashboard)
5. [Lista de Leads](#lista-de-leads)
6. [Gerenciamento de Leads](#gerenciamento-de-leads)
7. [Minha Carteira de Clientes](#minha-carteira-de-clientes)
8. [Metas por Cliente](#metas-por-cliente)
9. [Analytics](#analytics)
10. [Promoções e Descontos](#promoções-e-descontos)
11. [Relatórios](#relatórios)
12. [Assistente de IA e Chatbot](#assistente-de-ia-e-chatbot)
13. [Notificações Push](#notificações-push)
14. [Segurança e 2FA](#segurança-e-2fa)
15. [Modo Offline e PWA](#modo-offline-e-pwa)
16. [Dicas e Boas Práticas](#dicas-e-boas-práticas)

---

## 1. Introdução

O **Sistema de Gestão de Leads** é uma ferramenta moderna para gerenciar cotações, acompanhar clientes e otimizar suas vendas. Como vendedor (Level 1-4), você tem acesso às funcionalidades essenciais para o seu dia a dia.

### O que você pode fazer:
- ✅ Criar e gerenciar leads/cotações
- ✅ Visualizar sua carteira de clientes
- ✅ Acompanhar métricas de vendas pessoais
- ✅ Consultar promoções e descontos
- ✅ Registrar interações com clientes
- ✅ Acompanhar follow-ups pendentes
- ✅ Gerar relatórios de suas vendas
- ✅ **Acompanhar Metas por Cliente e Penetração**
- ✅ **Receber notificações push em tempo real**
- ✅ **Edição inline rápida de quantidade e vezes nos itens**
- ✅ **Recomendações de IA (Comprados Frequentemente Juntos)**
- ✅ **Trabalhar offline com sincronização automática**
- ✅ **Instalar como app no celular (PWA)**

### Limitações do seu nível:
- ❌ Você só visualiza leads e clientes atribuídos a você
- ❌ Não tem acesso às metas gerais da empresa
- ❌ Não pode filtrar por outros vendedores
- ❌ Botão "Calcular Pricing" não visível (só gerentes)

---

## 2. Acesso ao Sistema

### URL de Acesso
```
https://leads.vallery.com.br/
```

### Como fazer login

1. Acesse a URL do sistema
2. Na tela de login, informe:
   - **Usuário:** Seu email
   - **Senha:** Sua senha pessoal do vallery
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
| 📊 | **Dashboard** | Tela principal com widgets e métricas |
| 📋 | **Leads** | Lista completa de leads/cotações |
| 👥 | **Minha Carteira** | Lista de clientes atribuídos a você |
| 🎯 | **Metas por Cliente** | Acompanhamento de metas e penetração |
| 📈 | **Analytics** | Gráficos e análises de vendas |
| 🏷️ | **Promoções** | Promoções ativas |
| 🏷️ | **Desconto por Quantidade** | Tabela de descontos progressivos |
| 🏷️ | **Lançamentos** | Produtos em lançamento |
| 📄 | **Relatórios** | Geração de relatórios |
| ➕ | **Novo Lead** | Criar nova cotação |
| 🔐 | **Segurança** | Config. de senha e 2FA |

### Barra Superior

- **Nome do sistema:** "Gestão de Leads"
- **Seu nome/nick:** Exibido no canto direito
- **Avatar:** Clique para acessar seu perfil, segurança ou sair

### Versão do App
A versão atual do aplicativo é exibida no rodapé do menu lateral (ex: "Leads Agent v1.6.3").

---

## 4. Dashboard

O Dashboard é sua tela principal de trabalho, organizada em **abas temáticas**.

### Abas do Dashboard

#### Aba "Meta 30k"
Widgets focados em metas e performance:
- **Resumo Executivo:** Visão geral de vendas vs metas
- **Penetração:** Taxa de clientes ativos comprando
- **Pipeline:** Funil de leads em andamento
- **Metas por Cliente:** Progresso individual de clientes
- **Ranking:** Sua posição no ranking de vendas

#### Aba "IA & Inteligência"
Widgets com análises preditivas:
- **Forecast:** Previsão de vendas para os próximos 30 dias
- **Desvio:** Alertas se está abaixo/acima do esperado
- **Risco de Churn:** Clientes com alta probabilidade de parar de comprar
- **Recomendações:** Sugestões de produtos por cliente

#### Aba "Operações"
Widgets operacionais do dia a dia:
- **Saúde do Inventário:** Produtos em falta ou excesso
- **Follow-ups:** Contatos pendentes (com destaque para atrasados!)
- **Alertas:** Notificações importantes

### Métricas Pessoais (Cards)

Na parte superior, você verá cards com suas métricas:
- **Vendas do Mês:** Total vendido no mês atual
- **Vendas do Ano:** Total acumulado no ano
- **Ticket Médio:** Valor médio dos seus pedidos
- **Leads Abertos:** Quantidade de cotações pendentes

---

## 5. Lista de Leads

### Acessando a Lista
Clique em **Leads** no menu lateral para ver todos os seus leads.

### Funcionalidades da Lista

| Funcionalidade | Descrição |
|---------------|-----------|
| **Ordenação padrão** | Por ID descendente (mais recentes primeiro) |
| **100 itens por página** | Padrão otimizado para visualização |
| **Hora e tempo decorrido** | Mostra quando o lead foi criado e há quanto tempo |
| **Contagem de itens** | Mostra quantos produtos tem no carrinho (itens com preço > 0) |
| **Segmento** | Exibe o segmento do cliente |
| **Busca** | Busque por nome do cliente, ID ou nº de pedido |
| **Filtro de datas** | Padrão: data de hoje |
| **Imprimir** | Ícone de impressão direto na lista |

### Colunas da Tabela

| Coluna | Descrição |
|--------|-----------|
| **ID** | Identificador único do lead |
| **Cliente** | Nome do cliente |
| **Data/Hora** | Data e hora de criação + tempo decorrido |
| **# Pedido** | Número do pedido (se convertido) |
| **Itens** | Quantidade de produtos no carrinho |
| **Total** | Valor total da cotação |
| **Segmento** | Segmento do cliente |
| **Status** | Lead ou Pedido |
| **Ações** | Visualizar, editar, imprimir |

---

## 6. Gerenciamento de Leads

### Criar Novo Lead

1. Clique no botão **Novo Lead** (no menu ou no Dashboard)
2. Preencha os campos:

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

3. Clique em **Salvar Lead**

### Itens do Carrinho

Na tela de detalhes do lead, a seção "Itens do Carrinho" permite:

#### Adicionar Produtos
1. Clique em **Adicionar Produto**
2. Busque pelo código SKU ou nome
3. Selecione o produto
4. Informe quantidade e confirme

#### Edição Inline (Novo!)
Você pode editar **Quantidade** e **Vezes** diretamente na tabela:
1. Clique no valor que deseja alterar
2. Digite o novo valor
3. Pressione **Enter** ou clique fora para salvar
4. A alteração é salva automaticamente via AJAX

> **Dica:** É muito mais rápido que abrir o dialog de edição completo!

#### Colunas do Carrinho

| Coluna | Descrição |
|--------|-----------|
| **Produto** | Modelo, marca e descrição |
| **Quantidade** | Qtde do item (clique para editar) |
| **Vezes** | Nº de parcelas (clique para editar) |
| **Preço Tela** | Preço de tabela original |
| **Preço Unit.** | Preço negociado + desconto % |
| **Preço Pricing** | Sugestão calculada pelo sistema |
| **Subtotal** | Quantidade × Preço Unit. |
| **IPI/ST** | Impostos calculados |
| **Ações** | Calcular, editar, excluir |

#### Botões de Ação do Carrinho

| Botão | Descrição |
|-------|-----------|
| **Calcular Impostos** | Recalcula IPI e ST para todos os itens |
| **Calcular Todos Pricing** | Calcula preço sugerido para todos itens |
| **Aplicar Pricing** | Aplica os preços calculados aos itens |

### Recomendações de IA - "Comprados Frequentemente Juntos"

Abaixo do carrinho, o sistema mostra sugestões inteligentes:
- Produtos que outros clientes compraram junto com os itens do carrinho
- Cada card mostra código, descrição e preço
- Clique em **Adicionar** para incluir no carrinho

### Converter Lead em Pedido

1. Abra o lead
2. Clique no botão **Converter em Pedido**
3. Confirme a conversão
4. O sistema gerará um número de pedido

> **Nota:** Leads convertidos em pedido não podem mais ser editados.

---

## 7. Minha Carteira de Clientes

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

- **Aba Pedidos:** Histórico de pedidos
- **Aba Cotações:** Leads criados para o cliente
- **Aba Produtos Frequentes:** O que o cliente mais compra (útil para reposição!)
- **Aba Interações:** Histórico de contatos e anotações

### Registrar Interação

1. Na página do cliente, vá para aba **Interações**
2. Clique em **Nova Interação**
3. Selecione o tipo: Ligação, Email, Visita, WhatsApp, Reunião
4. Descreva o contato
5. Se necessário, agende um **follow-up**
6. Salve a interação

---

## 8. Metas por Cliente

### O que é
A página **Metas por Cliente** mostra o progresso de cada cliente em relação às metas definidas.

### Métricas Exibidas

| Métrica | Descrição |
|---------|-----------|
| **Meta 2026** | Valor esperado de vendas no ano |
| **Vendido 2026** | Total já vendido no ano |
| **Gap** | Diferença entre meta e vendido |
| **Progresso %** | Percentual da meta atingido |
| **Penetração** | % de categorias que o cliente compra |
| **Vendido Mês** | Total vendido no mês atual |

### Filtros
- **Busca por cliente:** Digite para filtrar
- **Ordenação:** Por gap, meta, vendido ou % progresso

### Cache Inteligente
Os dados são atualizados em tempo real para vendas do mês. Dados anuais e metas são cacheados para melhor performance.

---

## 9. Analytics

### Métricas Disponíveis

- **Cards de Resumo:** Vendas do ano, pedidos, ticket médio, clientes ativos
- **Gráfico de Vendas por Mês:** Evolução mensal
- **Top 5 Clientes:** Maiores clientes do período
- **Vendas por Dia da Semana:** Melhores dias para vender
- **Comparação Anual:** Desempenho vs ano anterior

### Inteligência Artificial

- **Previsão de Vendas (Forecast):** Projeção para os próximos 30 dias
- **Desvio de Metas:** Alerta se está abaixo/acima do esperado
- **Risco de Churn:** Clientes com probabilidade de parar de comprar
- **Recomendações:** Sugestões de produtos por cliente (Reposição e Cross-sell)

---

## 10. Promoções e Descontos

### Promoções Ativas
- Produtos em promoção
- Período de validade
- Desconto aplicado
- Condições especiais

### Desconto por Quantidade
- Tabela de descontos progressivos
- Faixas de quantidade
- Percentuais de desconto

### Lançamentos
- Novos produtos
- Condições especiais de lançamento

---

## 11. Relatórios

### Tipos Disponíveis
- **Vendas por Período:** Resumo de vendas
- **Clientes:** Lista e status
- **Leads:** Cotações e status
- **Produtos:** Mais vendidos

### Gerando um Relatório
1. Selecione o tipo
2. Defina o período
3. Aplique filtros
4. Clique em **Gerar Relatório**
5. Exporte em PDF ou Excel

---

## 12. Assistente de IA e Chatbot

> **Nota:** Disponível para supervisores e contas selecionadas.

O assistente inteligente fica no canto inferior direito da tela.

### O que pode fazer:
- **Consultas:** "Qual o estoque do produto 2050?"
- **Criação:** "Crie um lead para o cliente 50 com 10 máquinas A4."
- **Interações:** "Anote que liguei para o cliente 123."
- **Análise:** "Qual minha previsão de vendas?"

### Como usar:
1. Clique no ícone do robô
2. Digite sua dúvida em linguagem natural
3. A IA responderá instantaneamente

---

## 13. Notificações Push

### O que são
O sistema envia notificações mesmo quando você não está com o site aberto.

### Como ativar
1. Vá em **Segurança** no menu
2. Na seção **Notificações Push**, clique em **Ativar**
3. Permita as notificações no navegador

### Tipos de notificação
- Follow-ups pendentes
- Leads com ação necessária
- Alertas de clientes em risco
- Comunicados da gestão

### Notificações In-App
Quando você está com o sistema aberto, as notificações aparecem como toast no canto da tela.

---

## 14. Segurança e 2FA

### Acessando
Clique em **Segurança** no menu ou no menu do avatar.

### Alterar Senha
1. Informe a senha atual
2. Digite a nova senha
3. Confirme a nova senha
4. Clique em **Alterar**

### Autenticação de Dois Fatores (2FA)
1. Clique em **Ativar 2FA**
2. Escaneie o QR Code com app autenticador (Google Authenticator, Authy, etc.)
3. Digite o código de 6 dígitos para confirmar

> **Recomendado:** Ative o 2FA para maior segurança da sua conta!

---

## 15. Modo Offline e PWA

### Modo Offline
- Se perder conexão, um indicador **"Offline"** aparece na tela
- Você ainda pode navegar e criar leads
- Leads criados offline ficam em fila
- Quando a conexão voltar, sincronização automática

> **Importante:** Não limpe o cache do navegador com itens pendentes!

### Instalar como App (PWA)

O sistema pode ser instalado como um app no seu celular ou computador:

1. Acesse o site no navegador
2. Se disponível, aparecerá um prompt "Instalar"
3. Clique em **Instalar**
4. O app ficará na sua tela inicial

**Vantagens:**
- Acesso rápido sem abrir navegador
- Funciona offline
- Notificações push
- Tela cheia

---

## 16. Dicas e Boas Práticas

### Para Aumentar suas Vendas

1. **Acompanhe os Follow-ups** - Verifique diariamente!
2. **Monitore Clientes em Risco** - Entre em contato antes que fiquem inativos
3. **Use os Produtos Frequentes** - Sugira reposição
4. **Aproveite as Promoções** - Comunique aos clientes
5. **Registre Todas as Interações** - Facilita o acompanhamento
6. **Use a Edição Inline** - Muito mais rápido para ajustar quantidade/vezes
7. **Confira as Recomendações de IA** - "Comprados Frequentemente Juntos"

### Atalhos Úteis

| Ação | Como fazer |
|------|------------|
| Buscar lead | Campo de busca na lista de leads |
| Novo lead rápido | Botão "Novo Lead" no menu |
| Ver cliente | Clique no nome em qualquer lista |
| Ordenar tabela | Clique no cabeçalho da coluna |
| Editar quantidade | Clique no valor na tabela do carrinho |
| Abrir menu (mobile) | Deslize da borda esquerda para a direita |

### Solução de Problemas

| Problema | Solução |
|----------|---------|
| "Não consigo ver um lead" | Verifique se foi criado/atribuído a você |
| "Cliente não aparece" | Pode não estar na sua carteira |
| "Erro ao salvar" | Verifique campos obrigatórios |
| "Sessão expirada" | Faça login novamente (expira em 24h) |
| "Notificações não chegam" | Verifique permissões no navegador e na página de Segurança |

---

## 📞 Suporte

Em caso de dúvidas ou problemas:

1. **Primeiro:** Consulte este manual
2. **Segundo:** Fale com seu gerente direto
3. **Terceiro:** Entre em contato com o suporte técnico

---

**© Rolemak - Sistema de Gestão de Leads**  
*Manual do Usuário - Vendedor (Level 1-4) - v1.6.3*
