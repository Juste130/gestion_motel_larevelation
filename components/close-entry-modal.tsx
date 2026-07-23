"use client"

import { useState, useEffect, useMemo } from "react"
import { X, Check, Plus, Trash2, DoorOpen, Split } from "lucide-react"
import { formatMoney, getBeninTime, computeOvershootHours } from "@/lib/utils"
import { toast } from "sonner"

export function CloseEntryModal({ entry, products, room, currentDate, onCancel, onSave, onSplit }: any) {
  const [departure, setDeparture] = useState("")
  const [stayType, setStayType] = useState<"HORAIRE" | "NUITEE">(entry.stayType || "HORAIRE")
  const [roomAmount, setRoomAmount] = useState(entry.roomAmount.toString())
  const [selectedProducts, setSelectedProducts] = useState<any[]>([])
  const [productPick, setProductPick] = useState("")
  const [productQty, setProductQty] = useState(1)
  const [splitMode, setSplitMode] = useState(false)
  const [nightlyAmount, setNightlyAmount] = useState(entry.roomAmount.toString())
  const [hourlyAmount, setHourlyAmount] = useState("0")

  useEffect(() => {
    const now = getBeninTime();
    setDeparture(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
  }, []);

  // Raccourci clavier Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onCancel])

  // Heures de dépassement après 12h00, calculées à partir de l'heure de départ saisie
  const overshootHours = useMemo(() => computeOvershootHours(departure), [departure])

  // Le bouton de scission n'a de sens que pour un séjour NUITEE, avec un
  // dépassement réel (>0h), et seulement si ce dépassement reste raisonnable
  // (≤4h) — au-delà, une nuitée pleine supplémentaire est presque toujours
  // plus avantageuse pour le client, la scission perd son intérêt.
  const canSplit = entry.stayType === "NUITEE" && overshootHours > 0 && overshootHours <= 4

  useEffect(() => {
    if (canSplit && room) {
      setHourlyAmount((room.priceHourly * overshootHours).toString())
    }
  }, [canSplit, overshootHours, room])

  const newDrinksAmount = selectedProducts.reduce((s, d) => s + d.qty * d.price, 0)
  const newTotal = entry.total - entry.roomAmount + (parseFloat(roomAmount) || 0) + newDrinksAmount

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

  function validateDepartureTime() {
    const now = getBeninTime();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [h, m] = departure.split(':').map(Number);
    const inputMinutes = h * 60 + m;

    const diff = Math.abs(inputMinutes - currentMinutes);
    const trueDiff = Math.min(diff, 1440 - diff);
    if (trueDiff > 10) {
      toast.error("L'heure de départ ne peut pas différer de plus de 10 minutes par rapport à l'heure actuelle.");
      return false;
    }

    if (entry.date === currentDate && entry.arrival) {
      const [ah, am] = entry.arrival.split(':').map(Number);
      const arrMinutes = ah * 60 + am;
      if (inputMinutes <= arrMinutes) {
        toast.error("L'heure de départ doit être strictement supérieure à l'heure d'arrivée.");
        return false;
      }
    }
    return true
  }

  function submit() {
    if (!departure) {
      toast.error("Veuillez saisir l'heure de départ.")
      return
    }
    if (!validateDepartureTime()) return

    onSave({
      departure,
      stayType,
      roomAmount: parseFloat(roomAmount) || 0,
      products: selectedProducts
    })
  }

  function submitSplit() {
    if (!departure) {
      toast.error("Veuillez saisir l'heure de départ.")
      return
    }
    if (!validateDepartureTime()) return

    onSplit({
      currentDate,
      actualDeparture: departure,
      nightlyAmount: parseFloat(nightlyAmount) || 0,
      hourlyAmount: parseFloat(hourlyAmount) || 0,
    })
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-md shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col"
      >
        <div className="sticky top-0 z-10 flex justify-between items-center px-6 py-4 border-b border-border bg-card/95 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
              <DoorOpen size={24} />
            </div>
            <h2 className="font-serif text-2xl font-bold text-foreground m-0">Clôturer le séjour</h2>
          </div>
          <button onClick={onCancel} className="text-zinc-400 hover:bg-zinc-100 p-2 rounded-sm transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Recap chambre */}
          <div className="bg-amber-50 p-4 rounded-md border border-amber-100 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-amber-800">Chambre {entry.roomNum} ({entry.roomType})</p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase tracking-wider">
                {entry.stayType === "NUITEE" ? "Nuitée" : "Horaire"}
              </span>
            </div>
            <p className="text-xs text-amber-700">Heure d'arrivée initiale : <span className="font-mono font-bold">{entry.arrival || "—"}</span></p>
            {entry.products && entry.products.length > 0 && (
              <div className="mt-2 pt-2 border-t border-amber-200">
                <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-1">Consommations déjà enregistrées :</p>
                <ul className="flex flex-col gap-1">
                  {entry.products.map((p: any) => (
                    <li key={p.id} className="text-xs text-amber-800 flex items-center justify-between">
                      <span><span className="font-bold">{p.qty}x</span> {p.product?.name || "Produit"}</span>
                      <span className="font-mono">{formatMoney(p.qty * p.price)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="label-base">Heure de départ (Fin)</label>
            <input type="time" value={departure} onChange={(e) => setDeparture(e.target.value)} className="input-base" />
          </div>

          {/* Alerte + proposition de scission — nuitée avec dépassement raisonnable */}
          {canSplit && !splitMode && (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
              <Split size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-blue-800">
                  Dépassement de {overshootHours}h après 12h00
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Vous pouvez clôturer la nuitée à 12h00 et facturer séparément les {overshootHours}h supplémentaires à l'horaire.
                </p>
                <button
                  onClick={() => setSplitMode(true)}
                  className="btn-secondary h-8 px-3 text-xs mt-2"
                >
                  <Split size={12} /> Scinder Nuitée + Horaire
                </button>
              </div>
            </div>
          )}

          {splitMode ? (
            <div className="rounded-md border border-blue-200 bg-blue-50/50 p-4 space-y-3">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Scission du séjour</p>
              <div className="flex gap-3">
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="label-base">Montant nuitée (clôturée à 12h00)</label>
                  <input type="number" inputMode="numeric" value={nightlyAmount} onChange={(e) => setNightlyAmount(e.target.value)} className="input-base font-mono" />
                </div>
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="label-base">Montant horaire ({overshootHours}h dépassées)</label>
                  <input type="number" inputMode="numeric" value={hourlyAmount} onChange={(e) => setHourlyAmount(e.target.value)} className="input-base font-mono" />
                </div>
              </div>
              <p className="text-[11px] text-blue-600">
                Deux séjours distincts seront créés : la nuitée d'origine (clôturée à 12h00) et un nouveau séjour horaire (12h00 → {departure || "—"}).
              </p>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setSplitMode(false)} className="btn-outline h-9 px-3 text-xs flex-1">Annuler la scission</button>
                <button onClick={submitSplit} className="btn-primary h-9 px-3 text-xs flex-[2]">
                  <Check size={14} /> Confirmer la scission
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex gap-4">
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="label-base">Type de séjour</label>
                  <div className="inline-flex rounded-md bg-zinc-100 p-1 w-full">
                    <button
                      type="button"
                      onClick={() => { setStayType("HORAIRE"); if (room) setRoomAmount(room.priceHourly.toString()) }}
                      className={`flex-1 h-9 rounded-sm text-sm font-semibold transition-colors ${stayType === "HORAIRE" ? "bg-white text-amber-700 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
                    >
                      Horaire
                    </button>
                    <button
                      type="button"
                      onClick={() => { setStayType("NUITEE"); if (room) setRoomAmount(room.priceNightly.toString()) }}
                      className={`flex-1 h-9 rounded-sm text-sm font-semibold transition-colors ${stayType === "NUITEE" ? "bg-white text-amber-700 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
                    >
                      Nuitée
                    </button>
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="label-base">Montant Total Chambre</label>
                  <input type="number" inputMode="numeric" value={roomAmount} onChange={(e) => setRoomAmount(e.target.value)} className="input-base font-mono font-medium text-amber-700" />
                  <span className="text-[10px] text-zinc-400">Modifiable si le séjour a duré plus longtemps</span>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <label className="mb-3 label-base">Consommations de dernière minute (Opt.)</label>
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
                      <div key={d.id} className="flex justify-between items-center bg-white border border-border rounded-md px-3 py-2">
                        <span className="text-sm font-medium">{d.name} x{d.qty}</span>
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
              </div>
            </>
          )}
        </div>

        {!splitMode && (
          <div className="sticky bottom-0 mt-auto bg-card border-t border-border p-6 rounded-b-md shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Montant Final à Payer</span>
              <span className="font-mono font-bold text-2xl text-emerald-600">{formatMoney(newTotal)}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={onCancel} className="btn-outline flex-1">Annuler</button>
              <button onClick={submit} className="btn-primary flex-[2]">
                <Check size={18} className="mr-2" /> Valider la clôture
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}