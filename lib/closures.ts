// Calcul des bilans — journalier et hebdomadaire, GLOBAUX (toute l'équipe
// confondue, caisse commune). Toujours recalculé en direct depuis Payment/
// CashMovement/Entry pour la date/période demandée : jamais depuis un
// instantané figé. L'immuabilité du passé vient du fait que Payment,
// CashMovement et Entry sont toujours écrits avec la date du jour au
// moment de la création (jamais une date passée fournie par le client) —
// donc les chiffres d'un jour révolu ne peuvent plus jamais bouger.
//
// Import volontairement RELATIF : ce module est aussi utilisé par des
// scripts (scripts/populate_demo_data.ts) qui ne résolvent pas "@/...".
import { prisma } from "./prisma"

function ymd(d: Date) {
  return d.toISOString().slice(0, 10)
}

/** Bornes lundi->dimanche (ISO) de la semaine contenant `d` */
export function weekRange(d: Date) {
  const day = d.getUTCDay() || 7
  const monday = new Date(d)
  monday.setUTCDate(d.getUTCDate() - day + 1)
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)
  return { start: ymd(monday), end: ymd(sunday) }
}

/** Identifiant de semaine ISO, ex: "2026-W29" */
export function isoWeekId(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`
}

export type DailyBilan = {
  date: string
  entriesCount: number
  stayTypeBreakdown: { horaire: number; nuitee: number }
  receptionists: { id: string; name: string | null }[]
  montantSejours: number       // somme des Payment du jour (argent réellement pris sur les séjours)
  recettesCaisse: number       // CashMovement type=recette
  depensesCaisse: number       // CashMovement type=depense
  montantAttendu: number       // montantSejours + recettesCaisse - depensesCaisse
  produitsVendus: { drinks: number; condoms: number }
  closure: { id: string; status: string; handedAmount: number | null; discrepancy: number | null; comments: string | null; validatedByName: string | null } | null
}

export async function computeDailyBilan(date: string): Promise<DailyBilan> {
  const [payments, cashMovements, entries, closure] = await Promise.all([
    prisma.payment.findMany({ where: { date }, include: { entry: true } }),
    prisma.cashMovement.findMany({ where: { date } }),
    prisma.entry.findMany({
      where: { date },
      include: { user: { select: { id: true, name: true } }, products: { include: { product: true } } },
    }),
    prisma.closure.findUnique({
      where: { date_type: { date, type: "DAILY" } },
      include: { validatedBy: { select: { name: true } } },
    }),
  ])

  const montantSejours = payments.reduce((s, p) => s + p.amount, 0)
  const recettesCaisse = cashMovements.filter((m) => m.type === "recette").reduce((s, m) => s + m.amount, 0)
  const depensesCaisse = cashMovements.filter((m) => m.type === "depense").reduce((s, m) => s + m.amount, 0)

  const receptionistsMap = new Map<string, { id: string; name: string | null }>()
  for (const e of entries) {
    if (e.user) receptionistsMap.set(e.user.id, { id: e.user.id, name: e.user.name })
  }
  for (const p of payments) {
    // userId sur Payment garanti non-null
  }

  let drinks = 0
  let condoms = 0
  for (const e of entries) {
    for (const ep of e.products) {
      if (ep.product.category === "CONDOM") condoms += ep.qty * ep.price
      else drinks += ep.qty * ep.price
    }
  }

  return {
    date,
    entriesCount: entries.length,
    stayTypeBreakdown: {
      horaire: entries.filter((e) => e.stayType === "HORAIRE").length,
      nuitee: entries.filter((e) => e.stayType === "NUITEE").length,
    },
    receptionists: Array.from(receptionistsMap.values()),
    montantSejours,
    recettesCaisse,
    depensesCaisse,
    montantAttendu: montantSejours + recettesCaisse - depensesCaisse,
    produitsVendus: { drinks, condoms },
    closure: closure
      ? {
          id: closure.id,
          status: closure.status,
          handedAmount: closure.handedAmount,
          discrepancy: closure.discrepancy,
          comments: closure.comments,
          validatedByName: closure.validatedBy?.name || null,
        }
      : null,
  }
}

export type WeeklyBilan = {
  weekId: string
  start: string
  end: string
  days: DailyBilan[]
  receptionists: { id: string; name: string | null }[]
  montantSejours: number
  recettesCaisse: number
  depensesCaisse: number
  montantAttendu: number
  closure: DailyBilan["closure"]
}

export async function computeWeeklyBilan(referenceDate: Date): Promise<WeeklyBilan> {
  const { start, end } = weekRange(referenceDate)
  const weekId = isoWeekId(referenceDate)

  const dayDates: string[] = []
  const cursor = new Date(`${start}T00:00:00Z`)
  for (let i = 0; i < 7; i++) {
    dayDates.push(ymd(cursor))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  const days = await Promise.all(dayDates.map((d) => computeDailyBilan(d)))

  const receptionistsMap = new Map<string, { id: string; name: string | null }>()
  for (const day of days) {
    for (const r of day.receptionists) receptionistsMap.set(r.id, r)
  }

  const closure = await prisma.closure.findUnique({
    where: { date_type: { date: weekId, type: "WEEKLY" } },
    include: { validatedBy: { select: { name: true } } },
  })

  const montantSejours = days.reduce((s, d) => s + d.montantSejours, 0)
  const recettesCaisse = days.reduce((s, d) => s + d.recettesCaisse, 0)
  const depensesCaisse = days.reduce((s, d) => s + d.depensesCaisse, 0)

  return {
    weekId,
    start,
    end,
    days,
    receptionists: Array.from(receptionistsMap.values()),
    montantSejours,
    recettesCaisse,
    depensesCaisse,
    montantAttendu: montantSejours + recettesCaisse - depensesCaisse,
    closure: closure
      ? {
          id: closure.id,
          status: closure.status,
          handedAmount: closure.handedAmount,
          discrepancy: closure.discrepancy,
          comments: closure.comments,
          validatedByName: closure.validatedBy?.name || null,
        }
      : null,
  }
}