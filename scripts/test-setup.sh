#!/bin/bash

echo "🧪 Testando setup do projeto..."
echo ""

# Verificar estrutura de diretórios
echo "📁 Verificando estrutura de diretórios..."
if [ -d "backend" ] && [ -d "frontend" ] && [ -d "docker" ]; then
    echo "✅ Estrutura de diretórios OK"
else
    echo "❌ Estrutura de diretórios incompleta"
    exit 1
fi

# Verificar arquivos principais
echo ""
echo "📄 Verificando arquivos principais..."

files=(
    "backend/package.json"
    "backend/src/index.js"
    "frontend/package.json"
    "frontend/vite.config.js"
    "docker/docker-compose.yml"
    "docker/Dockerfile.backend"
    "docker/Dockerfile.frontend"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file - FALTANDO"
    fi
done

# Verificar Dockerfiles
echo ""
echo "🐳 Verificando Dockerfiles..."
if grep -q "npm install" docker/Dockerfile.backend; then
    echo "✅ Dockerfile.backend usa npm install"
else
    echo "❌ Dockerfile.backend precisa usar npm install"
fi

if grep -q "npm install" docker/Dockerfile.frontend; then
    echo "✅ Dockerfile.frontend usa npm install"
else
    echo "❌ Dockerfile.frontend precisa usar npm install"
fi

echo ""
echo "✨ Verificação concluída!"

