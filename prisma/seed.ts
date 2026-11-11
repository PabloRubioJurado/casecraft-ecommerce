import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.order.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.user.deleteMany()

  console.log('🌱 Base de datos limpia. Creando categorías y productos...')

  const categories = [
    { name: 'MagSafe Compatible Cases' },
    { name: 'Ultra-Impact Rugged Cases' },
    { name: 'Eco-Friendly Biodegradable' },
    { name: 'Clear Minimalist Cases' },
    { name: 'Leather Wallet Cases' }
  ]

  for (const cat of categories) {
    await prisma.category.create({ data: cat })
  }
  
  const allCats = await prisma.category.findMany()

  let productCount = 1
  for (const cat of allCats) {
    for (let i = 1; i <= 7; i++) {
      await prisma.product.create({
        data: {
          name: `${cat.name.split(' ')[0]} Case V${i}`,
          description: `Funda premium con tecnología ${cat.name.toLowerCase()}. Diseñada para máxima durabilidad y estética.`,
          price: Math.floor(Math.random() * (45 - 15 + 1) + 15) + 0.99,
          image: `https://source.unsplash.com/random/400x400/?phone,case,${productCount}`,
          stock: Math.floor(Math.random() * 50) + 10,
          categoryId: cat.id
        }
      })
      productCount++
    }
  }

  console.log(`✅ ¡Éxito! Se han creado ${allCats.length} categorías y 35 productos.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })