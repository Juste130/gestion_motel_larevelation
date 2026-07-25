"use client"

import { useState } from "react"
import { X, Check, Wallet } from "lucide-react"
import { formatMoney } from "@/lib/utils"

export function RecordPaymentModal({ entry, accruedAmount, alreadyPaid, onCancel, onSave }: {
  entry: any
  accruedAmount: number
  alreadyPaid: number
  onCancel: () => void
  onSave: (amount: number) => void
}) {
  const remaining = Math.max(accruedAmount - alreadyPaid, 0)
  const [amount, setAmount] = useState(remaining > 0 ? remaining.toString() : "")

  function submit() {
    const val = parseFloat(amount)
    if (!val || val <= 0) return
    onSave(val)
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center backdrop-blur-sm p-4" onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} className="bg-card w-full max-w-sm rounded-md shadow-2xl">
        <div className="flex justify-between items-center px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
              <Wallet size={20} />
            </div>
            <h2 className="font-serif text-xl font-bold text-foreground m-0">Enregistrer un paiement</h2>
          </div>
          <button onClick={onCancel} className="text-zinc-400 hover:bg-zinc-100 p-2 rounded-sm transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-zinc-500">
            Chambre {entry.roomNum} — séjour en cours (arrivée {entry.arrival})
          </p>

          <div className="bg-zinc-50 rounded-md p-3 flex flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Valeur théorique à ce jour</span>
              <span className="font-mono font-medium">{formatMoney(accruedAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Déjà réglé</span>
              <span className="font-mono font-medium">{formatMoney(alreadyPaid)}</span>
            </div>
            <div className="flex justify-between border-t border-zinc-200 pt-1 mt-1">
              <span className="text-zinc-700 font-semibold">Reste théorique</span>
              <span className="font-mono font-bold text-amber-700">{formatMoney(remaining)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="label-base">Montant réglé maintenant</label>
            <input
              type="number" min={1} value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-base font-mono"
              autoFocus
            />
            <span className="text-[11px] text-zinc-400">
              Ce montant sera compté dans le bilan d'aujourd'hui, pas dans celui du jour d'arrivée du séjour.
            </span>
          </div>
        </div>

        <div className="border-t border-border p-6 flex gap-3">
          <button onClick={onCancel} className="btn-outline flex-1">Annuler</button>
          <button onClick={submit} className="btn-primary flex-[2]">
            <Check size={16} className="mr-2" /> Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}