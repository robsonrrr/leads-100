# 📘 Manual do Usuário - Gerente (Level 5+)

## Sistema de Gestão de Leads - Rolemak

**Versão:** 1.0  
**Última atualização:** Janeiro 2026

---

## 📋 Índice

1. [Introdução](#introdução)
2. [Acesso ao Sistema](#acesso-ao-sistema)
3. [Visão Geral da Interface](#visão-geral-da-interface)
4. [Dashboard Gerencial](#dashboard-gerencial)
5. [Gestão de Metas](#gestão-de-metas)
6. [Filtros por Vendedor e Segmento](#filtros-por-vendedor-e-segmento)
7. [Analytics Avançado](#analytics-avançado)
8. [Gestão de Leads da Equipe](#gestão-de-leads-da-equipe)
9. [Carteira de Clientes](#carteira-de-clientes)
10. [Relatórios Gerenciais](#relatórios-gerenciais)
11. [Regras de Automação e Follow-up](#11-regras-de-automação-e-follow-up)
12. [Monitoramento com Inteligência Artificial](#12-monitoramento-com-inteligência-artificial)
13. [Dicas de Gestão](#13-dicas-de-gestão)

---

## 1. Introdução

O **Sistema de Gestão de Leads** oferece funcionalidades avançadas para gerentes (Level 5+), permitindo supervisionar toda a equipe de vendas, definir metas e acompanhar o desempenho.

### Permissões do Gerente

Como gerente, você tem acesso a **todas as funcionalidades** do sistema:

| Funcionalidade | Vendedor | Gerente |
|----------------|----------|---------|
| Ver próprios leads | ✅ | ✅ |
| Ver leads de toda equipe | ❌ | ✅ |
| Filtrar por vendedor | ❌ | ✅ |
| Filtrar por segmento de vendedor | ❌ | ✅ |
| Definir metas | ❌ | ✅ |
| Ver métricas da equipe | ❌ | ✅ |
| Ver ranking de vendedores | ❌ | ✅ |
| Acessar página de Metas | ❌ | ✅ |
| Ver todos os clientes | ❌ | ✅ |
| **Configurar Regras de Automação** | ❌ | ✅ |
| **Monitorar Previsão (Forecast) da Equipe** | ❌ | ✅ |
| **Receber Alertas de Risco de Churn** | ❌ | ✅ |

---

## 2. Acesso ao Sistema

### URL de Acesso
```
https://leads.internut.com.br/
```

### Credenciais

Use seu usuário e senha corporativos. Gerentes possuem **level 5 ou superior** no sistema.

### Verificar seu Nível

Após fazer login, seu nível é exibido no perfil. Se você não tem acesso às funcionalidades gerenciais, entre em contato com o administrador.

---

## 3. Visão Geral da Interface

### Menu Lateral - Itens Exclusivos do Gerente

| Menu | Descrição |
|------|-----------|
| 🎯 **Metas** | Definir e acompanhar metas da equipe |

### Filtros Adicionais no Header

Como gerente, você verá filtros extras em várias páginas:
- **Segmento do Vendedor:** Filtra por segmento (ex: Rolemak, MakPrime)
- **Vendedor:** Seleciona um vendedor específico

---

## 4. Dashboard Gerencial

O Dashboard do gerente possui widgets e métricas adicionais.

### Visão Geral da Equipe

Na parte superior, você verá um painel exclusivo com:

| Métrica | Descrição |
|---------|-----------|
| **Vendas do Mês** | Total vendido pela equipe no mês |
| **Clientes Atendidos** | Quantidade de clientes únicos |
| **Leads Abertos** | Total de cotações pendentes da equipe |
| **Clientes em Risco** | Clientes que precisam de atenção |

Cada card mostra a **variação percentual** em relação ao mês anterior.

### Filtros de Equipe

No topo do Dashboard, você pode filtrar por:

1. **Segmento do Vendedor**
   - Selecione um segmento para ver apenas vendedores daquele grupo
   - Ex: "Rolemak", "MakPrime"

2. **Vendedor Específico**
   - Use o autocomplete para selecionar um vendedor
   - Todas as métricas e leads serão filtrados

### Ranking de Vendedores

Widget exclusivo que mostra:
- Top vendedores do período
- Valor total vendido
- Comparativo entre vendedores

### Lista de Leads da Equipe

A tabela de leads mostra **todos os leads da equipe** (ou filtrados conforme seleção):

| Coluna | Descrição |
|--------|-----------|
| **User** | Quem criou o lead |
| **Seller** | Vendedor responsável |

Você pode ver leads de qualquer vendedor e acompanhar o trabalho da equipe.

---

## 5. Gestão de Metas

### Acessando a Página de Metas

Clique em **Metas** no menu lateral (ícone 🎯).

> **Nota:** Esta página é **exclusiva para gerentes**.

### Visão Geral

A página de metas exibe uma tabela com:

| Coluna | Descrição |
|--------|-----------|
| **Vendedor** | Nome do vendedor |
| **Segmento** | Segmento do vendedor |
| **Meta Mês** | Valor da meta definida |
| **Realizado** | Valor já atingido |
| **Progresso** | Barra de progresso visual |
| **Ações** | Botão para editar meta |

### Filtros de Metas

Use os filtros no topo:
- **Ano:** Selecione o ano
- **Mês:** Selecione o mês
- **Segmento:** Filtre por segmento de vendedores

### Criar Nova Meta

1. Clique no botão **Nova Meta**
2. Preencha o formulário:

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| **Vendedor** | ✅ Sim | Selecione o vendedor |
| **Ano** | ✅ Sim | Ano da meta |
| **Período** | ✅ Sim | Mês específico ou "Anual" |
| **Meta de Vendas (R$)** | ✅ Sim | Valor alvo |
| **Meta de Pedidos** | Não | Quantidade de pedidos |
| **Observações** | Não | Notas sobre a meta |

3. Clique em **Salvar**

### Editar Meta Existente

1. Na tabela, clique no ícone ✏️ (lápis) na linha do vendedor
2. Altere os valores desejados
3. Clique em **Salvar**

### Interpretando o Progresso

A barra de progresso usa cores para indicar o status:

| Cor | Percentual | Significado |
|-----|------------|-------------|
| 🔴 Vermelho | < 40% | Crítico - precisa de atenção |
| 🟡 Amarelo | 40% - 69% | Alerta - acompanhar de perto |
| 🔵 Azul | 70% - 99% | Bom - no caminho certo |
| 🟢 Verde | ≥ 100% | Excelente - meta atingida |

### Metas Anuais vs Mensais

- **Meta Mensal:** Valor específico para aquele mês
- **Meta Anual:** Valor total esperado no ano (selecione "Anual" no período)

---

## 6. Filtros por Vendedor e Segmento

### Onde os Filtros Aparecem

Os filtros de equipe estão disponíveis em:
- Dashboard
- Analytics
- Metas
- Relatórios

### Como Usar os Filtros

#### Filtro por Segmento

1. Localize o dropdown **"Seg. Vendedor"**
2. Selecione o segmento desejado
3. Todos os dados serão filtrados para vendedores daquele segmento

#### Filtro por Vendedor

1. Use o campo de autocomplete **"Vendedor"**
2. Digite o nome ou selecione da lista
3. Todos os dados serão filtrados para aquele vendedor específico

#### Combinando Filtros

- Selecione primeiro o **Segmento** para reduzir a lista de vendedores
- Depois selecione o **Vendedor** específico
- Ao limpar o vendedor, volta a mostrar todo o segmento

### Persistência dos Filtros

- Os filtros são salvos na URL
- Você pode compartilhar links com filtros aplicados
- Ao navegar entre páginas, os filtros são mantidos

---

## 7. Analytics Avançado

### Acessando Analytics

Clique em **Analytics** no menu lateral.

### Métricas Gerenciais

Como gerente, você vê métricas consolidadas:

#### Cards de Resumo
- **Vendas do Ano:** Total da equipe (ou filtrado)
- **Pedidos do Ano:** Quantidade total
- **Ticket Médio:** Média da equipe
- **Clientes Ativos:** Total de clientes atendidos

#### Gráfico de Vendas por Mês
- Visualize a evolução mensal
- Compare com meses anteriores
- Identifique tendências

#### Top 5 Clientes
- Maiores clientes da equipe
- Clique para ver detalhes
- Mostra o vendedor responsável

#### Vendas por Dia da Semana
- Identifique os melhores dias
- Otimize a alocação da equipe

#### Comparação Anual
- Compare com o ano anterior
- Veja a variação percentual

### Inteligência Artificial Avançada
Gerentes possuem acesso à visão consolidada da inteligência de dados:

- **Previsão de Vendas da Equipe:** A IA projeta o fechamento do mês para toda a equipe ou por segmento.
- **Análise de Desvio de Performance:** Identificação automática de vendedores ou segmentos que estão performando abaixo da tendência esperada.
- **Painel de Churn Consolidado:** Lista de todos os clientes da empresa com alto risco de perda, permitindo redistribuição ou intervenção gerencial.

### Filtrando Analytics

Use os filtros no topo para:
- Ver analytics de um segmento específico
- Ver analytics de um vendedor específico
- Comparar desempenhos

---

## 8. Gestão de Leads da Equipe

### Visualizando Leads de Todos

No Dashboard, sem filtros aplicados, você vê **todos os leads da equipe**.

### Identificando o Responsável

Cada lead mostra:
- **User:** Quem criou o lead
- **Seller:** Vendedor responsável pela conta

### Acompanhando Cotações

1. Filtre por vendedor se necessário
2. Ordene por data ou valor
3. Clique para ver detalhes

### Intervindo em Leads

Como gerente, você pode:
- Visualizar qualquer lead
- Editar leads de qualquer vendedor
- Acompanhar o progresso de conversão

---

## 9. Carteira de Clientes

### Visão Completa

Em **Minha Carteira**, você pode ver:
- Todos os clientes da empresa
- Filtrar por vendedor responsável
- Identificar clientes sem atendimento

### Métricas por Cliente

Para cada cliente, você vê:
- Status (Ativo, Em Risco, Inativo)
- Vendedor responsável
- Histórico de compras
- Leads em aberto

### Redistribuição de Clientes

Se identificar clientes mal atendidos:
1. Analise o histórico
2. Converse com o vendedor
3. Considere redistribuição se necessário

---

## 10. Relatórios Gerenciais

### Tipos de Relatórios

Como gerente, você tem acesso a relatórios expandidos:

| Relatório | Descrição |
|-----------|-----------|
| **Vendas por Vendedor** | Comparativo entre vendedores |
| **Vendas por Segmento** | Performance por segmento |
| **Clientes por Status** | Ativos, em risco, inativos |
| **Leads por Vendedor** | Cotações criadas e convertidas |
| **Metas vs Realizado** | Comparativo de metas |

### Gerando Relatórios

1. Acesse **Relatórios** no menu
2. Selecione o tipo de relatório
3. Defina o período
4. Aplique filtros (vendedor, segmento)
5. Clique em **Gerar**
6. Exporte em PDF ou Excel

### Relatórios Periódicos

Sugestão de relatórios para acompanhamento:

| Frequência | Relatório |
|------------|-----------|
| **Diário** | Leads criados, vendas do dia |
| **Semanal** | Progresso de metas, clientes em risco |
| **Mensal** | Comparativo de vendedores, análise de segmentos |
| **Trimestral** | Tendências, planejamento |

---

## 11. Regras de Automação e Follow-up

O sistema agora conta com um **Motor de Automação** que garante a padronização do atendimento.

### Regras Padrão Ativas:
- **Novos Leads:** Todos os leads ganham um follow-up automático agendado para +3 dias.
- **Inatividade:** Clientes sem pedidos há mais de 45 dias geram uma tarefa de reativação imediata.
- **Risco:** Clientes com Score de Churn > 80 geram alertas prioritários.

### Papel do Gerente:
- Monitorar se os vendedores estão cumprindo os follow-ups gerados pelas automações.
- Ajustar a carteira de clientes caso as automações de inatividade mostrem sobrecarga de algum vendedor.

---

## 12. Monitoramento com Inteligência Artificial

A IA atua como um assistente de gestão, poupando tempo na análise de relatórios extensos.

### Forecast (Previsão)
No dashboard e analytics, a linha de "Previsão" indica onde a equipe deve chegar no fim do mês. Use isso para cobrar resultados de forma proativa, antes do mês fechar.

### Prevenção de Churn
Acesse o widget de **"Clientes em Risco"**. Clientes com status **Crítico** (vermelho) calculados pela IA possuem 75%+ de chance de não voltarem a comprar sem uma oferta agressiva ou contato direto.

---

## 13. Dicas de Gestão

### Acompanhamento Diário

1. **Verifique o Dashboard**
   - Métricas da equipe
   - Leads abertos
   - Clientes em risco

2. **Monitore Follow-ups**
   - Vendedores com follow-ups atrasados
   - Clientes sem contato recente

3. **Analise Conversões**
   - Taxa de conversão de leads
   - Tempo médio de fechamento

### Gestão de Metas

1. **Defina Metas Realistas**
   - Baseie-se no histórico
   - Considere sazonalidade
   - Ajuste por vendedor

2. **Acompanhe Semanalmente**
   - Identifique desvios cedo
   - Ofereça suporte quando necessário

3. **Reconheça Resultados**
   - Celebre metas atingidas
   - Use o ranking como motivação

### Identificando Problemas

| Sinal | Possível Problema | Ação |
|-------|-------------------|------|
| Muitos leads abertos | Falta de follow-up | Conversar com vendedor |
| Baixa conversão | Qualidade das cotações | Revisar processo |
| Clientes em risco | Falta de atenção | Redistribuir ou treinar |
| Meta muito abaixo | Problemas diversos | Análise individual |

### Usando Filtros Estrategicamente

1. **Compare Segmentos**
   - Filtre por segmento
   - Identifique os mais rentáveis
   - Aloque recursos adequadamente

2. **Identifique Top Performers**
   - Use o ranking
   - Analise suas práticas
   - Compartilhe com a equipe

3. **Encontre Oportunidades**
   - Clientes grandes com baixa atividade
   - Segmentos com potencial
   - Vendedores com capacidade ociosa

### Comunicação com a Equipe

1. **Reuniões de Acompanhamento**
   - Use os dados do sistema
   - Mostre métricas e metas
   - Defina ações

2. **Feedback Individual**
   - Baseie-se em dados concretos
   - Mostre evolução
   - Defina próximos passos

---

## 📊 Resumo das Funcionalidades Exclusivas

| Funcionalidade | Localização | Descrição |
|----------------|-------------|-----------|
| Métricas da Equipe | Dashboard | Cards com totais da equipe |
| Filtro por Segmento | Dashboard, Analytics | Dropdown "Seg. Vendedor" |
| Filtro por Vendedor | Dashboard, Analytics | Autocomplete "Vendedor" |
| Ranking de Vendedores | Dashboard | Widget de ranking |
| Página de Metas | Menu lateral | Definir e acompanhar metas |
| Ver todos os leads | Dashboard | Sem filtro de usuário |
| Ver todos os clientes | Minha Carteira | Acesso completo |

---

## 📞 Suporte

Em caso de dúvidas:

1. Consulte este manual
2. Entre em contato com o administrador do sistema
3. Acesse o suporte técnico

---

**© Rolemak - Sistema de Gestão de Leads**  
*Manual do Usuário - Gerente (Level 5+)*
