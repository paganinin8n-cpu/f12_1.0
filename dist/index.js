"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
// Rotas
const users_1 = __importDefault(require("./routes/users"));
const auth_1 = __importDefault(require("./routes/auth"));
// Middlewares
const logging_1 = require("./middleware/logging");
const rateLimit_1 = require("./middleware/rateLimit");
// Logger
const logger_1 = require("./services/logger");
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
// ============================================
// MIDDLEWARES GLOBAIS
// ============================================
// Request ID único para cada requisição
app.use(logging_1.requestId);
// CORS
app.use((0, cors_1.default)({
    origin: '*', // Em produção, especifique os domínios permitidos
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
// Body parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Request logging
app.use(logging_1.requestLogger);
// Rate limiting geral (100 req/15min)
app.use(rateLimit_1.generalLimiter);
// ============================================
// ROTAS
// ============================================
// Rota raiz - Informações da API
app.get('/', (req, res) => {
    res.json({
        name: 'F12 API - Banco de Dados',
        version: '1.0.0',
        environment: NODE_ENV,
        timestamp: new Date().toISOString(),
        endpoints: {
            health: {
                url: '/health',
                method: 'GET',
                description: 'Status da API e banco de dados'
            },
            auth: {
                register: {
                    url: '/auth/register',
                    method: 'POST',
                    description: 'Registrar novo usuário',
                    rateLimit: '5 requisições por 15 minutos'
                },
                login: {
                    url: '/auth/login',
                    method: 'POST',
                    description: 'Fazer login',
                    rateLimit: '5 requisições por 15 minutos'
                },
                me: {
                    url: '/auth/me',
                    method: 'GET',
                    description: 'Obter dados do usuário autenticado',
                    auth: 'Bearer token'
                },
                logout: {
                    url: '/auth/logout',
                    method: 'POST',
                    description: 'Fazer logout',
                    auth: 'Bearer token'
                }
            },
            users: {
                list: {
                    url: '/users',
                    method: 'GET',
                    description: 'Listar todos os usuários'
                },
                get: {
                    url: '/users/:id',
                    method: 'GET',
                    description: 'Buscar usuário por ID'
                },
                create: {
                    url: '/users',
                    method: 'POST',
                    description: 'Criar novo usuário',
                    rateLimit: '10 requisições por hora'
                },
                update: {
                    url: '/users/:id',
                    method: 'PUT',
                    description: 'Atualizar usuário (apenas próprio perfil)',
                    auth: 'Bearer token'
                },
                delete: {
                    url: '/users/:id',
                    method: 'DELETE',
                    description: 'Deletar usuário (apenas própria conta)',
                    auth: 'Bearer token'
                }
            }
        },
        features: [
            'Autenticação JWT',
            'Rate Limiting',
            'Logs Estruturados',
            'Proteção de Rotas',
            'Validações Completas'
        ]
    });
});
// Health check
app.get('/health', async (req, res) => {
    try {
        // Testar conexão com banco
        const startTime = Date.now();
        await prisma.$queryRaw `SELECT 1`;
        const dbLatency = Date.now() - startTime;
        const health = {
            status: 'healthy',
            api: 'ok',
            database: 'ok',
            dbLatency: `${dbLatency}ms`,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: NODE_ENV,
            nodeVersion: process.version
        };
        logger_1.logger.debug('Health check realizado', 'HEALTH', health);
        res.json(health);
    }
    catch (error) {
        logger_1.logger.error('Erro no health check', 'HEALTH', error);
        res.status(503).json({
            status: 'unhealthy',
            api: 'ok',
            database: 'error',
            error: 'Falha na conexão com o banco de dados',
            timestamp: new Date().toISOString()
        });
    }
});
// Rotas de autenticação
app.use('/auth', auth_1.default);
// Rotas de usuários
app.use('/users', users_1.default);
// ============================================
// TRATAMENTO DE ERROS
// ============================================
// Rota 404 - Not Found
app.use((req, res) => {
    logger_1.logger.warn(`Rota não encontrada: ${req.method} ${req.path}`, 'HTTP');
    res.status(404).json({
        success: false,
        error: 'Rota não encontrada',
        path: req.path,
        method: req.method
    });
});
// Error handler global
app.use((err, req, res, next) => {
    logger_1.logger.error('Erro não tratado', 'ERROR', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });
    // Não expor detalhes do erro em produção
    const message = NODE_ENV === 'production'
        ? 'Erro interno do servidor'
        : err.message;
    res.status(err.status || 500).json({
        success: false,
        error: message,
        ...(NODE_ENV === 'development' && { stack: err.stack })
    });
});
// ============================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================
const server = app.listen(PORT, async () => {
    logger_1.logger.startup('🚀 Servidor iniciado', {
        port: PORT,
        environment: NODE_ENV,
        nodeVersion: process.version
    });
    // Testar conexão com banco na inicialização
    try {
        await prisma.$connect();
        logger_1.logger.startup('✅ Conectado ao banco de dados PostgreSQL');
    }
    catch (error) {
        logger_1.logger.error('❌ Falha ao conectar com o banco de dados', 'STARTUP', error);
        process.exit(1);
    }
    // Log de endpoints disponíveis
    logger_1.logger.startup('📍 Endpoints disponíveis:', {
        health: `http://localhost:${PORT}/health`,
        auth: `http://localhost:${PORT}/auth`,
        users: `http://localhost:${PORT}/users`
    });
    logger_1.logger.startup('🔒 Segurança ativada:', {
        rateLimit: 'Ativado (100 req/15min geral, 5 req/15min auth)',
        authentication: 'JWT',
        logging: 'Estruturado'
    });
});
// ============================================
// GRACEFUL SHUTDOWN
// ============================================
const gracefulShutdown = async (signal) => {
    logger_1.logger.info(`${signal} recebido, iniciando shutdown graceful...`, 'SHUTDOWN');
    // Parar de aceitar novas conexões
    server.close(async () => {
        logger_1.logger.info('Servidor HTTP fechado', 'SHUTDOWN');
        try {
            // Desconectar do banco
            await prisma.$disconnect();
            logger_1.logger.info('Desconectado do banco de dados', 'SHUTDOWN');
            logger_1.logger.info('✅ Shutdown concluído com sucesso', 'SHUTDOWN');
            process.exit(0);
        }
        catch (error) {
            logger_1.logger.error('Erro durante shutdown', 'SHUTDOWN', error);
            process.exit(1);
        }
    });
    // Forçar saída após 30 segundos
    setTimeout(() => {
        logger_1.logger.error('Shutdown forçado após timeout', 'SHUTDOWN');
        process.exit(1);
    }, 30000);
};
// Sinais de terminação
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
// Erros não tratados
process.on('unhandledRejection', (reason) => {
    logger_1.logger.error('Unhandled Promise Rejection', 'PROCESS', reason);
});
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception', 'PROCESS', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});
