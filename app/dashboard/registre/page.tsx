import { requireSession, getRole } from "@/lib/session"
import { getEntries } from "@/app/actions/entries"
import { getRooms, getProducts } from "@/app/actions/catalog"
import { RegistreClient } from "./client"
import { todayStr } from "@/lib/utils"

export default async function RegistrePage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const session = await requireSession()
  const role = getRole(session)

  const resolvedParams = await searchParams
  const currentDate = resolvedParams.date || todayStr()

  const [entries, rooms, products] = await Promise.all([
    getEntries(currentDate),
    getRooms(),
    getProducts()
  ])

  return (
    <RegistreClient
      entries={entries}
      rooms={rooms}
      products={products}
      currentDate={currentDate}
      role={role}
    />
  )
}
