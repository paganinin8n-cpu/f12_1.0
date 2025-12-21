"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'seu-secret-super-seguro-aqui-12345';
/**
 * Middleware de Autenticação
 * Verifica se o token JWT é válido e adiciona os dados do usuário ao request
 */
const authenticate = async (req, res, next) => {
    try {
        // Pegar token do header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Token não fornecido'
            });
        }
        const token = authHeader.substring(7); // Remove "Bearer "
        // Verificar token
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        }
        catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    error: 'Token expirado'
                });
            }
            return res.status(401).json({
                success: false,
                error: 'Token inválido'
            });
        }
        // Verificar se o usuário ainda existe
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId }
        });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Usuário não encontrado'
            });
        }
        // Adicionar dados do usuário ao request
        req.user = {
            userId: decoded.userId,
            email: decoded.email
        };
        next();
    }
    catch (error) {
        console.error('Erro no middleware de autenticação:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao verificar autenticação'
        });
    }
};
exports.authenticate = authenticate;
/**
 * Middleware Opcional de Autenticação
 * Se o token for fornecido, valida e adiciona ao request
 * Se não for fornecido, continua sem autenticação
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(); // Sem token, continua sem autenticação
        }
        const token = authHeader.substring(7);
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            req.user = {
                userId: decoded.userId,
                email: decoded.email
            };
        }
        catch (error) {
            // Token inválido, mas não bloqueia a requisição
            console.warn('Token inválido em autenticação opcional:', error);
        }
        next();
    }
    catch (error) {
        console.error('Erro no middleware de autenticação opcional:', error);
        next();
    }
};
exports.optionalAuth = optionalAuth;
