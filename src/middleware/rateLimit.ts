import { Request, Response, NextFunction } from 'express';

// Armazenamento em memória para rate limiting
// Em produção, use Redis para ambientes multi-servidor
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Configurações de Rate Limit
 */
interface RateLimitOptions {
  windowMs: number;     // Janela de tempo em milissegundos
  maxRequests: number;  // Número máximo de requisições na janela
  message?: string;     // Mensagem de erro personalizada
  skipSuccessfulRequests?: boolean; // Não contar requisições bem-sucedidas
}

/**
 * Cria um middleware de rate limiting
 */
export const createRateLimit = (options: RateLimitOptions) => {
  const {
    windowMs,
    maxRequests,
    message = 'Muitas requisições. Tente novamente mais tarde.',
    skipSuccessfulRequests = false
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Identificador único (IP + User Agent)
    const identifier = `${req.ip}-${req.headers['user-agent']}`;
    const now = Date.now();

    // Limpar registros expirados periodicamente
    cleanExpiredRecords(now);

    // Buscar ou criar registro
    let record = store[identifier];

    if (!record || now > record.resetTime) {
      // Criar novo registro
      record = {
        count: 0,
        resetTime: now + windowMs
      };
      store[identifier] = record;
    }

    // Verificar limite
    if (record.count >= maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(record.resetTime).toISOString(),
        'Retry-After': retryAfter.toString()
      });

      return res.status(429).json({
        success: false,
        error: message,
        retryAfter: `${retryAfter} segundos`
      });
    }

    // Incrementar contador
    record.count++;

    // Adicionar headers informativos
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': (maxRequests - record.count).toString(),
      'X-RateLimit-Reset': new Date(record.resetTime).toISOString()
    });

    // Se configurado para pular requisições bem-sucedidas, decrementar ao final
    if (skipSuccessfulRequests) {
      res.on('finish', () => {
        if (res.statusCode < 400) {
          record.count--;
        }
      });
    }

    next();
  };
};

/**
 * Limpa registros expirados do store
 */
function cleanExpiredRecords(now: number) {
  // Limpar apenas a cada 60 segundos
  const lastClean = (global as any).__lastRateLimitClean || 0;
  if (now - lastClean < 60000) return;

  Object.keys(store).forEach(key => {
    if (now > store[key].resetTime) {
      delete store[key];
    }
  });

  (global as any).__lastRateLimitClean = now;
}

/**
 * Rate Limits pré-configurados
 */

// Rate limit geral (100 req/15min)
export const generalLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 100,
  message: 'Muitas requisições. Limite de 100 requisições por 15 minutos.'
});

// Rate limit para autenticação (5 req/15min)
export const authLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 5,
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  skipSuccessfulRequests: true // Não contar logins bem-sucedidos
});

// Rate limit para criação (10 req/hora)
export const createLimiter = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  maxRequests: 10,
  message: 'Limite de criações atingido. Tente novamente em 1 hora.'
});

// Rate limit rigoroso (3 req/min)
export const strictLimiter = createRateLimit({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 3,
  message: 'Muitas requisições. Aguarde 1 minuto.'
});