"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const rateLimit_1 = require("../middleware/rateLimit");
const logger_1 = require("../services/logger");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// GET /users - Listar todos os usuários (autenticação opcional)
router.get('/', auth_1.optionalAuth, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        logger_1.logger.info(`Listados ${users.length} usuários`, 'USERS', {
            count: users.length,
            requestedBy: req.user?.userId
        });
        res.json({
            success: true,
            data: users,
            count: users.length
        });
    }
    catch (error) {
        logger_1.logger.error('Erro ao buscar usuários', 'USERS', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar usuários'
        });
    }
});
// GET /users/:id - Buscar usuário por ID (público)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                updatedAt: true
            }
        });
        if (!user) {
            logger_1.logger.warn(`Usuário não encontrado: ID ${id}`, 'USERS');
            return res.status(404).json({
                success: false,
                error: 'Usuário não encontrado'
            });
        }
        logger_1.logger.debug(`Usuário encontrado: ${user.email}`, 'USERS');
        res.json({
            success: true,
            data: user
        });
    }
    catch (error) {
        logger_1.logger.error('Erro ao buscar usuário', 'USERS', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar usuário'
        });
    }
});
// POST /users - Criar novo usuário (rate limited)
router.post('/', rateLimit_1.createLimiter, async (req, res) => {
    try {
        const { name, email } = req.body;
        // Validação básica
        if (!name || !email) {
            logger_1.logger.warn('Tentativa de criar usuário sem dados completos', 'USERS');
            return res.status(400).json({
                success: false,
                error: 'Nome e email são obrigatórios'
            });
        }
        // Validação de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            logger_1.logger.warn(`Email inválido fornecido: ${email}`, 'USERS');
            return res.status(400).json({
                success: false,
                error: 'Email inválido'
            });
        }
        // Verificar se email já existe
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            logger_1.logger.warn(`Tentativa de criar usuário com email duplicado: ${email}`, 'USERS');
            return res.status(409).json({
                success: false,
                error: 'Email já cadastrado'
            });
        }
        // Criar usuário
        const user = await prisma.user.create({
            data: {
                name,
                email
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                updatedAt: true
            }
        });
        logger_1.logger.info(`Usuário criado: ${user.email} (ID: ${user.id})`, 'USERS');
        res.status(201).json({
            success: true,
            data: user,
            message: 'Usuário criado com sucesso'
        });
    }
    catch (error) {
        logger_1.logger.error('Erro ao criar usuário', 'USERS', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao criar usuário'
        });
    }
});
// PUT /users/:id - Atualizar usuário (PROTEGIDO - apenas próprio usuário ou admin)
router.put('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email } = req.body;
        const userId = parseInt(id);
        // Verificar se usuário está tentando atualizar próprio perfil
        if (req.user.userId !== userId) {
            logger_1.logger.warn(`Usuário ${req.user.userId} tentou atualizar perfil de outro usuário (${userId})`, 'USERS');
            return res.status(403).json({
                success: false,
                error: 'Você só pode atualizar seu próprio perfil'
            });
        }
        // Verificar se usuário existe
        const existingUser = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!existingUser) {
            logger_1.logger.warn(`Usuário não encontrado para atualização: ID ${userId}`, 'USERS');
            return res.status(404).json({
                success: false,
                error: 'Usuário não encontrado'
            });
        }
        // Validação de email se fornecido
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    error: 'Email inválido'
                });
            }
            // Verificar se email já existe em outro usuário
            const emailExists = await prisma.user.findFirst({
                where: {
                    email,
                    NOT: { id: userId }
                }
            });
            if (emailExists) {
                logger_1.logger.warn(`Tentativa de usar email já cadastrado: ${email}`, 'USERS');
                return res.status(409).json({
                    success: false,
                    error: 'Email já cadastrado'
                });
            }
        }
        // Atualizar usuário
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(name && { name }),
                ...(email && { email })
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                updatedAt: true
            }
        });
        logger_1.logger.info(`Usuário atualizado: ${user.email} (ID: ${user.id})`, 'USERS');
        res.json({
            success: true,
            data: user,
            message: 'Usuário atualizado com sucesso'
        });
    }
    catch (error) {
        logger_1.logger.error('Erro ao atualizar usuário', 'USERS', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao atualizar usuário'
        });
    }
});
// DELETE /users/:id - Deletar usuário (PROTEGIDO - apenas próprio usuário)
router.delete('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = parseInt(id);
        // Verificar se usuário está tentando deletar própria conta
        if (req.user.userId !== userId) {
            logger_1.logger.warn(`Usuário ${req.user.userId} tentou deletar conta de outro usuário (${userId})`, 'USERS');
            return res.status(403).json({
                success: false,
                error: 'Você só pode deletar sua própria conta'
            });
        }
        // Verificar se usuário existe
        const existingUser = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                error: 'Usuário não encontrado'
            });
        }
        // Deletar usuário
        await prisma.user.delete({
            where: { id: userId }
        });
        logger_1.logger.info(`Usuário deletado: ${existingUser.email} (ID: ${userId})`, 'USERS');
        res.json({
            success: true,
            message: 'Usuário deletado com sucesso'
        });
    }
    catch (error) {
        logger_1.logger.error('Erro ao deletar usuário', 'USERS', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao deletar usuário'
        });
    }
});
exports.default = router;
