'use server'

import { register as registerService, login as loginService, logout as logoutService } from '@/server/services/auth-service'
import { AppError, ValidationError } from '@/lib/errors'

export async function register(formData: FormData) {
  try {
    await registerService({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      name: formData.get('name') as string,
    })
    return { success: true }
  } catch (e) {
    if (e instanceof ValidationError) {
      return { error: e.message, fields: e.fields }
    }
    if (e instanceof AppError) {
      return { error: e.message }
    }
    throw e
  }
}

export async function login(formData: FormData) {
  try {
    await loginService({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    })
    return { success: true }
  } catch (e) {
    if (e instanceof ValidationError) {
      return { error: e.message, fields: e.fields }
    }
    if (e instanceof AppError) {
      return { error: e.message }
    }
    throw e
  }
}

export async function logout() {
  await logoutService()
}
