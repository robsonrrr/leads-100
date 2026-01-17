# Watch Mode - Rebuild Automático para Ambiente de Teste

Para ambiente de teste remoto, você pode usar watch mode para rebuild automático quando arquivos mudam.

## Opções Disponíveis

### 1. Watch Mode com Vite (Recomendado) ⚡

Usa o watch mode nativo do Vite, mais eficiente:

```bash
cd /home/ubuntu/environment/Office/Apps/inProduction/leads-agent
./watch-frontend-vite.sh
```

**Como funciona:**
- Monitora mudanças em `frontend/src/`
- Faz rebuild automaticamente quando detecta mudanças
- Atualiza o serviço Docker automaticamente
- Mais rápido e eficiente

### 2. Watch Mode com inotifywait

Monitora mudanças usando inotifywait (Linux):

```bash
cd /home/ubuntu/environment/Office/Apps/inProduction/leads-agent
./watch-frontend.sh
```

**Como funciona:**
- Usa `inotifywait` para monitorar mudanças
- Fallback para polling se inotifywait não estiver disponível
- Faz rebuild e atualiza serviço quando detecta mudanças

### 3. Rebuild Manual

Para rebuild único sem watch:

```bash
cd /home/ubuntu/environment/Office/Apps/inProduction/leads-agent
./rebuild-frontend.sh
```

## Executar em Background

Para executar o watch mode em background (não bloqueia o terminal):

```bash
# Com nohup
nohup ./watch-frontend-vite.sh > watch.log 2>&1 &

# Ou com screen
screen -S watch-frontend
./watch-frontend-vite.sh
# Pressione Ctrl+A depois D para desanexar
# Para reanexar: screen -r watch-frontend
```

## Parar o Watch Mode

- Se estiver rodando no terminal: `Ctrl+C`
- Se estiver em background: `pkill -f watch-frontend`

## Dicas

1. **Cache do navegador**: Se mudanças não aparecerem, limpe o cache (`Ctrl+Shift+R`)
2. **Logs**: Verifique logs do serviço: `docker service logs -f leads-agent-frontend`
3. **Performance**: O watch mode do Vite é mais eficiente que polling

