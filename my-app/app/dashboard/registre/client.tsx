"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Clock, Trash2, Calendar, FileText } from "lucide-react"
import { addEntry, updateDeparture, deleteEntry } from "@/app/actions/entries"
import { formatMoney } from "@/lib/utils"

type Room = { id: string; num: string; type: string; label: string }
type Product = { id: string; name: string; category: string; price: number; stock: number }

export function RegistreClient({ entries, rooms, products, currentDate, role }: {
  entries: any[]; rooms: Room[]; products: Product[]; currentDate: string; role: string
}) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    receiptNo: "", roomNum: "", arrival: "", duration: "",
    roomAmount: "", condomAmount: ""
  })
  const [selectedProducts, setSelectedProducts] = useState<{ id: string; qty: number; price: number }[]>([])
  
  const [isPending, startTransition] = useTransition()
  const [departures, setDepartures] = useState<Record<string, string>>({})

  const canAdd = role === "ADMIN" || role === "RECEPTIONIST"
  const canDelete = role === "ADMIN" || role === "DG"

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    router.push(`/dashboard/registre?date=${e.target.value}`)
  }

  const handleAddProduct = (productId: string) => {
    if (!productId) return
    const p = products.find(x => x.id === productId)
    if (!p) return
    if (selectedProducts.find(x => x.id === productId)) return
    setSelectedProducts([...selectedProducts, { id: p.id, qty: 1, price: p.price }])
  }

  const handleRemoveProduct = (id: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== id))
  }

  const handleProductQtyChange = (id: string, qty: number) => {
    setSelectedProducts(selectedProducts.map(p => p.id === id ? { ...p, qty } : p))
  }

  const handleSubmit = () => {
    if (!form.roomNum) {
      alert("La chambre est obligatoire")
      return
    }
    
    const r = rooms.find(x => x.num === form.roomNum)
    if (!r) return

    startTransition(async () => {
      try {
        await addEntry({
          date: currentDate,
          receiptNo: form.receiptNo || undefined,
          roomNum: r.num,
          roomType: r.type,
          roomTypeLabel: r.label,
          arrival: form.arrival || undefined,
          duration: form.duration || undefined,
          roomAmount: parseFloat(form.roomAmount) || 0,
          condomAmount: parseFloat(form.condomAmount) || 0,
          products: selectedProducts
        })
        setForm({ receiptNo: "", roomNum: "", arrival: "", duration: "", roomAmount: "", condomAmount: "" })
        setSelectedProducts([])
        setShowForm(false)
        router.refresh()
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Erreur")
      }
    })
  }

  const handleSetDeparture = (id: string) => {
    const time = departures[id]
    if (!time) return
    startTransition(async () => {
      try {
        await updateDeparture(id, time, "—")
        router.refresh()
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Erreur")
      }
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cet enregistrement ?")) return
    startTransition(async () => {
      try {
        await deleteEntry(id)
        router.refresh()
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Erreur")
      }
    })
  }

  const totalRecettes = entries.reduce((s, e) => s + e.total, 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-zinc-900">Registre & Séjours</h1>
          <p className="text-zinc-500 mt-1 text-sm">Suivi des entrées et séjours</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="date"
              value={currentDate}
              onChange={handleDateChange}
              className="pl-10 pr-4 py-2 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          </div>
          {canAdd && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
            >
              <Plus size={15} /> Nouvelle entrée
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 flex flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total recettes (jour)</p>
          <p className="text-2xl font-bold font-mono text-zinc-800 mt-1">{formatMoney(totalRecettes)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 flex flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Séjours</p>
          <p className="text-2xl font-bold font-mono text-zinc-800 mt-1">{entries.length}</p>
        </div>
      </div>

      {showForm && canAdd && (
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-zinc-50 pb-4">
            <h2 className="font-bold text-zinc-800 flex items-center gap-2">
              <FileText size={18} className="text-amber-500" />
              Nouveau séjour
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-500">N° Reçu (opt.)</label>
              <input value={form.receiptNo} onChange={e => setForm({ ...form, receiptNo: e.target.value })}
                className="h-10 px-3 text-sm rounded-xl border border-zinc-200 focus:ring-2 focus:ring-amber-400 bg-zinc-50" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-500">Chambre <span className="text-red-500">*</span></label>
              <select value={form.roomNum} onChange={e => setForm({ ...form, roomNum: e.target.value })}
                className="h-10 px-3 text-sm rounded-xl border border-zinc-200 focus:ring-2 focus:ring-amber-400 bg-zinc-50">
                <option value="">Sélectionner</option>
                {rooms.map(r => <option key={r.id} value={r.num}>{r.num} - {r.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-500">Heure Arrivée</label>
              <input type="time" value={form.arrival} onChange={e => setForm({ ...form, arrival: e.target.value })}
                className="h-10 px-3 text-sm rounded-xl border border-zinc-200 focus:ring-2 focus:ring-amber-400 bg-zinc-50" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-500">Montant Chambre (FCFA)</label>
              <input type="number" min={0} value={form.roomAmount} onChange={e => setForm({ ...form, roomAmount: e.target.value })}
                placeholder="0"
                className="h-10 px-3 text-sm rounded-xl border border-zinc-200 focus:ring-2 focus:ring-amber-400 bg-zinc-50" />
            </div>
          </div>

          <div className="border-t border-zinc-100 pt-5">
            <h3 className="text-sm font-bold text-zinc-700 mb-3">Consommations (Produits)</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <select onChange={e => handleAddProduct(e.target.value)} value=""
                  className="h-9 px-3 text-sm rounded-xl border border-zinc-200 focus:ring-2 focus:ring-amber-400 bg-zinc-50">
                  <option value="">+ Ajouter un produit</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.category === "DRINK" ? "Boisson" : "Préservatif"}) - {formatMoney(p.price)}</option>)}
                </select>
                {selectedProducts.length > 0 && (
                  <span className="text-xs text-zinc-400 font-medium">{selectedProducts.length} produit(s) sélectionné(s)</span>
                )}
              </div>
              
              {selectedProducts.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  {selectedProducts.map(sp => {
                    const p = products.find(x => x.id === sp.id)
                    return (
                      <div key={sp.id} className="flex items-center gap-3 bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                        <span className="text-sm font-medium flex-1 text-zinc-800">{p?.name}</span>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-zinc-500">Qté:</label>
                          <input type="number" min={1} value={sp.qty} onChange={e => handleProductQtyChange(sp.id, parseInt(e.target.value) || 1)}
                            className="w-16 h-8 px-2 text-sm rounded border border-zinc-200" />
                        </div>
                        <span className="text-sm font-mono font-bold text-zinc-600 w-24 text-right">
                          {formatMoney(sp.price * sp.qty)}
                        </span>
                        <button onClick={() => handleRemoveProduct(sp.id)} className="p-1.5 text-zinc-400 hover:text-red-500 rounded">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-50">
            <button onClick={handleSubmit} disabled={isPending}
              className="bg-amber-400 hover:bg-amber-500 text-zinc-900 font-bold px-6 py-2.5 rounded-xl transition-colors shadow-sm disabled:opacity-50">
              Enregistrer le séjour
            </button>
          </div>
        </div>
      )}

      {/* Entries List */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-50 text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
              <th className="text-left px-5 py-3">Chambre</th>
              <th className="text-left px-5 py-3">Horaires</th>
              <th className="text-left px-5 py-3">Consommations</th>
              <th className="text-right px-5 py-3">Total (FCFA)</th>
              {canDelete && <th className="px-5 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {entries.length === 0 ? (
              <tr><td colSpan={5} className="text-center text-zinc-400 py-12">Aucun enregistrement pour ce jour.</td></tr>
            ) : entries.map(entry => (
              <tr key={entry.id} className="hover:bg-zinc-50/50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-amber-500 uppercase leading-none">{entry.roomType}</span>
                      <span className="text-sm font-bold text-amber-700 font-mono leading-tight">{entry.roomNum}</span>
                    </div>
                    <div>
                      {entry.receiptNo && <p className="text-xs font-mono text-zinc-400 mb-0.5">Reçu: {entry.receiptNo}</p>}
                      <p className="text-xs text-zinc-400 font-medium">Créé par {entry.user?.name || "—"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-zinc-600 text-xs font-mono">
                      <span className="font-bold text-zinc-800">Arr:</span> {entry.arrival || "—"}
                    </div>
                    {entry.departure ? (
                      <div className="flex items-center gap-2 text-zinc-600 text-xs font-mono">
                        <span className="font-bold text-zinc-800">Dép:</span> {entry.departure}
                      </div>
                    ) : canAdd ? (
                      <div className="flex items-center gap-1.5">
                        <input type="time" value={departures[entry.id] || ""} onChange={e => setDepartures({ ...departures, [entry.id]: e.target.value })}
                          className="h-7 px-2 text-xs font-mono rounded border border-zinc-200 focus:ring-1 focus:ring-amber-400 bg-white" />
                        <button onClick={() => handleSetDeparture(entry.id)} disabled={isPending || !departures[entry.id]}
                          className="h-7 w-7 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded transition-colors disabled:opacity-50">
                          <Clock size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-400 font-mono">En cours</div>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4">
                  {entry.products.length > 0 ? (
                    <ul className="flex flex-col gap-1">
                      {entry.products.map((p: any) => (
                        <li key={p.id} className="text-xs text-zinc-600 flex items-center justify-between gap-4">
                          <span><span className="font-bold">{p.qty}x</span> {p.product.name}</span>
                          <span className="font-mono text-zinc-400">{formatMoney(p.price * p.qty)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <span className="text-xs text-zinc-400 italic">Aucune</span>}
                </td>
                <td className="px-5 py-4 text-right">
                  <p className="font-bold font-mono text-lg text-emerald-600">{formatMoney(entry.total)}</p>
                  <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-wider">
                    (Ch. {formatMoney(entry.roomAmount)} + Prod. {formatMoney(entry.drinksAmount)})
                  </p>
                </td>
                {canDelete && (
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => handleDelete(entry.id)} className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
