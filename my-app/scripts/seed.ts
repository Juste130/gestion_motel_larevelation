import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = 'admin@larevelation.com'
  const adminPassword = await bcrypt.hash('Admin@2026!', 10)
  const dgEmail = 'dg@larevelation.com'
  const dgPassword = await bcrypt.hash('Dg@2026!', 10)

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Administrateur',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  const dg = await prisma.user.upsert({
    where: { email: dgEmail },
    update: {},
    create: {
      email: dgEmail,
      name: 'Direction Générale',
      password: dgPassword,
      role: 'DG',
    },
  })

  console.log('Comptes créés avec succès:')
  console.log(`- ADMIN: ${admin.email} / Admin@2026!`)
  console.log(`- DG: ${dg.email} / Dg@2026!`)
  
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
