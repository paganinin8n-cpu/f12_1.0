/**
 * Sistema de Logs Estruturados
 * Suporta diferentes níveis e formatos de log
 */

enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  userId?: number;
  requestId?: string;
  ip?: string;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  /**
   * Formata o log em JSON estruturado
   */
  private formatLog(entry: LogEntry): string {
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
    } else {
      // Formato JSON para produção (fácil parse por ferramentas)
      return JSON.stringify(entry);
    }
  }

  /**
   * Retorna emoji baseado no nível
   */
  private getEmoji(level: LogLevel): string {
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
  private log(level: LogLevel, message: string, context?: string, data?: any) {
    const entry: LogEntry = {
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
  error(message: string, context?: string, error?: any) {
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
  warn(message: string, context?: string, data?: any) {
    this.log(LogLevel.WARN, message, context, data);
  }

  /**
   * Log de informação
   */
  info(message: string, context?: string, data?: any) {
    this.log(LogLevel.INFO, message, context, data);
  }

  /**
   * Log de debug (apenas em desenvolvimento)
   */
  debug(message: string, context?: string, data?: any) {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  /**
   * Log de requisição HTTP
   */
  http(method: string, path: string, statusCode: number, duration: number, userId?: number, ip?: string) {
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
  auth(event: 'login' | 'register' | 'logout' | 'failed', email: string, success: boolean, ip?: string) {
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
  database(operation: string, table: string, duration?: number, error?: any) {
    if (error) {
      this.error(`Database error: ${operation} on ${table}`, 'DATABASE', error);
    } else {
      this.debug(`Database: ${operation} on ${table}${duration ? ` (${duration}ms)` : ''}`, 'DATABASE');
    }
  }

  /**
   * Log de inicialização
   */
  startup(message: string, data?: any) {
    this.info(message, 'STARTUP', data);
  }
}

// Exportar instância única
export const logger = new Logger();

// Exportar também a classe para testes
export { Logger, LogLevel };