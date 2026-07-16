"use server"

import { prisma } from "@/lib/prisma"

export async function getRooms() {
  return await prisma.room.findMany({
    orderBy: { num: 'asc' }
  })
}

export async function getProducts(category?: string) {
  return await prisma.product.findMany({
    where: category ? { category } : undefined,
    orderBy: [{ category: 'asc' }, { name: 'asc' }]
  })
}

/** @deprecated Use getProducts() instead */
export async function getDrinks() {
  return await prisma.product.findMany({
    where: { category: "DRINK" },
    orderBy: { name: 'asc' }
  })
}
