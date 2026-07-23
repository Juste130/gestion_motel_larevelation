"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { todayStr } from "@/lib/utils"
import { createAndSendActivation } from "@/lib/invitations"
import { getSessionUser } from "@/lib/session"
import {
  roomSchema,
  productSchema,
  stockMovementSchema,
  cashMovementSchema,
  inviteUserSchema,
} from "@/lib/validations"

export async function requireAuth() {
  const { session, user } = await getSessionUser()
  return { session, user }
}

export async function requireAdmin() {
  const { session, user } = await requireAuth()
  if (user.role !== "ADMIN") throw new Error("Accès Admin requis")
  return { session, user }
}

export async function requireAdminOrDG() {
  const { session, user } = await requireAuth()
  if (user.role !== "ADMIN" && user.role !== "DG") throw new Error("Accès Direction requis")
  return { session, user }
}

// ─── CATALOG : Rooms ─────────────────────────────────────────────
export async function addRoom(data: { num: string; type: string; label: string; price: number }) {
  const { user } = await requireAdminOrDG()
  const validated = roomSchema.parse(data)
  
  const room = await prisma.room.create({ data: validated })

  await prisma.auditLog.create({
    data: {
      action: "CREATE_ROOM",
      entityId: room.id,
      details: `Création chambre ${room.num} (${room.label}) - ${room.price} FCFA`,
      userId: user.id,
    },
  })

  revalidatePath("/dashboard", "layout")
}

export async function deleteRoom(id: string) {
  const { user } = await requireAdmin()
  const target = await prisma.room.findUnique({ where: { id } })
  
  await prisma.room.delete({ where: { id } })

  await prisma.auditLog.create({
    data: {
      action: "DELETE_ROOM",
      entityId: id,
      details: `Suppression chambre ${target?.num || id}`,
      userId: user.id,
    },
  })

  revalidatePath("/dashboard", "layout")
}

// ─── CATALOG : Products ──────────────────────────────────────────
export async function addProduct(data: { name: string; category: string; price: number; stock: number }) {
  const { user } = await requireAdminOrDG()
  const validated = productSchema.parse(data)

  const product = await prisma.product.create({ data: validated })

  await prisma.auditLog.create({
    data: {
      action: "CREATE_PRODUCT",
      entityId: product.id,
      details: `Création produit ${product.name} - ${product.price} FCFA (Stock initial: ${product.stock})`,
      userId: user.id,
    },
  })

  revalidatePath("/dashboard", "layout")
}

export async function deleteProduct(id: string) {
  const { user } = await requireAdmin()
  const target = await prisma.product.findUnique({ where: { id } })

  await prisma.product.delete({ where: { id } })

  await prisma.auditLog.create({
    data: {
      action: "DELETE_PRODUCT",
      entityId: id,
      details: `Suppression produit ${target?.name || id}`,
      userId: user.id,
    },
  })

  revalidatePath("/dashboard", "layout")
}

// ─── STOCK MOVEMENTS ─────────────────────────────────────────────
export async function getStockMovements(from?: string, to?: string) {
  const { user } = await requireAuth()
  const where: any = {}
  if (from) where.date = { gte: from }
  if (to) where.date = { ...where.date, lte: to }
  
  return prisma.stockMovement.findMany({ 
    where, 
    orderBy: { createdAt: "desc" },
    include: { 
      user: { select: { name: true } },
      product: { select: { name: true, category: true } }
    }
  })
}

export async function addStockMovement(data: { type: string; qty: number; price?: number; motif?: string; date: string; productId: string }) {
  const { user } = await requireAuth()
  const validated = stockMovementSchema.parse(data)
  
  if (user.role === "DG") throw new Error("Le DG ne gère pas les mouvements de stock")
  if (validated.type === "OUT" && !validated.motif) throw new Error("Le motif est obligatoire pour une sortie")
  
  await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: validated.productId } })
    if (!product) throw new Error("Produit introuvable")

    if (validated.type === "OUT" && product.stock < validated.qty) {
      throw new Error(`Stock insuffisant pour ${product.name} (Stock actuel: ${product.stock}, demandé: ${validated.qty})`)
    }

    await tx.stockMovement.create({
      data: {
        ...validated,
        userId: user.id
      }
    })
    
    const qtyChange = validated.type === "IN" ? validated.qty : -validated.qty
    await tx.product.update({
      where: { id: validated.productId },
      data: { stock: { increment: qtyChange } }
    })

    await tx.auditLog.create({
      data: {
        action: "STOCK_MOVEMENT",
        entityId: validated.productId,
        details: `Mouvement stock ${validated.type}: ${validated.qty} x ${product.name} (Motif: ${validated.motif || "N/A"})`,
        userId: user.id,
      }
    })
  })
  revalidatePath("/dashboard", "layout")
}

// ─── CAISSE (Cash Movements) ──────────────────────────────────────
export async function getCashMovements(from?: string, to?: string) {
  const { user } = await requireAuth()
  const where: any = {}
  if (from) where.date = { gte: from }
  if (to) where.date = { ...where.date, lte: to }
  
  if (user.role === "RECEPTIONIST") {
    where.userId = user.id
  }
  
  return prisma.cashMovement.findMany({ 
    where, 
    orderBy: { date: "desc" },
    include: { user: { select: { name: true } } }
  })
}

export async function addCashMovement(data: { label: string; amount: number; type: string; date: string }) {
  const { user } = await requireAuth()
  const validated = cashMovementSchema.parse(data)

  if (user.role === "DG") throw new Error("Le DG ne saisit pas de caisse")
  
  await prisma.cashMovement.create({ 
    data: {
      ...validated,
      userId: user.id
    }
  })
  revalidatePath("/dashboard", "layout")
}

export async function deleteCashMovement(id: string) {
  const { user } = await requireAdmin()
  const target = await prisma.cashMovement.findUnique({ where: { id } })

  await prisma.$transaction(async (tx) => {
    await tx.cashMovement.delete({ where: { id } })
    await tx.auditLog.create({
      data: {
        action: "DELETE_CASH_MOVEMENT",
        entityId: id,
        details: `Suppression mouvement caisse: ${target?.label} (${target?.amount} FCFA)`,
        userId: user.id,
      }
    })
  })
  revalidatePath("/dashboard", "layout")
}

// ─── USERS (Equipe) ───────────────────────────────────────────────
export async function getUsers() {
  await requireAdminOrDG()
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, status: true, authMethod: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  })
}

export async function inviteUser(data: { name: string; email: string; role: string }) {
  const { user } = await requireAdminOrDG()
  const validated = inviteUserSchema.parse(data)

  if (validated.role === "ADMIN" && user.role !== "ADMIN") {
    throw new Error("Seul un administrateur peut créer un autre administrateur")
  }

  const existing = await prisma.user.findUnique({ where: { email: validated.email } })
  if (existing) throw new Error("Un compte existe déjà avec cet e-mail.")

  const created = await prisma.user.create({
    data: { name: validated.name, email: validated.email, role: validated.role, status: "PENDING" },
  })

  await prisma.auditLog.create({
    data: {
      action: "INVITE_USER",
      entityId: created.id,
      details: `Invitation envoyée à ${created.email} (${created.role})`,
      userId: user.id,
    }
  })

  await createAndSendActivation(created.id, created.name, created.email)
  revalidatePath("/dashboard", "layout")
}

export async function resendInvitation(id: string) {
  const { user } = await requireAdminOrDG()
  const target = await prisma.user.findUnique({ where: { id } })
  if (!target) throw new Error("Compte introuvable")
  if (target.status !== "PENDING") throw new Error("Ce compte est déjà actif.")

  await createAndSendActivation(target.id, target.name, target.email)
  
  await prisma.auditLog.create({
    data: {
      action: "RESEND_INVITATION",
      entityId: target.id,
      details: `Renvoyé invitation à ${target.email}`,
      userId: user.id,
    }
  })

  revalidatePath("/dashboard", "layout")
}

export async function deleteUser(id: string) {
  const { user } = await requireAdmin()

  // GARDE-FOU 1: Interdire l'auto-suppression
  if (user.id === id) {
    throw new Error("Vous ne pouvez pas supprimer votre propre compte administrateur.")
  }

  const targetUser = await prisma.user.findUnique({ where: { id } })
  if (!targetUser) throw new Error("Utilisateur introuvable.")

  // GARDE-FOU 2: Vérifier qu'il reste au moins 1 autre admin actif
  if (targetUser.role === "ADMIN") {
    const activeAdmins = await prisma.user.count({
      where: { role: "ADMIN", status: "ACTIVE", id: { not: id } }
    })
    if (activeAdmins === 0) {
      throw new Error("Impossible de supprimer le dernier administrateur actif.")
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.delete({ where: { id } })
    await tx.auditLog.create({
      data: {
        action: "DELETE_USER",
        entityId: id,
        details: `Suppression de l'utilisateur ${targetUser.email} (${targetUser.role})`,
        userId: user.id,
      }
    })
  })

  revalidatePath("/dashboard", "layout")
}

// ─── ACCESS REQUESTS ──────────────────────────────────────────────
export async function getAccessRequests() {
  await requireAdminOrDG()
  return prisma.accessRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
  })
}

export async function approveAccessRequest(id: string, role: string) {
  const { user } = await requireAdminOrDG()
  if (role === "ADMIN" && user.role !== "ADMIN") {
    throw new Error("Seul un administrateur peut créer un autre administrateur")
  }

  const request = await prisma.accessRequest.findUnique({ where: { id } })
  if (!request) throw new Error("Demande introuvable")
  if (request.status !== "PENDING") throw new Error("Cette demande a déjà été traitée.")

  const existing = await prisma.user.findUnique({ where: { email: request.email } })
  if (existing) throw new Error("Un compte existe déjà avec cet e-mail.")

  const created = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: { name: request.name, email: request.email, role, status: "PENDING" },
    })
    await tx.accessRequest.update({ where: { id }, data: { status: "APPROVED" } })
    
    await tx.auditLog.create({
      data: {
        action: "APPROVE_ACCESS_REQUEST",
        entityId: id,
        details: `Approbation demande d'accès pour ${request.email} (${role})`,
        userId: user.id,
      }
    })

    return newUser
  })

  await createAndSendActivation(created.id, created.name, created.email)
  revalidatePath("/dashboard", "layout")
}

export async function rejectAccessRequest(id: string) {
  const { user } = await requireAdminOrDG()
  await prisma.accessRequest.update({ where: { id }, data: { status: "REJECTED" } })
  
  await prisma.auditLog.create({
    data: {
      action: "REJECT_ACCESS_REQUEST",
      entityId: id,
      details: `Rejet demande d'accès ID ${id}`,
      userId: user.id,
    }
  })

  revalidatePath("/dashboard", "layout")
}

// ─── CLOSURES (Bilans) ───────────────────────────────────────────
export async function getClosures() {
  const { user } = await requireAuth()
  const where: any = {}
  
  if (user.role === "RECEPTIONIST") {
    where.userId = user.id
  }
  
  return prisma.closure.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true } },
      validatedBy: { select: { name: true } }
    }
  })
}

export async function getLiveDailySummary() {
  const { user } = await requireAuth()
  if (user.role === "DG") return null
  const { computeLiveDailySnapshot } = await import("@/lib/closures")
  return computeLiveDailySnapshot(user.id, todayStr())
}

export async function validateClosure(id: string, handedAmount: number, comments?: string) {
  const { user } = await requireAdminOrDG()
  
  const closure = await prisma.closure.findUnique({ where: { id } })
  if (!closure) throw new Error("Bilan introuvable")
  if (closure.type !== "WEEKLY") {
    throw new Error("Seul le bilan hebdomadaire fait l'objet d'une remise à valider.")
  }
  
  const discrepancy = handedAmount - closure.expectedAmount
  
  await prisma.$transaction(async (tx) => {
    await tx.closure.update({
      where: { id },
      data: {
        handedAmount,
        discrepancy,
        comments,
        status: "VALIDATED",
        validatedById: user.id
      }
    })

    await tx.auditLog.create({
      data: {
        action: "VALIDATE_CLOSURE",
        entityId: id,
        details: `Validation bilan hebdo ${closure.date}: Remis ${handedAmount} FCFA (Écart: ${discrepancy} FCFA)`,
        userId: user.id,
      }
    })
  })

  revalidatePath("/dashboard", "layout")
}

// ─── STATS (Resume) ───────────────────────────────────────────────
export async function getResumeStats() {
  const { user } = await requireAuth()

  const today = todayStr()
  const thisMonth = today.slice(0, 7) // YYYY-MM

  let whereEntries: any = { date: { startsWith: thisMonth } }
  
  if (user.role === "RECEPTIONIST") {
    whereEntries.userId = user.id
  }

  const last7Dates: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - i)
    last7Dates.push(d.toISOString().slice(0, 10))
  }

  const prevMonthDate = new Date(`${thisMonth}-01T00:00:00Z`)
  prevMonthDate.setUTCMonth(prevMonthDate.getUTCMonth() - 1)
  const prevMonth = prevMonthDate.toISOString().slice(0, 7)
  const wherePrevMonth: any = { date: { startsWith: prevMonth } }
  if (user.role === "RECEPTIONIST") wherePrevMonth.userId = user.id

  const [
    entriesThisMonth,
    allUsers,
    rooms,
    products,
    last7DaysEntries,
    prevMonthEntries,
    ongoingEntries,
    lowStockProducts,
    pendingAccessRequestsCount,
  ] = await Promise.all([
    prisma.entry.findMany({ where: whereEntries }),
    user.role !== "RECEPTIONIST" ? prisma.user.findMany({ select: { id: true, name: true, role: true } }) : [],
    prisma.room.count(),
    prisma.product.count(),
    prisma.entry.findMany({
      where: {
        date: { gte: last7Dates[0], lte: last7Dates[6] },
        ...(user.role === "RECEPTIONIST" ? { userId: user.id } : {}),
      },
      select: { date: true, total: true },
    }),
    prisma.entry.findMany({ where: wherePrevMonth, select: { total: true } }),
    prisma.entry.findMany({
      where: { OR: [{ departure: null }, { departure: "" }] },
      select: { roomNum: true },
    }),
    prisma.product.findMany({
      where: { stock: { lte: 3 } },
      select: { id: true, name: true, category: true, stock: true },
      orderBy: { stock: "asc" },
    }),
    user.role !== "RECEPTIONIST" ? prisma.accessRequest.count({ where: { status: "PENDING" } }) : 0,
  ])

  const receptionnistes = user.role !== "RECEPTIONIST" ? allUsers.filter((u) => u.role === "RECEPTIONIST") : []

  const revenueByUser = receptionnistes.map((u) => {
    const userEntries = entriesThisMonth.filter((e: any) => e.userId === u.id)
    return {
      name: u.name || "Réceptionniste",
      entries: userEntries.length,
      revenue: userEntries.reduce((s: number, e: any) => s + (e.total || 0), 0),
    }
  })
  
  const cashMovements = await prisma.cashMovement.findMany({
    where: {
      date: { startsWith: thisMonth },
      ...(user.role === "RECEPTIONIST" ? { userId: user.id } : {})
    }
  })
  
  const recettes = cashMovements.filter(m => m.type === "recette").reduce((s, m) => s + m.amount, 0)
  const depenses = cashMovements.filter(m => m.type === "depense").reduce((s, m) => s + m.amount, 0)

  const totalRevenueMonth = entriesThisMonth.reduce((s, e: any) => s + (e.total || 0), 0)
  const previousMonthRevenue = prevMonthEntries.reduce((s, e: any) => s + (e.total || 0), 0)
  const revenueChangePct = previousMonthRevenue > 0
    ? ((totalRevenueMonth - previousMonthRevenue) / previousMonthRevenue) * 100
    : null

  const revenueByDay = last7Dates.map((date) => ({
    date,
    revenue: last7DaysEntries
      .filter((e) => e.date === date)
      .reduce((s, e) => s + (e.total || 0), 0),
  }))

  const occupiedRoomNums = new Set(ongoingEntries.map((e) => e.roomNum))
  const occupied = Math.min(occupiedRoomNums.size, rooms)

  let receptionistsLiveToday: { id: string; name: string; entriesCount: number; expectedAmount: number }[] = []
  if (user.role !== "RECEPTIONIST" && receptionnistes.length > 0) {
    const { computeLiveDailySnapshot } = await import("@/lib/closures")
    receptionistsLiveToday = await Promise.all(
      receptionnistes.map(async (r) => {
        const snap = await computeLiveDailySnapshot(r.id, today)
        return { id: r.id, name: r.name || "Réceptionniste", entriesCount: snap.entriesCount, expectedAmount: snap.expectedAmount }
      })
    )
  }

  return {
    totalRevenueMonth,
    totalEntriesMonth: entriesThisMonth.length,
    roomCount: rooms,
    productCount: products,
    revenueByUser, 
    recettes,
    depenses,
    previousMonthRevenue,
    revenueChangePct,
    revenueByDay,
    occupancy: { total: rooms, occupied, free: Math.max(rooms - occupied, 0) },
    lowStockAlerts: lowStockProducts,
    receptionistsLiveToday,
    pendingAccessRequestsCount,
  }
}
// ─── JOURNAL D'ACTIVITÉ (AuditLog) ────────────────────────────────
const AUDIT_ACTION_LABELS: Record<string, string> = {
  CREATE_ENTRY: "Création de séjour",
  UPDATE_DEPARTURE: "Clôture de séjour",
  UPDATE_ENTRY: "Modification de séjour",
  DELETE_ENTRY: "Suppression de séjour",
}

export async function getAuditLogs(filters?: { action?: string; from?: string; to?: string }) {
  await requireAdminOrDG()

  const where: any = {}
  if (filters?.action) where.action = filters.action
  if (filters?.from || filters?.to) {
    where.createdAt = {}
    if (filters.from) where.createdAt.gte = new Date(`${filters.from}T00:00:00`)
    if (filters.to) where.createdAt.lte = new Date(`${filters.to}T23:59:59`)
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 300, // le journal n'est pas encore paginé — on affiche les 300 événements les plus récents
  })

  // AuditLog.userId n'a pas de relation Prisma déclarée : on joint manuellement.
  const userIds = [...new Set(logs.map((l) => l.userId))]
  const users = userIds.length
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } })
    : []
  const userMap = new Map(users.map((u) => [u.id, u]))

  return logs.map((l) => ({
    id: l.id,
    action: l.action,
    actionLabel: AUDIT_ACTION_LABELS[l.action] ?? l.action,
    entityId: l.entityId,
    details: l.details,
    createdAt: l.createdAt,
    user: userMap.get(l.userId) ?? null,
  }))
}