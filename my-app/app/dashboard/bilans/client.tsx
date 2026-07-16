"use client"

import { useState, useTransition } from "react"
import { CheckCircle, Clock, AlertTriangle, Plus } from "lucide-react"
import { generateDailyClosure, validateClosure } from "@/app/actions/admin"
import { formatMoney } from "@/lib/utils"

type Closure = {
  id: string; date: string; type: string; status: string;
  expectedAmount: number; handedAmount: number | null; discrepancy: number | null; comments: string | null;
  user: { name: string | null }; validatedBy: { name: string | null } | null
}

export function BilansPageClient({ closures: initClosures, role }: {
  closures: Closure[]; role: string
}) {
  const [closures, setClosures] = useState(initClosures)
  const [validating, setValidating] = useState<string | null>(null)
  const [validateForm, setValidateForm] = useState({ handedAmount: "", comments: "" })
  const [isPending, startTransition] = useTransition()

  const canGenerate = role === "ADMIN" || role === "RECEPTIONIST"
  const canValidate = role === "ADMIN" || role === "DG"

  const handleGenerate = () => {
    startTransition(async () => {
      try {
        await generateDailyClosure()
        window.location.reload()
      } catch (e: unknown) {
        alert(e instanceof Error ? e.message : "Erreur")
      }
    })
  }

  const handleValidate = (id: string) => {
    if (!validateForm.handedAmount) return
    startTransition(async () => {
      try {
        await validateClosure(id, parseFloat(validateForm.handedAmount), validateForm.comments || undefined)
        setValidating(null)
        setValidateForm({ handedAmount: "", comments: "" })
        window.location.reload()
      } catch (e: unknown) {
        alert(e instanceof Error ? e.message : "Erreur")
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-zinc-900">Bilans & Clôtures</h1>
          <p className="text-zinc-500 mt-1 text-sm">
            {role === "RECEPTIONIST"
              ? "Vos bilans journaliers"
              : "Bilans de toute l'équipe — validation des remises"}
          </p>
        </div>
        {canGenerate && (
          <button
            onClick={handleGenerate}
            disabled={isPending}
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            <Plus size={15} /> Générer bilan du jour
          </button>
        )}
      </div>

      {closures.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-12 text-center">
          <Clock size={36} className="text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-400 font-medium">Aucun bilan généré pour l&apos;instant</p>
          {canGenerate && <p className="text-zinc-300 text-sm mt-1">Cliquez sur &quot;Générer bilan du jour&quot; pour créer votre premier bilan.</p>}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {closures.map(c => {
            const hasDiscrepancy = c.discrepancy !== null && Math.abs(c.discrepancy) > 0
            return (
              <div key={c.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
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
                      ) : (
                        <Clock size={20} className="text-zinc-300" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-zinc-700">{c.date}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          c.type === "DAILY" ? "bg-blue-50 text-blue-600" : "bg-violet-50 text-violet-600"
                        }`}>
                          {c.type === "DAILY" ? "Journalier" : "Hebdomadaire"}
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
                    ) : canValidate ? (
                      validating === c.id ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <input
                            type="number" min={0}
                            value={validateForm.handedAmount}
                            onChange={e => setValidateForm({ ...validateForm, handedAmount: e.target.value })}
                            placeholder="Montant remis (FCFA)"
                            className="h-8 px-3 text-sm rounded-xl border border-zinc-200 w-44 focus:outline-none focus:ring-2 focus:ring-amber-400"
                          />
                          <input
                            value={validateForm.comments}
                            onChange={e => setValidateForm({ ...validateForm, comments: e.target.value })}
                            placeholder="Commentaire (opt.)"
                            className="h-8 px-3 text-sm rounded-xl border border-zinc-200 w-40 focus:outline-none focus:ring-2 focus:ring-amber-400"
                          />
                          <button
                            onClick={() => handleValidate(c.id)}
                            disabled={isPending}
                            className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                          >
                            Confirmer
                          </button>
                          <button onClick={() => setValidating(null)} className="h-8 px-3 text-zinc-400 hover:text-zinc-600 text-xs rounded-xl">
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setValidating(c.id)}
                          className="text-sm font-semibold text-amber-600 hover:text-amber-700 px-3 py-1.5 rounded-xl hover:bg-amber-50 transition-colors"
                        >
                          Valider la remise
                        </button>
                      )
                    ) : (
                      <span className="text-xs bg-zinc-50 text-zinc-400 px-2.5 py-1 rounded-full font-semibold">En attente</span>
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
