import { SignJWT, jwtVerify } from 'jose'

const secretStr = process.env.JWT_SECRET
if (!secretStr) {
  throw new Error('JWT_SECRET environment variable is required')
}
const JWT_SECRET = new TextEncoder().encode(secretStr)

const TOKEN_EXPIRATION = '7d'

interface TokenPayload {
  sub: string
  role: 'USER' | 'ADMIN'
}

export async function signToken(userId: number, role: 'USER' | 'ADMIN'): Promise<string> {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(userId))
    .setExpirationTime(TOKEN_EXPIRATION)
    .setIssuedAt()
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<{ userId: number; role: 'USER' | 'ADMIN' }> {
  const { payload } = await jwtVerify(token, JWT_SECRET)
  return {
    userId: Number(payload.sub),
    role: (payload.role as 'USER' | 'ADMIN'),
  }
}

export { JWT_SECRET }
