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
  const entries = await prisma.entry.findMany({
    where: { date },
    include: {
      products: {
        include: { product: true }
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
  products: { id: string; qty: number; price: number }[]
}) {
  const session = await getSessionAndUser()
  const userId = (session.user as any)?.id

  const entry = await prisma.$transaction(async (tx) => {
    const productIds = data.products.map(p => p.id)
    const dbProducts = await tx.product.findMany({ where: { id: { in: productIds } } })
    
    let productsAmount = 0
    const entryProductsData = []

    for (const p of data.products) {
      const dbProduct = dbProducts.find(x => x.id === p.id)
      if (!dbProduct) throw new Error("Produit introuvable")
      
      const price = dbProduct.price // Prix sécurisé depuis la BDD
      productsAmount += price * p.qty
      
      entryProductsData.push({
        qty: p.qty,
        price: price,
        productId: p.id
      })

      await tx.product.update({
        where: { id: p.id },
        data: { stock: { decrement: p.qty } }
      })

      await tx.stockMovement.create({
        data: {
          type: "OUT",
          qty: p.qty,
          price: price,
          motif: `Séjour ch. ${data.roomNum}`,
          date: data.date,
          productId: p.id,
          userId
        }
      })
    }

    const total = data.roomAmount + data.condomAmount + productsAmount

    const newEntry = await tx.entry.create({
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
        drinksAmount: productsAmount,
        total,
        userId,
        products: {
          create: entryProductsData
        }
      }
    })

    await tx.auditLog.create({
      data: {
        action: 'CREATE_ENTRY',
        entityId: newEntry.id,
        details: `Création du séjour ch. ${newEntry.roomNum}`,
        userId,
      }
    })

    return newEntry
  })

  revalidatePath('/dashboard', 'layout')
  return entry
}

export async function updateDeparture(entryId: string, departure: string, duration: string) {
  const session = await getSessionAndUser()
  const userId = (session.user as any)?.id

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

  revalidatePath('/dashboard', 'layout')
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

  await prisma.$transaction(async (tx) => {
    // Restore stock before delete
    const entry = await tx.entry.findUnique({
      where: { id: entryId },
      include: { products: true }
    })

    if (entry) {
      for (const p of entry.products) {
        await tx.product.update({
          where: { id: p.productId },
          data: { stock: { increment: p.qty } }
        })
        await tx.stockMovement.create({
          data: {
            type: "IN",
            qty: p.qty,
            motif: `Annulation séjour ch. ${entry.roomNum}`,
            date: entry.date,
            productId: p.productId,
            userId
          }
        })
      }

      await tx.entry.delete({
        where: { id: entryId }
      })

      await tx.auditLog.create({
        data: {
          action: 'DELETE_ENTRY',
          entityId: entryId,
          details: `Suppression du séjour ch. ${entry.roomNum}`,
          userId,
        }
      })
    }
  })

  revalidatePath('/dashboard', 'layout')
}
