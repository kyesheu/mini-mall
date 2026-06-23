import { getCategoryList } from '@/server/services/category-service'
import { ProductForm } from '@/components/product/ProductForm'

export default async function NewProductPage() {
  const categories = await getCategoryList()

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1A1A2E] mb-6">新增商品</h1>
      <ProductForm categories={categories} />
    </div>
  )
}
