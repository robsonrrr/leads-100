# 🚀 Rodar Leads Agent Localmente (Sem Docker)

## Script Automatizado

Use o script `run-local.sh` para iniciar tudo automaticamente:

```bash
cd /home/ubuntu/environment/Office/Apps/inProduction/leads-agent
./run-local.sh
```

O script irá:
- ✅ Verificar dependências (Node.js, npm)
- ✅ Verificar se as portas estão disponíveis (3001, 5173)
- ✅ Criar `.env` se não existir
- ✅ Instalar dependências se necessário
- ✅ Iniciar backend na porta 3001
- ✅ Iniciar frontend na porta 5173
- ✅ Monitorar os processos

## URLs

Após iniciar:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health

## Parar os Serviços

Pressione `Ctrl+C` no terminal onde o script está rodando.

O script irá parar automaticamente:
- Backend (nodemon)
- Frontend (vite)

## Logs

Os logs são salvos em:
- **Backend**: `/tmp/leads-agent-backend.log`
- **Frontend**: `/tmp/leads-agent-frontend.log`

Para ver os logs em tempo real:
```bash
# Backend
tail -f /tmp/leads-agent-backend.log

# Frontend
tail -f /tmp/leads-agent-frontend.log
```

## Rodar Manualmente

Se preferir rodar manualmente:

### Backend

```bash
cd /home/ubuntu/environment/Office/Apps/inProduction/leads-agent/backend
npm install  # Se ainda não instalou
npm run dev
```

Backend rodará em: http://localhost:3001

### Frontend (em outro terminal)

```bash
cd /home/ubuntu/environment/Office/Apps/inProduction/leads-agent/frontend
export VITE_API_URL=http://localhost:3001/api
export VITE_BASE_PATH=/
npm install  # Se ainda não instalou
npm run dev
```

Frontend rodará em: http://localhost:5173

## Pré-requisitos

- Node.js 20+ instalado
- npm instalado
- Portas 3001 e 5173 disponíveis
- Arquivo `.env` configurado no backend (o script cria automaticamente)

## Troubleshooting

### Porta já em uso

```bash
# Verificar qual processo está usando a porta
lsof -i :3001
lsof -i :5173

# Parar processo
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### Erro de permissões

```bash
chmod +x run-local.sh
```

### Dependências não instaladas

O script instala automaticamente, mas se houver erro:

```bash
cd backend && npm install
cd ../frontend && npm install
```

### Backend não inicia

Verifique:
1. Arquivo `.env` existe e está configurado
2. Banco de dados está acessível
3. Porta 3001 está livre

```bash
tail -f /tmp/leads-agent-backend.log
```

### Frontend não inicia

Verifique:
1. Backend está rodando
2. Porta 5173 está livre
3. Variáveis de ambiente estão configuradas

```bash
tail -f /tmp/leads-agent-frontend.log
```

## Variáveis de Ambiente

O script configura automaticamente:
- `VITE_API_URL=http://localhost:3001/api`
- `VITE_BASE_PATH=/`

Para o backend, use o arquivo `.env` na pasta `backend/`.

## Diferenças do Docker

- **Sem isolamento**: Usa Node.js e npm do sistema
- **Portas locais**: 3001 (backend) e 5173 (frontend)
- **Sem Redis**: Redis é opcional em desenvolvimento
- **Hot reload**: Funciona normalmente com nodemon e vite

