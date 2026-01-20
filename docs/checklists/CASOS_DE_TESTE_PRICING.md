# Casos de Teste - Pricing Admin

## Visão Geral

Este documento descreve os casos de teste para validar as funcionalidades do módulo Pricing Admin.

---

## 1. Acesso e Autenticação

### TC-001: Acesso sem autenticação
**Passos:**
1. Acessar `/admin/pricing` sem estar logado

**Resultado Esperado:**
- Redirecionamento para página de login

### TC-002: Acesso com usuário sem permissão
**Passos:**
1. Logar com usuário nível < 5
2. Acessar `/admin/pricing`

**Resultado Esperado:**
- Redirecionamento para dashboard principal
- Mensagem de acesso negado

### TC-003: Acesso com usuário autorizado
**Passos:**
1. Logar com usuário nível >= 5
2. Acessar `/admin/pricing`

**Resultado Esperado:**
- Dashboard de Pricing carrega corretamente
- Todos os cards de navegação visíveis

---

## 2. Dashboard

### TC-010: Verificar status da API
**Passos:**
1. Acessar dashboard
2. Observar indicador de status

**Resultado Esperado:**
- Badge verde "Online" se API disponível
- Badge vermelho "Offline" se API indisponível

### TC-011: Navegação pelos cards
**Passos:**
1. Clicar em cada card do dashboard

**Resultado Esperado:**
- Navegação para página correta
- Loading spinner durante transição

---

## 3. CRUD de Marcas

### TC-020: Listar marcas
**Passos:**
1. Acessar `/admin/pricing/brands`

**Resultado Esperado:**
- Tabela com marcas existentes
- Paginação funcionando
- Filtros aplicáveis

### TC-021: Criar nova marca
**Passos:**
1. Clicar "Nova Marca"
2. Preencher formulário
3. Clicar "Salvar"

**Resultado Esperado:**
- Modal abre corretamente
- Validação de campos obrigatórios
- Mensagem de sucesso após salvar
- Nova marca aparece na lista

### TC-022: Editar marca
**Passos:**
1. Clicar ícone de edição em uma marca
2. Alterar dados
3. Salvar

**Resultado Esperado:**
- Modal pré-preenchido com dados atuais
- Alterações salvas corretamente

### TC-023: Excluir marca
**Passos:**
1. Clicar ícone de exclusão
2. Confirmar no diálogo

**Resultado Esperado:**
- Diálogo de confirmação aparece
- Marca removida após confirmação
- Mensagem de sucesso

---

## 4. Descontos por Quantidade (D4Q)

### TC-040: Criar desconto com faixas
**Passos:**
1. Acessar `/admin/pricing/quantity-discounts`
2. Clicar "Novo Desconto"
3. Selecionar produto via autocomplete
4. Adicionar faixas de quantidade
5. Salvar

**Resultado Esperado:**
- Busca de produto funciona
- Faixas podem ser adicionadas
- Validação de overlapping de faixas
- Desconto criado com sucesso

### TC-041: Validação de faixas sobrepostas
**Passos:**
1. Criar desconto com faixa 1-10
2. Tentar adicionar faixa 5-15

**Resultado Esperado:**
- Erro de validação indicando sobreposição

---

## 5. Bundles/Combos

### TC-050: Criar bundle com itens
**Passos:**
1. Acessar `/admin/pricing/bundles`
2. Criar novo bundle
3. Adicionar itens via busca de produto
4. Definir quantidades
5. Salvar

**Resultado Esperado:**
- Bundle criado
- Itens associados corretamente
- Preço total calculado

### TC-051: Editar itens do bundle
**Passos:**
1. Abrir bundle existente
2. Adicionar/remover/alterar itens
3. Salvar

**Resultado Esperado:**
- Alterações refletidas

---

## 6. Preços Fixos

### TC-060: Criar preço fixo
**Passos:**
1. Acessar `/admin/pricing/fixed-prices`
2. Clicar "Novo Preço"
3. Selecionar cliente
4. Selecionar produto
5. Definir preço e datas
6. Salvar

**Resultado Esperado:**
- Autocomplete de cliente funciona
- Autocomplete de produto funciona
- Preço fixo criado

### TC-061: Importar preços via CSV
**Passos:**
1. Clicar "Importar Lote"
2. Fazer upload de arquivo CSV válido
3. Verificar preview
4. Confirmar importação

**Resultado Esperado:**
- Upload processado
- Preview exibe dados corretos
- Validação identifica erros
- Importação conclui com relatório

### TC-062: Exportar preços
**Passos:**
1. Clicar "Exportar CSV"

**Resultado Esperado:**
- Download de arquivo CSV inicia
- Arquivo contém dados corretos

---

## 7. Teste de Precificação

### TC-070: Executar teste individual
**Passos:**
1. Acessar `/admin/pricing/test`
2. Selecionar cliente
3. Selecionar produto
4. Definir quantidade
5. Selecionar condição de pagamento
6. Clicar "Executar Teste"

**Resultado Esperado:**
- Loading durante processamento
- Resultado exibe preço base, desconto e preço final
- Regras aplicadas listadas
- Detalhamento JSON disponível

### TC-071: Histórico de testes
**Passos:**
1. Executar alguns testes
2. Observar seção "Histórico"

**Resultado Esperado:**
- Últimos testes listados
- Clicar em item carrega parâmetros

### TC-072: Teste em lote
**Passos:**
1. Acessar `/admin/pricing/test/batch`
2. Fazer upload de CSV
3. Configurar cenários
4. Executar

**Resultado Esperado:**
- Barra de progresso funciona
- Resultados exibidos por cenário
- Sumário com totais
- Exportação funciona

### TC-073: Comparação de cenários
**Passos:**
1. Adicionar múltiplos cenários
2. Executar teste em lote

**Resultado Esperado:**
- Cada cenário tem coluna própria
- Cards de resumo comparam resultados

---

## 8. Promoções

### TC-080: Criar promoção por segmento
**Passos:**
1. Acessar `/admin/pricing/promotions`
2. Selecionar aba do segmento
3. Criar nova promoção
4. Definir período e desconto
5. Salvar

**Resultado Esperado:**
- Promoção criada no segmento correto

### TC-081: Duplicar promoção
**Passos:**
1. Clicar em duplicar em promoção existente

**Resultado Esperado:**
- Modal abre com dados copiados
- Nome alterado para "Cópia de..."

---

## 9. Regras de Proteção

### TC-090: Proteção regional
**Passos:**
1. Criar regra de proteção para estado SP
2. Definir preço mínimo

**Resultado Esperado:**
- Regra salva
- Filtro por estado funciona

### TC-091: Ancoragem de preço
**Passos:**
1. Criar regra de ancoragem
2. Definir tipo e limites

**Resultado Esperado:**
- Regra salva com tipo correto
- Limites validados

---

## 10. Responsividade

### TC-100: Visualização mobile
**Passos:**
1. Acessar páginas com viewport mobile (< 768px)

**Resultado Esperado:**
- Layout adaptado
- Tabelas com scroll horizontal
- Modais ocupam tela cheia
- Botões acessíveis

### TC-101: Visualização tablet
**Passos:**
1. Acessar páginas com viewport tablet (768-1024px)

**Resultado Esperado:**
- Grids ajustados
- Navegação funcionando

---

## Checklist de Validação Final

- [ ] Todas as páginas carregam sem erros no console
- [ ] Loading states funcionam em todas as requisições
- [ ] Mensagens de erro são amigáveis
- [ ] Tooltips informativos presentes
- [ ] Navegação com teclado funciona
- [ ] Contraste de cores adequado
- [ ] Fontes legíveis
- [ ] Paginação funciona corretamente
- [ ] Filtros persistem ou resetam conforme esperado
- [ ] Ações destrutivas têm confirmação

---

## Bugs Conhecidos

| ID | Descrição | Severidade | Status |
|----|-----------|------------|--------|
| - | - | - | - |

---

## Notas

- Testes realizados em ambiente de desenvolvimento
- Data dos testes: 2024-01-20
- Versão testada: 1.0.0
