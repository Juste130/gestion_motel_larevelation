// Logique de clôture automatique (journalière et hebdomadaire).
// Import volontairement RELATIF (pas "@/lib/prisma") : ce module est aussi
// importé directement par les fonctions planifiées Netlify (netlify/functions/*),
// qui ne résolvent pas les alias TypeScript "@/..." lors du bundling.
import { prisma } from "./prisma"

function ymd(d: Date) {
  return d.toISOString().slice(0, 10)
}

// Identifiant de semaine ISO, ex: "2026-W29"
function isoWeekId(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`
}

// Bornes lundi->dimanche de la semaine contenant `d`
function weekRange(d: Date) {
  const day = d.getUTCDay() || 7
  const monday = new Date(d)
  monday.setUTCDate(d.getUTCDate() - day + 1)
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)
  return { start: ymd(monday), end: ymd(sunday) }
}

/**
 * Aperçu EN DIRECT du jour en cours pour un réceptionniste.
 * Ne crée rien en base — c'est un calcul à la volée sur les mouvements
 * pas encore clôturés (closureId: null) du jour même.
 */
export async function computeLiveDailySnapshot(userId: string, date: string) {
  const [entries, cashMovements] = await Promise.all([
    prisma.entry.findMany({ where: { closureId: null, userId, date } }),
    prisma.cashMovement.findMany({ where: { closureId: null, userId, date } }),
  ])

  const entryTotal = entries.reduce((s, e) => s + e.total, 0)
  const recettes = cashMovements.filter(m => m.type === "recette").reduce((s, m) => s + m.amount, 0)
  const depenses = cashMovements.filter(m => m.type === "depense").reduce((s, m) => s + m.amount, 0)

  return {
    date,
    entriesCount: entries.length,
    movementsCount: cashMovements.length,
    entryTotal,
    recettes,
    depenses,
    expectedAmount: entryTotal + recettes - depenses,
  }
}

/**
 * Clôture DÉFINITIVE d'une journée pour un réceptionniste : verrouille tous ses
 * mouvements non clôturés de `date` dans un Closure de type DAILY.
 * Idempotent : si un DAILY existe déjà pour ce (userId, date), il est retourné
 * tel quel sans rien recréer (protégé aussi par la contrainte unique en base).
 * Retourne `null` si rien à clôturer (aucun mouvement ce jour-là).
 */
export async function generateDailyClosureForUser(userId: string, date: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.closure.findFirst({ where: { userId, date, type: "DAILY" } })
    if (existing) return existing

    const [entries, cashMovements] = await Promise.all([
      tx.entry.findMany({ where: { closureId: null, userId, date } }),
      tx.cashMovement.findMany({ where: { closureId: null, userId, date } }),
    ])

    if (entries.length === 0 && cashMovements.length === 0) return null

    const entryTotal = entries.reduce((s, e) => s + e.total, 0)
    const recettes = cashMovements.filter(m => m.type === "recette").reduce((s, m) => s + m.amount, 0)
    const depenses = cashMovements.filter(m => m.type === "depense").reduce((s, m) => s + m.amount, 0)
    const expectedAmount = entryTotal + recettes - depenses

    const closure = await tx.closure.create({
      data: { date, type: "DAILY", userId, expectedAmount },
    })

    if (entries.length > 0) {
      await tx.entry.updateMany({
        where: { id: { in: entries.map(e => e.id) } },
        data: { closureId: closure.id },
      })
    }
    if (cashMovements.length > 0) {
      await tx.cashMovement.updateMany({
        where: { id: { in: cashMovements.map(m => m.id) } },
        data: { closureId: closure.id },
      })
    }

    return closure
  })
}

/**
 * Clôture hebdomadaire pour un réceptionniste : agrège les Closures DAILY déjà
 * générées dans la semaine (lundi->dimanche) contenant `referenceDate`.
 * N'endommage jamais les Entry/CashMovement : elle re-somme des DAILY déjà
 * verrouillées, elle ne "vole" jamais un mouvement à un autre bilan.
 * Idempotent comme la version journalière.
 */
export async function generateWeeklyClosureForUser(userId: string, referenceDate: Date) {
  const { start, end } = weekRange(referenceDate)
  const weekId = isoWeekId(referenceDate)

  return prisma.$transaction(async (tx) => {
    const existing = await tx.closure.findFirst({ where: { userId, date: weekId, type: "WEEKLY" } })
    if (existing) return existing

    const dailyClosures = await tx.closure.findMany({
      where: { userId, type: "DAILY", date: { gte: start, lte: end } },
    })
    if (dailyClosures.length === 0) return null

    const expectedAmount = dailyClosures.reduce((s, c) => s + c.expectedAmount, 0)

    return tx.closure.create({
      data: { date: weekId, type: "WEEKLY", userId, expectedAmount },
    })
  })
}

export async function runDailyClosuresForAllReceptionists(date: string) {
  const receptionists = await prisma.user.findMany({ where: { role: "RECEPTIONIST" } })
  const results = []
  for (const r of receptionists) {
    results.push({ userId: r.id, closure: await generateDailyClosureForUser(r.id, date) })
  }
  return results
}

export async function runWeeklyClosuresForAllReceptionists(referenceDate: Date) {
  const receptionists = await prisma.user.findMany({ where: { role: "RECEPTIONIST" } })
  const results = []
  for (const r of receptionists) {
    results.push({ userId: r.id, closure: await generateWeeklyClosureForUser(r.id, referenceDate) })
  }
  return results
}