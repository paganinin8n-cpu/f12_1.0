import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

// Rotas
import usersRouter from './routes/users';
import authRouter from './routes/auth';

// Middlewares
import { requestLogger, requestId } from './middleware/logging';
import { generalLimiter } from './middleware/rateLimit';

// Logger
import { logger } from './services/logger';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================
// MIDDLEWARES GLOBAIS
// ============================================

// Request ID único para cada requisição
app.use(requestId);

// CORS
app.use(cors({
  origin: '*', // Em produção, especifique os domínios permitidos
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Rate limiting geral (100 req/15min)
app.use(generalLimiter);

// ============================================
// ROTAS
// ============================================

// Rota raiz - Informações da API
app.get('/', (req: Request, res: Response) => {
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
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Testar conexão com banco
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
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

    logger.debug('Health check realizado', 'HEALTH', health);

    res.json(health);
  } catch (error) {
    logger.error('Erro no health check', 'HEALTH', error);
    
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
app.use('/auth', authRouter);

// Rotas de usuários
app.use('/users', usersRouter);

// ============================================
// TRATAMENTO DE ERROS
// ============================================

// Rota 404 - Not Found
app.use((req: Request, res: Response) => {
  logger.warn(`Rota não encontrada: ${req.method} ${req.path}`, 'HTTP');
  
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada',
    path: req.path,
    method: req.method
  });
});

// Error handler global
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Erro não tratado', 'ERROR', {
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
  logger.startup('🚀 Servidor iniciado', {
    port: PORT,
    environment: NODE_ENV,
    nodeVersion: process.version
  });

  // Testar conexão com banco na inicialização
  try {
    await prisma.$connect();
    logger.startup('✅ Conectado ao banco de dados PostgreSQL');
  } catch (error) {
    logger.error('❌ Falha ao conectar com o banco de dados', 'STARTUP', error);
    process.exit(1);
  }

  // Log de endpoints disponíveis
  logger.startup('📍 Endpoints disponíveis:', {
    health: `http://localhost:${PORT}/health`,
    auth: `http://localhost:${PORT}/auth`,
    users: `http://localhost:${PORT}/users`
  });

  logger.startup('🔒 Segurança ativada:', {
    rateLimit: 'Ativado (100 req/15min geral, 5 req/15min auth)',
    authentication: 'JWT',
    logging: 'Estruturado'
  });
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} recebido, iniciando shutdown graceful...`, 'SHUTDOWN');

  // Parar de aceitar novas conexões
  server.close(async () => {
    logger.info('Servidor HTTP fechado', 'SHUTDOWN');

    try {
      // Desconectar do banco
      await prisma.$disconnect();
      logger.info('Desconectado do banco de dados', 'SHUTDOWN');

      logger.info('✅ Shutdown concluído com sucesso', 'SHUTDOWN');
      process.exit(0);
    } catch (error) {
      logger.error('Erro durante shutdown', 'SHUTDOWN', error);
      process.exit(1);
    }
  });

  // Forçar saída após 30 segundos
  setTimeout(() => {
    logger.error('Shutdown forçado após timeout', 'SHUTDOWN');
    process.exit(1);
  }, 30000);
};

// Sinais de terminação
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Erros não tratados
process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Promise Rejection', 'PROCESS', reason);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', 'PROCESS', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});