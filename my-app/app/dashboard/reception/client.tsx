"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, BedDouble, Wine, Wallet } from "lucide-react"
import { Card } from "@/components/ui/card"
import { LedgerTable } from "@/components/ledger-table"
import { EntryForm } from "@/components/entry-form"
import { formatMoney, prettyDate } from "@/lib/utils"
import { addEntry, deleteEntry } from "@/app/actions/entries"

export function ReceptionClient({ initialDate, entries, rooms, drinks }: any) {
  const router = useRouter()
  const [date, setDate] = useState(initialDate)
  const [formOpen, setFormOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const totalRoom = entries.reduce((s: number, e: any) => s + (Number(e.roomAmount) || 0), 0)
  const totalDrinks = entries.reduce((s: number, e: any) => s + (Number(e.drinksAmount) || 0), 0)
  const totalDay = entries.reduce((s: number, e: any) => s + (Number(e.total) || 0), 0)

  const handleDateChange = (newDate: string) => {
    setDate(newDate)
    router.push(`/dashboard/reception?date=${newDate}`)
  }

  const handleSave = async (data: any) => {
    setLoading(true)
    await addEntry(data)
    setFormOpen(false)
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    // Only DG can delete, but the table component handles showing the button
    // We pass canDelete=false for reception view to prevent them from even trying.
    // However, if they bypass, the server action will throw an error.
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-primary">Réception</h1>
          <p className="text-muted-foreground text-lg">{prettyDate(date)}</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-border p-1.5 rounded-lg">
          <input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            className="border-none bg-transparent text-sm focus:outline-none px-2 py-1 text-primary font-medium"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <MiniStat label="Chambres" value={totalRoom} icon={<BedDouble size={16} />} />
        <MiniStat label="Boissons" value={totalDrinks} icon={<Wine size={16} />} />
        <MiniStat label="Total jour" value={totalDay} color="text-destructive" icon={<Wallet size={16} />} />
      </div>

      {entries.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground border-dashed">
          Aucun séjour enregistré pour cette date.
        </Card>
      ) : (
        <LedgerTable 
          date={date} 
          entries={entries} 
          canDelete={false} // Receptionist cannot delete! Anti-fraud rule
          onDelete={handleDelete} 
        />
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setFormOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-accent text-accent-foreground rounded-full shadow-lg border border-accent flex items-center justify-center hover:scale-105 transition-transform hover:shadow-xl z-40"
      >
        <Plus size={28} />
      </button>

      {formOpen && (
        <EntryForm
          rooms={rooms}
          drinks={drinks}
          date={date}
          onCancel={() => setFormOpen(false)}
          onSave={handleSave}
        />
      )}
    </>
  )
}

function MiniStat({ label, value, color = "text-primary", icon }: any) {
  return (
    <Card className="p-5 flex flex-col justify-center relative overflow-hidden group hover:border-accent/50 transition-colors">
      <div className="absolute top-0 left-0 w-1 h-full bg-accent/80 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">
        {icon}
        {label}
      </div>
      <div className={`text-2xl font-mono font-bold ${color}`}>
        {formatMoney(value)}
      </div>
    </Card>
  )
}
