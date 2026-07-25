"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle, Clock, AlertTriangle, Calendar, Users, Wine,
  Loader2, ArrowRight, BedDouble, Wallet
} from "lucide-react"
import { validateBilan } from "@/app/actions/admin"
import { formatMoney, todayStr } from "@/lib/utils"
import { toast } from "sonner"

type Closure = { id: string; status: string; handedAmount: number | null; discrepancy: number | null; comments: string | null; validatedByName: string | null } | null

type DailyBilan = {
  date: string
  entriesCount: number
  stayTypeBreakdown: { horaire: number; nuitee: number }
  receptionists: { id: string; name: string | null }[]
  montantSejours: number
  recettesCaisse: number
  depensesCaisse: number
  montantAttendu: number
  produitsVendus: { drinks: number; condoms: number }
  closure: Closure
}

type WeeklyBilan = {
  weekId: string
  start: string
  end: string
  days: DailyBilan[]
  receptionists: { id: string; name: string | null }[]
  montantSejours: number
  recettesCaisse: number
  depensesCaisse: number
  montantAttendu: number
  closure: Closure
}

function ClosureBadge({ closure, isToday }: { closure: Closure; isToday: boolean }) {
  if (isToday) {
    return <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-blue-50 text-blue-600">
      <Clock size={11} /> En cours — se fige à minuit
    </span>
  }
  if (closure?.status === "VALIDATED") {
    const hasDiscrepancy = closure.discrepancy !== null && Math.abs(closure.discrepancy) > 0
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ${
        hasDiscrepancy ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-700"
      }`}>
        {hasDiscrepancy ? <AlertTriangle size={11} /> : <CheckCircle size={11} />}
        Validé{hasDiscrepancy ? ` — écart ${closure.discrepancy! > 0 ? "+" : ""}${formatMoney(closure.discrepancy!)}` : ""}
      </span>
    )
  }
  return <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-zinc-100 text-zinc-500">
    <Clock size={11} /> En attente de remise
  </span>
}

function ValidateForm({ onSubmit, isPending }: { onSubmit: (amount: number, comments?: string) => void; isPending: boolean }) {
  const [amount, setAmount] = useState("")
  const [comments, setComments] = useState("")
  return (
    <div className="flex flex-wrap items-end gap-2 bg-zinc-50 rounded-md p-3 border border-zinc-100">
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-semibold text-zinc-500">Montant remis</label>
        <input type="number" min={0} value={amount} onChange={e => setAmount(e.target.value)} className="input-base h-9 w-36" />
      </div>
      <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
        <label className="text-[11px] font-semibold text-zinc-500">Commentaire (manquant, etc.)</label>
        <input value={comments} onChange={e => setComments(e.target.value)} className="input-base h-9" />
      </div>
      <button
        onClick={() => amount && onSubmit(parseFloat(amount), comments || undefined)}
        disabled={isPending || !amount}
        className="btn-primary h-9 px-4 disabled:opacity-50"
      >
        {isPending ? <Loader2 size={14} className="animate-spin" /> : "Valider"}
      </button>
    </div>
  )
}

function DailyDetail({ bilan, role, isToday, onValidate, isPending, showingValidate, setShowingValidate }: {
  bilan: DailyBilan; role: string; isToday: boolean
  onValidate: (amount: number, comments?: string) => void
  isPending: boolean; showingValidate: boolean; setShowingValidate: (v: boolean) => void
}) {
  const canValidate = (role === "ADMIN" || role === "DG") && !isToday && bilan.closure?.status !== "VALIDATED"

  return (
    <div className="card-base card-body flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-serif text-xl font-bold text-zinc-900">
            {new Date(bilan.date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">{bilan.date}</p>
        </div>
        <ClosureBadge closure={bilan.closure} isToday={isToday} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-zinc-50 rounded-md p-3">
          <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold flex items-center gap-1"><BedDouble size={12} /> Séjours</p>
          <p className="font-mono font-bold text-zinc-800 text-lg mt-1">{bilan.entriesCount}</p>
          <p className="text-[11px] text-zinc-400">{bilan.stayTypeBreakdown.horaire} horaire · {bilan.stayTypeBreakdown.nuitee} nuitée</p>
        </div>
        <div className="bg-zinc-50 rounded-md p-3">
          <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold flex items-center gap-1"><Wallet size={12} /> Encaissé séjours</p>
          <p className="font-mono font-bold text-emerald-600 text-lg mt-1">{formatMoney(bilan.montantSejours)}</p>
        </div>
        <div className="bg-zinc-50 rounded-md p-3">
          <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Recettes / Dépenses</p>
          <p className="font-mono font-bold text-zinc-800 mt-1">
            <span className="text-emerald-600">+{formatMoney(bilan.recettesCaisse)}</span>{" "}
            <span className="text-rose-500">-{formatMoney(bilan.depensesCaisse)}</span>
          </p>
        </div>
        <div className="bg-amber-50 rounded-md p-3 border border-amber-100">
          <p className="text-[11px] text-amber-600 uppercase tracking-wider font-semibold">Somme à prendre</p>
          <p className="font-mono font-bold text-amber-800 text-lg mt-1">{formatMoney(bilan.montantAttendu)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2 text-zinc-600">
          <Users size={14} className="text-zinc-400" />
          {bilan.receptionists.length > 0
            ? <span>{bilan.receptionists.map(r => r.name || "Réceptionniste").join(", ")}</span>
            : <span className="text-zinc-400 italic">Aucun réceptionniste actif ce jour</span>}
        </div>
        <div className="flex items-center gap-2 text-zinc-600">
          <Wine size={14} className="text-zinc-400" />
          <span>Boissons {formatMoney(bilan.produitsVendus.drinks)} · Préservatifs {formatMoney(bilan.produitsVendus.condoms)}</span>
        </div>
      </div>

      {bilan.closure?.status === "VALIDATED" && (
        <div className="text-sm text-zinc-500 border-t border-zinc-100 pt-3">
          Remis : <span className="font-mono font-bold text-zinc-700">{formatMoney(bilan.closure.handedAmount || 0)}</span>
          {" "}par {bilan.closure.validatedByName || "—"}
          {bilan.closure.comments && <span className="italic"> — {bilan.closure.comments}</span>}
        </div>
      )}

      {canValidate && (
        showingValidate
          ? <ValidateForm onSubmit={onValidate} isPending={isPending} />
          : <button onClick={() => setShowingValidate(true)} className="btn-secondary self-start">Valider ce bilan</button>
      )}
    </div>
  )
}

export function BilansPageClient({ daily, weekly, date, role }: {
  daily: DailyBilan; weekly: WeeklyBilan; date: string; role: string
}) {
  const router = useRouter()
  const [tab, setTab] = useState<"daily" | "weekly">("daily")
  const [showingValidate, setShowingValidate] = useState(false)
  const [isPending, startTransition] = useTransition()

  const isToday = date === todayStr()
  const canValidateWeekly = (role === "ADMIN" || role === "DG") && weekly.end < todayStr() && weekly.closure?.status !== "VALIDATED"

  const goToDate = (d: string) => router.push(`/dashboard/bilans?date=${d}`)

  const handleValidate = (type: "DAILY" | "WEEKLY") => (amount: number, comments?: string) => {
    startTransition(async () => {
      try {
        await validateBilan(type === "DAILY" ? date : weekly.weekId, type, amount, comments)
        setShowingValidate(false)
        toast.success("Bilan validé.")
        router.refresh()
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Erreur lors de la validation.")
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold text-zinc-900">Bilans</h1>
          <p className="text-zinc-500 mt-1 text-sm">Calculés automatiquement — la remise est le seul acte humain requis</p>
        </div>
        <div className="relative">
          <input
            type="date" value={date}
            onChange={(e) => goToDate(e.target.value)}
            className="input-base pl-10 h-10 w-40"
          />
          <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        </div>
      </div>

      {/* Onglets filtres */}
      <div className="inline-flex rounded-md bg-zinc-100 p-1 w-fit">
        <button
          onClick={() => setTab("daily")}
          className={`px-5 h-9 rounded-sm text-sm font-semibold transition-colors ${tab === "daily" ? "bg-white text-amber-700 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
        >
          Journalier
        </button>
        <button
          onClick={() => setTab("weekly")}
          className={`px-5 h-9 rounded-sm text-sm font-semibold transition-colors ${tab === "weekly" ? "bg-white text-amber-700 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
        >
          Hebdomadaire
        </button>
      </div>

      {tab === "daily" ? (
        <DailyDetail
          bilan={daily} role={role} isToday={isToday}
          onValidate={handleValidate("DAILY")} isPending={isPending}
          showingValidate={showingValidate} setShowingValidate={setShowingValidate}
        />
      ) : (
        <div className="flex flex-col gap-5">
          <div className="card-base card-body flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-serif text-xl font-bold text-zinc-900">Semaine {weekly.weekId}</h2>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">Du {weekly.start} au {weekly.end}</p>
              </div>
              <ClosureBadge closure={weekly.closure} isToday={weekly.end >= todayStr() && weekly.start <= todayStr()} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-zinc-50 rounded-md p-3">
                <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold flex items-center gap-1"><Wallet size={12} /> Encaissé séjours</p>
                <p className="font-mono font-bold text-emerald-600 text-lg mt-1">{formatMoney(weekly.montantSejours)}</p>
              </div>
              <div className="bg-zinc-50 rounded-md p-3">
                <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Recettes / Dépenses</p>
                <p className="font-mono font-bold text-zinc-800 mt-1">
                  <span className="text-emerald-600">+{formatMoney(weekly.recettesCaisse)}</span>{" "}
                  <span className="text-rose-500">-{formatMoney(weekly.depensesCaisse)}</span>
                </p>
              </div>
              <div className="bg-amber-50 rounded-md p-3 border border-amber-100 col-span-2 sm:col-span-1">
                <p className="text-[11px] text-amber-600 uppercase tracking-wider font-semibold">Somme à prendre (semaine)</p>
                <p className="font-mono font-bold text-amber-800 text-lg mt-1">{formatMoney(weekly.montantAttendu)}</p>
              </div>
              <div className="bg-zinc-50 rounded-md p-3">
                <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold flex items-center gap-1"><Users size={12} /> Réceptionniste(s)</p>
                <p className="text-xs text-zinc-700 mt-1.5 leading-relaxed">
                  {weekly.receptionists.length > 0 ? weekly.receptionists.map(r => r.name || "Réceptionniste").join(", ") : "—"}
                </p>
              </div>
            </div>

            {weekly.closure?.status === "VALIDATED" && (
              <div className="text-sm text-zinc-500 border-t border-zinc-100 pt-3">
                Remis : <span className="font-mono font-bold text-zinc-700">{formatMoney(weekly.closure.handedAmount || 0)}</span>
                {" "}par {weekly.closure.validatedByName || "—"}
                {weekly.closure.comments && <span className="italic"> — {weekly.closure.comments}</span>}
              </div>
            )}

            {canValidateWeekly && (
              showingValidate
                ? <ValidateForm onSubmit={handleValidate("WEEKLY")} isPending={isPending} />
                : <button onClick={() => setShowingValidate(true)} className="btn-secondary self-start">Valider la remise hebdomadaire</button>
            )}
          </div>

          {/* Liste des jours de la semaine, cliquable */}
          <div className="card-base overflow-hidden">
            <div className="px-6 py-3 border-b border-zinc-50">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Détail par jour</h3>
            </div>
            <div className="divide-y divide-zinc-50">
              {weekly.days.map((d) => (
                <button
                  key={d.date}
                  onClick={() => { goToDate(d.date); setTab("daily") }}
                  className="w-full text-left px-6 py-3.5 flex items-center justify-between gap-3 hover:bg-zinc-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-medium text-zinc-700 w-28 flex-shrink-0">
                      {new Date(d.date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" })}
                    </span>
                    <span className="text-xs text-zinc-400">{d.entriesCount} séjour{d.entriesCount !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-mono font-bold text-sm text-zinc-800">{formatMoney(d.montantAttendu)}</span>
                    <ArrowRight size={14} className="text-zinc-300" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}