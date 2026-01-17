# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]

---

## [1.6.1] - 2026-01-16

### Adicionado
- Notificações in-app (toast) quando push chega com app em foco
- API externa para envio de push notifications (`/api/notifications/send`, `/broadcast`)
- Scripts de linha de comando para broadcast e envio de notificações
- Exibição da versão do app no rodapé do menu lateral

### Modificado
- Botão "Calcular Pricing" oculto para vendedores (level ≤ 4) nos dialogs de item

---

## [1.6.0] - 2026-01-16

### Adicionado
- Cache inteligente para página Metas por Cliente
  - Dados estáticos (metas, classificações) com cache de 30 minutos
  - Dados anuais (sold_2026, gap) com cache de 10 minutos
  - Dados mensais (sold_month, penetração) sempre realtime
- Headers HTTP de debug para cache (X-Cache-Static, X-Cache-Annual, X-Query-Time-Ms)
- Invalidação automática do cache quando lead é convertido em pedido
- Logs de telemetria com tempo de query e status do cache
- Sistema de versionamento com CHANGELOG.md
- Workflow de release em `.agent/workflows/release.md`

### Modificado
- Refatoração do `CustomerGoalsService` com arquitetura em 3 camadas de cache

## [1.5.0] - 2026-01-16

### Adicionado
- Controle de acesso por nível para página Metas por Cliente
- Restrição de visualização para vendedores (só podem ver próprios dados)

---

## [1.4.0] - 2026-01-15

### Adicionado
- Melhorias na home de leads:
  - Ícone de imprimir na listagem
  - Data de/até padrão para hoje
  - Ordenação padrão por ID descendente
  - Coluna de hora e tempo decorrido
  - 100 leads por página por padrão
  - Colunas de segmento e contagem de itens
  - Contagem de itens com preço > 0

### Corrigido
- Erro de validação decisionId no updateItem
- Erro db() não definido no createLead
- Mapeamento de segmentos para IDs numéricos
- React key warning nos Autocompletes

---

## [1.3.0] - 2026-01-14

### Adicionado
- Integração com API 4C Intelligence para recomendações Next Best Action
- Feedback loop para decisões de IA (ACCEPTED, CONVERTED)

---

## [1.2.0] - 2026-01-13

### Adicionado
- Documentação completa do chatbot
- Notas de release para automação
- Manuais de treinamento e administração

---

## [1.1.0] - 2026-01-12

### Adicionado
- Lógica de sincronização offline para leads
- Validação do serviço de notificações push
- Triggers de automação para criação de leads
- Integração IA + Pricing Agent para cotações multi-item

---

## [1.0.0] - 2026-01-01

### Adicionado
- Sistema completo de gestão de leads
- API RESTful com autenticação JWT
- Dashboard com widgets personalizáveis
- Integração com banco de dados legado (MAK)
- Página Metas por Cliente com análise de penetração
- Cálculo automático de impostos (IPI/ST)
- Conversão de lead para pedido
- Sistema de cache com Redis

---

## Convenções de Versionamento

### Formato: MAJOR.MINOR.PATCH

- **MAJOR**: Mudanças incompatíveis com versões anteriores
- **MINOR**: Novas funcionalidades compatíveis com versões anteriores
- **PATCH**: Correções de bugs compatíveis com versões anteriores

### Tipos de Mudanças

- **Adicionado**: Novas funcionalidades
- **Modificado**: Mudanças em funcionalidades existentes
- **Obsoleto**: Funcionalidades que serão removidas em breve
- **Removido**: Funcionalidades removidas
- **Corrigido**: Correções de bugs
- **Segurança**: Correções de vulnerabilidades

---

## Links

[Unreleased]: https://github.com/Rolemak/leads-agent/compare/v1.5.0...HEAD
[1.5.0]: https://github.com/Rolemak/leads-agent/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/Rolemak/leads-agent/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/Rolemak/leads-agent/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/Rolemak/leads-agent/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Rolemak/leads-agent/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Rolemak/leads-agent/releases/tag/v1.0.0
