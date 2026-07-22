"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Calendar, ShoppingCart, DoorOpen, Loader2, BedDouble, AlertTriangle } from "lucide-react"
import { addEntry, deleteEntry, addProductToEntry, closeEntry } from "@/app/actions/entries"
import { formatMoney, todayStr } from "@/lib/utils"
import { EntryForm } from "@/components/entry-form"
import { CloseEntryModal } from "@/components/close-entry-modal"
import { AddProductModal } from "@/components/add-product-modal"
import { toast } from "sonner"

type Room = { id: string; num: string; type: string; label: string }
type Product = { id: string; name: string; category: string; price: number; stock: number }

export function RegistreClient({ entries, rooms, products, currentDate, role }: {
  entries: any[]; rooms: Room[]; products: Product[]; currentDate: string; role: string
}) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [closingEntry, setClosingEntry] = useState<any | null>(null)
  const [addingProductTo, setAddingProductTo] = useState<any | null>(null)
  
  const [isPending, startTransition] = useTransition()

  const isToday = currentDate === todayStr()
  const canAdd = (role === "ADMIN" || role === "RECEPTIONIST") && isToday
  const canDelete = role === "ADMIN" || role === "DG"

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    router.push(`/dashboard/registre?date=${e.target.value}`)
  }

  const handleSaveEntry = (data: any) => {
    startTransition(async () => {
      try {
        await addEntry({
          date: currentDate,
          receiptNo: data.receiptNo || undefined,
          roomNum: data.roomNum,
          roomType: data.roomType,
          roomTypeLabel: data.roomTypeLabel,
          arrival: data.arrival || undefined,
          duration: data.duration || undefined,
          roomAmount: data.roomAmount,
          condomAmount: data.condomAmount,
          products: data.drinks
        })
        setShowForm(false)
        toast.success("Séjour enregistré avec succès !")
        router.refresh()
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Une erreur est survenue.")
      }
    })
  }

  const handleSaveAdditionalProducts = (productsToAdd: any[]) => {
    if (!addingProductTo || productsToAdd.length === 0) return
    startTransition(async () => {
      try {
        await addProductToEntry(addingProductTo.id, currentDate, productsToAdd)
        setAddingProductTo(null)
        toast.success("Consommations ajoutées avec succès !")
        router.refresh()
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Une erreur est survenue.")
      }
    })
  }

  const handleCloseEntry = (data: any) => {
    if (!closingEntry) return
    startTransition(async () => {
      try {
        await closeEntry(closingEntry.id, {
          departure: data.departure,
          roomAmount: data.roomAmount,
          products: data.products,
          currentDate
        })
        setClosingEntry(null)
        toast.success("Séjour clôturé avec succès !")
        router.refresh()
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Une erreur est survenue.")
      }
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cet enregistrement ?")) return
    startTransition(async () => {
      try {
        await deleteEntry(id)
        toast.success("Enregistrement supprimé.")
        router.refresh()
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Une erreur est survenue.")
      }
    })
  }

  const totalRecettes = entries.reduce((s, e) => s + e.total, 0)

  return (
    <div className="flex flex-col gap-6 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-zinc-900">Registre & Séjours</h1>
          <p className="text-zinc-500 mt-1 text-sm">Suivi des entrées et séjours du jour</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="date"
              value={currentDate}
              onChange={handleDateChange}
              className="input-base pl-10 h-10 w-40"
            />
            <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          </div>
          {canAdd && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              <Plus size={18} /> Nouvelle entrée
            </button>
          )}
        </div>
      </div>

      {!isToday && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md text-sm font-medium flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-600" />
            <span>Vous consultez le registre d'une date antérieure ({new Date(currentDate).toLocaleDateString("fr-FR")}).</span>
          </div>
          <button onClick={() => router.push(`/dashboard/registre?date=${todayStr()}`)} className="btn-secondary h-8 px-3 text-xs">
            Revenir à aujourd'hui
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-base card-body flex flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total recettes</p>
          <p className="text-2xl font-bold font-mono text-zinc-800 mt-1">{formatMoney(totalRecettes)}</p>
        </div>
        <div className="card-base card-body flex flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Séjours</p>
          <p className="text-2xl font-bold font-mono text-zinc-800 mt-1">{entries.length}</p>
        </div>
      </div>

      {showForm && canAdd && (
        <EntryForm 
          rooms={rooms}
          drinks={products}
          date={currentDate}
          entries={entries}
          onCancel={() => setShowForm(false)}
          onSave={handleSaveEntry}
        />
      )}

      {/* Entries List */}
      <div className="card-base overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="bg-zinc-50 text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
              <th className="text-left px-5 py-3">Chambre</th>
              <th className="text-left px-5 py-3">Horaires & Durée</th>
              <th className="text-left px-5 py-3">Consommations</th>
              <th className="text-right px-5 py-3">Total (FCFA)</th>
              <th className="text-right px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center">
                      <BedDouble size={24} className="text-zinc-300" />
                    </div>
                    <p className="font-semibold text-zinc-400">Aucun séjour enregistré pour cette date</p>
                    {canAdd && (
                      <button onClick={() => setShowForm(true)} className="btn-primary h-9 px-4 mt-2">
                        Nouvelle entrée →
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : entries.map(entry => {
              const isPast = entry.date < currentDate;
              // Calcul précis des jours écoulés (différence calendaire pure)
              const createdDateOnly = new Date(entry.createdAt).toISOString().split('T')[0];
              const diffTime = new Date(currentDate).getTime() - new Date(createdDateOnly).getTime();
              const daysElapsed = isPast ? Math.round(diffTime / (1000 * 3600 * 24)) : 0;
              
              const createdAtDate = new Date(entry.createdAt);
              const originalDateStr = createdAtDate.toLocaleDateString("fr-FR");

              return (
              <tr key={entry.id} className={`hover:bg-zinc-50/50 transition-colors ${isPast && !entry.departure ? 'bg-amber-50/30' : ''}`}>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-amber-50 border border-amber-100 flex flex-col items-center justify-center flex-shrink-0">
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
                    {isPast && !entry.departure ? (
                      <div className="flex flex-col gap-1 mb-1">
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold w-fit uppercase tracking-wider">Séjour prolongé</span>
                        <span className="text-xs text-zinc-500 font-medium">
                          Début: {originalDateStr} à <span className="font-mono text-zinc-800">{entry.arrival || "—"}</span>
                        </span>
                        <span className="text-[10px] text-zinc-400 font-bold italic">({daysElapsed} jour{daysElapsed > 1 ? 's' : ''} écoulé{daysElapsed > 1 ? 's' : ''})</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-zinc-600 text-xs font-mono">
                        <span className="font-bold text-zinc-800">Arr:</span> {entry.arrival || "—"}
                      </div>
                    )}

                    {entry.departure ? (
                      <div className="flex items-center gap-2 text-zinc-600 text-xs font-mono">
                        <span className="font-bold text-zinc-800">Dép:</span> {entry.departure}
                      </div>
                    ) : (
                      <div className="text-xs text-emerald-600 font-mono font-semibold">En cours</div>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-2">
                    {entry.products.length > 0 ? (
                      <ul className="flex flex-col gap-1">
                        {entry.products.map((p: any) => (
                          <li key={p.id} className="text-xs text-zinc-600 flex items-center gap-2">
                            <span className="font-bold bg-zinc-100 px-1 rounded text-[10px]">{p.qty}x</span> 
                            <span>{p.product.name}</span>
                          </li>
                        ))}
                      </ul>
                    ) : <span className="text-xs text-zinc-400 italic">Aucune conso</span>}
                    
                    {!entry.departure && canAdd && (
                      <button onClick={() => setAddingProductTo(entry)} 
                        className="btn-secondary h-7 px-2 text-[10px] uppercase mt-1">
                        <ShoppingCart size={12} /> Ajouter conso
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4 text-right">
                  <p className="font-bold font-mono text-lg text-emerald-600">{formatMoney(entry.total)}</p>
                  <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-wider">
                    (Ch. {formatMoney(entry.roomAmount)} + Prod. {formatMoney(entry.drinksAmount)})
                  </p>
                </td>
                <td className="px-5 py-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-2">
                    {!entry.departure && canAdd && (
                      <button onClick={() => setClosingEntry(entry)} disabled={isPending}
                        className="btn-primary h-8 px-3 text-[11px] uppercase tracking-wider">
                        <DoorOpen size={14} /> Clôturer
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => handleDelete(entry.id)} disabled={isPending} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-sm transition-colors disabled:opacity-50">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      {addingProductTo && (
        <AddProductModal 
          entry={addingProductTo}
          products={products}
          onCancel={() => setAddingProductTo(null)}
          onSave={handleSaveAdditionalProducts}
        />
      )}

      {closingEntry && (
        <CloseEntryModal 
          entry={closingEntry}
          products={products}
          currentDate={currentDate}
          onCancel={() => setClosingEntry(null)}
          onSave={handleCloseEntry}
        />
      )}
    </div>
  )
}
