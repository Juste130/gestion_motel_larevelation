"use client"

import { useState, useTransition } from "react"
import { DollarSign, Plus, Trash2, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react"
import { addCashMovement, deleteCashMovement } from "@/app/actions/admin"
import { formatMoney } from "@/lib/utils"

type Movement = {
  id: string; label: string; amount: number; type: string; date: string;
  user?: { name: string | null } | null
}

export function FinancesClient({ movements: initMovements, role }: {
  movements: Movement[]; role: string
}) {
  const [movements, setMovements] = useState(initMovements)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    label: "", amount: "", type: "recette",
    date: new Date().toISOString().slice(0, 10)
  })
  const [isPending, startTransition] = useTransition()

  const canAdd = role === "ADMIN" || role === "RECEPTIONIST"
  const canDelete = role === "ADMIN"

  const reload = () => window.location.reload()

  const handleAdd = () => {
    if (!form.label || !form.amount) return
    startTransition(async () => {
      await addCashMovement({
        label: form.label, amount: parseFloat(form.amount),
        type: form.type, date: form.date
      })
      setForm({ label: "", amount: "", type: "recette", date: new Date().toISOString().slice(0, 10) })
      setShowForm(false)
      reload()
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm("Supprimer ce mouvement ?")) return
    startTransition(async () => {
      await deleteCashMovement(id)
      setMovements(prev => prev.filter(m => m.id !== id))
    })
  }

  const recettes = movements.filter(m => m.type === "recette").reduce((s, m) => s + m.amount, 0)
  const depenses = movements.filter(m => m.type === "depense").reduce((s, m) => s + m.amount, 0)
  const solde = recettes - depenses

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-zinc-900">Recettes & Dépenses</h1>
        <p className="text-zinc-500 mt-1 text-sm">
          {role === "RECEPTIONIST" ? "Vos mouvements de caisse" : "Tous les mouvements de caisse"}
          {" "}&mdash; <span className="font-medium text-zinc-600">Les données sont immuables après saisie.</span>
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <ArrowUpRight size={18} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Recettes</p>
            <p className="text-xl font-bold font-mono text-emerald-600">{formatMoney(recettes)}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
            <ArrowDownRight size={18} className="text-rose-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Dépenses</p>
            <p className="text-xl font-bold font-mono text-rose-500">{formatMoney(depenses)}</p>
          </div>
        </div>
        <div className={`rounded-2xl border shadow-sm p-5 flex items-center gap-4 ${solde >= 0 ? "bg-amber-50 border-amber-200" : "bg-white border-zinc-100"}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${solde >= 0 ? "bg-amber-100" : "bg-zinc-100"}`}>
            <Wallet size={18} className={solde >= 0 ? "text-amber-600" : "text-zinc-400"} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Solde net</p>
            <p className={`text-xl font-bold font-mono ${solde >= 0 ? "text-amber-700" : "text-rose-600"}`}>{formatMoney(solde)}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-50">
          <h2 className="font-bold text-zinc-800 text-sm">{movements.length} mouvement(s)</h2>
          {canAdd && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1.5 text-sm font-semibold bg-amber-400 hover:bg-amber-500 text-zinc-900 px-4 py-2 rounded-xl transition-colors"
            >
              <Plus size={15} /> Ajouter
            </button>
          )}
        </div>

        {showForm && canAdd && (
          <div className="px-6 py-4 border-b border-zinc-50 bg-zinc-50 flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
              <label className="text-xs font-semibold text-zinc-500">Libellé</label>
              <input
                value={form.label}
                onChange={e => setForm({ ...form, label: e.target.value })}
                placeholder="ex: Achat fournitures"
                className="h-9 px-3 text-sm rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              />
            </div>
            <div className="flex flex-col gap-1 w-32">
              <label className="text-xs font-semibold text-zinc-500">Montant (FCFA)</label>
              <input
                type="number" min={0} value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                placeholder="0"
                className="h-9 px-3 text-sm rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              />
            </div>
            <div className="flex flex-col gap-1 w-32">
              <label className="text-xs font-semibold text-zinc-500">Type</label>
              <select
                value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                className="h-9 px-3 text-sm rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              >
                <option value="recette">Recette</option>
                <option value="depense">Dépense</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 w-36">
              <label className="text-xs font-semibold text-zinc-500">Date</label>
              <input
                type="date" value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="h-9 px-3 text-sm rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              />
            </div>
            <button
              onClick={handleAdd} disabled={isPending}
              className="h-9 px-4 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              Enregistrer
            </button>
          </div>
        )}

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-50 text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
              <th className="text-left px-6 py-3">Date</th>
              <th className="text-left px-6 py-3">Libellé</th>
              {role !== "RECEPTIONIST" && <th className="text-left px-6 py-3">Saisi par</th>}
              <th className="text-left px-6 py-3">Type</th>
              <th className="text-right px-6 py-3">Montant</th>
              {canDelete && <th className="px-6 py-3" />}
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-zinc-400 py-12 text-sm">
                  Aucun mouvement enregistré
                </td>
              </tr>
            ) : (
              movements.map(m => (
                <tr key={m.id} className="border-t border-zinc-50 hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-3.5 text-zinc-400 font-mono text-xs">{m.date}</td>
                  <td className="px-6 py-3.5 font-medium text-zinc-800">{m.label}</td>
                  {role !== "RECEPTIONIST" && (
                    <td className="px-6 py-3.5 text-zinc-500 text-xs">{m.user?.name || "—"}</td>
                  )}
                  <td className="px-6 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      m.type === "recette"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        : "bg-rose-50 text-rose-700 border border-rose-100"
                    }`}>
                      {m.type === "recette" ? "Recette" : "Dépense"}
                    </span>
                  </td>
                  <td className={`px-6 py-3.5 text-right font-bold font-mono ${m.type === "recette" ? "text-emerald-600" : "text-rose-500"}`}>
                    {m.type === "recette" ? "+" : "-"}{formatMoney(m.amount)}
                  </td>
                  {canDelete && (
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
