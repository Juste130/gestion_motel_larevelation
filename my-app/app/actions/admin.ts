"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (!session || (role !== "DG" && role !== "ADMIN")) throw new Error("Non autorisé")
  return session
}

// ─── CATALOG : Rooms ─────────────────────────────────────────────
export async function addRoom(data: { num: string; type: string; label: string }) {
  await requireAdmin()
  await prisma.room.create({ data })
  revalidatePath("/dashboard/admin")
}

export async function deleteRoom(id: string) {
  await requireAdmin()
  await prisma.room.delete({ where: { id } })
  revalidatePath("/dashboard/admin")
}

// ─── CATALOG : Drinks ─────────────────────────────────────────────
export async function addDrink(data: { name: string; price: number; stock: number }) {
  await requireAdmin()
  await prisma.drink.create({ data })
  revalidatePath("/dashboard/admin")
}

export async function updateDrinkStock(id: string, stock: number) {
  await requireAdmin()
  await prisma.drink.update({ where: { id }, data: { stock } })
  revalidatePath("/dashboard/admin")
}

export async function deleteDrink(id: string) {
  await requireAdmin()
  await prisma.drink.delete({ where: { id } })
  revalidatePath("/dashboard/admin")
}

// ─── CAISSE (Cash Movements) ──────────────────────────────────────
export async function getCashMovements(from?: string, to?: string) {
  await requireAdmin()
  const where: any = {}
  if (from) where.date = { gte: from }
  if (to) where.date = { ...where.date, lte: to }
  return prisma.cashMovement.findMany({ where, orderBy: { date: "desc" } })
}

export async function addCashMovement(data: { label: string; amount: number; type: string; date: string }) {
  await requireAdmin()
  await prisma.cashMovement.create({ data })
  revalidatePath("/dashboard/admin")
}

export async function deleteCashMovement(id: string) {
  await requireAdmin()
  await prisma.cashMovement.delete({ where: { id } })
  revalidatePath("/dashboard/admin")
}

// ─── USERS (Equipe) ───────────────────────────────────────────────
export async function getUsers() {
  await requireAdmin()
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  })
}

export async function createUser(data: { name: string; email: string; password: string; role: string }) {
  await requireAdmin()
  const hashed = await bcrypt.hash(data.password, 10)
  await prisma.user.create({
    data: { name: data.name, email: data.email, password: hashed, role: data.role },
  })
  revalidatePath("/dashboard/admin")
}

export async function deleteUser(id: string) {
  await requireAdmin()
  await prisma.user.delete({ where: { id } })
  revalidatePath("/dashboard/admin")
}

// ─── STATS (Resume) ───────────────────────────────────────────────
export async function getResumeStats() {
  await requireAdmin()

  const today = new Date().toISOString().slice(0, 10)
  const thisMonth = today.slice(0, 7) // YYYY-MM

  const [entriesThisMonth, allUsers, rooms, drinks] = await Promise.all([
    prisma.entry.findMany({ where: { date: { startsWith: thisMonth } } }),
    prisma.user.findMany({ select: { id: true, name: true, role: true } }),
    prisma.room.count(),
    prisma.drink.count(),
  ])

  const receptionnistes = allUsers.filter((u) => u.role === "RECEPTIONIST")

  const revenueByUser = receptionnistes.map((u) => {
    const userEntries = entriesThisMonth.filter((e: any) => e.userId === u.id)
    return {
      name: u.name || "Réceptionniste",
      entries: userEntries.length,
      revenue: userEntries.reduce((s: number, e: any) => s + (e.total || 0), 0),
    }
  })

  return {
    totalRevenueMonth: entriesThisMonth.reduce((s, e: any) => s + (e.total || 0), 0),
    totalEntriesMonth: entriesThisMonth.length,
    roomCount: rooms,
    drinkCount: drinks,
    revenueByUser,
  }
}
