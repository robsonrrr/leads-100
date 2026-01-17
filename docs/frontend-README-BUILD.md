# 🔧 Build do Frontend

## Problema de Assets 404

Se você está vendo erros 404 nos assets (JS/CSS), o problema é que o Vite precisa ser configurado com o `base` path correto.

## Solução

O `vite.config.js` já está configurado para usar `VITE_BASE_PATH`:

```js
base: process.env.VITE_BASE_PATH || '/leads/modern/',
```

## Build Manual

Para fazer build manualmente com o path correto:

```bash
cd frontend
export VITE_API_URL=https://dev.office.internut.com.br/leads/modern/api
export VITE_BASE_PATH=/leads/modern/
npm run build
```

## Verificar Build

Após o build, verifique o `dist/index.html`:

```bash
cat dist/index.html | grep -o 'src="[^"]*"' | head -5
```

Os paths devem começar com `/leads/modern/assets/` ou `./assets/` (relativo).

## Como o Traefik Funciona

1. Navegador solicita: `https://dev.office.internut.com.br/leads/modern/assets/index-XXX.js`
2. Traefik faz strip prefix: remove `/leads/modern`
3. Traefik encaminha para Nginx: `/assets/index-XXX.js`
4. Nginx serve o arquivo de `/usr/share/nginx/html/assets/index-XXX.js`

Por isso o HTML gerado deve ter paths com `/leads/modern/assets/` para que o navegador faça a requisição correta.

## Troubleshooting

### Assets ainda dando 404

1. Verificar se o build foi feito com `VITE_BASE_PATH`:
   ```bash
   cat dist/index.html | grep assets
   ```

2. Verificar se o nginx está servindo corretamente:
   ```bash
   docker exec -it leads-agent-frontend ls -la /usr/share/nginx/html/assets/
   ```

3. Verificar logs do Traefik:
   ```bash
   docker service logs traefik | grep leads-agent
   ```

### Rebuild necessário

Sempre que mudar o `PATH_PREFIX` no script de deploy, é necessário fazer rebuild:

```bash
cd /home/ubuntu/environment/Office/Apps/inProduction/leads-agent/frontend
rm -rf dist node_modules/.vite
export VITE_BASE_PATH=/leads/modern/
npm run build
```

