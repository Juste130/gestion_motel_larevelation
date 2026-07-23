"use client"

import { useState, useTransition } from "react"
import { History, PlusCircle, DoorOpen, ShoppingCart, Trash2, Loader2, Filter, Info } from "lucide-react"
import { getAuditLogs } from "@/app/actions/admin"

type LogRow = {
  id: string; action: string; actionLabel: string; entityId: string; details: string
  createdAt: Date | string
  user: { id: string; name: string | null; email: string } | null
}

const ACTION_STYLES: Record<string, { icon: React.ReactNode; tone: string }> = {
  CREATE_ENTRY:     { icon: <PlusCircle size={14} />, tone: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  UPDATE_DEPARTURE: { icon: <DoorOpen size={14} />,    tone: "bg-amber-50 text-amber-700 border-amber-100" },
  UPDATE_ENTRY:     { icon: <ShoppingCart size={14} />, tone: "bg-sky-50 text-sky-700 border-sky-100" },
  DELETE_ENTRY:     { icon: <Trash2 size={14} />,      tone: "bg-rose-50 text-rose-700 border-rose-100" },
}
const DEFAULT_STYLE = { icon: <Info size={14} />, tone: "bg-zinc-100 text-zinc-600 border-zinc-200" }

const ACTION_OPTIONS = [
  { value: "", label: "Toutes les actions" },
  { value: "CREATE_ENTRY", label: "Création de séjour" },
  { value: "UPDATE_DEPARTURE", label: "Clôture de séjour" },
  { value: "UPDATE_ENTRY", label: "Modification de séjour" },
  { value: "DELETE_ENTRY", label: "Suppression de séjour" },
]

export function LogsPageClient({ initialLogs }: { initialLogs: LogRow[] }) {
  const [logs, setLogs] = useState(initialLogs)
  const [action, setAction] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [isPending, startTransition] = useTransition()

  const applyFilters = () => {
    startTransition(async () => {
      const result = await getAuditLogs({
        action: action || undefined,
        from: from || undefined,
        to: to || undefined,
      })
      setLogs(result)
    })
  }

  const resetFilters = () => {
    setAction("")
    setFrom("")
    setTo("")
    startTransition(async () => {
      const result = await getAuditLogs()
      setLogs(result)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-zinc-900">Journal d&apos;activité</h1>
        <p className="text-zinc-500 mt-1 text-sm">Historique des actions effectuées sur les séjours</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md text-sm flex items-start gap-2">
        <Info size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <span>Ce journal couvre pour l&apos;instant les actions sur le <strong>registre des séjours</strong> (création, clôture, modification, suppression). Les 300 événements les plus récents sont affichés.</span>
      </div>

      {/* Filtres */}
      <div className="card-base card-body flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
          <label className="label-base">Action</label>
          <select value={action} onChange={(e) => setAction(e.target.value)} className="select-base">
            {ACTION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1 w-40">
          <label className="label-base">Du</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input-base" />
        </div>
        <div className="flex flex-col gap-1 w-40">
          <label className="label-base">Au</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input-base" />
        </div>
        <button onClick={applyFilters} disabled={isPending} className="btn-primary h-10 px-4 flex-shrink-0">
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <Filter size={14} />}
          Filtrer
        </button>
        <button onClick={resetFilters} disabled={isPending} className="btn-outline h-10 px-4 flex-shrink-0">
          Réinitialiser
        </button>
      </div>

      {/* Liste des événements */}
      <div className="card-base overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-50 flex items-center gap-2">
          <History size={16} className="text-zinc-400" />
          <h2 className="font-bold text-zinc-800 text-sm">{logs.length} événement(s)</h2>
        </div>

        {logs.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center">
              <History size={24} className="text-zinc-300" />
            </div>
            <p className="font-semibold text-zinc-400">Aucun événement pour ces filtres</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {logs.map((log) => {
              const style = ACTION_STYLES[log.action] ?? DEFAULT_STYLE
              const date = new Date(log.createdAt)
              return (
                <div key={log.id} className="px-6 py-3.5 flex flex-wrap items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold border flex-shrink-0 ${style.tone}`}>
                    {style.icon} {log.actionLabel}
                  </span>
                  <p className="text-sm text-zinc-700 flex-1 min-w-[160px] truncate">{log.details}</p>
                  <span className="text-xs text-zinc-400 whitespace-nowrap">
                    {log.user?.name || log.user?.email || "Utilisateur supprimé"}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono whitespace-nowrap">
                    {date.toLocaleDateString("fr-FR")} {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}