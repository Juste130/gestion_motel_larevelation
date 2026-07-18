"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, Wallet, Loader2, X, BanknoteIcon } from "lucide-react"
import { addCashMovement, deleteCashMovement } from "@/app/actions/admin"
import { formatMoney, todayStr } from "@/lib/utils"
import { toast } from "sonner"

type Movement = {
  id: string; label: string; amount: number; type: string; date: string;
  user?: { name: string | null } | null
}

function ConfirmDeleteModal({ label, onConfirm, onCancel }: { label: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-md shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
        <div className="w-11 h-11 rounded-sm bg-red-50 flex items-center justify-center mb-4">
          <Trash2 size={20} className="text-red-500" />
        </div>
        <h3 className="font-bold text-zinc-900 text-lg mb-1">Supprimer ce mouvement ?</h3>
        <p className="text-sm text-zinc-500 mb-5 truncate">« {label} »</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-outline flex-1 h-10">
            Annuler
          </button>
          <button onClick={onConfirm} className="btn-destructive flex-1 h-10">
            Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}

export function FinancesClient({ movements: initMovements, role }: {
  movements: Movement[]; role: string
}) {
  const router = useRouter()
  const [movements, setMovements] = useState(initMovements)
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Movement | null>(null)
  const [form, setForm] = useState({
    label: "", amount: "", type: "recette",
    date: todayStr()
  })
  const [isPending, startTransition] = useTransition()
  const [filterType, setFilterType] = useState<"all" | "recette" | "depense">("all")

  const canAdd = role === "ADMIN" || role === "RECEPTIONIST"
  const canDelete = role === "ADMIN"

  const handleAdd = () => {
    if (!form.label.trim()) { toast.error("Le libellé est obligatoire."); return }
    if (!form.amount || parseFloat(form.amount) <= 0) { toast.error("Veuillez saisir un montant valide."); return }

    startTransition(async () => {
      try {
        await addCashMovement({
          label: form.label, amount: parseFloat(form.amount),
          type: form.type, date: form.date
        })
        setForm({ label: "", amount: "", type: "recette", date: todayStr() })
        setShowForm(false)
        toast.success("Mouvement enregistré avec succès !")
        router.refresh()
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Une erreur est survenue.")
      }
    })
  }

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    const targetId = deleteTarget.id
    const targetLabel = deleteTarget.label
    setDeleteTarget(null)
    startTransition(async () => {
      try {
        await deleteCashMovement(targetId)
        setMovements(prev => prev.filter(m => m.id !== targetId))
        toast.success(`Mouvement « ${targetLabel} » supprimé.`)
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Erreur lors de la suppression.")
      }
    })
  }

  const recettes = movements.filter(m => m.type === "recette").reduce((s, m) => s + m.amount, 0)
  const depenses = movements.filter(m => m.type === "depense").reduce((s, m) => s + m.amount, 0)
  const solde = recettes - depenses
  const filteredMovements = filterType === "all" ? movements : movements.filter(m => m.type === filterType)

  return (
    <div className="flex flex-col gap-6">
      {deleteTarget && (
        <ConfirmDeleteModal
          label={deleteTarget.label}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div>
        <h1 className="font-serif text-3xl font-bold text-zinc-900">Recettes & Dépenses</h1>
        <p className="text-zinc-500 mt-1 text-sm">
          {role === "RECEPTIONIST" ? "Vos mouvements de caisse" : "Tous les mouvements de caisse"}
          {" "}&mdash; <span className="font-medium text-zinc-600">Les données sont immuables après saisie.</span>
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-md border border-zinc-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <ArrowUpRight size={18} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Recettes</p>
            <p className="text-xl font-bold font-mono text-emerald-600">{formatMoney(recettes)}</p>
          </div>
        </div>
        <div className="bg-white rounded-md border border-zinc-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
            <ArrowDownRight size={18} className="text-rose-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Dépenses</p>
            <p className="text-xl font-bold font-mono text-rose-500">{formatMoney(depenses)}</p>
          </div>
        </div>
        <div className={`rounded-md border shadow-sm p-5 flex items-center gap-4 ${solde >= 0 ? "bg-amber-50 border-amber-200" : "bg-white border-zinc-100"}`}>
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
      <div className="bg-white rounded-md border border-zinc-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-50 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-zinc-800 text-sm">{filteredMovements.length} mouvement(s)</h2>
            {/* Filtres */}
            <div className="flex items-center gap-1 ml-3 bg-zinc-100 rounded-xl p-1">
              {(["all", "recette", "depense"] as const).map(f => (
                <button key={f} onClick={() => setFilterType(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    filterType === f
                      ? "bg-white shadow text-zinc-800"
                      : "text-zinc-400 hover:text-zinc-600"
                  }`}>
                  {f === "all" ? "Tous" : f === "recette" ? "Recettes" : "Dépenses"}
                </button>
              ))}
            </div>
          </div>
          {canAdd && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-primary h-9 px-4"
            >
              <Plus size={15} /> Ajouter
            </button>
          )}
        </div>

        {showForm && canAdd && (
          <div className="px-6 py-5 border-b border-zinc-100 bg-zinc-50/80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-zinc-800 text-sm">Nouveau mouvement</h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-sm text-zinc-400 hover:text-zinc-600">
                <X size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
                <label className="label-base">Libellé <span className="text-red-400">*</span></label>
                <input
                  value={form.label}
                  onChange={e => setForm({ ...form, label: e.target.value })}
                  placeholder="ex: Achat fournitures"
                  className="input-base"
                />
              </div>
              <div className="flex flex-col gap-1 w-36">
                <label className="label-base">Montant (FCFA) <span className="text-red-400">*</span></label>
                <input
                  type="number" min={0} value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  placeholder="0"
                  className="input-base"
                />
              </div>
              <div className="flex flex-col gap-1 w-32">
                <label className="label-base">Type</label>
                <select
                  value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                  className="select-base"
                >
                  <option value="recette">Recette</option>
                  <option value="depense">Dépense</option>
                </select>
              </div>
              <div className="flex flex-col gap-1 w-36">
                <label className="label-base">Date</label>
                <input
                  type="date" value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  className="input-base"
                />
              </div>
              <button
                onClick={handleAdd} disabled={isPending}
                className="btn-secondary h-10"
              >
                {isPending ? <><Loader2 size={14} className="animate-spin" /> Traitement...</> : "Enregistrer"}
              </button>
            </div>
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
            {filteredMovements.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center">
                      <BanknoteIcon size={24} className="text-zinc-300" />
                    </div>
                    <p className="font-semibold text-zinc-400">
                      {filterType === "all" ? "Aucun mouvement enregistré" : "Aucun résultat pour ce filtre"}
                    </p>
                    <p className="text-sm text-zinc-400">Les mouvements de caisse apparaîtront ici.</p>
                    {canAdd && filterType === "all" && (
                      <button onClick={() => setShowForm(true)} className="btn-primary h-9 px-4 mt-2">
                        Enregistrer un premier mouvement →
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredMovements.map(m => (
                <tr key={m.id} className="border-t border-zinc-50 hover:bg-zinc-50/60 transition-colors">
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
                        onClick={() => setDeleteTarget(m)}
                        disabled={isPending}
                        className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-sm transition-colors disabled:opacity-30"
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



