import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const adapter = new PrismaBetterSqlite3({ url: './dev.db' })
const prisma = new PrismaClient({ adapter })

async function main() {
  const adminEmail = 'direction@larevelation.com'
  const adminPassword = await bcrypt.hash('1234', 10)

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Direction Générale',
      password: adminPassword,
      role: 'DG',
    },
  })

  console.log('Utilisateur admin (DG) créé avec succès:', admin.email)
  
  // Initialiser les chambres par défaut si elles n'existent pas
  const countRooms = await prisma.room.count();
  if (countRooms === 0) {
    await prisma.room.createMany({
      data: [
        { num: '01', type: 'V', label: 'VIP' },
        { num: '02', type: 'C', label: 'Confort' },
        { num: '03', type: 'C', label: 'Confort' },
        { num: '04', type: 'A', label: 'Appart' },
        { num: '05', type: 'C', label: 'Confort' },
        { num: '06', type: 'V', label: 'VIP' },
      ]
    })
    console.log('Chambres par défaut créées.')
  }

  // Initialiser les boissons par défaut si elles n'existent pas
  const countDrinks = await prisma.product.count({ where: { category: 'DRINK' } });
  if (countDrinks === 0) {
    await prisma.product.createMany({
      data: [
        { name: 'Flag', price: 700, stock: 50, category: 'DRINK' },
        { name: 'Doppel Noir', price: 700, stock: 50, category: 'DRINK' },
        { name: 'Kankpé', price: 700, stock: 50, category: 'DRINK' },
        { name: 'LB 60cl', price: 700, stock: 50, category: 'DRINK' },
        { name: 'BF 60cl', price: 700, stock: 50, category: 'DRINK' },
        { name: 'Chill 60cl', price: 700, stock: 50, category: 'DRINK' },
        { name: 'Sucrerie', price: 600, stock: 50, category: 'DRINK' },
        { name: 'Fifa', price: 600, stock: 50, category: 'DRINK' },
        { name: 'Heineken', price: 1000, stock: 50, category: 'DRINK' },
      ]
    })
    console.log('Boissons par défaut créées.')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
