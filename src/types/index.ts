// ============================================================
// Shared TypeScript types
// ============================================================

/** Authenticated user from getCurrentUser() */
export interface CurrentUser {
  id: number
  email: string
  name: string
  role: 'USER' | 'ADMIN'
}

/** Paginated list result */
export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  totalPages: number
}

/** Server Action return type for mutations */
export interface ActionResult {
  success?: boolean
  error?: string
  fields?: Record<string, string>
}

/** Dashboard statistics */
export interface DashboardStats {
  totalProducts: number
  publishedProducts: number
  totalOrders: number
  pendingOrders: number
  totalSalesCents: number | null
  totalUsers: number
}
