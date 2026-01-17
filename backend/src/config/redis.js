import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient = null;

export async function connectRedis() {
  // Em desenvolvimento, verificar se Redis está disponível antes de tentar conectar
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!isProduction) {
    // Em desenvolvimento, tentar conexão rápida e falhar silenciosamente
    try {
      const redisHost = process.env.REDIS_HOST || 'localhost';
      const redisPort = process.env.REDIS_PORT || 6379;
      
      // Se estiver tentando conectar ao hostname do Docker mas não estiver no Docker, usar localhost
      const finalHost = (redisHost === 'leads-agent-redis' && !process.env.DOCKER_ENV) 
        ? 'localhost' 
        : redisHost;

      redisClient = createClient({
        socket: {
          host: finalHost,
          port: parseInt(redisPort),
          connectTimeout: 1000, // Timeout de conexão de 1 segundo
          reconnectStrategy: () => false, // Não tentar reconectar em desenvolvimento
        }
      });

      redisClient.on('error', () => {
        // Silenciar erros em desenvolvimento
        redisClient = null;
      });

      redisClient.on('connect', () => {
        console.log('✅ Redis connected');
      });

      // Tentar conectar com timeout curto (1 segundo)
      const connectPromise = redisClient.connect();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Redis connection timeout')), 1000)
      );

      try {
        await Promise.race([connectPromise, timeoutPromise]);
        return redisClient;
      } catch (timeoutError) {
        // Se timeout, desconectar silenciosamente
        try {
          if (redisClient) {
            await redisClient.quit().catch(() => {});
          }
        } catch (e) {
          // Ignorar erro ao desconectar
        }
        redisClient = null;
        console.warn('⚠️  Redis não disponível - continuando sem cache');
        return null;
      }
    } catch (error) {
      // Em desenvolvimento, não bloquear o servidor se Redis falhar
      redisClient = null;
      console.warn('⚠️  Redis não disponível - continuando sem cache');
      return null;
    }
  } else {
    // Em produção, comportamento normal com retry
    try {
      const redisHost = process.env.REDIS_HOST || 'localhost';
      const redisPort = process.env.REDIS_PORT || 6379;

      redisClient = createClient({
        socket: {
          host: redisHost,
          port: parseInt(redisPort),
          reconnectStrategy: (retries) => {
            return Math.min(retries * 100, 3000);
          }
        }
      });

      redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      redisClient.on('connect', () => {
        console.log('✅ Redis connected');
      });

      await redisClient.connect();
      return redisClient;
    } catch (error) {
      console.error('Redis connection error:', error);
      throw error;
    }
  }
}

export function getRedis() {
  // Em desenvolvimento, sempre retornar null se não houver cliente (nunca lançar erro)
  if (!redisClient) {
    return null;
  }
  return redisClient;
}

// Cache helper functions
export async function cacheGet(key) {
  try {
    const client = getRedis();
    if (!client) return null; // Redis não disponível
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    // Silenciar todos os erros (Redis é opcional)
    return null;
  }
}

export async function cacheSet(key, value, ttl = 3600) {
  try {
    const client = getRedis();
    if (!client) return false; // Redis não disponível
    // Se value já é string, não fazer JSON.stringify
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    await client.setEx(key, ttl, stringValue);
    return true;
  } catch (error) {
    // Silenciar todos os erros (Redis é opcional)
    return false;
  }
}

export async function cacheDelete(key) {
  try {
    const client = getRedis();
    if (!client) return false; // Redis não disponível
    await client.del(key);
    return true;
  } catch (error) {
    // Silenciar todos os erros (Redis é opcional)
    return false;
  }
}

