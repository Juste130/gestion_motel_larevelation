import { getEntries } from "@/app/actions/entries"
import { getRooms, getDrinks } from "@/app/actions/catalog"
import { ReceptionClient } from "./client"
import { todayStr } from "@/lib/utils"

export default async function ReceptionPage({ searchParams }: { searchParams: { date?: string } }) {
  // Fix Next 15 searchParams resolution
  const params = await searchParams
  const date = params.date || todayStr()
  
  const [entries, rooms, drinks] = await Promise.all([
    getEntries(date),
    getRooms(),
    getDrinks(),
  ])

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 pb-32">
      <ReceptionClient 
        initialDate={date} 
        entries={entries} 
        rooms={rooms} 
        drinks={drinks} 
      />
    </div>
  )
}
