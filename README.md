# 🚀 Leads Agent - Sistema Moderno de Gestão de Leads

Aplicação moderna e isolada para gestão de leads, desenvolvida com Node.js, React e Docker.

## 📋 Pré-requisitos

- Docker e Docker Compose
- Node.js 20+ (para desenvolvimento local)
- npm ou yarn

## 🚀 Início Rápido

### Com Docker (Recomendado)

```bash
# 1. Copiar arquivo de ambiente
cp backend/.env.example backend/.env

# 2. Editar variáveis de ambiente se necessário
nano backend/.env

# 3. Iniciar todos os serviços
cd docker
docker-compose up -d

# 4. Ver logs
docker-compose logs -f
```

### Desenvolvimento Local

```bash
# Backend
cd backend
npm install
cp .env.example .env
npm run dev

# Frontend (em outro terminal)
cd frontend
npm install
npm run dev
```

## 📁 Estrutura do Projeto

```
leads-agent/
├── backend/          # API Node.js + Express
├── frontend/          # React SPA
├── docker/            # Configurações Docker
├── nginx/             # Configuração Nginx
└── shared/            # Código compartilhado
```

## 🔌 Endpoints da API

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Usuário atual
- `POST /api/auth/logout` - Logout

### Leads
- `GET /api/leads` - Listar leads
- `GET /api/leads/:id` - Obter lead
- `POST /api/leads` - Criar lead
- `PUT /api/leads/:id` - Atualizar lead
- `DELETE /api/leads/:id` - Deletar lead

### Clientes
- `GET /api/customers/search` - Buscar clientes
- `GET /api/customers/:id` - Obter cliente

### Produtos
- `GET /api/products/search` - Buscar produtos
- `GET /api/products/:id` - Obter produto

## 🛠️ Desenvolvimento

### Backend
```bash
cd backend
npm run dev      # Desenvolvimento com hot reload
npm test         # Executar testes
npm run lint     # Linter
```

### Frontend
```bash
cd frontend
npm run dev      # Desenvolvimento
npm run build    # Build de produção
npm run preview  # Preview do build
```

## 📝 Variáveis de Ambiente

Ver `backend/.env.example` para lista completa de variáveis.

## 🐳 Docker

### Comandos Úteis

```bash
# Iniciar serviços
docker-compose up -d

# Parar serviços
docker-compose down

# Ver logs
docker-compose logs -f [service]

# Rebuild
docker-compose build --no-cache

# Acessar container
docker exec -it leads-backend sh
```

## 📚 Documentação

- [Plano de Modernização](./PLANO_MODERNIZACAO_LEADS.md)
- [API Documentation](./docs/api.md) (em breve)

## 🤝 Contribuindo

1. Criar branch para feature
2. Fazer commit das mudanças
3. Push para branch
4. Abrir Pull Request

## 📄 Licença

ISC

# leads-agent
<<<<<<< HEAD
=======
# Test auto-version
>>>>>>> 61089a2 (feat: add quick filter buttons for leads by status and seller)
# leads-100
