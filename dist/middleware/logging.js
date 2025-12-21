"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestId = exports.requestLogger = void 0;
const logger_1 = require("../services/logger");
/**
 * Middleware de logging para todas as requisições HTTP
 */
const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    // Capturar quando a resposta é finalizada
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const userId = req.user?.userId;
        const ip = req.ip || req.socket.remoteAddress;
        logger_1.logger.http(req.method, req.path, res.statusCode, duration, userId, ip);
    });
    next();
};
exports.requestLogger = requestLogger;
/**
 * Middleware para adicionar requestId único a cada requisição
 */
const requestId = (req, res, next) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    req.headers['x-request-id'] = id;
    res.setHeader('X-Request-Id', id);
    next();
};
exports.requestId = requestId;
