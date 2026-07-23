"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, ArrowUp, ArrowDown, ChevronDown, ChevronUp, Wine, ShoppingBag, Loader2, X, Clock } from "lucide-react"
import { addStockMovement } from "@/app/actions/admin"
import { formatMoney, todayStr } from "@/lib/utils"
import { toast } from "sonner"

type Product = { id: string; name: string; category: string; price: number; stock: number }
type Movement = {
  id: string; type: string; qty: number; price: number | null; motif: string | null; date: string;
  product: { name: string; category: string }; user: { name: string | null } | null
}

const CATEGORIES: Record<string, { label: string; icon: React.ReactNode }> = {
  DRINK:  { label: "Boissons",      icon: <Wine size={15} className="text-amber-500" /> },
  CONDOM: { label: "Préservatifs",  icon: <ShoppingBag size={15} className="text-rose-400" /> },
}

export function StockPageClient({ products, movements, role }: {
  products: Product[]; movements: Movement[]; role: string
}) {
  const router = useRouter()
  const [showMovementForm, setShowMovementForm] = useState(false)
  const [form, setForm] = useState({
    type: "IN", qty: "", price: "", motif: "",
    date: todayStr(), productId: products[0]?.id ?? ""
  })
  const [expandedDate, setExpandedDate] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const canAdd = role === "ADMIN" || role === "RECEPTIONIST"

  const handleAdd = () => {
    if (!form.qty || parseInt(form.qty) <= 0) {
      toast.error("Veuillez saisir une quantité valide.")
      return
    }
    if (!form.productId) {
      toast.error("Veuillez sélectionner un produit.")
      return
    }
    if (form.type === "OUT" && !form.motif?.trim()) { 
      toast.error("Le motif est obligatoire pour une sortie.")
      return 
    }

    startTransition(async () => {
      try {
        await addStockMovement({
          type: form.type,
          qty: parseInt(form.qty),
          price: form.price ? parseFloat(form.price) : undefined,
          motif: form.motif || undefined,
          date: form.date,
          productId: form.productId
        })
        setForm({ type: "IN", qty: "", price: "", motif: "", date: todayStr(), productId: products[0]?.id ?? "" })
        setShowMovementForm(false)
        toast.success("Mouvement de stock enregistré !")
        router.refresh()
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Une erreur est survenue.")
      }
    })
  }

  // Group movements by date
  const movementsByDate = movements.reduce<Record<string, Movement[]>>((acc, m) => {
    acc[m.date] = acc[m.date] || []
    acc[m.date].push(m)
    return acc
  }, {})

  const stockValue = products.reduce((s, p) => s + p.stock * p.price, 0)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-zinc-900">Stock</h1>
        <p className="text-zinc-500 mt-1 text-sm">Gestion des stocks de produits</p>
      </div>

      {/* Stock value banner */}
      <div className="bg-gradient-to-r from-zinc-800 to-zinc-600 rounded-md p-5 text-white flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-zinc-300 text-xs font-semibold uppercase tracking-wider">Valeur totale du stock</p>
          <p className="text-3xl font-bold font-mono mt-1 truncate">{formatMoney(stockValue)}</p>
        </div>
        {canAdd && (
          <button
            onClick={() => setShowMovementForm(!showMovementForm)}
            className="btn-primary"
          >
            <Plus size={15} /> Mouvement
          </button>
        )}
      </div>

      {/* Add movement form */}
      {showMovementForm && canAdd && (
        <div className="card-base">
          <div className="px-6 py-5 bg-zinc-50/80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-zinc-800 text-sm">Nouveau mouvement de stock</h3>
              <button onClick={() => setShowMovementForm(false)} className="p-1 rounded-sm text-zinc-400 hover:text-zinc-600">
                <X size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex flex-col gap-1 w-32">
                <label className="label-base">Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                  className="select-base">
                  <option value="IN">Entrée (+)</option>
                  <option value="OUT">Sortie (-)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
                <label className="label-base">Produit <span className="text-red-400">*</span></label>
                <select value={form.productId} onChange={e => setForm({ ...form, productId: e.target.value })}
                  className="select-base">
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({CATEGORIES[p.category]?.label ?? p.category})</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1 w-24">
                <label className="label-base">Quantité <span className="text-red-400">*</span></label>
                <input type="number" min={1} value={form.qty} onChange={e => setForm({ ...form, qty: e.target.value })}
                  placeholder="0"
                  className="input-base" />
              </div>
              <div className="flex flex-col gap-1 w-28">
                <label className="label-base">Prix unit. (opt.)</label>
                <input type="number" min={0} value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                  placeholder="FCFA"
                  className="input-base" />
              </div>
              {form.type === "OUT" && (
                <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
                  <label className="label-base">Motif <span className="text-red-400">*</span></label>
                  <input value={form.motif} onChange={e => setForm({ ...form, motif: e.target.value })}
                    placeholder="ex: Vente bar, Casse..."
                    className="input-base" />
                </div>
              )}
              <div className="flex flex-col gap-1 w-36">
                <label className="label-base">Date</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                  className="input-base" />
              </div>
              <button onClick={handleAdd} disabled={isPending}
                className="btn-secondary h-10">
                {isPending ? <><Loader2 size={14} className="animate-spin" /> Traitement...</> : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products by category */}
      {["DRINK", "CONDOM"].map(cat => {
        const catProducts = products.filter(p => p.category === cat)
        if (!catProducts.length) return null
        return (
          <div key={cat} className="card-base">
            <div className="px-6 py-4 border-b border-zinc-50 flex items-center gap-2">
              {CATEGORIES[cat]?.icon}
              <h2 className="font-bold text-zinc-800">{CATEGORIES[cat]?.label}</h2>
              <span className="ml-auto text-xs font-semibold text-zinc-400">{catProducts.length} article(s)</span>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="bg-zinc-50 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="text-left px-6 py-3">Produit</th>
                  <th className="text-right px-6 py-3">Prix unitaire</th>
                  <th className="text-right px-6 py-3">Stock actuel</th>
                  <th className="text-right px-6 py-3">Valeur</th>
                </tr>
              </thead>
              <tbody>
                {catProducts.map(p => (
                  <tr key={p.id} className="border-t border-zinc-50 hover:bg-zinc-50">
                    <td className="px-6 py-3.5 font-medium text-zinc-800">{p.name}</td>
                    <td className="px-6 py-3.5 text-right font-mono text-zinc-500">{formatMoney(p.price)}</td>
                    <td className="px-6 py-3.5 text-right">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold font-mono ${
                        p.stock <= 3 ? "bg-red-50 text-red-600 border border-red-100"
                        : p.stock <= 10 ? "bg-amber-50 text-amber-700 border border-amber-100"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      }`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right font-bold font-mono text-zinc-700">{formatMoney(p.stock * p.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )
      })}

      {/* Movement history by day */}
      <div className="card-base">
        <div className="px-6 py-4 border-b border-zinc-50">
          <h2 className="font-bold text-zinc-800">Historique des mouvements</h2>
        </div>
        
        {Object.keys(movementsByDate).length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center">
              <Clock size={24} className="text-zinc-300" />
            </div>
            <p className="font-semibold text-zinc-400">Aucun historique disponible</p>
            <p className="text-sm text-zinc-400">Les mouvements de stock apparaîtront ici.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {Object.entries(movementsByDate).map(([date, dayMovements]) => (
              <div key={date}>
                <button
                  onClick={() => setExpandedDate(expandedDate === date ? null : date)}
                  className="w-full flex flex-wrap items-center justify-between gap-y-1 px-6 py-3.5 hover:bg-zinc-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-sm font-semibold text-zinc-700 truncate">{date}</span>
                    <span className="text-xs text-zinc-400 whitespace-nowrap">{dayMovements.length} mouvement(s)</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-emerald-600 font-semibold whitespace-nowrap">
                      +{dayMovements.filter(m => m.type === "IN").reduce((s, m) => s + m.qty, 0)} entrées
                    </span>
                    <span className="text-xs text-rose-500 font-semibold whitespace-nowrap">
                      -{dayMovements.filter(m => m.type === "OUT").reduce((s, m) => s + m.qty, 0)} sorties
                    </span>
                    {expandedDate === date ? <ChevronUp size={15} className="text-zinc-400" /> : <ChevronDown size={15} className="text-zinc-400" />}
                  </div>
                </button>
                {expandedDate === date && (
                  <div className="px-6 pb-3 overflow-x-auto">
                    <table className="w-full text-sm min-w-[480px]">
                      <thead>
                        <tr className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                          <th className="text-left py-2">Produit</th>
                          <th className="text-left py-2">Type</th>
                          <th className="text-right py-2">Qté</th>
                          <th className="text-left py-2">Motif</th>
                          {role !== "RECEPTIONIST" && <th className="text-left py-2">Par</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {dayMovements.map(m => (
                          <tr key={m.id}>
                            <td className="py-2 text-zinc-700 font-medium">{m.product.name}</td>
                            <td className="py-2">
                              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${
                                m.type === "IN" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"
                              }`}>
                                {m.type === "IN" ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                                {m.type === "IN" ? "Entrée" : "Sortie"}
                              </span>
                            </td>
                            <td className="py-2 text-right font-mono font-bold text-zinc-800">{m.qty}</td>
                            <td className="py-2 text-zinc-500 text-xs">{m.motif || "—"}</td>
                            {role !== "RECEPTIONIST" && <td className="py-2 text-zinc-400 text-xs">{m.user?.name || "—"}</td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}