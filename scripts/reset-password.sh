#!/bin/bash
# Script para resetar senha de usuário para testes

DB_HOST="vallery.catmgckfixum.sa-east-1.rds.amazonaws.com"
DB_USER="robsonrr"
DB_PASSWORD="Best94364811082"
DB_NAME="mak"

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Uso: $0 <user_id> <nova_senha>"
    echo ""
    echo "Exemplos:"
    echo "  $0 1 teste123    # Resetar senha do usuário ID 1 para 'teste123'"
    echo "  $0 1 admin       # Resetar senha do usuário ID 1 para 'admin'"
    echo ""
    echo "Usuários disponíveis:"
    mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "SELECT id, user, email FROM users WHERE level >= 1 ORDER BY id LIMIT 10;" 2>/dev/null
    exit 1
fi

USER_ID=$1
NEW_PASSWORD=$2

# Gerar hash MD5 da nova senha
PASSWORD_HASH=$(echo -n "$NEW_PASSWORD" | md5sum | cut -d' ' -f1)

echo "Resetando senha do usuário ID $USER_ID..."
echo "Nova senha: $NEW_PASSWORD"
echo "Hash MD5: $PASSWORD_HASH"

# Atualizar no banco (Resetando para MD5 e limpando Bcrypt para permitir nova migração híbrida)
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "
UPDATE rolemak_users 
SET newpassword = '$PASSWORD_HASH',
    password_bcrypt = NULL,
    password_version = 'MD5',
    last_password_change = NOW()
WHERE id = $USER_ID;
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Senha resetada com sucesso!"
    echo ""
    echo "Credenciais:"
    mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "
    SELECT id, user, email 
    FROM users 
    WHERE id = $USER_ID;
    " 2>/dev/null
    echo ""
    echo "Use estas credenciais para fazer login:"
    echo "  Usuário: (nome do user ou email acima)"
    echo "  Senha: $NEW_PASSWORD"
else
    echo "❌ Erro ao resetar senha"
    exit 1
fi

