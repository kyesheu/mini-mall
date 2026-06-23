import { z } from 'zod'
import { CART_QUANTITY_MIN, CART_QUANTITY_MAX, PRODUCT_IMAGE_MAX } from '@/lib/constants'

// ============================================================
// Auth
// ============================================================

export const registerSchema = z.object({
  email: z
    .string({ message: '请输入邮箱' })
    .email('邮箱格式不正确'),
  password: z
    .string({ message: '请输入密码' })
    .min(6, '密码至少 6 位')
    .max(100, '密码最多 100 位'),
  name: z
    .string({ message: '请输入昵称' })
    .min(1, '昵称不能为空')
    .max(50, '昵称最多 50 字'),
})

export const loginSchema = z.object({
  email: z
    .string({ message: '请输入邮箱' })
    .email('邮箱格式不正确'),
  password: z
    .string({ message: '请输入密码' })
    .min(1, '请输入密码'),
})

// ============================================================
// Product
// ============================================================

export const productCreateSchema = z.object({
  sku: z
    .string({ message: '请输入 SKU' })
    .min(1, 'SKU 不能为空')
    .max(50, 'SKU 最多 50 字'),
  name: z
    .string({ message: '请输入商品名称' })
    .min(1, '商品名称不能为空')
    .max(200, '商品名称最多 200 字'),
  description: z
    .string({ message: '请输入商品描述' })
    .min(1, '商品描述不能为空'),
  priceCents: z
    .number({ message: '请输入价格' })
    .int('价格必须是整数（分）')
    .min(1, '价格必须大于 0'),
  imageUrls: z
    .array(z.string().url('图片 URL 格式不正确'))
    .max(PRODUCT_IMAGE_MAX, `最多 ${PRODUCT_IMAGE_MAX} 张图片`)
    .default([]),
  stock: z
    .number({ message: '请输入库存' })
    .int('库存必须是整数')
    .min(0, '库存不能为负数')
    .default(0),
  published: z.boolean().default(false),
  categoryId: z
    .number({ message: '请选择分类' })
    .int('分类 ID 必须是整数')
    .positive('分类 ID 必须大于 0')
    .nullable()
    .optional(),
})

export const productUpdateSchema = productCreateSchema.partial()

// ============================================================
// Category
// ============================================================

export const categoryCreateSchema = z.object({
  name: z
    .string({ message: '请输入分类名称' })
    .min(1, '分类名称不能为空')
    .max(50, '分类名称最多 50 字'),
  slug: z
    .string({ message: '请输入分类 slug' })
    .min(1, 'slug 不能为空')
    .max(50, 'slug 最多 50 字')
    .regex(/^[a-z0-9-]+$/, 'slug 只能包含小写字母、数字和连字符'),
  description: z
    .string()
    .max(500, '描述最多 500 字')
    .optional()
    .nullable(),
})

export const categoryUpdateSchema = categoryCreateSchema.partial()

// ============================================================
// Cart
// ============================================================

export const cartQuantitySchema = z
  .number({ message: '请输入数量' })
  .int('数量必须是整数')
  .min(CART_QUANTITY_MIN, `数量最少 ${CART_QUANTITY_MIN}`)
  .max(CART_QUANTITY_MAX, `数量最多 ${CART_QUANTITY_MAX}`)

export const addToCartSchema = z.object({
  productId: z
    .number({ message: '商品 ID 缺失' })
    .int('商品 ID 必须是整数')
    .positive('商品 ID 必须大于 0'),
  quantity: cartQuantitySchema,
})

// ============================================================
// Order
// ============================================================

export const createOrderSchema = z.object({
  receiverName: z
    .string({ message: '请输入收货人姓名' })
    .min(1, '收货人姓名不能为空')
    .max(50, '收货人姓名最多 50 字'),
  receiverPhone: z
    .string({ message: '请输入收货人电话' })
    .min(1, '收货人电话不能为空')
    .max(20, '收货人电话最多 20 字')
    .regex(/^[\d\-+() ]+$/, '电话号码格式不正确'),
  shippingAddress: z
    .string({ message: '请输入收货地址' })
    .min(1, '收货地址不能为空')
    .max(200, '收货地址最多 200 字'),
})

// ============================================================
// Admin
// ============================================================

export const orderStatusUpdateSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'], {
    message: '无效的订单状态',
  }),
})

// ============================================================
// Inferred types
// ============================================================

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ProductCreateInput = z.infer<typeof productCreateSchema>
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>
export type AddToCartInput = z.infer<typeof addToCartSchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>
