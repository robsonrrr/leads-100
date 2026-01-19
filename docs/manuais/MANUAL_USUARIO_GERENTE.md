# 📘 Manual do Usuário - Gerente (Level 5+)

## Sistema de Gestão de Leads - Rolemak

**Versão:** 2.0  
**Última atualização:** 19 de Janeiro 2026

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
11. [Painel Administrativo](#11-painel-administrativo) ⭐ NOVO
12. [Integração WhatsApp (Superbot)](#12-integração-whatsapp-superbot) ⭐ NOVO
13. [Daily Tasks (Lista do Dia)](#13-daily-tasks-lista-do-dia) ⭐ NOVO
14. [Chatbot Decisório IA](#14-chatbot-decisório-ia) ⭐ NOVO
15. [Regras de Automação e Follow-up](#15-regras-de-automação-e-follow-up)
16. [Monitoramento com Inteligência Artificial](#16-monitoramento-com-inteligência-artificial)
17. [Dicas de Gestão](#17-dicas-de-gestão)

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
| **Painel Administrativo** | ❌ | ✅ |
| **Gestão de Usuários** | ❌ | ✅ |
| **Vinculação de Telefones WhatsApp** | ❌ | ✅ |
| **Vinculação de Clientes Superbot** | ❌ | ✅ |
| **Configuração do Chatbot IA** | ❌ | ✅ |
| **Logs de Auditoria** | ❌ | ✅ |
| **Daily Tasks da Equipe** | ❌ | ✅ |
| Configurar Regras de Automação | ❌ | ✅ |
| Monitorar Previsão (Forecast) da Equipe | ❌ | ✅ |
| Receber Alertas de Risco de Churn | ❌ | ✅ |

---

## 2. Acesso ao Sistema

### URL de Acesso
```
https://leads.vallery.com.br/
```

### Credenciais

Use seu usuário e senha corporativos. Gerentes possuem **level 5 ou superior** no sistema.

### Níveis de Acesso

| Level | Perfil | Permissões |
|-------|--------|------------|
| 1-2 | Vendedor | Acesso básico |
| 3 | Vendedor Sênior | Acesso expandido |
| 4 | Supervisor | Visão de equipe |
| 5 | Gerente | Admin Panel + Equipe |
| 6 | Administrador | Acesso total |

---

## 3. Visão Geral da Interface

### Menu Lateral - Itens Exclusivos do Gerente

| Menu | Descrição |
|------|-----------|
| 🎯 **Metas** | Definir e acompanhar metas da equipe |
| 📋 **Daily Tasks** | Lista de tarefas diárias da equipe |
| 🛠️ **Admin** | Painel administrativo (Level 5+) |

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

### Widget WhatsApp (Novo!)

Novo widget que mostra métricas do WhatsApp:
- **Mensagens Hoje:** Total de mensagens recebidas/enviadas
- **Leads via WhatsApp:** Leads criados automaticamente
- **Conversas Ativas:** Sessões ativas nas últimas 24h

### Ranking de Vendedores

Widget exclusivo que mostra:
- Top vendedores do período
- Valor total vendido
- Comparativo entre vendedores

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

### Interpretando o Progresso

| Cor | Percentual | Significado |
|-----|------------|-------------|
| 🔴 Vermelho | < 40% | Crítico - precisa de atenção |
| 🟡 Amarelo | 40% - 69% | Alerta - acompanhar de perto |
| 🔵 Azul | 70% - 99% | Bom - no caminho certo |
| 🟢 Verde | ≥ 100% | Excelente - meta atingida |

---

## 6. Filtros por Vendedor e Segmento

### Onde os Filtros Aparecem

Os filtros de equipe estão disponíveis em:
- Dashboard
- Analytics
- Metas
- Relatórios
- Daily Tasks

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

#### Gráficos Disponíveis
- Vendas por Mês (linha/área)
- Top 5 Clientes (ranking)
- Vendas por Dia da Semana
- Comparação Anual
- **Funil de Conversão WhatsApp** (Novo!)

---

## 8. Gestão de Leads da Equipe

### Visualizando Leads de Todos

No Dashboard, sem filtros aplicados, você vê **todos os leads da equipe**.

### Identificando o Responsável

Cada lead mostra:
- **User:** Quem criou o lead
- **Seller:** Vendedor responsável pela conta
- **Origem:** WhatsApp, Manual ou Automático

### Leads Criados via WhatsApp (Novo!)

Leads criados automaticamente pelo Superbot aparecem com:
- Badge "WhatsApp" na origem
- Link para ver conversa original
- Análise de intenção da IA

---

## 9. Carteira de Clientes

### Visão Completa

Em **Minha Carteira**, você pode ver:
- Todos os clientes da empresa
- Filtrar por vendedor responsável
- Identificar clientes sem atendimento
- **Ver histórico de conversas WhatsApp** (Novo!)

### Métricas por Cliente

Para cada cliente, você vê:
- Status (Ativo, Em Risco, Inativo)
- Vendedor responsável
- Histórico de compras
- Leads em aberto
- **Conversas via WhatsApp** (se vinculado)
- **Sentimento das conversas** (análise IA)

---

## 10. Relatórios Gerenciais

### Tipos de Relatórios

| Relatório | Descrição |
|-----------|-----------|
| **Vendas por Vendedor** | Comparativo entre vendedores |
| **Vendas por Segmento** | Performance por segmento |
| **Clientes por Status** | Ativos, em risco, inativos |
| **Leads por Vendedor** | Cotações criadas e convertidas |
| **Metas vs Realizado** | Comparativo de metas |
| **WhatsApp Analytics** | Mensagens, conversões, intenções (Novo!) |

---

## 11. Painel Administrativo ⭐ NOVO

### Acessando o Admin Panel

Clique em **Admin** no menu lateral ou acesse `/admin`.

> **Nota:** Requer Level 5 ou superior.

### Módulos Disponíveis

| Módulo | Descrição | Rota |
|--------|-----------|------|
| 📊 **Dashboard** | Estatísticas gerais | `/admin` |
| 👥 **Usuários** | Gerenciar usuários | `/admin/users` |
| 📱 **Telefones Vendedores** | Vincular WhatsApp | `/admin/seller-phones` |
| 🔗 **Vinculação de Clientes** | Links Superbot ↔ Leads | `/admin/customer-links` |
| 🤖 **Chatbot** | Configurar IA | `/admin/chatbot` |
| 📋 **Logs** | Auditoria de ações | `/admin/logs` |

### Gestão de Usuários

Em `/admin/users`, você pode:
- **Criar novo usuário:** Definir login, senha, nível, departamento
- **Editar usuário:** Alterar dados e permissões
- **Desativar/Reativar:** Controlar acesso
- **Resetar senha:** Definir nova senha
- **Ver histórico de login:** Acompanhar acessos

### Vinculação de Telefones

Em `/admin/seller-phones`, configure quais telefones WhatsApp cada vendedor atende:
- Vincule um ou mais telefones por vendedor
- Defina telefone principal
- Assim, conversas daquele telefone aparecem para o vendedor correto

### Vinculação de Clientes (Novo!)

Em `/admin/customer-links`, gerencie links entre clientes do Superbot e do Leads-Agent:
- **Visualize** todas as vinculações existentes
- **Crie** novas vinculações manualmente
- **Edite** score de confiança
- **Remova** vinculações incorretas
- **Veja estatísticas** de vinculações

### Logs de Auditoria

Em `/admin/logs`, visualize:
- Todas as ações realizadas no sistema
- Quem fez, quando, o quê
- Filtre por usuário, ação, período

---

## 12. Integração WhatsApp (Superbot) ⭐ NOVO

### O que é o Superbot?

O **Superbot** é nosso sistema de WhatsApp que:
- Grava todas as conversas automaticamente
- Transcreve áudios com IA
- Detecta intenções dos clientes
- Cria leads automaticamente

### Dashboard WhatsApp

Acesse em **WhatsApp** no menu ou via Dashboard:

| Métrica | Descrição |
|---------|-----------|
| **Total Mensagens** | Mensagens no período |
| **Contatos Únicos** | Clientes que conversaram |
| **Leads Criados** | Leads via WhatsApp |
| **Taxa de Conversão** | % de contatos → leads |

### Gráficos Disponíveis

- **Mensagens por Dia:** Volume diário
- **Horários de Pico:** Melhores horários
- **Intenções Detectadas:** O que clientes querem
- **Funil de Conversão:** Contatos → Leads → Pedidos

### Visualizando Conversas

1. Acesse o perfil do cliente
2. Clique na aba "WhatsApp"
3. Veja o histórico completo:
   - Mensagens de texto
   - Imagens e documentos
   - Áudios com transcrição
   - Análise de sentimento

### Análise de Intenção

A IA analisa as conversas e detecta:
- **QUOTE_REQUEST:** Pedido de cotação
- **PURCHASE_INTENT:** Intenção de compra
- **PRICE_CHECK:** Consulta de preço
- **STOCK_CHECK:** Consulta de estoque
- **COMPLAINT:** Reclamação
- **ORDER_STATUS:** Status de pedido

---

## 13. Daily Tasks (Lista do Dia) ⭐ NOVO

### O que são Daily Tasks?

Sistema inteligente que gera **tarefas prioritárias** para cada vendedor baseadas em:
- Sinais de compra detectados
- Clientes inativos
- Follow-ups pendentes
- Oportunidades de cross-sell

### Visualizando Tarefas da Equipe

Como gerente, você pode:

1. **Ver tarefas de todos os vendedores:**
   - Acesse `/tasks`
   - Use o filtro de vendedor

2. **Identificar vendedores sobrecarregados:**
   - Veja quantidade de tarefas por vendedor
   - Redistribua se necessário

3. **Monitorar execução:**
   - Tarefas concluídas vs pendentes
   - Tempo médio de conclusão

### Status das Tarefas

| Status | Significado |
|--------|-------------|
| 🔵 OPEN | Tarefa gerada, não iniciada |
| 🟡 IN_PROGRESS | Vendedor está trabalhando |
| ✅ DONE | Concluída com sucesso |
| ⏭️ SKIPPED | Pulada (com motivo) |
| ⏰ EXPIRED | Expirou sem ação |

### Prioridades

| Prioridade | Quando usar |
|------------|-------------|
| 🔴 CRITICAL | Cliente importante, alto valor |
| 🟠 HIGH | Oportunidade quente |
| 🟡 MEDIUM | Follow-up padrão |
| 🟢 LOW | Manutenção de relacionamento |

---

## 14. Chatbot Decisório IA ⭐ NOVO

### O que é o Chatbot Decisório?

Assistente de IA integrado que ajuda vendedores:
- Simulação de preços com políticas
- Consulta de estoque
- Busca de clientes e produtos
- Análise de risco e aprovações

### Configurando o Chatbot

Em `/admin/chatbot`, você pode:
- Ativar/desativar o chatbot
- Configurar modelo de IA
- Ajustar temperatura (criatividade)
- Definir contexto máximo

### Monitorando Uso

Veja estatísticas de uso:
- Comandos mais utilizados
- Tempo médio de resposta
- Taxa de sucesso
- Erros e fallbacks

### Políticas de Desconto

O chatbot aplica automaticamente:
- Limites de desconto por nível
- Aprovações automáticas ou pendentes
- Registro de todas as decisões

---

## 15. Regras de Automação e Follow-up

O sistema conta com um **Motor de Automação** que garante padronização.

### Regras Padrão Ativas

| Regra | Gatilho | Ação |
|-------|---------|------|
| Novos Leads | Lead criado | Follow-up em +3 dias |
| Inatividade | 45 dias sem pedido | Tarefa de reativação |
| Risco | Score Churn > 80 | Alerta prioritário |
| WhatsApp | Conversa com intenção | Gerar lead automático |

### Papel do Gerente

- Monitorar cumprimento de follow-ups
- Ajustar carteira se houver sobrecarga
- Revisar regras periodicamente

---

## 16. Monitoramento com Inteligência Artificial

A IA atua como assistente de gestão.

### Forecast (Previsão)

No dashboard, a linha de "Previsão" indica onde a equipe deve chegar no fim do mês.

### Prevenção de Churn

Acesse o widget de **"Clientes em Risco"**:
- 🔴 **Crítico (75%+):** Intervenção urgente
- 🟠 **Alto (50-74%):** Atenção necessária
- 🟡 **Médio (25-49%):** Monitorar

### Análise de Sentimento (Novo!)

Baseada nas conversas WhatsApp:
- 😊 **Positivo:** Cliente satisfeito
- 😐 **Neutro:** Sem indicação clara
- 😠 **Negativo:** Insatisfação detectada

---

## 17. Dicas de Gestão

### Acompanhamento Diário

1. **Verifique o Dashboard**
   - Métricas da equipe
   - Leads abertos
   - Clientes em risco
   - **Conversas WhatsApp pendentes**

2. **Monitore Daily Tasks**
   - Tarefas não executadas
   - Vendedores com backlog

3. **Analise Conversões**
   - Taxa de conversão de leads
   - **Conversão WhatsApp → Lead → Pedido**

### Usando o Admin Panel

1. **Semanalmente:**
   - Revise logs de auditoria
   - Verifique vinculações de clientes

2. **Mensalmente:**
   - Revise usuários ativos/inativos
   - Ajuste configurações do chatbot

---

## 📊 Resumo das Funcionalidades

| Funcionalidade | Localização | Descrição |
|----------------|-------------|-----------|
| Métricas da Equipe | Dashboard | Cards com totais da equipe |
| Filtro por Segmento | Dashboard, Analytics | Dropdown "Seg. Vendedor" |
| Filtro por Vendedor | Dashboard, Analytics | Autocomplete "Vendedor" |
| Ranking de Vendedores | Dashboard | Widget de ranking |
| Página de Metas | Menu lateral | Definir e acompanhar metas |
| **Admin Panel** | /admin | Gerenciamento do sistema |
| **Gestão de Usuários** | /admin/users | Criar, editar usuários |
| **Telefones WhatsApp** | /admin/seller-phones | Vincular telefones |
| **Vinculação Clientes** | /admin/customer-links | Links Superbot ↔ Leads |
| **Dashboard WhatsApp** | WhatsApp menu | Analytics de mensagens |
| **Daily Tasks** | /tasks | Tarefas da equipe |
| **Logs de Auditoria** | /admin/logs | Histórico de ações |

---

## 📞 Suporte

Em caso de dúvidas:

1. Consulte este manual
2. Use o chatbot digitando sua dúvida
3. Entre em contato com o administrador do sistema
4. Acesse o suporte técnico

---

**© Rolemak - Sistema de Gestão de Leads**  
*Manual do Usuário - Gerente (Level 5+) v2.0*
