import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'
import { createAndSendActivation } from '../lib/invitations'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({ adapter })

// ⚠️ À AJUSTER avant d'exécuter le script : tarifs réels par type de chambre.
// V = Ventilée, C = Climée, A = Appart
const ROOM_RATES: Record<string, { priceHourly: number; priceNightly: number }> = {
  V: { priceHourly: 1500, priceNightly: 7000 },
  C: { priceHourly: 3000, priceNightly: 15000 },
  A: { priceHourly: 4500, priceNightly: 20000 },
}

/**
 * Crée (ou récupère) un compte en attente d'activation et lui envoie
 * l'e-mail d'invitation — exactement le même flux que inviteUser() côté
 * app/actions/admin.ts, mais utilisable hors contexte de session (script).
 */
async function inviteOrSkip(email: string, name: string, role: string) {
  const existing = await prisma.user.findUnique({ where: { email } })

  if (existing) {
    console.log(`- ${role}: ${email} existe déjà (statut: ${existing.status}) — invitation non renvoyée.`)
    return existing
  }

  const created = await prisma.user.create({
    data: { email, name, role, status: 'PENDING' },
  })
  await createAndSendActivation(created.id, created.name, created.email)
  console.log(`- ${role}: invitation envoyée à ${email}`)
  return created
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL
  const dgEmail = process.env.DG_EMAIL

  if (!adminEmail || !dgEmail) {
    throw new Error(
      "ADMIN_EMAIL et DG_EMAIL doivent être définis dans .env avec de vraies adresses e-mail (les invitations y seront envoyées)."
    )
  }

  console.log('Envoi des invitations...')
  await inviteOrSkip(adminEmail, 'Administrateur', 'ADMIN')
  await inviteOrSkip(dgEmail, 'Direction Générale', 'DG')
  console.log('Chaque destinataire doit consulter sa boîte mail et suivre le lien pour activer son compte (mot de passe ou Google).')

  // Initialiser les chambres par défaut si elles n'existent pas
  const countRooms = await prisma.room.count()
  if (countRooms === 0) {
    const roomDefs = [
      ...['01','02','03','04','05','06','07','08','09'].map(num => ({ num, type: 'V', label: 'Ventilée' })),
      ...['10','11','12','13','14','15','16','17','18','19'].map(num => ({ num, type: 'C', label: 'Climée' })),
      ...['20','21','22','23','24','25','26','27','28','29'].map(num => ({ num, type: 'A', label: 'Appart' })),
    ]
    await prisma.room.createMany({
      data: roomDefs.map(r => ({ ...r, ...ROOM_RATES[r.type] })),
    })
    console.log('Chambres par défaut créées (tarifs placeholder — à vérifier dans Paramètres).')
  }

  // Initialiser les boissons par défaut si elles n'existent pas
  const countDrinks = await prisma.product.count({ where: { category: 'DRINK' } })
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
      ],
    })
    console.log('Boissons par défaut créées.')
  }

  // Initialiser les préservatifs par défaut si ils n'existent pas
  const countCondoms = await prisma.product.count({ where: { category: 'CONDOM' } })
  if (countCondoms === 0) {
    await prisma.product.createMany({
      data: [
        { name: 'Kiss', price: 300, stock: 50, category: 'CONDOM' },
      ],
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