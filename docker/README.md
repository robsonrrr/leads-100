# 🐳 Docker Setup

## Iniciar Serviços

```bash
# A partir do diretório docker/
docker-compose up -d
```

## Parar Serviços

```bash
docker-compose down
```

## Rebuild (após mudanças nos Dockerfiles)

```bash
docker-compose build --no-cache
docker-compose up -d
```

## Ver Logs

```bash
# Todos os serviços
docker-compose logs -f

# Serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f redis
```

## Acessar Container

```bash
# Backend
docker exec -it leads-backend sh

# Frontend
docker exec -it leads-frontend sh
```

## Limpar Tudo

```bash
# Parar e remover containers, volumes e networks
docker-compose down -v

# Remover imagens também
docker-compose down -v --rmi all
```

## Troubleshooting

### Erro: npm ci precisa de package-lock.json
- Solução: Os Dockerfiles foram atualizados para usar `npm install` ao invés de `npm ci`

### Porta já em uso
- Altere as portas no `docker-compose.yml` ou pare o serviço que está usando a porta

### Erro de permissão
- Execute com `sudo` se necessário

