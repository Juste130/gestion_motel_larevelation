"use client"

import { useState } from "react"
import { Plus, X, Check } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { formatMoney, computeDuration } from "@/lib/utils"

export function EntryForm({ rooms, drinks, date, onCancel, onSave }: any) {
  const [receiptNo, setReceiptNo] = useState("")
  const [roomNum, setRoomNum] = useState(rooms[0]?.num || "")
  const [arrival, setArrival] = useState("")
  const [departure, setDeparture] = useState("")
  const [roomAmount, setRoomAmount] = useState("")
  const [condomAmount, setCondomAmount] = useState("")
  const [selectedDrinks, setSelectedDrinks] = useState<any[]>([])
  const [drinkPick, setDrinkPick] = useState(drinks[0]?.id || "")
  const [drinkQty, setDrinkQty] = useState(1)

  const room = rooms.find((r: any) => r.num === roomNum) || rooms[0]
  const roomTypeLabel = room?.label || room?.type

  const drinksAmount = selectedDrinks.reduce((s, d) => s + d.qty * d.price, 0)
  const total = (Number(roomAmount) || 0) + drinksAmount + (Number(condomAmount) || 0)

  function addDrink() {
    const d = drinks.find((x: any) => x.id === drinkPick)
    if (!d || drinkQty <= 0) return
    setSelectedDrinks((prev) => {
      const existing = prev.find((x) => x.id === d.id)
      if (existing) {
        return prev.map((x) => (x.id === d.id ? { ...x, qty: x.qty + Number(drinkQty) } : x))
      }
      return [...prev, { id: d.id, name: d.name, price: d.price, qty: Number(drinkQty) }]
    })
    setDrinkQty(1)
  }

  function removeDrink(id: string) {
    setSelectedDrinks((prev) => prev.filter((x) => x.id !== id))
  }

  function submit() {
    if (!roomNum) return
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
      drinks: selectedDrinks
    }
    onSave(entry)
  }

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 z-50 flex items-end justify-center backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-background w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-t-2xl p-6 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-serif text-xl font-bold text-primary m-0">Nouveau séjour</h3>
          <button onClick={onCancel} className="text-muted-foreground hover:bg-muted p-1 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>N° de reçu</Label>
            <Input value={receiptNo} onChange={(e) => setReceiptNo(e.target.value)} placeholder="0000" className="font-mono" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Chambre</Label>
            <select 
              value={roomNum} 
              onChange={(e) => setRoomNum(e.target.value)} 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {rooms.map((r: any) => (
                <option key={r.id} value={r.num}>{r.num} — {r.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Type de chambre</Label>
            <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
              {roomTypeLabel}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Temps effectué</Label>
            <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground font-mono">
              {computeDuration(arrival, departure) || "—"}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Heure d'arrivée</Label>
            <Input type="time" value={arrival} onChange={(e) => setArrival(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Heure de sortie (optionnel)</Label>
            <Input type="time" value={departure} onChange={(e) => setDeparture(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Montant payé (F)</Label>
            <Input type="number" inputMode="numeric" value={roomAmount} onChange={(e) => setRoomAmount(e.target.value)} placeholder="0" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Préservatif (F)</Label>
            <Input type="number" inputMode="numeric" value={condomAmount} onChange={(e) => setCondomAmount(e.target.value)} placeholder="0" />
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-4">
          <Label className="mb-3 block">Boissons consommées</Label>
          <div className="flex gap-2">
            <select 
              value={drinkPick} 
              onChange={(e) => setDrinkPick(e.target.value)} 
              className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {drinks.map((d: any) => (
                <option key={d.id} value={d.id}>{d.name} — {formatMoney(d.price)}</option>
              ))}
            </select>
            <Input type="number" min={1} value={drinkQty} onChange={(e) => setDrinkQty(Number(e.target.value))} className="w-20" />
            <Button onClick={addDrink} variant="secondary" size="icon"><Plus size={16} /></Button>
          </div>

          {selectedDrinks.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              {selectedDrinks.map((d) => (
                <div key={d.id} className="flex justify-between items-center bg-white border border-border rounded-md px-3 py-2">
                  <span className="text-sm font-medium">{d.name} x{d.qty}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold">{formatMoney(d.qty * d.price)}</span>
                    <button onClick={() => removeDrink(d.id)} className="text-destructive hover:bg-destructive/10 p-1 rounded">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-destructive/5 rounded-xl flex justify-between items-center border border-destructive/10">
          <span className="text-sm text-destructive font-bold">Total à payer</span>
          <span className="font-mono font-bold text-destructive text-xl">{formatMoney(total)}</span>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onCancel} className="flex-1">Annuler</Button>
          <Button onClick={submit} className="flex-[2]"><Check size={16} className="mr-2" /> Enregistrer</Button>
        </div>
      </div>
    </div>
  )
}
