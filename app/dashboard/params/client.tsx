"use client"

import { useState, useTransition } from "react"
import { Plus, Trash2 } from "lucide-react"
import { addRoom, deleteRoom, addProduct, deleteProduct } from "@/app/actions/admin"
import { formatMoney } from "@/lib/utils"

type Room = { id: string; num: string; type: string; label: string; price: number }
type Product = { id: string; name: string; category: string; price: number; stock: number }

export function ParamsPageClient({ rooms: initRooms, products: initProducts, role }: {
  rooms: Room[]; products: Product[]; role: string
}) {
  const [rooms, setRooms] = useState(initRooms)
  const [products, setProducts] = useState(initProducts)
  const [roomForm, setRoomForm] = useState({ num: "", type: "C", label: "Confort", price: 0 })
  const [productForm, setProductForm] = useState({ name: "", category: "DRINK", price: "", stock: "0" })
  const [isPending, startTransition] = useTransition()

  const canModify = role === "ADMIN" || role === "DG"
  const canDelete = role === "ADMIN"

  const handleAddRoom = () => {
    if (!roomForm.num) return
    startTransition(async () => {
      await addRoom(roomForm)
      setRooms(prev => [...prev, { ...roomForm, id: Date.now().toString() }])
      setRoomForm({ num: "", type: "C", label: "Confort", price: 0 })
    })
  }

  const handleDeleteRoom = (id: string) => {
    startTransition(async () => {
      await deleteRoom(id)
      setRooms(prev => prev.filter(r => r.id !== id))
    })
  }

  const handleAddProduct = () => {
    if (!productForm.name || !productForm.price) return
    startTransition(async () => {
      await addProduct({
        name: productForm.name,
        category: productForm.category,
        price: parseFloat(productForm.price),
        stock: parseInt(productForm.stock) || 0
      })
      setProducts(prev => [...prev, {
        ...productForm, id: Date.now().toString(),
        price: parseFloat(productForm.price), stock: parseInt(productForm.stock) || 0
      }])
      setProductForm({ name: "", category: "DRINK", price: "", stock: "0" })
    })
  }

  const handleDeleteProduct = (id: string) => {
    startTransition(async () => {
      await deleteProduct(id)
      setProducts(prev => prev.filter(p => p.id !== id))
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-zinc-900">Paramètres</h1>
        <p className="text-zinc-500 mt-1 text-sm">
          {canModify ? "Gestion des chambres et du catalogue de produits" : "Consultation du catalogue (lecture seule)"}
        </p>
      </div>

      {/* Chambres */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-50 flex items-center justify-between">
          <h2 className="font-bold text-zinc-800">Chambres</h2>
          <span className="text-xs text-zinc-400 font-semibold">{rooms.length} chambre(s)</span>
        </div>
        {canModify && (
          <div className="px-6 py-4 border-b border-zinc-50 bg-zinc-50 flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-500">N° Chambre</label>
              <input value={roomForm.num} onChange={e => setRoomForm({ ...roomForm, num: e.target.value })}
                placeholder="ex: 101"
                className="h-9 w-24 px-3 text-sm rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-500">Type</label>
              <select value={roomForm.type} onChange={e => {
                const labels: Record<string, string> = { C: "Confort", V: "VIP", A: "Appartement" }
                setRoomForm({ ...roomForm, type: e.target.value, label: labels[e.target.value] ?? e.target.value })
              }} className="h-9 px-3 text-sm rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                <option value="C">Confort</option>
                <option value="V">VIP</option>
                <option value="A">Appartement</option>
              </select>
            </div>
            <button onClick={handleAddRoom} disabled={isPending}
              className="btn-secondary h-9 px-4">
              <Plus size={14} /> Ajouter
            </button>
          </div>
        )}
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[480px]">
          <thead>
            <tr className="bg-zinc-50 text-xs font-bold text-zinc-400 uppercase tracking-wider">
              <th className="text-left px-6 py-3">Numéro</th>
              <th className="text-left px-6 py-3">Type</th>
              <th className="text-left px-6 py-3">Label</th>
              {canDelete && <th className="px-6 py-3" />}
            </tr>
          </thead>
          <tbody>
            {rooms.map(r => (
              <tr key={r.id} className="border-t border-zinc-50 hover:bg-zinc-50">
                <td className="px-6 py-3.5 font-bold font-mono text-zinc-800">{r.num}</td>
                <td className="px-6 py-3.5"><span className="text-xs font-bold px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600">{r.type}</span></td>
                <td className="px-6 py-3.5 text-zinc-600">{r.label}</td>
                {canDelete && (
                  <td className="px-6 py-3.5 text-right">
                    <button onClick={() => handleDeleteRoom(r.id)} className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-sm transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {rooms.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-400 text-sm">Aucune chambre enregistrée</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Produits */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-50 flex items-center justify-between">
          <h2 className="font-bold text-zinc-800">Catalogue de produits</h2>
          <span className="text-xs text-zinc-400 font-semibold">{products.length} produit(s)</span>
        </div>
        {canModify && (
          <div className="px-6 py-4 border-b border-zinc-50 bg-zinc-50 flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1 flex-1 min-w-[130px]">
              <label className="text-xs font-semibold text-zinc-500">Nom</label>
              <input value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                placeholder="ex: Castel Bière"
                className="h-9 px-3 text-sm rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white" />
            </div>
            <div className="flex flex-col gap-1 w-36">
              <label className="text-xs font-semibold text-zinc-500">Catégorie</label>
              <select value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                className="h-9 px-3 text-sm rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                <option value="DRINK">Boisson</option>
                <option value="CONDOM">Préservatif</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 w-32">
              <label className="text-xs font-semibold text-zinc-500">Prix (FCFA)</label>
              <input type="number" min={0} value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                placeholder="0"
                className="h-9 px-3 text-sm rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white" />
            </div>
            <div className="flex flex-col gap-1 w-24">
              <label className="text-xs font-semibold text-zinc-500">Stock init.</label>
              <input type="number" min={0} value={productForm.stock} onChange={e => setProductForm({ ...productForm, stock: e.target.value })}
                placeholder="0"
                className="h-9 px-3 text-sm rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white" />
            </div>
            <button onClick={handleAddProduct} disabled={isPending}
              className="btn-secondary h-9 px-4">
              <Plus size={14} /> Ajouter
            </button>
          </div>
        )}
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="bg-zinc-50 text-xs font-bold text-zinc-400 uppercase tracking-wider">
              <th className="text-left px-6 py-3">Nom</th>
              <th className="text-left px-6 py-3">Catégorie</th>
              <th className="text-right px-6 py-3">Prix</th>
              <th className="text-right px-6 py-3">Stock</th>
              {canDelete && <th className="px-6 py-3" />}
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="border-t border-zinc-50 hover:bg-zinc-50">
                <td className="px-6 py-3.5 font-medium text-zinc-800">{p.name}</td>
                <td className="px-6 py-3.5">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    p.category === "DRINK" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-600"
                  }`}>
                    {p.category === "DRINK" ? "Boisson" : "Préservatif"}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-right font-mono text-zinc-500">{formatMoney(p.price)}</td>
                <td className="px-6 py-3.5 text-right">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold font-mono ${
                    p.stock <= 3 ? "bg-red-50 text-red-600" : p.stock <= 10 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                  }`}>{p.stock}</span>
                </td>
                {canDelete && (
                  <td className="px-6 py-3.5 text-right">
                    <button onClick={() => handleDeleteProduct(p.id)} className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-sm transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-zinc-400 text-sm">Aucun produit enregistré</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}