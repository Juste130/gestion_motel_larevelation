"use client"

import { useState, useEffect } from "react"
import { X, Check, ShoppingCart, Plus, Trash2 } from "lucide-react"
import { formatMoney } from "@/lib/utils"

export function AddProductModal({ entry, products, onCancel, onSave }: any) {
  const [selectedProducts, setSelectedProducts] = useState<any[]>([])
  const [productPick, setProductPick] = useState("")
  const [productQty, setProductQty] = useState(1)

  // Raccourci clavier Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onCancel])

  const additionalTotal = selectedProducts.reduce((s, d) => s + d.qty * d.price, 0)

  function addProduct() {
    const d = products.find((x: any) => x.id === productPick)
    if (!d || productQty <= 0) return
    setSelectedProducts((prev) => {
      const existing = prev.find((x) => x.id === d.id)
      if (existing) {
        return prev.map((x) => (x.id === d.id ? { ...x, qty: x.qty + Number(productQty) } : x))
      }
      return [...prev, { id: d.id, name: d.name, price: d.price, qty: Number(productQty) }]
    })
    setProductQty(1)
    setProductPick("")
  }

  function removeProduct(id: string) {
    setSelectedProducts((prev) => prev.filter((x) => x.id !== id))
  }

  function submit() {
    if (selectedProducts.length === 0) return
    onSave(selectedProducts)
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card w-full max-w-md max-h-[90vh] overflow-y-auto rounded-md shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col"
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-card/95">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
              <ShoppingCart size={20} />
            </div>
            <h2 className="font-serif text-xl font-bold text-foreground m-0">Ajouter conso.</h2>
          </div>
          <button onClick={onCancel} className="text-zinc-400 hover:bg-zinc-100 p-2 rounded-sm transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex gap-2">
            <select 
              value={productPick} 
              onChange={(e) => setProductPick(e.target.value)} 
              className="select-base flex-1"
            >
              <option value="">Sélectionner un produit...</option>
              {products.map((d: any) => (
                <option key={d.id} value={d.id}>{d.name} — {formatMoney(d.price)}</option>
              ))}
            </select>
            <input type="number" min={1} value={productQty} onChange={(e) => setProductQty(Number(e.target.value))} className="input-base w-16" />
            <button onClick={addProduct} className="btn-outline h-10 w-10 p-0 flex items-center justify-center flex-shrink-0"><Plus size={16} /></button>
          </div>

          {selectedProducts.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              {selectedProducts.map((d) => (
                <div key={d.id} className="flex justify-between items-center bg-zinc-50 border border-zinc-200 rounded-md px-3 py-2">
                  <span className="text-sm font-medium">{d.name} <span className="text-zinc-400 font-bold ml-1">x{d.qty}</span></span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold">{formatMoney(d.qty * d.price)}</span>
                    <button onClick={() => removeProduct(d.id)} className="text-zinc-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-sm">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedProducts.length > 0 && (
            <div className="flex justify-between items-center pt-4 border-t border-border mt-4">
              <span className="text-sm text-zinc-500 font-medium">Sous-total :</span>
              <span className="font-mono font-bold text-amber-600">{formatMoney(additionalTotal)}</span>
            </div>
          )}
        </div>

        <div className="bg-card border-t border-border p-4 rounded-b-md">
          <button onClick={submit} disabled={selectedProducts.length === 0} className="btn-primary w-full h-11">
            <Check size={18} className="mr-2" /> Valider l'ajout
          </button>
        </div>
      </div>
    </div>
  )
}
