"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, Clock, AlertTriangle, TrendingUp, Loader2, Archive } from "lucide-react"
import { validateClosure } from "@/app/actions/admin"
import { formatMoney } from "@/lib/utils"
import { toast } from "sonner"

type Closure = {
  id: string; date: string; type: string; status: string;
  expectedAmount: number; handedAmount: number | null; discrepancy: number | null; comments: string | null;
  user: { name: string | null }; validatedBy: { name: string | null } | null
}

type LiveSummary = {
  date: string; entriesCount: number; movementsCount: number;
  entryTotal: number; recettes: number; depenses: number; expectedAmount: number
} | null

export function BilansPageClient({ closures, role, liveSummary }: {
  closures: Closure[]; role: string; liveSummary: LiveSummary
}) {
  const router = useRouter()
  const [validating, setValidating] = useState<string | null>(null)
  const [validateForm, setValidateForm] = useState({ handedAmount: "", comments: "" })
  const [isPending, startTransition] = useTransition()

  const canValidate = role === "ADMIN" || role === "DG"

  const handleValidate = (id: string) => {
    if (!validateForm.handedAmount) return
    startTransition(async () => {
      try {
        await validateClosure(id, parseFloat(validateForm.handedAmount), validateForm.comments || undefined)
        setValidating(null)
        setValidateForm({ handedAmount: "", comments: "" })
        toast.success("Remise validée avec succès.")
        router.refresh()
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Erreur lors de la validation.")
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-zinc-900">Bilans &amp; Clôtures</h1>
        <p className="text-zinc-500 mt-1 text-sm">
          {role === "RECEPTIONIST"
            ? "Vos bilans, générés automatiquement chaque nuit"
            : "Bilans de toute l'équipe — la remise hebdomadaire se valide ici"}
        </p>
      </div>

      {/* Point du jour — calcul EN DIRECT, non figé, aucune action requise */}
      {liveSummary && (
        <div className="rounded-md border border-amber-200 bg-amber-50/60 p-5">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <TrendingUp size={16} className="text-amber-600" />
            <h2 className="font-bold text-zinc-800 text-sm">Point du jour en cours ({liveSummary.date})</h2>
            <span className="ml-auto text-[11px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-semibold">
              Se clôture automatiquement cette nuit
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="min-w-0">
              <p className="text-xs text-zinc-500">Séjours enregistrés</p>
              <p className="font-mono font-bold text-zinc-800 truncate">{liveSummary.entriesCount}</p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-zinc-500">Recettes caisse</p>
              <p className="font-mono font-bold text-emerald-600 truncate">{formatMoney(liveSummary.recettes)}</p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-zinc-500">Dépenses caisse</p>
              <p className="font-mono font-bold text-rose-500 truncate">{formatMoney(liveSummary.depenses)}</p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-zinc-500">Total attendu (provisoire)</p>
              <p className="font-mono font-bold text-zinc-900 truncate">{formatMoney(liveSummary.expectedAmount)}</p>
            </div>
          </div>
        </div>
      )}

      {closures.length === 0 ? (
        <div className="card-base card-body text-center py-16 flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center">
            <Clock size={24} className="text-zinc-300" />
          </div>
          <p className="text-zinc-400 font-medium">Aucun bilan clôturé pour l&apos;instant</p>
          <p className="text-zinc-300 text-sm">Le premier bilan journalier apparaîtra ici automatiquement cette nuit.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {closures.map(c => {
            const hasDiscrepancy = c.discrepancy !== null && Math.abs(c.discrepancy) > 0
            const isWeekly = c.type === "WEEKLY"
            return (
              <div key={c.id} className={`card-base shadow-sm overflow-hidden ${
                c.status === "VALIDATED"
                  ? hasDiscrepancy ? "border-rose-200" : "border-emerald-200"
                  : "border-zinc-100"
              }`}>
                <div className="px-6 py-4 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-4">
                    <div>
                      {c.status === "VALIDATED" ? (
                        hasDiscrepancy
                          ? <AlertTriangle size={20} className="text-rose-500" />
                          : <CheckCircle size={20} className="text-emerald-500" />
                      ) : isWeekly ? (
                        <Clock size={20} className="text-zinc-300" />
                      ) : (
                        <Archive size={20} className="text-zinc-300" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-zinc-700">{c.date}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          isWeekly ? "bg-violet-50 text-violet-600" : "bg-blue-50 text-blue-600"
                        }`}>
                          {isWeekly ? "Hebdomadaire" : "Journalier"}
                        </span>
                        {role !== "RECEPTIONIST" && (
                          <span className="text-xs text-zinc-400">— {c.user.name || "Inconnu"}</span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-500 mt-0.5">
                        Montant attendu : <span className="font-mono font-bold text-zinc-700">{formatMoney(c.expectedAmount)}</span>
                        {c.handedAmount !== null && (
                          <> · Remis : <span className="font-mono font-bold text-zinc-700">{formatMoney(c.handedAmount)}</span></>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {c.status === "VALIDATED" ? (
                      <div className="text-right">
                        {hasDiscrepancy && (
                          <p className="text-sm font-bold text-rose-600 font-mono">
                            Écart : {c.discrepancy! > 0 ? "+" : ""}{formatMoney(c.discrepancy!)}
                          </p>
                        )}
                        {c.comments && <p className="text-xs text-zinc-400 mt-0.5">{c.comments}</p>}
                        <p className="text-xs text-zinc-300 mt-0.5">
                          Validé par {c.validatedBy?.name || "—"}
                        </p>
                      </div>
                    ) : isWeekly ? (
                      canValidate ? (
                        validating === c.id ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <input
                              type="number" min={0}
                              value={validateForm.handedAmount}
                              onChange={e => setValidateForm({ ...validateForm, handedAmount: e.target.value })}
                              placeholder="Montant remis (FCFA)"
                              className="input-base w-44"
                            />
                            <input
                              value={validateForm.comments}
                              onChange={e => setValidateForm({ ...validateForm, comments: e.target.value })}
                              placeholder="Manquant / commentaire (opt.)"
                              className="input-base w-44"
                            />
                            <button
                              onClick={() => handleValidate(c.id)}
                              disabled={isPending}
                              className="btn-primary h-9 px-3 text-xs disabled:opacity-50"
                            >
                              {isPending ? <Loader2 size={13} className="animate-spin" /> : "Confirmer"}
                            </button>
                            <button onClick={() => setValidating(null)} className="btn-ghost h-9 px-3">
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setValidating(c.id)}
                            className="btn-secondary h-9 px-3"
                          >
                            Valider la remise
                          </button>
                        )
                      ) : (
                        <span className="text-xs bg-zinc-50 text-zinc-400 px-2.5 py-1 rounded-full font-semibold">En attente de remise</span>
                      )
                    ) : (
                      <span className="text-xs bg-zinc-50 text-zinc-400 px-2.5 py-1 rounded-full font-semibold" title="Les bilans journaliers sont archivés automatiquement ; la remise se valide au niveau du bilan hebdomadaire.">
                        Archivé
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}