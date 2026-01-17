#!/usr/bin/env node
/**
 * Gera um token JWT para um usuário específico
 * Uso: node generate-token.js <user_id> [expiration]
 * 
 * Exemplos:
 *   node generate-token.js 107           # Token de 24h para usuário 107
 *   node generate-token.js 107 30d       # Token de 30 dias
 *   node generate-token.js 107 1y        # Token de 1 ano (service account)
 */

import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
import mysql from 'mysql2/promise';

config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function generateToken(userId, expiration = '24h') {
    // Conectar ao banco para buscar dados do usuário
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'rolemak'
    });

    try {
        const [users] = await connection.execute(
            'SELECT id, user, nick, level, depto, segmento FROM rolemak_users WHERE id = ? LIMIT 1',
            [userId]
        );

        if (users.length === 0) {
            console.error(`❌ Usuário ${userId} não encontrado`);
            process.exit(1);
        }

        const user = users[0];

        const token = jwt.sign(
            {
                userId: user.id,
                username: user.user,
                level: user.level,
                depto: user.depto,
                segmento: user.segmento,
                isServiceToken: true
            },
            JWT_SECRET,
            { expiresIn: expiration }
        );

        console.log('\n✅ Token gerado com sucesso!\n');
        console.log('📋 Usuário:', user.nick || user.user);
        console.log('🆔 ID:', user.id);
        console.log('📊 Nível:', user.level);
        console.log('⏰ Expiração:', expiration);
        console.log('\n🔑 Token:\n');
        console.log(token);
        console.log('\n');

        // Decodificar para mostrar info
        const decoded = jwt.decode(token);
        console.log('📅 Expira em:', new Date(decoded.exp * 1000).toLocaleString('pt-BR'));

        return token;
    } finally {
        await connection.end();
    }
}

// Main
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log(`
📌 Uso: node generate-token.js <user_id> [expiration]

Exemplos:
  node generate-token.js 107           # Token de 24h
  node generate-token.js 107 7d        # Token de 7 dias
  node generate-token.js 107 30d       # Token de 30 dias
  node generate-token.js 107 1y        # Token de 1 ano

Expirações válidas:
  1h, 24h, 7d, 30d, 90d, 365d, 1y, never
`);
    process.exit(0);
}

const userId = parseInt(args[0]);
let expiration = args[1] || '24h';

// Converter 'never' para 100 anos
if (expiration === 'never') {
    expiration = '36500d';
}

generateToken(userId, expiration);
