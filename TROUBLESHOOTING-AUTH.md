# 🔧 Troubleshooting - Autenticação

## Erro: "Access token required"

### Sintomas
- Erro 401 ao acessar endpoints protegidos
- Mensagem: `{"message": "Access token required"}`
- Usuário está logado mas requisições falham

### Causas Possíveis

1. **Token não foi salvo após login**
   - Verificar se o login foi bem-sucedido
   - Verificar localStorage no navegador

2. **Token expirado**
   - Access tokens expiram em 24 horas (padrão)
   - Refresh token deve renovar automaticamente

3. **Token não está sendo enviado**
   - Verificar interceptor do axios
   - Verificar headers da requisição

### Solução

#### 1. Verificar Token no LocalStorage

Abra o console do navegador (F12) e execute:

```javascript
// Verificar se o token existe
console.log('Token:', localStorage.getItem('token'))
console.log('Refresh Token:', localStorage.getItem('refreshToken'))
console.log('User:', localStorage.getItem('user'))
```

#### 2. Fazer Login Novamente

Se o token não existir ou estiver inválido:

1. Acesse: `https://dev.office.internut.com.br/leads/modern/login`
2. Faça login novamente
3. Verifique se o token foi salvo

#### 3. Verificar Requisições no Network

1. Abra DevTools (F12)
2. Vá para a aba "Network"
3. Faça uma requisição (ex: recarregar a página)
4. Verifique a requisição para `/api/leads`
5. Veja se o header `Authorization: Bearer <token>` está presente

#### 4. Limpar Cache e Fazer Login

```javascript
// No console do navegador
localStorage.clear()
location.reload()
```

Depois faça login novamente.

### Verificar se o Token Está Sendo Enviado

No console do navegador, antes de fazer uma requisição:

```javascript
// Interceptar requisições do axios
const originalRequest = axios.Axios.prototype.request
axios.Axios.prototype.request = function(config) {
  console.log('Request config:', config)
  console.log('Headers:', config.headers)
  return originalRequest.call(this, config)
}
```

### Teste Manual da API

```bash
# 1. Fazer login e obter token
curl -X POST https://dev.office.internut.com.br/leads/modern/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"Robson Rebelo Reis","password":"sua_senha"}'

# 2. Usar o token retornado
curl -X GET https://dev.office.internut.com.br/leads/modern/api/leads \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Debug no Código

Adicione logs temporários no `api.js`:

```javascript
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    console.log('🔑 Token encontrado:', !!token)
    console.log('📤 URL da requisição:', config.url)
    console.log('🌐 Base URL:', config.baseURL)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('✅ Token adicionado ao header')
    } else {
      console.warn('⚠️ Token não encontrado!')
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)
```

### Solução Rápida

Se nada funcionar:

1. **Limpar tudo e fazer login novamente:**
   ```javascript
   // No console do navegador
   localStorage.clear()
   sessionStorage.clear()
   location.href = '/login'
   ```

2. **Verificar se o backend está rodando:**
   ```bash
   docker service logs leads-agent-backend --tail 20
   ```

3. **Verificar se o token está sendo gerado corretamente:**
   - Fazer login via API diretamente
   - Verificar se o token JWT é válido

### Prevenção

- Implementar renovação automática de token antes de expirar
- Adicionar middleware para verificar token antes de cada requisição
- Implementar logout automático quando token expirar

---

**Última atualização**: 2025-01-09

