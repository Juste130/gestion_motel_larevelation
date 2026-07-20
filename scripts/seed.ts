import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@larevelation.com'
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@2026!', 10)
  const dgEmail = process.env.DG_EMAIL || 'dg@larevelation.com'
  const dgPassword = await bcrypt.hash(process.env.DG_PASSWORD || 'Dg@2026!', 10)

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
        { num: '01', type: 'V', label: 'Ventilée' },
        { num: '02', type: 'V', label: 'Ventilée' },
        { num: '03', type: 'V', label: 'Ventilée' },
        { num: '04', type: 'V', label: 'Ventilée' },
        { num: '05', type: 'V', label: 'Ventilée' },
        { num: '06', type: 'V', label: 'Ventilée' },
        { num: '07', type: 'V', label: 'Ventilée' },
        { num: '08', type: 'V', label: 'Ventilée' },
        { num: '09', type: 'V', label: 'Ventilée' },
        { num: '10', type: 'C', label: 'Climée' },
        { num: '11', type: 'C', label: 'Climée' },
        { num: '12', type: 'C', label: 'Climée' },
        { num: '13', type: 'C', label: 'Climée' },
        { num: '14', type: 'C', label: 'Climée' },
        { num: '15', type: 'C', label: 'Climée' },
        { num: '16', type: 'C', label: 'Climée' },
        { num: '17', type: 'C', label: 'Climée' },
        { num: '18', type: 'C', label: 'Climée' },
        { num: '19', type: 'C', label: 'Climée' },
        { num: '20', type: 'A', label: 'Appart' },
        { num: '21', type: 'A', label: 'Appart' },
        { num: '22', type: 'A', label: 'Appart' },
        { num: '23', type: 'A', label: 'Appart' },
        { num: '24', type: 'A', label: 'Appart' },
        { num: '25', type: 'A', label: 'Appart' },
        { num: '26', type: 'A', label: 'Appart' },
        { num: '27', type: 'A', label: 'Appart' },
        { num: '28', type: 'A', label: 'Appart' },
        { num: '29', type: 'A', label: 'Appart' },
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
        { name: 'La Béninoise 60cl', price: 700, stock: 50, category: 'DRINK' },
        { name: 'Beaufort 60cl', price: 700, stock: 50, category: 'DRINK' },
        { name: 'Chill 60cl', price: 700, stock: 50, category: 'DRINK' },
        { name: 'Sucrerie', price: 600, stock: 50, category: 'DRINK' },
        { name: 'Fifa', price: 600, stock: 50, category: 'DRINK' },
        { name: 'Heineken', price: 1000, stock: 50, category: 'DRINK' },
      ]
    })
    console.log('Boissons par défaut créées.')
  }
  // Initialiser les préservatifs par défaut si ils n'existent pas
  const countCondoms = await prisma.product.count({ where: { category: 'CONDOM' } });
  if (countCondoms === 0) {
    await prisma.product.createMany({
      data: [
        { name: 'Kiss', price: 300, stock: 50, category: 'CONDOM' },
      ]
    })
    console.log('Préservatifs par défaut créés.')
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
