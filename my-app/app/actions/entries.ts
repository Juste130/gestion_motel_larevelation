"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"

async function getSessionAndUser() {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Non autorisé")
  return session
}

export async function getEntries(date: string) {
  // date in YYYY-MM-DD
  const session = await getSessionAndUser()
  const role = (session.user as any)?.role

  // By default fetch for this date. 
  // If we wanted to restrict Receptionist to only see their own, we could do it here.
  // But usually, they see the whole day's registry like a physical book.
  const entries = await prisma.entry.findMany({
    where: { date },
    include: {
      drinks: {
        include: { drink: true }
      },
      user: {
        select: { name: true, email: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  })
  return entries
}

export async function addEntry(data: {
  date: string
  receiptNo?: string
  roomNum: string
  roomType: string
  roomTypeLabel: string
  arrival?: string
  departure?: string
  duration?: string
  roomAmount: number
  condomAmount: number
  drinks: { id: string; qty: number; price: number }[]
}) {
  const session = await getSessionAndUser()
  const userId = (session.user as any)?.id

  const drinksAmount = data.drinks.reduce((acc, d) => acc + (d.qty * d.price), 0)
  const total = data.roomAmount + data.condomAmount + drinksAmount

  const entry = await prisma.entry.create({
    data: {
      date: data.date,
      receiptNo: data.receiptNo,
      roomNum: data.roomNum,
      roomType: data.roomType,
      roomTypeLabel: data.roomTypeLabel,
      arrival: data.arrival,
      departure: data.departure,
      duration: data.duration,
      roomAmount: data.roomAmount,
      condomAmount: data.condomAmount,
      drinksAmount,
      total,
      userId,
      drinks: {
        create: data.drinks.map(d => ({
          qty: d.qty,
          price: d.price,
          drinkId: d.id
        }))
      }
    }
  })

  // Decrement stock
  for (const d of data.drinks) {
    await prisma.drink.update({
      where: { id: d.id },
      data: { stock: { decrement: d.qty } }
    })
  }

  // Audit Log
  await prisma.auditLog.create({
    data: {
      action: 'CREATE_ENTRY',
      entityId: entry.id,
      details: `Création du séjour ch. ${entry.roomNum}`,
      userId,
    }
  })

  revalidatePath('/dashboard/reception')
  revalidatePath('/dashboard/admin')
  return entry
}

export async function updateDeparture(entryId: string, departure: string, duration: string) {
  const session = await getSessionAndUser()
  const userId = (session.user as any)?.id

  // Anyone (Receptionist) can update the departure time
  const updated = await prisma.entry.update({
    where: { id: entryId },
    data: { departure, duration }
  })

  await prisma.auditLog.create({
    data: {
      action: 'UPDATE_DEPARTURE',
      entityId: entryId,
      details: `Ajout heure de départ: ${departure}`,
      userId,
    }
  })

  revalidatePath('/dashboard/reception')
  return updated
}

export async function deleteEntry(entryId: string) {
  const session = await getSessionAndUser()
  const role = (session.user as any)?.role
  const userId = (session.user as any)?.id

  // ANTI-FRAUD RULE: Only DG/ADMIN can delete
  if (role !== "DG" && role !== "ADMIN") {
    throw new Error("Seule la direction peut supprimer un enregistrement.")
  }

  // Restore stock before delete
  const entry = await prisma.entry.findUnique({
    where: { id: entryId },
    include: { drinks: true }
  })

  if (entry) {
    for (const d of entry.drinks) {
      await prisma.drink.update({
        where: { id: d.drinkId },
        data: { stock: { increment: d.qty } }
      })
    }
  }

  await prisma.entry.delete({
    where: { id: entryId }
  })

  await prisma.auditLog.create({
    data: {
      action: 'DELETE_ENTRY',
      entityId: entryId,
      details: `Suppression du séjour ch. ${entry?.roomNum}`,
      userId,
    }
  })

  revalidatePath('/dashboard/reception')
  revalidatePath('/dashboard/admin')
}
