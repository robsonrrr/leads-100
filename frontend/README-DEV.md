# 🚀 Desenvolvimento Local (Sem Docker)

Este guia explica como rodar o frontend diretamente na máquina remota para desenvolvimento mais rápido.

## ⚡ Vantagens

- **Hot Reload Instantâneo**: Mudanças aparecem na tela em menos de 1 segundo
- **Sem Build**: Não precisa fazer build a cada alteração
- **Debug Mais Fácil**: Console do navegador mostra erros em tempo real
- **Mais Rápido**: Vite é extremamente rápido para desenvolvimento

## 📋 Pré-requisitos

- Node.js instalado (já está: v22.19.0 ✅)
- npm instalado (já está: 10.9.3 ✅)

## 🏃 Como Usar

### Opção 1: Script Automático (Recomendado)

```bash
cd /home/ubuntu/environment/Office/Apps/inProduction/leads-agent/frontend
./dev-server.sh
```

O script vai:
- ✅ Verificar/instalar dependências automaticamente
- ✅ Detectar onde o backend está rodando
- ✅ Iniciar o servidor de desenvolvimento

### Opção 2: Manual

```bash
cd /home/ubuntu/environment/Office/Apps/inProduction/leads-agent/frontend

# Instalar dependências (só na primeira vez)
npm install

# Rodar o dev server
npm run dev
```

## 🌐 Acessar o Frontend

Após iniciar, o frontend estará disponível em:

- **Local**: http://localhost:5173
- **Rede**: http://[IP_DA_MAQUINA]:5173

Para descobrir o IP da máquina:
```bash
hostname -I
```

## ⚙️ Configuração

### Variáveis de Ambiente

Você pode criar um arquivo `.env` na pasta `frontend/`:

```env
# URL do backend (opcional - o script detecta automaticamente)
VITE_API_URL=http://localhost:3001/api
# ou
VITE_API_URL=https://dev.office.internut.com.br/leads/modern/api
```

### Porta Diferente

Se a porta 5173 estiver ocupada, o Vite tentará automaticamente outra porta.

Para forçar uma porta específica, edite `vite.config.js`:

```js
server: {
  port: 5174, // ou outra porta
}
```

## 🔥 Hot Reload

O Vite tem **Hot Module Replacement (HMR)** ativo por padrão:

- ✅ Salvar um arquivo `.jsx` → atualiza instantaneamente
- ✅ Mudanças em CSS → aplica sem recarregar a página
- ✅ Erros aparecem no console do navegador

## 🐛 Troubleshooting

### Porta já em uso
```bash
# Ver qual processo está usando a porta
lsof -i :5173
# Matar o processo
kill -9 [PID]
```

### Dependências desatualizadas
```bash
npm install
```

### Backend não encontrado
Verifique se o backend está rodando:
```bash
curl http://localhost:3001/api/health
```

## 📝 Notas

- O dev server **não** precisa do Docker
- As alterações são **instantâneas** (não precisa rebuild)
- Para produção, ainda use `npm run build` e Docker

