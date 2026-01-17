# 🔐 Credenciais de Acesso - Leads Agent

## Usuários Disponíveis no Sistema

### Usuário Administrador (Recomendado para Testes)

**Usuário**: `Robson Rebelo Reis` ou `robsonrr@rolemak.com.br`  
**Senha**: (consulte o administrador do sistema ou use o sistema legado K3 para resetar)  
**Nível**: 6 (Administrador)  
**ID**: 1  
**Hash MD5**: `930248581fba709f1e0c2970c4f1d476`

> **Nota**: As senhas são armazenadas como hash MD5. Para descobrir a senha, você pode:
> - Consultar o administrador do sistema
> - Usar o sistema legado K3 para fazer login e alterar a senha
> - Resetar a senha diretamente no banco (apenas desenvolvimento)

### Outros Usuários Disponíveis

1. **Ronald Rebelo Reis**
   - Email: `ronaldrr@rolemak.com.br`
   - Nível: 5
   - ID: 2

2. **Cristina Rabello Reis Ghirarde**
   - Email: `cristinarrg@rolemak.com.br`
   - Nível: 5
   - ID: 5

3. **Financeiro**
   - Email: `finance@rolemak.com.br`
   - Nível: 1
   - ID: 12

## Como Fazer Login

1. Acesse: `https://dev.office.internut.com.br/leads/modern/`
2. Você será redirecionado para `/login` se não estiver autenticado
3. Use o **nome de usuário** (campo `user`) ou **email** para fazer login
4. Digite a senha correspondente

## Nota sobre Senhas

As senhas no sistema K3 são armazenadas como hash MD5 no campo `newpassword` da tabela `users`.

O sistema de autenticação suporta:
- ✅ Senhas em hash MD5 (formato do sistema legado)
- ✅ Senhas em texto plano (fallback para compatibilidade)
- ✅ Senhas em bcrypt (futuras migrações)

## Recuperar/Resetar Senha

### Opção 1: Usar Script de Reset (Recomendado para Testes)

```bash
cd /home/ubuntu/environment/Office/Apps/inProduction/leads-agent
./reset-password.sh 1 teste123
```

Isso resetará a senha do usuário ID 1 (Robson) para `teste123`.

### Opção 2: Atualizar Diretamente no Banco

```sql
-- Gerar hash MD5 da nova senha
-- Exemplo: senha "teste123" = "16d7a4fca7442dda3ad93c9a726597e4"
UPDATE users SET newpassword = MD5('nova_senha') WHERE id = 1;
```

### Opção 3: Usar o Sistema Legado K3

Acesse o sistema K3 e altere a senha normalmente. A mesma senha funcionará no sistema moderno.

## Teste de Login

Para testar o login via API:

```bash
curl -X POST https://dev.office.internut.com.br/leads/modern/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "Robson Rebelo Reis",
    "password": "sua_senha_aqui"
  }'
```

## Segurança

⚠️ **IMPORTANTE**: 
- Não compartilhe credenciais em produção
- Use senhas fortes
- Implemente política de expiração de senhas
- Considere implementar 2FA no futuro

---

**Última atualização**: 2025-01-09

