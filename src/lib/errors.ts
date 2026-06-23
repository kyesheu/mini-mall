/**
 * Application error class hierarchy.
 * Services throw these; Actions/API Routes catch and convert to responses.
 */

export class AppError extends Error {
  statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.name = 'AppError'
  }
}

/** 422 — Zod validation / business rule validation failure */
export class ValidationError extends AppError {
  fields: Record<string, string>

  constructor(message: string, fields: Record<string, string> = {}) {
    super(message, 422)
    this.name = 'ValidationError'
    this.fields = fields
  }
}

/** 404 — Resource not found */
export class NotFoundError extends AppError {
  constructor(message = '资源不存在') {
    super(message, 404)
    this.name = 'NotFoundError'
  }
}

/** 401 — Not authenticated */
export class UnauthorizedError extends AppError {
  constructor(message = '请先登录') {
    super(message, 401)
    this.name = 'UnauthorizedError'
  }
}

/** 403 — Authenticated but not authorized */
export class ForbiddenError extends AppError {
  constructor(message = '权限不足') {
    super(message, 403)
    this.name = 'ForbiddenError'
  }
}

/** 409 — Conflict (e.g. stock insufficient, duplicate) */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409)
    this.name = 'ConflictError'
  }
}
