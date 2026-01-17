# 🚀 Guia de Deployment

## Deployment com Traefik (Produção)

O deployment segue o padrão do ambiente local usando Docker Swarm e Traefik, similar ao `leads5.sh`.

### Pré-requisitos

- Docker Swarm inicializado
- Traefik rodando na rede `traefik-net`
- Node.js instalado localmente (para build do frontend)
- Acesso ao diretório `/home/ubuntu/environment/Office/Apps/inProduction/leads-agent`

### Deploy

```bash
# Executar script de deployment
cd /home/ubuntu/environment/Office/Scripts/inProduction
./leads-agent.sh
```

O script irá:
1. Remover serviços existentes (se houver)
2. Criar serviço do backend (Node.js)
3. Fazer build do frontend localmente
4. Criar serviço do frontend (Nginx servindo arquivos estáticos)
5. Criar serviço do Redis

### Verificar Status

```bash
# Listar serviços
docker service ls | grep leads-agent

# Ver logs
docker service logs leads-agent-backend -f
docker service logs leads-agent-frontend -f
docker service logs leads-agent-redis -f

# Ver detalhes do serviço
docker service inspect leads-agent-backend
```

### Atualizar Deployment

```bash
# Atualizar código
cd /home/ubuntu/environment/Office/Apps/inProduction/leads-agent
git pull  # ou fazer suas alterações

# Re-executar script (remove e recria serviços)
cd /home/ubuntu/environment/Office/Scripts/inProduction
./leads-agent.sh
```

### Remover Deployment

```bash
# Remover todos os serviços
docker service rm leads-agent-backend leads-agent-frontend leads-agent-redis
```

## Configuração

### Variáveis de Ambiente

O script usa variáveis hardcoded. Para alterar, edite o arquivo `leads-agent.sh`:

```bash
SERVICE_NAME="leads-agent"
APP_PATH="/home/ubuntu/environment/Office/Apps/inProduction/leads-agent"
HOST_DOMAIN="dev.office.internut.com.br"
PATH_PREFIX="/leads/modern"
```

### URLs

- **Frontend**: `https://dev.office.internut.com.br/leads/modern`
- **Backend API**: `https://dev.office.internut.com.br/leads/modern/api`

### Rede

Todos os serviços usam a rede `traefik-net` que deve estar criada:

```bash
docker network create --driver overlay traefik-net
```

## Estrutura de Serviços

### leads-agent-backend
- **Porta interna**: 3001
- **Path**: `/leads/modern/api`
- **Imagem**: `node:20-alpine`
- **Volumes**: 
  - Código fonte: `/home/ubuntu/environment/Office/Apps/inProduction/leads-agent/backend`
  - .env: `/home/ubuntu/environment/Office/Apps/inProduction/leads-agent/backend/.env`
  - Config: `/home/ubuntu/environment/Office/Configs/dev/config.env`

### leads-agent-frontend
- **Porta interna**: 80
- **Path**: `/leads/modern`
- **Imagem**: `nginx:alpine`
- **Volumes**: 
  - Build: `/home/ubuntu/environment/Office/Apps/inProduction/leads-agent/frontend/dist`
  - Nginx config: `/home/ubuntu/environment/Office/Apps/inProduction/leads-agent/frontend/nginx.conf`

### leads-agent-redis
- **Imagem**: `redis:7-alpine`
- **Rede**: `traefik-net` (apenas interno, não exposto via Traefik)
- **Persistência**: `--appendonly yes`

## Labels Traefik

O script configura automaticamente:

- **Routers**: Roteamento baseado em Host e PathPrefix
- **Entrypoints**: `websecure` (HTTPS)
- **TLS**: Certificado automático via `myresolver`
- **Middlewares**: Strip prefix para remover `/leads/modern` antes de encaminhar

## Troubleshooting

### Serviço não inicia
```bash
# Ver logs detalhados
docker service logs leads-agent-backend --raw

# Verificar se a rede existe
docker network ls | grep traefik-net
```

### Erro de permissão
```bash
# Verificar permissões dos arquivos
ls -la /home/ubuntu/environment/Office/Apps/inProduction/leads-agent/backend
```

### Frontend não carrega
```bash
# Verificar se o build foi feito
ls -la /home/ubuntu/environment/Office/Apps/inProduction/leads-agent/frontend/dist

# Rebuild manual
cd /home/ubuntu/environment/Office/Apps/inProduction/leads-agent/frontend
npm run build
```

### Redis não conecta
```bash
# Verificar se Redis está rodando
docker service ps leads-agent-redis

# Testar conexão do backend
docker exec -it $(docker ps -q -f name=leads-agent-backend) sh
# Dentro do container:
# apk add redis
# redis-cli -h leads-agent-redis ping
```

### Erro no build do frontend
```bash
# Verificar Node.js instalado
node --version
npm --version

# Limpar e reinstalar
cd /home/ubuntu/environment/Office/Apps/inProduction/leads-agent/frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Desenvolvimento Local (Docker Compose)

Para desenvolvimento local sem Traefik:

```bash
cd /home/ubuntu/environment/Office/Apps/inProduction/leads-agent/docker
docker-compose up -d
```

Isso usa o `docker-compose.yml` padrão para desenvolvimento.

## Diferenças do Padrão leads5.sh

- **leads5.sh**: Usa imagem PHP (`koseven-php7:latest`) com Apache
- **leads-agent.sh**: Usa Node.js para backend e Nginx para frontend
- Ambos seguem o mesmo padrão de labels Traefik e estrutura de deployment
