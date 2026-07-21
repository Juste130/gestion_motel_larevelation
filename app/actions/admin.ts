"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { todayStr } from "@/lib/utils"
import { createAndSendActivation } from "@/lib/invitations"

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Non autorisé")
  return { session, user: session.user as any }
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
  await requireAdminOrDG()
  await prisma.room.create({ data })
  revalidatePath("/dashboard", "layout")
}

export async function deleteRoom(id: string) {
  await requireAdmin()
  await prisma.room.delete({ where: { id } })
  revalidatePath("/dashboard", "layout")
}

// ─── CATALOG : Products ──────────────────────────────────────────
export async function addProduct(data: { name: string; category: string; price: number; stock: number }) {
  await requireAdminOrDG()
  await prisma.product.create({ data })
  revalidatePath("/dashboard", "layout")
}

export async function deleteProduct(id: string) {
  await requireAdmin()
  await prisma.product.delete({ where: { id } })
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

export async function addStockMovement(data: { type: string, qty: number, price?: number, motif?: string, date: string, productId: string }) {
  const { user } = await requireAuth()
  
  if (user.role === "DG") throw new Error("Le DG ne gère pas les mouvements de stock")
  if (data.type === "OUT" && !data.motif) throw new Error("Le motif est obligatoire pour une sortie")
  if (data.qty <= 0) throw new Error("La quantité doit être supérieure à 0")
  
  await prisma.$transaction(async (tx) => {
    await tx.stockMovement.create({
      data: {
        ...data,
        userId: user.id
      }
    })
    
    const qtyChange = data.type === "IN" ? data.qty : -data.qty
    await tx.product.update({
      where: { id: data.productId },
      data: { stock: { increment: qtyChange } }
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
  
  // Reception sees only their own
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
  if (user.role === "DG") throw new Error("Le DG ne saisit pas de caisse")
  
  await prisma.cashMovement.create({ 
    data: {
      ...data,
      userId: user.id
    }
  })
  revalidatePath("/dashboard", "layout")
}

export async function deleteCashMovement(id: string) {
  await requireAdmin()
  await prisma.cashMovement.delete({ where: { id } })
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

/**
 * Invite un nouveau membre : aucun mot de passe n'est défini par l'admin/DG.
 * Le compte est créé en statut PENDING et un e-mail d'activation est envoyé
 * à l'utilisateur, qui choisit lui-même mot de passe ou connexion Google.
 */
export async function inviteUser(data: { name: string; email: string; role: string }) {
  const { user } = await requireAdminOrDG()
  if (data.role === "ADMIN" && user.role !== "ADMIN") {
    throw new Error("Seul un administrateur peut créer un autre administrateur")
  }

  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  if (existing) throw new Error("Un compte existe déjà avec cet e-mail.")

  const created = await prisma.user.create({
    data: { name: data.name, email: data.email, role: data.role, status: "PENDING" },
  })
  await createAndSendActivation(created.id, created.name, created.email)
  revalidatePath("/dashboard", "layout")
}

/** Renvoie un nouveau lien d'activation (invalide l'ancien) pour un compte encore PENDING */
export async function resendInvitation(id: string) {
  await requireAdminOrDG()
  const target = await prisma.user.findUnique({ where: { id } })
  if (!target) throw new Error("Compte introuvable")
  if (target.status !== "PENDING") throw new Error("Ce compte est déjà actif.")

  await createAndSendActivation(target.id, target.name, target.email)
  revalidatePath("/dashboard", "layout")
}

export async function deleteUser(id: string) {
  await requireAdmin()
  await prisma.user.delete({ where: { id } })
  revalidatePath("/dashboard", "layout")
}

// ─── ACCESS REQUESTS (Demandes d'accès) ───────────────────────────
export async function getAccessRequests() {
  await requireAdminOrDG()
  return prisma.accessRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
  })
}

/** Approuve une demande : crée le compte PENDING et envoie le lien d'activation */
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
    return newUser
  })
  await createAndSendActivation(created.id, created.name, created.email)
  revalidatePath("/dashboard", "layout")
}

export async function rejectAccessRequest(id: string) {
  await requireAdminOrDG()
  await prisma.accessRequest.update({ where: { id }, data: { status: "REJECTED" } })
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
  if (user.role === "DG") return null // Le DG n'a pas de "journée en cours" personnelle
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
  
  await prisma.closure.update({
    where: { id },
    data: {
      handedAmount,
      discrepancy,
      comments,
      status: "VALIDATED",
      validatedById: user.id
    }
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

  const [entriesThisMonth, allUsers, rooms, products] = await Promise.all([
    prisma.entry.findMany({ where: whereEntries }),
    user.role !== "RECEPTIONIST" ? prisma.user.findMany({ select: { id: true, name: true, role: true } }) : [],
    prisma.room.count(),
    prisma.product.count(),
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

  return {
    totalRevenueMonth: entriesThisMonth.reduce((s, e: any) => s + (e.total || 0), 0),
    totalEntriesMonth: entriesThisMonth.length,
    roomCount: rooms,
    productCount: products,
    revenueByUser, 
    recettes,
    depenses
  }
}