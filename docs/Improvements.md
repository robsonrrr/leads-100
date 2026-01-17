Phase Breakdown

Selection Mode

Yolo Mode
1.
Remover Código de Debug e Implementar Logging Estruturado
✅ COMPLETED
Limpar código de debug e implementar logging profissional: Remover todos os console.log de debug em @lead.repository.js, @leads.controller.js, @promotion.repository.js Implementar biblioteca de logging estruturado (Winston ou Pino) em backend/src/config/logger.js Substituir console.logs por logger com níveis apropriados (info, warn, error, debug) Adicionar request ID tracking para rastreamento de requisições Remover arquivos de debug temporários (debug-lead.js, debug-stock.js, test-lead-filter.js)

Create Plan

Handoff To

2.
Implementar Testes Unitários e de Integração
✅ COMPLETED
Adicionar cobertura de testes ao backend: Configurar Jest e Supertest (já em @package.json) Criar testes unitários para repositories em backend/src/repositories/tests/ Criar testes de integração para controllers em backend/src/controllers/tests/ Testar fluxos críticos: autenticação, criação de lead, conversão para pedido, cálculo de impostos Adicionar mock do banco de dados e fixtures de teste Configurar CI/CD para rodar testes automaticamente Meta: mínimo 70% de cobertura em lógica de negócio

3.
Otimizar Performance de Queries e Implementar Cache
✅ COMPLETED
Melhorar performance do backend: Otimizar LeadRepository.findAll() em @lead.repository.js: usar JOIN único ao invés de queries separadas Implementar cache Redis para metadados (NOPs, transportadoras, unidades) em @/home/ubuntu/environment/Office/Apps/inProduction/leads-agent/backend/src/repositories/ Adicionar índices no banco de dados para queries frequentes (cUser, cSeller, cSegment, dCart) Implementar paginação cursor-based para melhor performance em grandes datasets Adicionar cache de totais de carrinho em CartItemRepository.calculateTotals() Implementar query batching para buscar produtos em PromotionRepository


4.
Implementar Validação Robusta e Tratamento de Erros
✅ COMPLETED
Melhorar validação e error handling: Criar middleware de validação centralizado em backend/src/middleware/validation.js Adicionar validação de tipos e ranges em todos os controllers Implementar classe de erro customizada com códigos de erro padronizados Melhorar errorHandler em @errorHandler.js com mensagens mais descritivas Adicionar validação de relacionamentos (ex: cliente existe antes de criar lead) Implementar validação de regras de negócio (ex: não converter lead já convertido) Adicionar sanitização de inputs para prevenir SQL injection

5.
Melhorar UX com Loading States e Feedback Visual
✅ COMPLETED
Aprimorar experiência do usuário no frontend: Adicionar skeleton loaders em @DashboardPage.jsx e @LeadDetailPage.jsx Implementar toast notifications globais usando Snackbar do MUI Adicionar confirmações visuais para ações críticas (deletar, converter) Melhorar estados de loading em @CartItems.jsx Adicionar indicadores de progresso para operações longas (cálculo de impostos, conversão) Implementar debounce em autocompletes para reduzir requisições Adicionar empty states com ilustrações quando não há dados

6.
Implementar Rate Limiting e Melhorias de Segurança
✅ COMPLETED
Fortalecer segurança da API: Adicionar rate limiting por IP e por usuário em backend/src/middleware/rateLimiter.js Implementar CSRF protection para endpoints de mutação Adicionar helmet headers adicionais (já tem básico em @index.js) Implementar audit log para ações críticas (conversão, deleção) em nova tabela audit_logs Adicionar validação de permissões por nível de usuário (level <= 4 vs level > 4) Implementar rotação de JWT secrets Adicionar 2FA opcional para usuários admin

7.
Refatorar Código Duplicado e Melhorar Manutenibilidade
✅ COMPLETED
Eliminar duplicação e melhorar organização: Extrair lógica de formatação duplicada em frontend/src/utils/formatters.js (formatDate, formatCurrency) Criar hooks customizados para lógica repetida: useLeadData, useMetadata, usePagination Refatorar LeadDetailPage (1344 linhas) dividindo em componentes menores Extrair constantes mágicas para backend/src/constants/ (payment types, freight types, etc) Criar service layer para lógica de negócio complexa (separar de repositories) Padronizar estrutura de resposta da API (já tem padrão mas não é consistente)

8.
Implementar Dashboard com Métricas e Gráficos
Criar dashboard analítico: Adicionar cards de métricas em @DashboardPage.jsx: total de leads, conversão %, valor total Implementar gráficos com Chart.js ou Recharts: leads por período, conversão por vendedor, valor por segmento Criar endpoints de analytics em backend/src/controllers/analytics.controller.js Adicionar filtros de período (hoje, semana, mês, customizado) Implementar comparação com período anterior Adicionar exportação de relatórios em PDF/Excel Criar página dedicada de analytics em /analytics

9.
Implementar Histórico de Alterações e Auditoria
Adicionar rastreamento de mudanças: Criar tabela lead_history para armazenar snapshots de alterações Implementar trigger ou middleware para capturar mudanças em leads Criar endpoint GET /api/leads/:id/history em @leads.controller.js Adicionar componente de timeline no LeadDetailPage mostrando histórico Registrar quem fez a alteração, quando e o que mudou (diff) Implementar filtro de histórico por tipo de alteração Adicionar possibilidade de reverter alterações (soft rollback)

10.
Implementar Envio Real de Email e Templates
Substituir simulação de email por envio real: Integrar Nodemailer ou SendGrid em backend/src/services/email.service.js Criar templates HTML responsivos para cotação em backend/src/templates/email/ Implementar geração de PDF da cotação usando Puppeteer ou PDFKit Adicionar endpoint POST /api/leads/:id/send-email em @leads.controller.js Implementar fila de emails com Bull/BullMQ para processamento assíncrono Adicionar tracking de emails enviados (abertos, clicados) Criar página de configuração de templates de email

11.
Implementar Filtros Avançados e Busca Global
Melhorar capacidade de busca e filtragem: Adicionar filtros avançados em @DashboardPage.jsx: por vendedor, período, valor, status Implementar busca global por cliente, produto, número de pedido Criar componente de filtros reutilizável frontend/src/components/AdvancedFilters.jsx Adicionar salvamento de filtros favoritos no localStorage Implementar busca full-text no backend usando MySQL FULLTEXT ou Elasticsearch Adicionar sugestões de busca (autocomplete) Criar página de busca avançada dedicada

12.
Implementar Testes E2E e Melhorar Qualidade Frontend
Adicionar testes end-to-end: Configurar Cypress ou Playwright para testes E2E Criar testes para fluxos críticos: login, criar lead, adicionar produtos, converter Adicionar testes de acessibilidade (a11y) com axe-core Implementar testes de responsividade para mobile Adicionar linting mais rigoroso (ESLint + Prettier) Configurar Husky para pre-commit hooks Adicionar análise de bundle size e otimização Meta: 100% dos fluxos críticos cobertos

13.
Implementar Funcionalidade de Revendedor (Cliente de Cliente)
Adicionar suporte a revendedores: Criar campo cCC (cliente de cliente) no formulário de lead Implementar autocomplete de revendedores em frontend/src/components/ResellerAutocomplete.jsx Adicionar lógica de cálculo de comissão de revenda em CartItemRepository.calculateTotals() Atualizar LeadDetailPage para mostrar informações do revendedor Implementar relatório de comissões por revendedor Adicionar validação de relacionamento cliente-revendedor Criar endpoint para buscar revendedores de um cliente

14.
Otimizar Build e Deploy com CI/CD
Melhorar processo de build e deploy: Criar pipeline CI/CD com GitHub Actions ou GitLab CI Automatizar testes em cada commit/PR Implementar build multi-stage do Docker para reduzir tamanho de imagens Adicionar health checks nos containers Docker Implementar blue-green deployment ou rolling updates Adicionar monitoramento de deploy (Sentry, New Relic) Criar scripts de rollback automático em caso de falha Documentar processo de deploy em @DEPLOY.md

15.
Implementar Notificações em Tempo Real
Adicionar sistema de notificações: Implementar WebSocket ou Server-Sent Events em backend/src/services/notification.service.js Criar notificações para: lead convertido, novo lead atribuído, alteração em lead Adicionar componente de notificações no Layout do frontend Implementar badge de notificações não lidas Adicionar preferências de notificação por usuário Criar tabela notifications para persistir notificações Implementar push notifications para mobile (PWA)

16.
Implementar Exportação de Dados e Relatórios
Adicionar funcionalidade de exportação: Implementar exportação de leads para Excel usando ExcelJS em backend/src/services/export.service.js Criar geração de PDF de cotação usando Puppeteer Adicionar endpoint GET /api/leads/export com filtros Implementar exportação de relatórios de vendas Criar templates de relatório customizáveis Adicionar agendamento de relatórios automáticos Implementar compressão de arquivos grandes (ZIP)

Add phase

