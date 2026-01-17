# 🔧 Troubleshooting - Leads Agent

## Erro 403 (Forbidden)

### Sintomas
- `GET https://dev.office.internut.com.br/leads/modern 403 (Forbidden)`
- Logs do nginx mostram: `directory index of "/usr/share/nginx/html/" is forbidden`

### Causas Possíveis

1. **Diretório dist vazio ou não montado**
   ```bash
   # Verificar se o diretório existe e tem arquivos
   ls -la /home/ubuntu/environment/Office/Apps/inProduction/leads-agent/frontend/dist/
   
   # Verificar dentro do container
   docker exec $(docker ps -q -f name=leads-agent-frontend) ls -la /usr/share/nginx/html/
   ```

2. **index.html não encontrado**
   ```bash
   # Verificar se index.html existe
   test -f /home/ubuntu/environment/Office/Apps/inProduction/leads-agent/frontend/dist/index.html && echo "OK" || echo "FALTANDO"
   ```

3. **Permissões incorretas**
   ```bash
   # Verificar permissões
   ls -la /home/ubuntu/environment/Office/Apps/inProduction/leads-agent/frontend/dist/
   ```

### Solução

1. **Fazer rebuild do frontend**
   ```bash
   cd /home/ubuntu/environment/Office/Apps/inProduction/leads-agent
   ./rebuild-frontend.sh
   ```

2. **Recriar serviço do frontend**
   ```bash
   docker service rm leads-agent-frontend
   cd /home/ubuntu/environment/Office/Scripts/inProduction
   ./leads-agent.sh
   ```

3. **Verificar logs**
   ```bash
   docker service logs leads-agent-frontend -f
   ```

## Erro 404 nos Assets

### Sintomas
- `GET https://dev.office.internut.com.br/assets/index-XXX.js 404`
- Assets não carregam

### Causa
O build foi feito sem o `VITE_BASE_PATH` configurado.

### Solução

1. **Rebuild com base path correto**
   ```bash
   cd /home/ubuntu/environment/Office/Apps/inProduction/leads-agent/frontend
   export VITE_BASE_PATH=/leads/modern/
   export VITE_API_URL=https://dev.office.internut.com.br/leads/modern/api
   rm -rf dist
   npm run build
   ```

2. **Verificar HTML gerado**
   ```bash
   cat dist/index.html | grep -o 'src="[^"]*"'
   # Deve mostrar: src="/leads/modern/assets/..."
   ```

## Verificar Status dos Serviços

```bash
# Listar serviços
docker service ls | grep leads-agent

# Ver logs
docker service logs leads-agent-backend -f
docker service logs leads-agent-frontend -f

# Ver detalhes
docker service inspect leads-agent-frontend --pretty
```

## Testar Acesso Direto

```bash
# Testar nginx dentro do container
docker exec $(docker ps -q -f name=leads-agent-frontend) wget -O- http://localhost/

# Testar API
curl https://dev.office.internut.com.br/leads/modern/api/health
```

## Rebuild Completo

```bash
# 1. Parar serviços
docker service rm leads-agent-backend leads-agent-frontend leads-agent-redis

# 2. Rebuild frontend
cd /home/ubuntu/environment/Office/Apps/inProduction/leads-agent
./rebuild-frontend.sh

# 3. Redeploy
cd /home/ubuntu/environment/Office/Scripts/inProduction
./leads-agent.sh
```

