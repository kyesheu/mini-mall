import { cookies } from 'next/headers'
import { prisma } from '@/server/db'
import { signToken } from '@/server/auth/jwt'
import { hashPassword, verifyPassword } from '@/server/auth/password'
import { AUTH_COOKIE } from '@/server/auth/session'
import { registerSchema, loginSchema } from '@/lib/validations'
import { ValidationError, ConflictError, UnauthorizedError } from '@/lib/errors'
import type { RegisterInput, LoginInput } from '@/lib/validations'

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
}

async function setAuthCookie(userId: number, role: 'USER' | 'ADMIN') {
  const token = await signToken(userId, role)
  const cookieStore = await cookies()
  cookieStore.set(AUTH_COOKIE, token, COOKIE_OPTIONS)
}

export async function register(input: RegisterInput) {
  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) {
    const fields: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.')
      fields[key] = issue.message
    }
    throw new ValidationError('注册信息校验失败', fields)
  }

  const { email, password, name } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw new ConflictError('该邮箱已被注册')
  }

  const hashed = await hashPassword(password)
  const user = await prisma.user.create({
    data: { email, password: hashed, name },
    select: { id: true, email: true, name: true, role: true },
  })

  await setAuthCookie(user.id, user.role)

  return user
}

export async function login(input: LoginInput) {
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) {
    const fields: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.')
      fields[key] = issue.message
    }
    throw new ValidationError('登录信息校验失败', fields)
  }

  const { email, password } = parsed.data

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true, password: true },
  })
  if (!user) {
    throw new UnauthorizedError('邮箱或密码错误')
  }

  const valid = await verifyPassword(password, user.password)
  if (!valid) {
    throw new UnauthorizedError('邮箱或密码错误')
  }

  await setAuthCookie(user.id, user.role)

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as 'USER' | 'ADMIN',
  }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.set(AUTH_COOKIE, '', { ...COOKIE_OPTIONS, maxAge: 0 })
}
