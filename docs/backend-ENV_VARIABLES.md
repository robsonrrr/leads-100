# Variáveis de Ambiente

Este documento lista todas as variáveis de ambiente necessárias para o backend.

## Configuração do Servidor

```env
PORT=3001
NODE_ENV=development
```

## Configuração do Banco de Dados

```env
DB_HOST=vallery.catmgckfixum.sa-east-1.rds.amazonaws.com
DB_USER=robsonrr
DB_PASSWORD=Best94364811082
DB_NAME=mak
DB_PORT=3306
```

## Configuração do Redis

```env
REDIS_HOST=localhost
REDIS_PORT=6379
DOCKER_ENV=false
```

## Configuração JWT

```env
JWT_SECRET=leads-agent-secret-key-change-in-production-2025
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
```

## Configuração CORS

```env
CORS_ORIGIN=https://dev.office.internut.com.br/leads/modern
```

## Configuração da API de Pricing

```env
PRICING_API_URL=https://csuite.internut.com.br/pricing/run
PRICING_API_KEY=eff0bf9efe8238b433f2587153c0c8209c4737e6a56fa90018308500678cafd5
```

## Exemplo Completo de .env

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=vallery.catmgckfixum.sa-east-1.rds.amazonaws.com
DB_USER=robsonrr
DB_PASSWORD=Best94364811082
DB_NAME=mak
DB_PORT=3306

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
DOCKER_ENV=false

# JWT Configuration
JWT_SECRET=leads-agent-secret-key-change-in-production-2025
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=https://dev.office.internut.com.br/leads/modern

# Pricing API Configuration
PRICING_API_URL=https://csuite.internut.com.br/pricing/run
PRICING_API_KEY=eff0bf9efe8238b433f2587153c0c8209c4737e6a56fa90018308500678cafd5
```

## Notas

- O arquivo `.env` não deve ser commitado no Git (já está no .gitignore)
- Em produção, use valores seguros para `JWT_SECRET` e `PRICING_API_KEY`
- As variáveis de Pricing têm valores padrão no código, mas é recomendado configurá-las no `.env`

