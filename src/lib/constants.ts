/** Default items per page for product listing */
export const PAGE_SIZE = 12

/** Maximum quantity per cart item */
export const CART_QUANTITY_MIN = 1
export const CART_QUANTITY_MAX = 99

/** Maximum number of product images */
export const PRODUCT_IMAGE_MAX = 6

/** Order status display labels (Chinese) */
export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: '待支付',
  PAID: '已支付',
  SHIPPED: '已发货',
  DELIVERED: '已签收',
  CANCELLED: '已取消',
}

/** User role display labels (Chinese) */
export const ROLE_LABELS: Record<string, string> = {
  USER: '普通用户',
  ADMIN: '管理员',
}

/** Order status transition map — which target statuses are allowed from each source */
export const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['PAID', 'CANCELLED'],
  PAID: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
}
