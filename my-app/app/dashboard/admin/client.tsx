"use client"

import { useState, useTransition, useEffect } from "react"
import {
  TrendingUp, Wallet, Wine, Settings, ShieldCheck,
  Plus, Trash2, RefreshCw, User, ChevronRight, DollarSign, BedDouble
} from "lucide-react"
import {
  addRoom, deleteRoom,
  addDrink, updateDrinkStock, deleteDrink,
  getCashMovements, addCashMovement, deleteCashMovement,
  getUsers, createUser, deleteUser,
  getResumeStats,
} from "@/app/actions/admin"
import { formatMoney } from "@/lib/utils"

// ─── Helpers ─────────────────────────────────────────────────────
function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-zinc-800">{title}</h2>
      {sub && <p className="text-base text-zinc-500 mt-1">{sub}</p>}
    </div>
  )
}

function StatCard({ label, value, icon, highlight = false }: any) {
  return (
    <div className={`rounded-xl border p-5 flex items-center gap-4 bg-white ${highlight ? "border-amber-200 ring-1 ring-amber-100" : "border-zinc-200"}`}>
      <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${highlight ? "bg-amber-50" : "bg-zinc-100"}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
        <p className={`text-2xl font-bold font-mono mt-0.5 ${highlight ? "text-amber-600" : "text-zinc-800"}`}>{value}</p>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────
export function AdminClient({ rooms: initRooms, drinks: initDrinks, tab = "resume" }: any) {
  return (
    <div>
      {tab === "resume"  && <ResumeModule />}
      {tab === "caisse"  && <CaisseModule />}
      {tab === "stock"   && <StockModule initDrinks={initDrinks} />}
      {tab === "params"  && <ParamsModule initRooms={initRooms} initDrinks={initDrinks} />}
      {tab === "users"   && <UsersModule />}
    </div>
  )
}

// ─── Module : RÉSUMÉ ─────────────────────────────────────────────
function ResumeModule() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getResumeStats().then((s) => { setStats(s); setLoading(false) })
  }, [])

  if (loading) return <div className="text-center text-zinc-400 py-16 animate-pulse">Chargement des statistiques...</div>

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="CA du mois" value={formatMoney(stats.totalRevenueMonth)} icon={<DollarSign size={18} className="text-[#EAB308]" />} highlight />
        <StatCard label="Séjours du mois" value={stats.totalEntriesMonth} icon={<BedDouble size={18} className="text-zinc-500" />} />
        <StatCard label="Chambres" value={stats.roomCount} icon={<BedDouble size={18} className="text-zinc-500" />} />
        <StatCard label="Boissons au catalogue" value={stats.drinkCount} icon={<Wine size={18} className="text-zinc-500" />} />
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h3 className="font-bold text-[#1A1A1A] text-sm">Performance des réceptionnistes — Mois en cours</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-50 text-xs font-bold text-zinc-500 uppercase tracking-wider">
              <th className="text-left px-5 py-3">Réceptionniste</th>
              <th className="text-right px-5 py-3">Séjours</th>
              <th className="text-right px-5 py-3">Revenus générés</th>
            </tr>
          </thead>
          <tbody>
            {stats.revenueByUser.length === 0 ? (
              <tr><td colSpan={3} className="text-center text-zinc-400 py-8 text-sm">Aucune donnée pour ce mois</td></tr>
            ) : (
              stats.revenueByUser.map((u: any, i: number) => (
                <tr key={i} className="border-t border-zinc-100 hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-[#1A1A1A] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold">{u.name[0]}</span>
                    {u.name}
                  </td>
                  <td className="px-5 py-3 text-right text-zinc-600 font-mono">{u.entries}</td>
                  <td className="px-5 py-3 text-right font-bold font-mono text-[#1A1A1A]">{formatMoney(u.revenue)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <a
        href="/dashboard/reception"
        className="self-start flex items-center gap-2 bg-[#EAB308] text-[#1A1A1A] px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-[#ca9a04] transition-colors"
      >
        Aller au Registre Réception <ChevronRight size={16} />
      </a>
    </div>
  )
}

// ─── Module : CAISSE ─────────────────────────────────────────────
function CaisseModule() {
  const [movements, setMovements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ label: "", amount: "", type: "depense", date: new Date().toISOString().slice(0, 10) })
  const [isPending, startTransition] = useTransition()

  const reload = () => getCashMovements().then((m) => { setMovements(m); setLoading(false) })
  useEffect(() => { reload() }, [])

  const handleAdd = () => {
    if (!form.label || !form.amount) return
    startTransition(async () => {
      await addCashMovement({ label: form.label, amount: parseFloat(form.amount), type: form.type, date: form.date })
      setForm({ label: "", amount: "", type: "depense", date: new Date().toISOString().slice(0, 10) })
      setShowForm(false)
      reload()
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => { await deleteCashMovement(id); reload() })
  }

  const depenses = movements.filter(m => m.type === "depense").reduce((s, m) => s + m.amount, 0)
  const recettes = movements.filter(m => m.type === "recette").reduce((s, m) => s + m.amount, 0)
  const solde = recettes - depenses

  if (loading) return <div className="text-center text-zinc-400 py-16 animate-pulse">Chargement...</div>

  return (
    <div className="flex flex-col gap-5">
      <SectionTitle title="Caisse & Dépenses" sub="Suivez les mouvements de trésorerie de l'établissement" />
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Recettes" value={formatMoney(recettes)} icon={<DollarSign size={18} className="text-green-500" />} />
        <StatCard label="Dépenses" value={formatMoney(depenses)} icon={<DollarSign size={18} className="text-red-400" />} />
        <StatCard label="Solde net" value={formatMoney(solde)} icon={<Wallet size={18} className="text-amber-600" />} highlight />
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100">
          <h3 className="font-bold text-sm text-[#1A1A1A]">Mouvements</h3>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 text-xs font-bold bg-[#EAB308] text-[#1A1A1A] px-3 py-1.5 rounded-lg hover:bg-[#ca9a04] transition-colors">
            <Plus size={13} /> Ajouter
          </button>
        </div>

        {showForm && (
          <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50 flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
              <label className="text-xs font-semibold text-zinc-500">Libellé</label>
              <input value={form.label} onChange={e => setForm({...form, label: e.target.value})} placeholder="ex: Achat fournitures" className="h-9 px-3 text-sm rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#EAB308]" />
            </div>
            <div className="flex flex-col gap-1 w-28">
              <label className="text-xs font-semibold text-zinc-500">Montant (FCFA)</label>
              <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="0" className="h-9 px-3 text-sm rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#EAB308]" />
            </div>
            <div className="flex flex-col gap-1 w-28">
              <label className="text-xs font-semibold text-zinc-500">Type</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="h-9 px-3 text-sm rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#EAB308] bg-white">
                <option value="depense">Dépense</option>
                <option value="recette">Recette</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 w-36">
              <label className="text-xs font-semibold text-zinc-500">Date</label>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="h-9 px-3 text-sm rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#EAB308]" />
            </div>
            <button onClick={handleAdd} disabled={isPending} className="h-9 px-4 bg-[#1A1A1A] text-white rounded-lg text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50">
              Enregistrer
            </button>
          </div>
        )}

        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-xs font-bold text-zinc-500 uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3">Date</th>
              <th className="text-left px-5 py-3">Libellé</th>
              <th className="text-left px-5 py-3">Type</th>
              <th className="text-right px-5 py-3">Montant</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 ? (
              <tr><td colSpan={5} className="text-center text-zinc-400 py-8">Aucun mouvement enregistré</td></tr>
            ) : (
              movements.map((m) => (
                <tr key={m.id} className="border-t border-zinc-100 hover:bg-zinc-50">
                  <td className="px-5 py-3 text-zinc-500 font-mono text-xs">{m.date}</td>
                  <td className="px-5 py-3 text-[#1A1A1A] font-medium">{m.label}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${m.type === "recette" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {m.type === "recette" ? "Recette" : "Dépense"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-bold font-mono text-[#1A1A1A]">{formatMoney(m.amount)}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => handleDelete(m.id)} className="text-zinc-400 hover:text-red-500 transition-colors p-1">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Module : STOCK ──────────────────────────────────────────────
function StockModule({ initDrinks }: any) {
  const [drinks, setDrinks] = useState(initDrinks)
  const [editStocks, setEditStocks] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  const handleStockUpdate = (id: string) => {
    const val = parseInt(editStocks[id] ?? "")
    if (isNaN(val)) return
    startTransition(async () => {
      await updateDrinkStock(id, val)
      setDrinks((prev: any[]) => prev.map(d => d.id === id ? { ...d, stock: val } : d))
      setEditStocks(prev => { const n = { ...prev }; delete n[id]; return n })
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionTitle title="Stock des Boissons" sub="Consultez et mettez à jour les niveaux de stock" />
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-xs font-bold text-zinc-500 uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3">Boisson</th>
              <th className="text-right px-5 py-3">Prix (FCFA)</th>
              <th className="text-right px-5 py-3">Stock actuel</th>
              <th className="text-right px-5 py-3">Nouveau stock</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {drinks.map((d: any) => (
              <tr key={d.id} className="border-t border-zinc-100 hover:bg-zinc-50">
                <td className="px-5 py-3 font-medium text-[#1A1A1A]">{d.name}</td>
                <td className="px-5 py-3 text-right font-mono text-zinc-600">{formatMoney(d.price)}</td>
                <td className="px-5 py-3 text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold font-mono ${d.stock <= 5 ? "bg-red-100 text-red-700" : d.stock <= 15 ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                    {d.stock}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <input
                    type="number"
                    min={0}
                    value={editStocks[d.id] ?? ""}
                    onChange={e => setEditStocks(prev => ({ ...prev, [d.id]: e.target.value }))}
                    placeholder={String(d.stock)}
                    className="w-20 h-8 px-2 text-sm text-right rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#EAB308]"
                  />
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => handleStockUpdate(d.id)}
                    disabled={isPending || editStocks[d.id] === undefined}
                    className="h-8 px-3 bg-[#EAB308] text-[#1A1A1A] rounded-lg text-xs font-bold hover:bg-[#ca9a04] transition-colors disabled:opacity-40 flex items-center gap-1"
                  >
                    <RefreshCw size={11} /> Màj
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Module : PARAMÈTRES ─────────────────────────────────────────
function ParamsModule({ initRooms, initDrinks }: any) {
  const [rooms, setRooms] = useState(initRooms)
  const [drinks, setDrinks] = useState(initDrinks)
  const [roomForm, setRoomForm] = useState({ num: "", type: "C", label: "Confort" })
  const [drinkForm, setDrinkForm] = useState({ name: "", price: "", stock: "0" })
  const [isPending, startTransition] = useTransition()

  const handleAddRoom = () => {
    if (!roomForm.num) return
    startTransition(async () => {
      await addRoom(roomForm)
      setRooms((prev: any[]) => [...prev, { ...roomForm, id: Date.now().toString() }])
      setRoomForm({ num: "", type: "C", label: "Confort" })
    })
  }

  const handleDeleteRoom = (id: string) => {
    startTransition(async () => {
      await deleteRoom(id)
      setRooms((prev: any[]) => prev.filter(r => r.id !== id))
    })
  }

  const handleAddDrink = () => {
    if (!drinkForm.name || !drinkForm.price) return
    startTransition(async () => {
      await addDrink({ name: drinkForm.name, price: parseFloat(drinkForm.price), stock: parseInt(drinkForm.stock) || 0 })
      setDrinks((prev: any[]) => [...prev, { ...drinkForm, id: Date.now().toString(), price: parseFloat(drinkForm.price), stock: parseInt(drinkForm.stock) || 0 }])
      setDrinkForm({ name: "", price: "", stock: "0" })
    })
  }

  const handleDeleteDrink = (id: string) => {
    startTransition(async () => {
      await deleteDrink(id)
      setDrinks((prev: any[]) => prev.filter(d => d.id !== id))
    })
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Chambres */}
      <div>
        <SectionTitle title="Gestion des Chambres" sub="Ajoutez ou supprimez des chambres du registre" />
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50 flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-500">N° Chambre</label>
              <input value={roomForm.num} onChange={e => setRoomForm({...roomForm, num: e.target.value})} placeholder="ex: 101" className="h-9 w-24 px-3 text-sm rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#EAB308]" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-500">Type</label>
              <select value={roomForm.type} onChange={e => {
                const types: any = { C: "Confort", V: "VIP", A: "Appartement" }
                setRoomForm({...roomForm, type: e.target.value, label: types[e.target.value] || e.target.value})
              }} className="h-9 px-3 text-sm rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#EAB308] bg-white">
                <option value="C">Confort</option>
                <option value="V">VIP</option>
                <option value="A">Appartement</option>
              </select>
            </div>
            <button onClick={handleAddRoom} disabled={isPending} className="h-9 px-4 bg-[#1A1A1A] text-white rounded-lg text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center gap-1">
              <Plus size={14} /> Ajouter
            </button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-xs font-bold text-zinc-500 uppercase tracking-wider border-t border-zinc-100">
              <tr>
                <th className="text-left px-5 py-3">Numéro</th>
                <th className="text-left px-5 py-3">Type</th>
                <th className="text-left px-5 py-3">Label</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {rooms.map((r: any) => (
                <tr key={r.id} className="border-t border-zinc-100 hover:bg-zinc-50">
                  <td className="px-5 py-3 font-bold font-mono text-[#1A1A1A]">{r.num}</td>
                  <td className="px-5 py-3"><span className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-600">{r.type}</span></td>
                  <td className="px-5 py-3 text-zinc-600">{r.label}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => handleDeleteRoom(r.id)} className="text-zinc-400 hover:text-red-500 transition-colors p-1"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Boissons */}
      <div>
        <SectionTitle title="Catalogue des Boissons" sub="Gérez les boissons disponibles à la vente" />
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50 flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
              <label className="text-xs font-semibold text-zinc-500">Nom</label>
              <input value={drinkForm.name} onChange={e => setDrinkForm({...drinkForm, name: e.target.value})} placeholder="ex: Castel Bière" className="h-9 px-3 text-sm rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#EAB308]" />
            </div>
            <div className="flex flex-col gap-1 w-32">
              <label className="text-xs font-semibold text-zinc-500">Prix (FCFA)</label>
              <input type="number" value={drinkForm.price} onChange={e => setDrinkForm({...drinkForm, price: e.target.value})} placeholder="0" className="h-9 px-3 text-sm rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#EAB308]" />
            </div>
            <div className="flex flex-col gap-1 w-24">
              <label className="text-xs font-semibold text-zinc-500">Stock initial</label>
              <input type="number" value={drinkForm.stock} onChange={e => setDrinkForm({...drinkForm, stock: e.target.value})} placeholder="0" className="h-9 px-3 text-sm rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#EAB308]" />
            </div>
            <button onClick={handleAddDrink} disabled={isPending} className="h-9 px-4 bg-[#1A1A1A] text-white rounded-lg text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center gap-1">
              <Plus size={14} /> Ajouter
            </button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-xs font-bold text-zinc-500 uppercase tracking-wider border-t border-zinc-100">
              <tr>
                <th className="text-left px-5 py-3">Nom</th>
                <th className="text-right px-5 py-3">Prix</th>
                <th className="text-right px-5 py-3">Stock</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {drinks.map((d: any) => (
                <tr key={d.id} className="border-t border-zinc-100 hover:bg-zinc-50">
                  <td className="px-5 py-3 font-medium text-[#1A1A1A]">{d.name}</td>
                  <td className="px-5 py-3 text-right font-mono text-zinc-600">{formatMoney(d.price)}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${d.stock <= 5 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>{d.stock}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => handleDeleteDrink(d.id)} className="text-zinc-400 hover:text-red-500 transition-colors p-1"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Module : ÉQUIPE ─────────────────────────────────────────────
function UsersModule() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "RECEPTIONIST" })
  const [isPending, startTransition] = useTransition()

  const reload = () => getUsers().then(u => { setUsers(u); setLoading(false) })
  useEffect(() => { reload() }, [])

  const handleCreate = () => {
    if (!form.name || !form.email || !form.password) return
    startTransition(async () => {
      await createUser(form)
      setForm({ name: "", email: "", password: "", role: "RECEPTIONIST" })
      setShowForm(false)
      reload()
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => { await deleteUser(id); reload() })
  }

  if (loading) return <div className="text-center text-zinc-400 py-16 animate-pulse">Chargement...</div>

  return (
    <div className="flex flex-col gap-5">
      <SectionTitle title="Gestion de l'Équipe" sub="Créez et gérez les comptes des membres du personnel" />

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100">
          <h3 className="font-bold text-sm text-[#1A1A1A]">{users.length} membre(s)</h3>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 text-xs font-bold bg-[#EAB308] text-[#1A1A1A] px-3 py-1.5 rounded-lg hover:bg-[#ca9a04] transition-colors">
            <Plus size={13} /> Nouveau membre
          </button>
        </div>

        {showForm && (
          <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50 flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1 flex-1 min-w-[130px]">
              <label className="text-xs font-semibold text-zinc-500">Nom complet</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Jean Dupont" className="h-9 px-3 text-sm rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#EAB308]" />
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
              <label className="text-xs font-semibold text-zinc-500">E-mail</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="jean@larevelation.com" className="h-9 px-3 text-sm rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#EAB308]" />
            </div>
            <div className="flex flex-col gap-1 w-36">
              <label className="text-xs font-semibold text-zinc-500">Mot de passe</label>
              <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" className="h-9 px-3 text-sm rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#EAB308]" />
            </div>
            <div className="flex flex-col gap-1 w-36">
              <label className="text-xs font-semibold text-zinc-500">Rôle</label>
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="h-9 px-3 text-sm rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#EAB308] bg-white">
                <option value="RECEPTIONIST">Réceptionniste</option>
                <option value="ADMIN">Admin</option>
                <option value="DG">DG</option>
              </select>
            </div>
            <button onClick={handleCreate} disabled={isPending} className="h-9 px-4 bg-[#1A1A1A] text-white rounded-lg text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50">
              Créer
            </button>
          </div>
        )}

        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-xs font-bold text-zinc-500 uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3">Nom</th>
              <th className="text-left px-5 py-3">E-mail</th>
              <th className="text-left px-5 py-3">Rôle</th>
              <th className="text-left px-5 py-3">Créé le</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-zinc-100 hover:bg-zinc-50">
                <td className="px-5 py-3 font-medium text-[#1A1A1A] flex items-center gap-2 mt-0.5">
                  <span className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-600">{(u.name || "?")[0].toUpperCase()}</span>
                  {u.name || "—"}
                </td>
                <td className="px-5 py-3 text-zinc-500">{u.email}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    u.role === "DG" ? "bg-[#EAB308]/20 text-[#92690a]" :
                    u.role === "ADMIN" ? "bg-blue-100 text-blue-700" :
                    "bg-zinc-100 text-zinc-600"
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-3 text-zinc-400 font-mono text-xs">{new Date(u.createdAt).toLocaleDateString("fr-FR")}</td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => handleDelete(u.id)} className="text-zinc-400 hover:text-red-500 transition-colors p-1"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
