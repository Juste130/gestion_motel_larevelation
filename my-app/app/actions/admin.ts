"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

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
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  })
}

export async function createUser(data: { name: string; email: string; password: string; role: string }) {
  const { user } = await requireAdminOrDG()
  if (data.role === "ADMIN" && user.role !== "ADMIN") {
    throw new Error("Seul un administrateur peut créer un autre administrateur")
  }
  const hashed = await bcrypt.hash(data.password, 10)
  await prisma.user.create({
    data: { name: data.name, email: data.email, password: hashed, role: data.role },
  })
  revalidatePath("/dashboard", "layout")
}

export async function deleteUser(id: string) {
  await requireAdmin()
  await prisma.user.delete({ where: { id } })
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

export async function generateDailyClosure() {
  const { user } = await requireAuth()
  if (user.role === "DG") throw new Error("Le DG ne génère pas de clôture journalière")

  const today = new Date().toISOString().slice(0, 10)
  
  return await prisma.$transaction(async (tx) => {
    const entries = await tx.entry.findMany({ where: { closureId: null, userId: user.id } })
    const entryTotal = entries.reduce((acc, curr) => acc + curr.total, 0)

    const cashMovements = await tx.cashMovement.findMany({ where: { closureId: null, userId: user.id } })
    const recettes = cashMovements.filter(m => m.type === "recette").reduce((acc, curr) => acc + curr.amount, 0)
    const depenses = cashMovements.filter(m => m.type === "depense").reduce((acc, curr) => acc + curr.amount, 0)

    const expectedAmount = entryTotal + recettes - depenses

    if (entries.length === 0 && cashMovements.length === 0) {
      throw new Error("Aucun mouvement à clôturer pour cette session.")
    }

    const closure = await tx.closure.create({
      data: {
        date: today,
        type: "DAILY",
        userId: user.id,
        expectedAmount,
      }
    })
    
    if (entries.length > 0) {
      await tx.entry.updateMany({
        where: { id: { in: entries.map(e => e.id) } },
        data: { closureId: closure.id }
      })
    }

    if (cashMovements.length > 0) {
      await tx.cashMovement.updateMany({
        where: { id: { in: cashMovements.map(m => m.id) } },
        data: { closureId: closure.id }
      })
    }

    return closure
  })
}

export async function validateClosure(id: string, handedAmount: number, comments?: string) {
  const { user } = await requireAdminOrDG()
  
  const closure = await prisma.closure.findUnique({ where: { id } })
  if (!closure) throw new Error("Bilan introuvable")
  
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

  const today = new Date().toISOString().slice(0, 10)
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
