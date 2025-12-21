"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.strictLimiter = exports.createLimiter = exports.authLimiter = exports.generalLimiter = exports.createRateLimit = void 0;
const store = {};
/**
 * Cria um middleware de rate limiting
 */
const createRateLimit = (options) => {
    const { windowMs, maxRequests, message = 'Muitas requisições. Tente novamente mais tarde.', skipSuccessfulRequests = false } = options;
    return (req, res, next) => {
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
exports.createRateLimit = createRateLimit;
/**
 * Limpa registros expirados do store
 */
function cleanExpiredRecords(now) {
    // Limpar apenas a cada 60 segundos
    const lastClean = global.__lastRateLimitClean || 0;
    if (now - lastClean < 60000)
        return;
    Object.keys(store).forEach(key => {
        if (now > store[key].resetTime) {
            delete store[key];
        }
    });
    global.__lastRateLimitClean = now;
}
/**
 * Rate Limits pré-configurados
 */
// Rate limit geral (100 req/15min)
exports.generalLimiter = (0, exports.createRateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 100,
    message: 'Muitas requisições. Limite de 100 requisições por 15 minutos.'
});
// Rate limit para autenticação (5 req/15min)
exports.authLimiter = (0, exports.createRateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 5,
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    skipSuccessfulRequests: true // Não contar logins bem-sucedidos
});
// Rate limit para criação (10 req/hora)
exports.createLimiter = (0, exports.createRateLimit)({
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 10,
    message: 'Limite de criações atingido. Tente novamente em 1 hora.'
});
// Rate limit rigoroso (3 req/min)
exports.strictLimiter = (0, exports.createRateLimit)({
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 3,
    message: 'Muitas requisições. Aguarde 1 minuto.'
});
