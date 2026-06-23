import { cookies } from 'next/headers'
import { verifyToken } from '@/server/auth/jwt'
import { prisma } from '@/server/db'
import type { CurrentUser } from '@/types'

const AUTH_COOKIE = 'token'

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE)?.value
  if (!token) return null

  try {
    const { userId } = await verifyToken(token)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true },
    })
    if (!user) return null
    return user as CurrentUser
  } catch {
    return null
  }
}

export { AUTH_COOKIE }
