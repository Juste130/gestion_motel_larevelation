"use client"

import { Settings, Trash2, Check } from "lucide-react"
import { formatMoney } from "@/lib/utils"
import { useState } from "react"
import { updateDeparture } from "@/app/actions/entries"

const LEDGER_COLS = [
  { key: "receiptNo", label: "N° Reçu", w: "90px" },
  { key: "roomNum", label: "N° Chambre", w: "90px" },
  { key: "roomType", label: "Type", w: "60px" },
  { key: "arrival", label: "Arrivée", w: "80px" },
  { key: "departure", label: "Sortie", w: "100px" },
  { key: "duration", label: "Temps effectué", w: "110px" },
  { key: "roomAmount", label: "Montant payé", w: "110px" },
  { key: "drinksLabel", label: "Boissons", w: "180px" },
  { key: "drinksCount", label: "Nb boissons", w: "90px" },
  { key: "drinksAmount", label: "Montant boissons", w: "130px" },
  { key: "condomAmount", label: "Préservatif", w: "100px" },
  { key: "total", label: "Total payé", w: "110px" },
]

export function LedgerTable({ date, entries, canDelete, onDelete }: any) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [departureVal, setDepartureVal] = useState("")

  const totals = {
    roomAmount: entries.reduce((s: number, e: any) => s + (Number(e.roomAmount) || 0), 0),
    drinksAmount: entries.reduce((s: number, e: any) => s + (Number(e.drinksAmount) || 0), 0),
    condomAmount: entries.reduce((s: number, e: any) => s + (Number(e.condomAmount) || 0), 0),
    total: entries.reduce((s: number, e: any) => s + (Number(e.total) || 0), 0),
  }

  const handleSaveDeparture = async (e: any) => {
    if (!departureVal) return
    const arrival = e.arrival
    
    const computeDuration = (arr: string, dep: string) => {
      if (!arr || !dep) return ""
      const [ah, am] = arr.split(":").map(Number)
      const [dh, dm] = dep.split(":").map(Number)
      let mins = (dh * 60 + dm) - (ah * 60 + am)
      if (mins < 0) mins += 24 * 60
      const h = Math.floor(mins / 60)
      const m = mins % 60
      if (h === 0) return `${m}min`
      if (m === 0) return `${h}h`
      return `${h}h${String(m).padStart(2, "0")}`
    }

    const duration = computeDuration(arrival, departureVal)
    await updateDeparture(e.id, departureVal, duration)
    setEditingId(null)
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[1180px]">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-zinc-50 text-zinc-500 text-left px-4 py-3 text-xs font-bold uppercase tracking-wider min-w-[88px] border-b border-zinc-200">
                Date
              </th>
              {LEDGER_COLS.map((c) => (
                <th
                  key={c.key}
                  className="bg-zinc-50 text-zinc-500 text-left px-4 py-3 text-xs font-bold uppercase tracking-wider border-l border-zinc-200 border-b"
                  style={{ minWidth: c.w }}
                >
                  {c.label}
                </th>
              ))}
              <th className="bg-zinc-50 border-b border-zinc-200 min-w-[70px]" />
            </tr>
          </thead>
          <tbody>
            {entries.map((e: any, i: number) => {
              const bgClass = i % 2 === 0 ? "bg-white" : "bg-muted/30"
              return (
                <tr key={e.id} className={bgClass}>
                  <td className={`sticky left-0 ${bgClass} px-3 py-2 border-b border-border text-muted-foreground font-mono`}>
                    {date.slice(8, 10)}/{date.slice(5, 7)}
                  </td>
                  <td className="px-3 py-2 border-b border-border text-foreground">{e.receiptNo || "—"}</td>
                  <td className="px-3 py-2 border-b border-border font-bold text-primary">{e.roomNum}</td>
                  <td className="px-3 py-2 border-b border-border text-foreground">{e.roomType}</td>
                  <td className="px-3 py-2 border-b border-border text-foreground">{e.arrival || "—"}</td>
                  <td className="px-3 py-2 border-b border-border text-foreground">
                    {editingId === e.id ? (
                      <div className="flex items-center gap-1">
                        <input 
                          type="time" 
                          value={departureVal} 
                          onChange={(ev) => setDepartureVal(ev.target.value)} 
                          className="border border-border rounded px-1 py-0.5 text-xs w-[75px]"
                        />
                        <button onClick={() => handleSaveDeparture(e)} className="text-success p-1"><Check size={14} /></button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center group">
                        {e.departure || "—"}
                        {!e.departure && (
                          <button onClick={() => { setEditingId(e.id); setDepartureVal(""); }} className="opacity-0 group-hover:opacity-100 text-primary">
                            <Settings size={13} />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 border-b border-border text-foreground">{e.duration || "—"}</td>
                  <td className="px-3 py-2 border-b border-border font-mono">{formatMoney(e.roomAmount)}</td>
                  <td className="px-3 py-2 border-b border-border text-muted-foreground">
                    {e.drinks?.map((d: any) => `${d.drink.name} x${d.qty}`).join(", ") || "—"}
                  </td>
                  <td className="px-3 py-2 border-b border-border font-mono">
                    {e.drinks?.reduce((s: number, d: any) => s + d.qty, 0) || "—"}
                  </td>
                  <td className="px-3 py-2 border-b border-border font-mono">{formatMoney(e.drinksAmount)}</td>
                  <td className="px-3 py-2 border-b border-border font-mono">{formatMoney(e.condomAmount)}</td>
                  <td className="px-3 py-2 border-b border-border font-mono font-bold text-destructive">{formatMoney(e.total)}</td>
                  <td className="px-3 py-2 border-b border-border whitespace-nowrap text-right">
                    {canDelete && (
                      <button onClick={() => onDelete(e.id)} className="bg-destructive/10 border-none rounded-md px-2 py-1 cursor-pointer hover:bg-destructive/20 transition-colors">
                        <Trash2 size={12} className="text-destructive" />
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={7} className="px-3 py-2.5 font-bold text-primary border-t-2 border-primary">Total du jour</td>
              <td className="px-3 py-2.5 font-bold font-mono border-t-2 border-primary">{formatMoney(totals.roomAmount)}</td>
              <td className="border-t-2 border-primary" />
              <td className="border-t-2 border-primary" />
              <td className="px-3 py-2.5 font-bold font-mono border-t-2 border-primary">{formatMoney(totals.drinksAmount)}</td>
              <td className="px-3 py-2.5 font-bold font-mono border-t-2 border-primary">{formatMoney(totals.condomAmount)}</td>
              <td className="px-3 py-2.5 font-bold font-mono text-destructive border-t-2 border-primary">{formatMoney(totals.total)}</td>
              <td className="border-t-2 border-primary" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
