# 🚀 Guia de Início Rápido

## ✅ O que foi criado

### Estrutura Completa
- ✅ Backend Node.js + Express com estrutura MVC
- ✅ Frontend React + Vite + Material-UI
- ✅ Docker Compose com todos os serviços
- ✅ Nginx como proxy reverso
- ✅ Redis para cache
- ✅ Autenticação JWT
- ✅ Conexão com banco de dados MySQL
- ✅ Estrutura de rotas e controllers

### Funcionalidades Implementadas
- ✅ Sistema de autenticação (login, refresh token)
- ✅ Estrutura de API REST
- ✅ Middleware de autenticação
- ✅ Tratamento de erros
- ✅ Integração com banco de dados
- ✅ Cache com Redis
- ✅ Frontend básico com React Router
- ✅ Redux para gerenciamento de estado

## 📦 Como Iniciar

### Opção 1: Docker (Recomendado)

```bash
# 1. Navegar para o diretório docker
cd /home/ubuntu/environment/Office/Apps/inProduction/leads-agent/docker

# 2. Iniciar todos os serviços
docker-compose up -d

# 3. Ver logs
docker-compose logs -f

# 4. Acessar aplicação
# Frontend: http://localhost:5173
# Backend API: http://localhost:3001/api
# Nginx: http://localhost
```

### Opção 2: Desenvolvimento Local

#### Backend
```bash
cd backend
npm install
npm run dev
# API rodando em http://localhost:3001
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
# Frontend rodando em http://localhost:5173
```

## 🔧 Configuração

### Variáveis de Ambiente

O arquivo `.env` já está configurado com as credenciais do banco de dados do K3.

Para modificar, edite `backend/.env`:

```env
DB_HOST=vallery.catmgckfixum.sa-east-1.rds.amazonaws.com
DB_USER=robsonrr
DB_PASSWORD=Best94364811082
DB_NAME=mak
```

## 🧪 Testar a API

### Health Check
```bash
curl http://localhost:3001/health
```

### Login (exemplo)
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"seu_usuario","password":"sua_senha"}'
```

## 📁 Estrutura de Arquivos

```
leads-agent/
├── backend/
│   ├── src/
│   │   ├── config/        # Database, Redis
│   │   ├── controllers/   # Controllers da API
│   │   ├── middleware/    # Auth, Error handling
│   │   └── routes/        # Rotas da API
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/         # Páginas React
│   │   ├── store/         # Redux store
│   │   └── services/      # API services
│   └── package.json
├── docker/
│   └── docker-compose.yml
└── nginx/
    └── nginx.conf
```

## 🎯 Próximos Passos

1. **Implementar Controllers**
   - Leads CRUD completo
   - Busca de clientes
   - Busca de produtos
   - Cálculo de impostos

2. **Desenvolver Frontend**
   - Dashboard de leads
   - Formulário de criação
   - Carrinho de produtos
   - Visualização de lead

3. **Integrações**
   - Validação de estoque
   - Cálculo de impostos
   - Conversão para pedido

## 📝 Notas Importantes

- O sistema está configurado para usar o mesmo banco de dados do K3
- A autenticação integra com a tabela `Auth.users`
- Redis é usado para cache e sessões
- Todos os serviços estão containerizados

## 🐛 Troubleshooting

### Erro de conexão com banco
- Verifique as credenciais em `backend/.env`
- Confirme que o banco está acessível

### Erro de conexão com Redis
- Se usando Docker, Redis deve iniciar automaticamente
- Se local, instale Redis: `sudo apt install redis-server`

### Porta já em uso
- Altere as portas no `docker-compose.yml` ou `.env`

## 📚 Documentação

- [Plano Completo](./PLANO_MODERNIZACAO_LEADS.md)
- [README Principal](./README.md)

