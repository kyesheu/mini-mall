import { getCategoryList } from '@/server/services/category-service'
import { getProductBySlug } from '@/server/services/product-service'
import { ProductForm } from '@/components/product/ProductForm'
import { notFound } from 'next/navigation'

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const productId = Number(id)
  if (isNaN(productId)) notFound()

  const product = await prismaForEdit(productId)
  if (!product) notFound()

  const categories = await getCategoryList()

  const defaultValues = {
    id: product.id,
    sku: product.sku,
    name: product.name,
    slug: product.slug,
    description: product.description,
    priceCents: product.priceCents,
    imageUrls: product.imageUrls as string[],
    stock: product.stock,
    published: product.published,
    categoryId: product.categoryId,
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1A1A2E] mb-6">编辑商品</h1>
      <ProductForm categories={categories} defaultValues={defaultValues} />
    </div>
  )
}

async function prismaForEdit(id: number) {
  const { prisma } = await import('@/server/db')
  return prisma.product.findUnique({ where: { id } })
}
