export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  stock: number;
}

export type ProductCardData = Pick<Product, 'id' | 'name' | 'price' | 'category' | 'stock' | 'image'> & {
  averageRating?: number | null;
  reviewCount?: number;
};