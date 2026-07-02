/**
 * Sistema de Logs (Documento 11 — Padrão dos Logs).
 *
 * Registra erros, avisos e ações importantes.
 * NUNCA registrar informações sensíveis do aluno (saúde, psicologia,
 * finanças) — apenas identificadores e metadados técnicos.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: string | number | boolean | null | undefined;
}

const levelPriority: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const minimumLevel: LogLevel = process.env.NODE_ENV === "production" ? "info" : "debug";

function log(level: LogLevel, message: string, context?: LogContext) {
  if (levelPriority[level] < levelPriority[minimumLevel]) return;

  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  switch (level) {
    case "error":
      console.error(JSON.stringify(entry));
      break;
    case "warn":
      console.warn(JSON.stringify(entry));
      break;
    default:
      console.log(JSON.stringify(entry));
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => log("debug", message, context),
  info: (message: string, context?: LogContext) => log("info", message, context),
  warn: (message: string, context?: LogContext) => log("warn", message, context),
  error: (message: string, context?: LogContext) => log("error", message, context),
};
