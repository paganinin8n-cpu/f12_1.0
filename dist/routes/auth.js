"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../middleware/auth");
const rateLimit_1 = require("../middleware/rateLimit");
const logger_1 = require("../services/logger");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'seu-secret-super-seguro-aqui-12345';
const JWT_EXPIRES_IN = '7d';
/**
 * REGISTER
 * POST /auth/register
 * Rate Limited: 5 tentativas por 15 minutos
 */
router.post('/register', rateLimit_1.authLimiter, async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const ip = req.ip || req.socket.remoteAddress;
        // Validação de campos obrigatórios
        if (!email || !password || !name) {
            logger_1.logger.warn('Tentativa de registro sem dados completos', 'AUTH', { email, ip });
            return res.status(400).json({
                success: false,
                error: 'Email, senha e nome são obrigatórios'
            });
        }
        // Validação de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            logger_1.logger.warn(`Tentativa de registro com email inválido: ${email}`, 'AUTH', { ip });
            return res.status(400).json({
                success: false,
                error: 'Email inválido'
            });
        }
        // Validação de senha (mínimo 6 caracteres)
        if (password.length < 6) {
            logger_1.logger.warn('Tentativa de registro com senha fraca', 'AUTH', { email, ip });
            return res.status(400).json({
                success: false,
                error: 'Senha deve ter no mínimo 6 caracteres'
            });
        }
        // Verificar se email já existe
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            logger_1.logger.auth('register', email, false, ip);
            return res.status(409).json({
                success: false,
                error: 'Email já cadastrado'
            });
        }
        // Hash da senha
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Criar usuário
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true
            }
        });
        // Gerar token JWT
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        logger_1.logger.auth('register', email, true, ip);
        logger_1.logger.info(`Novo usuário registrado: ${email} (ID: ${user.id})`, 'AUTH');
        res.status(201).json({
            success: true,
            message: 'Usuário registrado com sucesso',
            data: {
                user,
                token
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Erro ao registrar usuário', 'AUTH', error);
        // Tratamento específico de erro de duplicação do Prisma
        if (error.code === 'P2002') {
            return res.status(409).json({
                success: false,
                error: 'Email já cadastrado'
            });
        }
        res.status(500).json({
            success: false,
            error: 'Erro ao registrar usuário'
        });
    }
});
/**
 * LOGIN
 * POST /auth/login
 * Rate Limited: 5 tentativas por 15 minutos
 */
router.post('/login', rateLimit_1.authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        const ip = req.ip || req.socket.remoteAddress;
        // Validação de campos obrigatórios
        if (!email || !password) {
            logger_1.logger.warn('Tentativa de login sem credenciais completas', 'AUTH', { ip });
            return res.status(400).json({
                success: false,
                error: 'Email e senha são obrigatórios'
            });
        }
        // Buscar usuário com senha
        const user = await prisma.user.findUnique({
            where: { email }
        });
        // Verificar se usuário existe
        if (!user) {
            logger_1.logger.auth('login', email, false, ip);
            return res.status(401).json({
                success: false,
                error: 'Email ou senha inválidos'
            });
        }
        // Verificar se o usuário tem senha cadastrada
        if (!user.password) {
            logger_1.logger.warn(`Usuário sem senha tentou fazer login: ${email}`, 'AUTH', { ip });
            return res.status(401).json({
                success: false,
                error: 'Usuário sem senha cadastrada. Use o registro.'
            });
        }
        // Verificar senha
        const passwordMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!passwordMatch) {
            logger_1.logger.auth('login', email, false, ip);
            return res.status(401).json({
                success: false,
                error: 'Email ou senha inválidos'
            });
        }
        // Gerar token JWT
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        logger_1.logger.auth('login', email, true, ip);
        res.json({
            success: true,
            message: 'Login realizado com sucesso',
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    createdAt: user.createdAt
                },
                token
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Erro ao fazer login', 'AUTH', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao fazer login'
        });
    }
});
/**
 * GET USER INFO (Authenticated)
 * GET /auth/me
 * Headers: Authorization: Bearer <token>
 */
router.get('/me', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        // Buscar usuário
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                updatedAt: true
            }
        });
        if (!user) {
            logger_1.logger.warn(`Usuário autenticado não encontrado no banco: ID ${userId}`, 'AUTH');
            return res.status(404).json({
                success: false,
                error: 'Usuário não encontrado'
            });
        }
        logger_1.logger.debug(`Dados do usuário acessados: ${user.email}`, 'AUTH');
        res.json({
            success: true,
            data: user
        });
    }
    catch (error) {
        logger_1.logger.error('Erro ao obter dados do usuário', 'AUTH', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao obter dados do usuário'
        });
    }
});
/**
 * LOGOUT (Authenticated)
 * POST /auth/logout
 * Nota: Como JWT é stateless, o logout é feito no client removendo o token
 * Este endpoint serve apenas para logging e possível invalidação futura
 */
router.post('/logout', auth_1.authenticate, async (req, res) => {
    try {
        const email = req.user.email;
        const ip = req.ip || req.socket.remoteAddress;
        logger_1.logger.auth('logout', email, true, ip);
        res.json({
            success: true,
            message: 'Logout realizado com sucesso'
        });
    }
    catch (error) {
        logger_1.logger.error('Erro ao fazer logout', 'AUTH', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao fazer logout'
        });
    }
});
exports.default = router;
