/**
 * Sistema de Erros (Documento 11 — Padrão dos Erros).
 *
 * Toda exceção possui mensagem clara, contexto e possível solução.
 * Nunca lançar erros genéricos.
 */

interface AppErrorOptions {
  /** Código estável para rastreio e tratamento programático. */
  code: string;
  /** Mensagem clara, orientada ao problema. */
  message: string;
  /** Contexto adicional (nunca dados sensíveis). */
  context?: Record<string, string | number | boolean | null | undefined>;
  /** Possível solução ou próximo passo. */
  solution?: string;
  /** Erro original, quando encapsulado. */
  cause?: unknown;
}

/** Erro base da aplicação. */
export class AppError extends Error {
  readonly code: string;
  readonly context?: AppErrorOptions["context"];
  readonly solution?: string;

  constructor({ code, message, context, solution, cause }: AppErrorOptions) {
    super(message, { cause });
    this.name = "AppError";
    this.code = code;
    this.context = context;
    this.solution = solution;
  }
}

/** Falha de validação de entrada (Zod ou regra de negócio). */
export class ValidationError extends AppError {
  constructor(options: Omit<AppErrorOptions, "code"> & { code?: string }) {
    super({ code: options.code ?? "VALIDATION_ERROR", ...options });
    this.name = "ValidationError";
  }
}

/** Recurso não encontrado. */
export class NotFoundError extends AppError {
  constructor(options: Omit<AppErrorOptions, "code"> & { code?: string }) {
    super({ code: options.code ?? "NOT_FOUND", ...options });
    this.name = "NotFoundError";
  }
}

/** Falha de configuração do ambiente (variáveis ausentes etc.). */
export class ConfigurationError extends AppError {
  constructor(options: Omit<AppErrorOptions, "code"> & { code?: string }) {
    super({ code: options.code ?? "CONFIGURATION_ERROR", ...options });
    this.name = "ConfigurationError";
  }
}

/** Type guard para erros da aplicação. */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
