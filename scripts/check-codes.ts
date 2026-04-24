import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const products = await prisma.product.findMany({
    select: { code: true }
  })
  console.log(products.map(p => p.code))
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
