"use strict";
/**
 * Sistema de Logs Estruturados
 * Suporta diferentes níveis e formatos de log
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogLevel = exports.Logger = exports.logger = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "ERROR";
    LogLevel["WARN"] = "WARN";
    LogLevel["INFO"] = "INFO";
    LogLevel["DEBUG"] = "DEBUG";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    constructor() {
        this.isDevelopment = process.env.NODE_ENV !== 'production';
    }
    /**
     * Formata o log em JSON estruturado
     */
    formatLog(entry) {
        if (this.isDevelopment) {
            // Formato legível para desenvolvimento
            const emoji = this.getEmoji(entry.level);
            const timestamp = new Date(entry.timestamp).toLocaleTimeString('pt-BR');
            let output = `${emoji} [${timestamp}] ${entry.level}`;
            if (entry.context) {
                output += ` [${entry.context}]`;
            }
            output += `: ${entry.message}`;
            if (entry.data) {
                output += `\n${JSON.stringify(entry.data, null, 2)}`;
            }
            return output;
        }
        else {
            // Formato JSON para produção (fácil parse por ferramentas)
            return JSON.stringify(entry);
        }
    }
    /**
     * Retorna emoji baseado no nível
     */
    getEmoji(level) {
        const emojis = {
            [LogLevel.ERROR]: '❌',
            [LogLevel.WARN]: '⚠️',
            [LogLevel.INFO]: 'ℹ️',
            [LogLevel.DEBUG]: '🔍'
        };
        return emojis[level] || '📝';
    }
    /**
     * Cria uma entrada de log
     */
    log(level, message, context, data) {
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context,
            data
        };
        const formatted = this.formatLog(entry);
        // Output baseado no nível
        switch (level) {
            case LogLevel.ERROR:
                console.error(formatted);
                break;
            case LogLevel.WARN:
                console.warn(formatted);
                break;
            case LogLevel.DEBUG:
                if (this.isDevelopment) {
                    console.debug(formatted);
                }
                break;
            default:
                console.log(formatted);
        }
    }
    /**
     * Log de erro
     */
    error(message, context, error) {
        const data = error ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
            ...error
        } : undefined;
        this.log(LogLevel.ERROR, message, context, data);
    }
    /**
     * Log de aviso
     */
    warn(message, context, data) {
        this.log(LogLevel.WARN, message, context, data);
    }
    /**
     * Log de informação
     */
    info(message, context, data) {
        this.log(LogLevel.INFO, message, context, data);
    }
    /**
     * Log de debug (apenas em desenvolvimento)
     */
    debug(message, context, data) {
        this.log(LogLevel.DEBUG, message, context, data);
    }
    /**
     * Log de requisição HTTP
     */
    http(method, path, statusCode, duration, userId, ip) {
        const level = statusCode >= 500 ? LogLevel.ERROR :
            statusCode >= 400 ? LogLevel.WARN :
                LogLevel.INFO;
        const message = `${method} ${path} ${statusCode} - ${duration}ms`;
        this.log(level, message, 'HTTP', {
            method,
            path,
            statusCode,
            duration,
            userId,
            ip
        });
    }
    /**
     * Log de autenticação
     */
    auth(event, email, success, ip) {
        const message = success
            ? `${event} bem-sucedido: ${email}`
            : `${event} falhou: ${email}`;
        const level = success ? LogLevel.INFO : LogLevel.WARN;
        this.log(level, message, 'AUTH', {
            event,
            email,
            success,
            ip
        });
    }
    /**
     * Log de banco de dados
     */
    database(operation, table, duration, error) {
        if (error) {
            this.error(`Database error: ${operation} on ${table}`, 'DATABASE', error);
        }
        else {
            this.debug(`Database: ${operation} on ${table}${duration ? ` (${duration}ms)` : ''}`, 'DATABASE');
        }
    }
    /**
     * Log de inicialização
     */
    startup(message, data) {
        this.info(message, 'STARTUP', data);
    }
}
exports.Logger = Logger;
// Exportar instância única
exports.logger = new Logger();
