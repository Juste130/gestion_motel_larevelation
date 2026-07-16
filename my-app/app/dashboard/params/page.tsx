import { requireSession, getRole } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { ParamsPageClient } from "./client"

export default async function ParamsPage() {
  const session = await requireSession()
  const role = getRole(session)

  const [rooms, products] = await Promise.all([
    prisma.room.findMany({ orderBy: { num: "asc" } }),
    prisma.product.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] })
  ])

  return <ParamsPageClient rooms={rooms} products={products} role={role} />
}
