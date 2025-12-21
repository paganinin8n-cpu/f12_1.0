import { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger';

/**
 * Middleware de logging para todas as requisições HTTP
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Capturar quando a resposta é finalizada
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const userId = req.user?.userId;
    const ip = req.ip || req.socket.remoteAddress;

    logger.http(
      req.method,
      req.path,
      res.statusCode,
      duration,
      userId,
      ip
    );
  });

  next();
};

/**
 * Middleware para adicionar requestId único a cada requisição
 */
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.headers['x-request-id'] = id;
  res.setHeader('X-Request-Id', id);
  next();
};