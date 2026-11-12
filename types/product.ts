// types/product.ts
// El id es numérico porque en prisma/schema.prisma es `Int @id @default(autoincrement())`.
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  stock: number;
}

export type ProductCardData = Pick<Product, 'id' | 'name' | 'price' | 'category' | 'stock'>;
