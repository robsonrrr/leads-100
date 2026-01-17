---
description: Como criar uma nova versão do leads-agent
---

# Workflow de Versionamento do Leads Agent

## Pré-requisitos

- Todas as mudanças commitadas
- Testes passando (se aplicável)
- Branch `main` atualizada

---

## Passos para Nova Versão

### 1. Atualizar CHANGELOG.md

Mover itens de `[Unreleased]` para nova seção com a versão:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Adicionado
- (mover itens de Unreleased)
```

### 2. Atualizar versão no package.json

// turbo
```bash
# Backend
cd /home/ubuntu/environment/Office/Apps/inProduction/leads-agent/backend
npm version <major|minor|patch> --no-git-tag-version

# Frontend  
cd /home/ubuntu/environment/Office/Apps/inProduction/leads-agent/frontend
npm version <major|minor|patch> --no-git-tag-version
```

### 3. Commit da versão

```bash
cd /home/ubuntu/environment/Office/Apps/inProduction/leads-agent
git add .
git commit -m "chore(release): v1.X.X"
```

### 4. Criar tag

// turbo
```bash
git tag -a v1.X.X -m "Release v1.X.X - Descrição breve"
```

### 5. Push com tags

```bash
git push origin main
git push origin --tags
```

### 6. Deploy (opcional)

```bash
cd /home/ubuntu/environment/Office/Deployment/run-solid
fab deploy-app leads-agent
```

---

## Exemplos de Versionamento Semântico

| Tipo de Mudança | Exemplo | Versão |
|-----------------|---------|--------|
| Bug fix | Corrigir erro de validação | 1.4.0 → 1.4.1 |
| Nova feature | Adicionar cache de metas | 1.4.1 → 1.5.0 |
| Breaking change | Mudar formato da API | 1.5.0 → 2.0.0 |

---

## Comandos Rápidos

### Ver versão atual
// turbo
```bash
cd /home/ubuntu/environment/Office/Apps/inProduction/leads-agent/backend
node -p "require('./package.json').version"
```

### Listar todas as tags
// turbo
```bash
git tag -l --sort=-v:refname | head -10
```

### Ver changelog entre versões
// turbo
```bash
git log v1.4.0..v1.5.0 --oneline
```

### Criar release rápida (patch)
```bash
cd /home/ubuntu/environment/Office/Apps/inProduction/leads-agent
npm version patch -w backend -w frontend --no-git-tag-version
git add .
git commit -m "chore(release): v1.X.X"
git tag -a v1.X.X -m "Patch release"
git push origin main --tags
```

---

## Script de Release Automatizado

Para automatizar, você pode criar um script:

```bash
#!/bin/bash
# release.sh <version>
# Exemplo: ./release.sh 1.6.0

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Uso: ./release.sh <version>"
  exit 1
fi

cd /home/ubuntu/environment/Office/Apps/inProduction/leads-agent

# Atualizar package.json
cd backend && npm version $VERSION --no-git-tag-version && cd ..
cd frontend && npm version $VERSION --no-git-tag-version && cd ..

# Commit e tag
git add .
git commit -m "chore(release): v$VERSION"
git tag -a "v$VERSION" -m "Release v$VERSION"

# Push
git push origin main
git push origin --tags

echo "✅ Versão v$VERSION publicada!"
```
