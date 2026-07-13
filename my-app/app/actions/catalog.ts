"use server"

import { prisma } from "@/lib/prisma"

export async function getRooms() {
  return await prisma.room.findMany({
    orderBy: { num: 'asc' }
  })
}

export async function getDrinks() {
  return await prisma.drink.findMany({
    orderBy: { name: 'asc' }
  })
}
