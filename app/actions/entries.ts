"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { todayStr } from "@/lib/utils"
import { getSessionUser } from "@/lib/session"
import { addEntrySchema, closeEntrySchema, addProductToEntrySchema } from "@/lib/validations"

export async function getEntries(date: string) {
  const today = todayStr()
  const isFuture = date > today

  const entries = await prisma.entry.findMany({
    where: {
      OR: [
        { date: date },
        ...(!isFuture ? [{ 
          date: { lt: date },
          departure: null
        }] : [])
      ]
    },
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
  const validated = addEntrySchema.parse(data)
  const { user } = await getSessionUser()
  const userId = user.id

  const entry = await prisma.$transaction(async (tx) => {
    // Vérification de la disponibilité de la chambre (non occupée)
    const activeEntry = await tx.entry.findFirst({
      where: {
        roomNum: validated.roomNum,
        departure: null
      }
    })
    if (activeEntry) {
      throw new Error(`La chambre ${validated.roomNum} est actuellement occupée. Veuillez d'abord clôturer le séjour en cours.`)
    }

    const productIds = validated.products.map(p => p.id)
    const dbProducts = await tx.product.findMany({ where: { id: { in: productIds } } })
    
    let productsAmount = 0
    const entryProductsData = []

    for (const p of validated.products) {
      const dbProduct = dbProducts.find(x => x.id === p.id)
      if (!dbProduct) throw new Error("Produit introuvable")

      // VERIFICATION DU STOCK DISPONIBLE (POINT 2 DE L'AUDIT)
      if (dbProduct.stock < p.qty) {
        throw new Error(`Stock insuffisant pour "${dbProduct.name}" (Disponible: ${dbProduct.stock}, demandé: ${p.qty})`)
      }
      
      const price = dbProduct.price
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
          motif: `Séjour ch. ${validated.roomNum}`,
          date: validated.date,
          productId: p.id,
          userId
        }
      })
    }

    const total = validated.roomAmount + validated.condomAmount + productsAmount

    const newEntry = await tx.entry.create({
      data: {
        date: validated.date,
        receiptNo: validated.receiptNo,
        roomNum: validated.roomNum,
        roomType: validated.roomType,
        roomTypeLabel: validated.roomTypeLabel,
        arrival: validated.arrival,
        departure: validated.departure,
        duration: validated.duration,
        roomAmount: validated.roomAmount,
        condomAmount: validated.condomAmount,
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

export async function closeEntry(entryId: string, data: {
  departure: string;
  duration?: string;
  roomAmount: number;
  products: { id: string; qty: number; price: number }[];
  currentDate: string;
}) {
  const validated = closeEntrySchema.parse(data)
  const { user } = await getSessionUser()
  const userId = user.id

  await prisma.$transaction(async (tx) => {
    const entry = await tx.entry.findUnique({ where: { id: entryId } })
    if (!entry) throw new Error("Séjour introuvable")

    let additionalAmount = 0
    if (validated.products && validated.products.length > 0) {
      const productIds = validated.products.map(p => p.id)
      const dbProducts = await tx.product.findMany({ where: { id: { in: productIds } } })

      for (const p of validated.products) {
        const dbProduct = dbProducts.find(x => x.id === p.id)
        if (!dbProduct) throw new Error("Produit introuvable")

        // VERIFICATION DU STOCK DISPONIBLE (POINT 2 DE L'AUDIT)
        if (dbProduct.stock < p.qty) {
          throw new Error(`Stock insuffisant pour "${dbProduct.name}" (Disponible: ${dbProduct.stock}, demandé: ${p.qty})`)
        }
        
        const price = dbProduct.price
        additionalAmount += price * p.qty

        const existingEntryProduct = await tx.entryProduct.findFirst({
          where: { entryId: entry.id, productId: p.id }
        })

        if (existingEntryProduct) {
          await tx.entryProduct.update({
            where: { id: existingEntryProduct.id },
            data: { qty: { increment: p.qty } }
          })
        } else {
          await tx.entryProduct.create({
            data: {
              entryId: entry.id,
              productId: p.id,
              qty: p.qty,
              price: price
            }
          })
        }

        await tx.product.update({
          where: { id: p.id },
          data: { stock: { decrement: p.qty } }
        })

        await tx.stockMovement.create({
          data: {
            type: "OUT",
            qty: p.qty,
            price: price,
            motif: `Ajout conso clôture séjour ch. ${entry.roomNum}`,
            date: validated.currentDate,
            productId: p.id,
            userId
          }
        })
      }
    }

    const newRoomAmount = validated.roomAmount
    const newDrinksAmount = entry.drinksAmount + additionalAmount
    const newTotal = newRoomAmount + entry.condomAmount + newDrinksAmount

    await tx.entry.update({
      where: { id: entryId },
      data: {
        departure: validated.departure,
        duration: validated.duration,
        roomAmount: newRoomAmount,
        drinksAmount: newDrinksAmount,
        total: newTotal,
        date: validated.currentDate
      }
    })

    await tx.auditLog.create({
      data: {
        action: 'UPDATE_DEPARTURE',
        entityId: entryId,
        details: `Clôture: départ ${validated.departure}, montant ch. ${newRoomAmount}`,
        userId,
      }
    })
  })

  revalidatePath('/dashboard', 'layout')
}

export async function updateDeparture(entryId: string, departure: string, duration: string) {
  const { user } = await getSessionUser()
  const role = user.role

  if (role !== "DG" && role !== "ADMIN") {
    throw new Error("Seule la direction peut modifier l'heure de départ.")
  }

  await prisma.entry.update({
    where: { id: entryId },
    data: { departure, duration }
  })
  
  revalidatePath('/dashboard', 'layout')
}

export async function deleteEntry(entryId: string) {
  const { user } = await getSessionUser()
  const role = user.role
  const userId = user.id

  if (role !== "DG" && role !== "ADMIN") {
    throw new Error("Seule la direction peut supprimer un enregistrement.")
  }

  await prisma.$transaction(async (tx) => {
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

export async function addProductToEntry(entryId: string, date: string, products: { id: string; qty: number; price: number }[]) {
  const validated = addProductToEntrySchema.parse({ entryId, date, products })
  const { user } = await getSessionUser()
  const userId = user.id

  await prisma.$transaction(async (tx) => {
    const entry = await tx.entry.findUnique({ where: { id: entryId } })
    if (!entry) throw new Error("Séjour introuvable")

    const productIds = validated.products.map(p => p.id)
    const dbProducts = await tx.product.findMany({ where: { id: { in: productIds } } })

    let additionalAmount = 0

    for (const p of validated.products) {
      const dbProduct = dbProducts.find(x => x.id === p.id)
      if (!dbProduct) throw new Error("Produit introuvable")

      // VERIFICATION DU STOCK DISPONIBLE (POINT 2 DE L'AUDIT)
      if (dbProduct.stock < p.qty) {
        throw new Error(`Stock insuffisant pour "${dbProduct.name}" (Disponible: ${dbProduct.stock}, demandé: ${p.qty})`)
      }
      
      const price = dbProduct.price
      additionalAmount += price * p.qty

      const existingEntryProduct = await tx.entryProduct.findFirst({
        where: { entryId: entry.id, productId: p.id }
      })

      if (existingEntryProduct) {
        await tx.entryProduct.update({
          where: { id: existingEntryProduct.id },
          data: { qty: { increment: p.qty } }
        })
      } else {
        await tx.entryProduct.create({
          data: {
            entryId: entry.id,
            productId: p.id,
            qty: p.qty,
            price: price
          }
        })
      }

      await tx.product.update({
        where: { id: p.id },
        data: { stock: { decrement: p.qty } }
      })

      await tx.stockMovement.create({
        data: {
          type: "OUT",
          qty: p.qty,
          price: price,
          motif: `Ajout conso séjour ch. ${entry.roomNum}`,
          date: validated.date,
          productId: p.id,
          userId
        }
      })
    }

    await tx.entry.update({
      where: { id: entryId },
      data: {
        drinksAmount: { increment: additionalAmount },
        total: { increment: additionalAmount }
      }
    })

    await tx.auditLog.create({
      data: {
        action: 'UPDATE_ENTRY',
        entityId: entryId,
        details: `Ajout de consommations au séjour ch. ${entry.roomNum}`,
        userId,
      }
    })
  })

  revalidatePath('/dashboard', 'layout')
}
