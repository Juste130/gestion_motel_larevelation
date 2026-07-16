"use client"

import { useState, useTransition } from "react"
import { Plus, ArrowUp, ArrowDown, ChevronDown, ChevronUp, Wine, ShoppingBag } from "lucide-react"
import { addStockMovement } from "@/app/actions/admin"
import { formatMoney } from "@/lib/utils"

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
  const [showMovementForm, setShowMovementForm] = useState(false)
  const [form, setForm] = useState({
    type: "IN", qty: "", price: "", motif: "",
    date: new Date().toISOString().slice(0, 10), productId: products[0]?.id ?? ""
  })
  const [expandedDate, setExpandedDate] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const canAdd = role === "ADMIN" || role === "RECEPTIONIST"

  const handleAdd = () => {
    if (!form.qty || !form.productId) return
    if (form.type === "OUT" && !form.motif) { alert("Le motif est obligatoire pour une sortie."); return }
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
        setForm({ type: "IN", qty: "", price: "", motif: "", date: new Date().toISOString().slice(0, 10), productId: products[0]?.id ?? "" })
        setShowMovementForm(false)
        window.location.reload()
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Erreur")
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
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-700 rounded-2xl p-5 text-white flex items-center justify-between">
        <div>
          <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Valeur totale du stock</p>
          <p className="text-3xl font-bold font-mono mt-1">{formatMoney(stockValue)}</p>
        </div>
        {canAdd && (
          <button
            onClick={() => setShowMovementForm(!showMovementForm)}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-zinc-900 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus size={15} /> Mouvement
          </button>
        )}
      </div>

      {/* Add movement form */}
      {showMovementForm && canAdd && (
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 flex flex-col gap-4">
          <h2 className="font-bold text-zinc-800">Nouveau mouvement de stock</h2>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1 w-32">
              <label className="text-xs font-semibold text-zinc-500">Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                className="h-9 px-3 text-sm rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                <option value="IN">Entrée (+)</option>
                <option value="OUT">Sortie (-)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
              <label className="text-xs font-semibold text-zinc-500">Produit</label>
              <select value={form.productId} onChange={e => setForm({ ...form, productId: e.target.value })}
                className="h-9 px-3 text-sm rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({CATEGORIES[p.category]?.label ?? p.category})</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1 w-24">
              <label className="text-xs font-semibold text-zinc-500">Quantité</label>
              <input type="number" min={1} value={form.qty} onChange={e => setForm({ ...form, qty: e.target.value })}
                placeholder="0"
                className="h-9 px-3 text-sm rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white" />
            </div>
            <div className="flex flex-col gap-1 w-28">
              <label className="text-xs font-semibold text-zinc-500">Prix unit. (opt.)</label>
              <input type="number" min={0} value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                placeholder="FCFA"
                className="h-9 px-3 text-sm rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white" />
            </div>
            {form.type === "OUT" && (
              <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
                <label className="text-xs font-semibold text-zinc-500">Motif <span className="text-red-500">*</span></label>
                <input value={form.motif} onChange={e => setForm({ ...form, motif: e.target.value })}
                  placeholder="ex: Vente bar, Casse..."
                  className="h-9 px-3 text-sm rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white" />
              </div>
            )}
            <div className="flex flex-col gap-1 w-36">
              <label className="text-xs font-semibold text-zinc-500">Date</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                className="h-9 px-3 text-sm rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white" />
            </div>
            <button onClick={handleAdd} disabled={isPending}
              className="h-9 px-4 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-700 transition-colors disabled:opacity-50">
              Enregistrer
            </button>
          </div>
        </div>
      )}

      {/* Products by category */}
      {["DRINK", "CONDOM"].map(cat => {
        const catProducts = products.filter(p => p.category === cat)
        if (!catProducts.length) return null
        return (
          <div key={cat} className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-50 flex items-center gap-2">
              {CATEGORIES[cat]?.icon}
              <h2 className="font-bold text-zinc-800">{CATEGORIES[cat]?.label}</h2>
              <span className="ml-auto text-xs font-semibold text-zinc-400">{catProducts.length} article(s)</span>
            </div>
            <table className="w-full text-sm">
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
        )
      })}

      {/* Movement history by day */}
      {Object.keys(movementsByDate).length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-50">
            <h2 className="font-bold text-zinc-800">Historique des mouvements</h2>
          </div>
          <div className="divide-y divide-zinc-50">
            {Object.entries(movementsByDate).map(([date, dayMovements]) => (
              <div key={date}>
                <button
                  onClick={() => setExpandedDate(expandedDate === date ? null : date)}
                  className="w-full flex items-center justify-between px-6 py-3.5 hover:bg-zinc-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-zinc-700">{date}</span>
                    <span className="text-xs text-zinc-400">{dayMovements.length} mouvement(s)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-emerald-600 font-semibold">
                      +{dayMovements.filter(m => m.type === "IN").reduce((s, m) => s + m.qty, 0)} entrées
                    </span>
                    <span className="text-xs text-rose-500 font-semibold">
                      -{dayMovements.filter(m => m.type === "OUT").reduce((s, m) => s + m.qty, 0)} sorties
                    </span>
                    {expandedDate === date ? <ChevronUp size={15} className="text-zinc-400" /> : <ChevronDown size={15} className="text-zinc-400" />}
                  </div>
                </button>
                {expandedDate === date && (
                  <div className="px-6 pb-3">
                    <table className="w-full text-sm">
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
        </div>
      )}
    </div>
  )
}
