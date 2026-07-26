/**
 * Script de remplissage — génère 2 mois d'activité réaliste (~15 clients/jour)
 * pour observer la plateforme en conditions réelles (registre, caisse, stock,
 * bilans, dashboard, occupation des chambres, alertes).
 *
 * ⚠️ Nettoie préalablement les anciennes données d'activité avant de repeupler.
 *
 * Usage : npx tsx scripts/populate_demo_data.ts
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'
import {
  computeDailyBilan,
  computeWeeklyBilan,
} from '../lib/closures'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const DEMO_PASSWORD = 'Demo@2026!'

// ─── Utilitaires ────────────────────────────────────────────────────────

function ymd(d: Date) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)]
}

function minutesToTime(mins: number) {
  const h = Math.floor(mins / 60) % 24
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function computeDuration(arrival: string, departure: string) {
  const [ah, am] = arrival.split(':').map(Number)
  const [dh, dm] = departure.split(':').map(Number)
  let mins = (dh * 60 + dm) - (ah * 60 + am)
  if (mins < 0) mins += 24 * 60
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h${String(m).padStart(2, '0')}`
}

// ─── Nettoyage préalable ────────────────────────────────────────────────

async function cleanExistingActivityData() {
  console.log('=== Nettoyage des anciennes données d\'activité ===')
  await prisma.payment.deleteMany({})
  await prisma.entryProduct.deleteMany({})
  await prisma.entry.deleteMany({})
  await prisma.stockMovement.deleteMany({})
  await prisma.cashMovement.deleteMany({})
  await prisma.closure.deleteMany({})
  await prisma.auditLog.deleteMany({})
  console.log('Anciennes données d\'activité supprimées avec succès.')
}

// ─── 1. Comptes réceptionnistes ─────────────────────────────────────────

async function ensureReceptionist(email: string, name: string) {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`- ${email} existe déjà (statut: ${existing.status}) — réutilisé tel quel.`)
    return existing
  }
  const hashed = await bcrypt.hash(DEMO_PASSWORD, 10)
  const created = await prisma.user.create({
    data: {
      email,
      name,
      role: 'RECEPTIONIST',
      password: hashed,
      authMethod: 'CREDENTIALS',
      status: 'ACTIVE',
    },
  })
  console.log(`- ${email} créé (mot de passe démo : ${DEMO_PASSWORD})`)
  return created
}

// ─── 2. Génération des séjours / caisse / stock, jour par jour ─────────

async function generateDayActivity(
  date: string,
  isToday: boolean,
  receptionists: { id: string; name: string | null }[],
  rooms: { num: string; type: string; label: string; priceHourly: number; priceNightly: number }[],
  products: { id: string; name: string; category: string; price: number }[]
) {
  const drinkProducts = products.filter((p) => p.category === 'DRINK')
  const condomProduct = products.find((p) => p.category === 'CONDOM')

  // Chambres actuellement occupées (séjours sans départ en base au début du jour)
  const occupiedEntries = await prisma.entry.findMany({
    where: { departure: null },
    select: { roomNum: true },
  })
  // Ensemble des numéros de chambre occupés — mis à jour dynamiquement pendant la génération
  const occupiedRooms = new Set<string>(occupiedEntries.map((e) => e.roomNum))

  // En moyenne 15 séjours par jour (entre 12 et 18), mais limité par le nb de chambres libres
  const targetCount = randInt(12, 18)

  let created = 0

  for (let attempt = 0; attempt < targetCount * 5 && created < targetCount; attempt++) {
    const user = pick(receptionists)
    const stayType: 'HORAIRE' | 'NUITEE' = Math.random() < 0.65 ? 'HORAIRE' : 'NUITEE'

    // Chambres disponibles : non occupées en ce moment
    const availableRooms = rooms.filter((r) => !occupiedRooms.has(r.num))
    if (availableRooms.length === 0) break // plus de chambre libre, on arrête

    const room = pick(availableRooms)

    const arrivalMinutes = randInt(7 * 60, 23 * 60) // entre 07h00 et 23h00
    const arrival = minutesToTime(arrivalMinutes)

    // Les 2 derniers séjours du jour courant sont laissés "en cours"
    const leaveOngoing = isToday && created >= targetCount - 2

    let departure: string | null = null
    let duration: string | null = null
    let roomAmount = 0

    if (stayType === 'HORAIRE') {
      const hours = randInt(1, 4)
      roomAmount = room.priceHourly * hours
      if (!leaveOngoing) {
        departure = minutesToTime(arrivalMinutes + hours * 60)
        duration = computeDuration(arrival, departure)
      }
    } else {
      const nights = randInt(1, 2)
      roomAmount = room.priceNightly * nights
      if (!leaveOngoing) {
        departure = minutesToTime(12 * 60 + randInt(-30, 15))
        duration = `${nights} nuit${nights > 1 ? 's' : ''}`
      }
    }

    // Consommations (0 à 3 boissons, préservatif parfois)
    const entryProducts: { productId: string; qty: number; price: number }[] = []
    let drinksAmount = 0
    if (Math.random() < 0.6 && drinkProducts.length > 0) {
      const nbDrinks = randInt(1, 3)
      for (let d = 0; d < nbDrinks; d++) {
        const prod = pick(drinkProducts)
        const qty = randInt(1, 2)
        entryProducts.push({ productId: prod.id, qty, price: prod.price })
        drinksAmount += prod.price * qty
      }
    }
    let condomAmount = 0
    if (Math.random() < 0.35 && condomProduct) {
      const qty = randInt(1, 2)
      entryProducts.push({ productId: condomProduct.id, qty, price: condomProduct.price })
      condomAmount += condomProduct.price * qty
    }

    const total = roomAmount + drinksAmount + condomAmount

    const entry = await prisma.entry.create({
      data: {
        date,
        receiptNo: `REC-${date.replace(/-/g, '')}-${String(created + 1).padStart(2, '0')}`,
        roomNum: room.num,
        roomType: room.type,
        roomTypeLabel: room.label,
        stayType,
        arrival,
        departure: departure ?? undefined,
        duration: duration ?? undefined,
        roomAmount,
        condomAmount,
        drinksAmount,
        total,
        userId: user.id,
      },
    })

    // Si le séjour est en cours (pas de départ), la chambre est bloquée
    if (!departure) {
      occupiedRooms.add(room.num)
    }
    // Si le séjour est clôturé, la chambre redevient libre pour les prochains séjours du jour
    // (on ne l'ajoute pas à occupiedRooms)

    // Enregistrement des paiements (source de vérité des bilans) pour les séjours clôturés
    if (!leaveOngoing && total > 0) {
      await prisma.payment.create({
        data: {
          entryId: entry.id,
          amount: total,
          date,
          userId: user.id,
        },
      })
    }

    for (const ep of entryProducts) {
      await prisma.entryProduct.create({
        data: { entryId: entry.id, productId: ep.productId, qty: ep.qty, price: ep.price },
      })
      await prisma.product.update({
        where: { id: ep.productId },
        data: { stock: { decrement: ep.qty } },
      })
      await prisma.stockMovement.create({
        data: {
          type: 'OUT',
          qty: ep.qty,
          price: ep.price,
          motif: `Conso séjour ch. ${room.num}`,
          date,
          productId: ep.productId,
          userId: user.id,
        },
      })
    }

    created++
  }

  // Mouvements de caisse
  for (const user of receptionists) {
    if (Math.random() < 0.6) {
      await prisma.cashMovement.create({
        data: {
          label: pick(['Achat glace', 'Réparation robinet ch.', 'Fourniture ménage', 'Recharge crédit tel.', 'Ampoule chambre']),
          amount: randInt(1000, 7000),
          type: 'depense',
          date,
          userId: user.id,
        },
      })
    }
    if (Math.random() < 0.4) {
      await prisma.cashMovement.create({
        data: {
          label: pick(['Vente directe boisson', 'Appoint client', 'Recette diverse']),
          amount: randInt(500, 3000),
          type: 'recette',
          date,
          userId: user.id,
        },
      })
    }
  }

  // Réapprovisionnement de stock
  if (Math.random() < 0.25) {
    const prod = pick(products)
    const qty = randInt(30, 80)
    await prisma.product.update({ where: { id: prod.id }, data: { stock: { increment: qty } } })
    await prisma.stockMovement.create({
      data: {
        type: 'IN',
        qty,
        price: prod.price,
        motif: 'Réapprovisionnement fournisseur',
        date,
        productId: prod.id,
        userId: pick(receptionists).id,
      },
    })
  }
}

// ─── 3. Programme principal ─────────────────────────────────────────────

async function main() {
  console.log('=== 1. Nettoyage et initialisation ===')
  await cleanExistingActivityData()

  console.log('\n=== 2. Comptes réceptionnistes ===')
  const existing2 = await prisma.user.findUnique({ where: { email: 'houezojuste2@gmail.com' } })
  if (!existing2) {
    throw new Error(
      "houezojuste2@gmail.com est introuvable en base. Ce compte doit déjà exister (réceptionniste existant) avant de lancer ce script."
    )
  }
  const r3 = await ensureReceptionist('houezojuste3@gmail.com', 'Réceptionniste 3')
  const r4 = await ensureReceptionist('houezojuste4@gmail.com', 'Réceptionniste 4')
  const receptionists = [existing2, r3, r4]

  console.log('\n=== 3. Chargement chambres & produits ===')
  const rooms = await prisma.room.findMany()
  const products = await prisma.product.findMany()
  if (rooms.length === 0 || products.length === 0) {
    throw new Error("Aucune chambre ou produit en base. Lance d'abord scripts/seed.ts.")
  }

  console.log('\n=== 4. Génération de 60 jours d\'activité (~15 clients/jour) ===')
  for (let i = 60; i >= 0; i--) {
    const date = ymd(daysAgo(i))
    const isToday = i === 0
    await generateDayActivity(date, isToday, receptionists, rooms, products)
    console.log(`- ${date} : activité générée${isToday ? ' (journée en cours)' : ''}`)
  }

  console.log('\n=== 5. Clôtures journalières (jours passés uniquement) ===')
  for (let i = 60; i >= 1; i--) {
    const date = ymd(daysAgo(i))
    const bilan = await computeDailyBilan(date)
    await prisma.closure.upsert({
      where: { date_type: { date, type: 'DAILY' } },
      create: {
        date,
        type: 'DAILY',
        expectedAmount: bilan.montantAttendu,
        status: 'PENDING',
      },
      update: {
        expectedAmount: bilan.montantAttendu,
      },
    })
  }
  console.log('Clôtures journalières générées.')

  console.log('\n=== 6. Clôtures hebdomadaires (semaines complètes) ===')
  const weekRefs = []
  for (let w = 8; w >= 1; w--) {
    weekRefs.push(daysAgo(w * 7))
  }
  for (const ref of weekRefs) {
    const bilan = await computeWeeklyBilan(ref)
    await prisma.closure.upsert({
      where: { date_type: { date: bilan.weekId, type: 'WEEKLY' } },
      create: {
        date: bilan.weekId,
        type: 'WEEKLY',
        expectedAmount: bilan.montantAttendu,
        status: 'PENDING',
      },
      update: {
        expectedAmount: bilan.montantAttendu,
      },
    })
  }
  console.log('Clôtures hebdomadaires générées.')

  console.log('\n=== 7. Validation des remises (bilans hebdomadaires passés) ===')
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
  const dg = await prisma.user.findFirst({ where: { role: 'DG' } })
  const validator = dg || admin
  const weeklyClosures = await prisma.closure.findMany({ where: { type: 'WEEKLY', status: 'PENDING' } })
  for (const c of weeklyClosures.slice(0, Math.max(0, weeklyClosures.length - 1))) {
    const discrepancy = Math.random() < 0.75 ? 0 : randInt(-3000, 3000)
    const handedAmount = c.expectedAmount + discrepancy
    await prisma.closure.update({
      where: { id: c.id },
      data: {
        handedAmount,
        discrepancy,
        status: 'VALIDATED',
        validatedById: validator?.id,
        comments: discrepancy !== 0 ? 'Écart constaté à la remise.' : null,
      },
    })
  }
  console.log(`${Math.max(0, weeklyClosures.length - 1)} bilan(s) hebdomadaire(s) validé(s).`)

  console.log('\n=== 8. Réduction de stock d\'alerte ===')
  await prisma.product.update({ where: { id: products[0].id }, data: { stock: 2 } })
  console.log(`Stock du produit "${products[0].name}" réduit à 2 pour l'alerte stock.`)

  console.log('\n✅ Repeuplement de 60 jours d\'activité terminé avec succès !')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })