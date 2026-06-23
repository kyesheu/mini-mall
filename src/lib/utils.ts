/**
 * Format an integer cents value to a display currency string.
 * @example formatCurrency(19990) → "¥199.90"
 */
export function formatCurrency(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`
}

/**
 * Build pagination metadata from total count and current page.
 */
export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export function buildPagination(
  total: number,
  page: number,
  pageSize: number,
): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize) || 1,
  }
}

/**
 * Generate a URL-friendly slug from a string.
 * @example slugify("USB-C 充电线") → "usb-c-chong-dian-xian"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w一-鿿-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
