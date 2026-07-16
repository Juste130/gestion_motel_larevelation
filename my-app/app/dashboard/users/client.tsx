"use client"

import { useState, useTransition } from "react"
import { Plus, Trash2 } from "lucide-react"
import { createUser, deleteUser } from "@/app/actions/admin"

type UserRow = { id: string; name: string | null; email: string; role: string; createdAt: Date }

const ROLE_LABELS: Record<string, string> = { ADMIN: "Administrateur", DG: "Directeur Général", RECEPTIONIST: "Réceptionniste" }
const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-violet-50 text-violet-700 border border-violet-100",
  DG: "bg-amber-50 text-amber-700 border border-amber-100",
  RECEPTIONIST: "bg-zinc-100 text-zinc-600",
}

export function UsersPageClient({ users: initUsers, currentRole }: {
  users: UserRow[]; currentRole: string
}) {
  const [users, setUsers] = useState(initUsers)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "RECEPTIONIST" })
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  const canDeleteUsers = currentRole === "ADMIN"
  // DG can create RECEPTIONIST and DG, but not ADMIN
  const availableRoles = currentRole === "ADMIN"
    ? [{ v: "RECEPTIONIST", l: "Réceptionniste" }, { v: "DG", l: "Directeur Général" }, { v: "ADMIN", l: "Administrateur" }]
    : [{ v: "RECEPTIONIST", l: "Réceptionniste" }, { v: "DG", l: "Directeur Général" }]

  const handleCreate = () => {
    if (!form.name || !form.email || !form.password) return
    setError("")
    startTransition(async () => {
      try {
        await createUser(form)
        setForm({ name: "", email: "", password: "", role: "RECEPTIONIST" })
        setShowForm(false)
        window.location.reload()
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Erreur de création")
      }
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm("Supprimer ce compte ? Cette action est irréversible.")) return
    startTransition(async () => {
      await deleteUser(id)
      setUsers(prev => prev.filter(u => u.id !== id))
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-zinc-900">Équipe</h1>
        <p className="text-zinc-500 mt-1 text-sm">Gestion des comptes du personnel</p>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-50">
          <h2 className="font-bold text-zinc-800">{users.length} membre(s)</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 text-sm font-semibold bg-amber-400 hover:bg-amber-500 text-zinc-900 px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={15} /> Nouveau membre
          </button>
        </div>

        {showForm && (
          <div className="px-6 py-4 border-b border-zinc-50 bg-zinc-50">
            {error && <p className="text-sm text-red-600 mb-3 font-medium">{error}</p>}
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                <label className="text-xs font-semibold text-zinc-500">Nom complet</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Jean Dupont"
                  className="h-9 px-3 text-sm rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white" />
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-[170px]">
                <label className="text-xs font-semibold text-zinc-500">E-mail</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="jean@larevelation.com"
                  className="h-9 px-3 text-sm rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white" />
              </div>
              <div className="flex flex-col gap-1 w-36">
                <label className="text-xs font-semibold text-zinc-500">Mot de passe</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="h-9 px-3 text-sm rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white" />
              </div>
              <div className="flex flex-col gap-1 w-40">
                <label className="text-xs font-semibold text-zinc-500">Rôle</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                  className="h-9 px-3 text-sm rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                  {availableRoles.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
                </select>
              </div>
              <button onClick={handleCreate} disabled={isPending}
                className="h-9 px-4 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-700 transition-colors disabled:opacity-50">
                Créer
              </button>
            </div>
          </div>
        )}

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-50 text-xs font-bold text-zinc-400 uppercase tracking-wider">
              <th className="text-left px-6 py-3">Nom</th>
              <th className="text-left px-6 py-3">E-mail</th>
              <th className="text-left px-6 py-3">Rôle</th>
              <th className="text-left px-6 py-3">Créé le</th>
              {canDeleteUsers && <th className="px-6 py-3" />}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t border-zinc-50 hover:bg-zinc-50">
                <td className="px-6 py-3.5 flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-xs font-bold text-amber-600 flex-shrink-0">
                    {(u.name || u.email)[0].toUpperCase()}
                  </span>
                  <span className="font-medium text-zinc-800">{u.name || "—"}</span>
                </td>
                <td className="px-6 py-3.5 text-zinc-500">{u.email}</td>
                <td className="px-6 py-3.5">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${ROLE_COLORS[u.role] ?? "bg-zinc-100 text-zinc-600"}`}>
                    {ROLE_LABELS[u.role] ?? u.role}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-zinc-400 font-mono text-xs">
                  {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                </td>
                {canDeleteUsers && (
                  <td className="px-6 py-3.5 text-right">
                    <button onClick={() => handleDelete(u.id)} className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={14} />
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
