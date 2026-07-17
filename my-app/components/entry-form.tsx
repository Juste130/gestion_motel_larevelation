"use client"

import { useState, useEffect } from "react"
import { Plus, X, Check, BedDouble, ShoppingCart, Receipt } from "lucide-react"
import { formatMoney, computeDuration, getBeninTime } from "@/lib/utils"
import { toast } from "sonner"

export function EntryForm({ rooms, drinks, date, onCancel, onSave }: any) {
  const products = drinks // On renomme en local
  const [receiptNo, setReceiptNo] = useState("")
  const [roomNum, setRoomNum] = useState(rooms[0]?.num || "")
  const [arrival, setArrival] = useState("")
  const [departure, setDeparture] = useState("")
  const [roomAmount, setRoomAmount] = useState(rooms[0]?.price?.toString() || "")
  const [condomAmount, setCondomAmount] = useState("")
  const [selectedProducts, setSelectedProducts] = useState<any[]>([])
  const [productPick, setProductPick] = useState("")
  const [productQty, setProductQty] = useState(1)

  // Pré-remplir avec l'heure actuelle
  useEffect(() => {
    const now = getBeninTime();
    setArrival(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
  }, []);

  // Raccourcis clavier
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onCancel])

  const room = rooms.find((r: any) => r.num === roomNum) || rooms[0]
  const roomTypeLabel = room?.label || room?.type

  const productsAmount = selectedProducts.reduce((s, d) => s + d.qty * d.price, 0)
  const total = (Number(roomAmount) || 0) + productsAmount + (Number(condomAmount) || 0)

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
    if (!roomNum) {
      toast.error("Veuillez sélectionner une chambre.")
      return
    }
    if (!arrival) {
      toast.error("Veuillez saisir l'heure d'arrivée.")
      return
    }

    const now = getBeninTime();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [h, m] = arrival.split(':').map(Number);
    const inputMinutes = h * 60 + m;
    const diff = Math.abs(inputMinutes - currentMinutes);
    const trueDiff = Math.min(diff, 1440 - diff);

    if (trueDiff > 10) {
      toast.error("L'heure spécifiée ne peut pas différer de plus de 10 minutes par rapport à l'heure actuelle.");
      return;
    }

    const entry = {
      date,
      receiptNo,
      roomNum,
      roomType: room?.type,
      roomTypeLabel,
      arrival,
      departure,
      duration: computeDuration(arrival, departure),
      roomAmount: Number(roomAmount) || 0,
      condomAmount: Number(condomAmount) || 0,
      drinks: selectedProducts
    }
    onSave(entry)
  }

  const selectClasses = "select-base"

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-md shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col"
      >
        <div className="sticky top-0 z-10 flex justify-between items-center px-6 py-4 border-b border-border bg-card/95 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl text-primary">
              <Receipt size={24} />
            </div>
            <h2 className="font-serif text-2xl font-bold text-foreground m-0">Nouveau séjour</h2>
          </div>
          <button onClick={onCancel} className="text-zinc-400 hover:bg-zinc-100 p-2 rounded-sm transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          
          <section className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-zinc-800">
              <BedDouble size={20} className="text-primary" />
              Détails de la chambre
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-secondary/40 rounded-md border border-border/50">
              <div className="flex flex-col gap-1.5">
                <label className="label-base">N° de reçu</label>
                <input value={receiptNo} onChange={(e) => setReceiptNo(e.target.value)} placeholder="Ex: 0001" className="input-base font-mono" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="label-base">Chambre</label>
                <select 
                  value={roomNum} 
                  onChange={(e) => {
                    const newNum = e.target.value
                    setRoomNum(newNum)
                    const r = rooms.find((x: any) => x.num === newNum)
                    if (r && r.price !== undefined) setRoomAmount(r.price.toString())
                  }} 
                  className={selectClasses}
                >
                  {rooms.map((r: any) => (
                    <option key={r.id} value={r.num}>Ch. {r.num} — {r.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="label-base">Heure d'arrivée</label>
                <input type="time" value={arrival} onChange={(e) => setArrival(e.target.value)} className="input-base" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="label-base">Heure de sortie <span className="text-zinc-400 font-normal">(optionnel)</span></label>
                <input type="time" value={departure} onChange={(e) => setDeparture(e.target.value)} className="input-base" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="label-base">Montant chambre (F CFA)</label>
                <input type="number" inputMode="numeric" value={roomAmount} onChange={(e) => setRoomAmount(e.target.value)} placeholder="0" className="input-base font-mono font-medium text-amber-700" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="label-base">Préservatifs (F CFA)</label>
                <input type="number" inputMode="numeric" value={condomAmount} onChange={(e) => setCondomAmount(e.target.value)} placeholder="0" className="input-base" />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-zinc-800">
              <ShoppingCart size={20} className="text-primary" />
              Consommations (Produits)
            </h3>
            <div className="p-5 bg-secondary/40 rounded-md border border-border/50">
              <div className="flex gap-3 items-end">
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="label-base">Produit</label>
                  <select value={productPick} onChange={(e) => setProductPick(e.target.value)} className={selectClasses}>
                    <option value="">Sélectionner un produit...</option>
                    {products.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name} — {formatMoney(d.price)}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="label-base">Qté</label>
                  <input type="number" min={1} value={productQty} onChange={(e) => setProductQty(Number(e.target.value))} className="input-base" />
                </div>
                <button onClick={addProduct} className="btn-secondary px-4 self-end h-10">
                  <Plus size={18} /> Ajouter
                </button>
              </div>

              {selectedProducts.length > 0 && (
                <div className="mt-4 flex flex-col gap-2">
                  {selectedProducts.map((d) => (
                    <div key={d.id} className="flex justify-between items-center bg-white border border-border rounded-md px-4 py-2.5 shadow-sm group hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 text-primary w-6 h-6 rounded flex items-center justify-center font-bold text-xs">{d.qty}x</div>
                        <span className="text-sm font-medium">{d.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-sm font-semibold text-zinc-600">{formatMoney(d.qty * d.price)}</span>
                        <button onClick={() => removeProduct(d.id)} className="text-zinc-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-sm transition-colors">
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="text-right text-sm font-medium text-muted-foreground mt-2 pr-2">
                    Sous-total produits: <span className="text-foreground">{formatMoney(productsAmount)}</span>
                  </div>
                </div>
              )}
            </div>
          </section>

        </div>

        <div className="sticky bottom-0 mt-auto bg-card border-t border-border p-6 rounded-b-md shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total à payer</span>
              <span className="font-mono font-bold text-3xl text-primary">{formatMoney(total)}</span>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button onClick={onCancel} className="btn-outline flex-1 md:flex-none">Annuler</button>
              <button onClick={submit} className="btn-primary flex-1 md:flex-none text-md px-8 h-11">
                <Check size={18} className="mr-2" /> Enregistrer le séjour
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
