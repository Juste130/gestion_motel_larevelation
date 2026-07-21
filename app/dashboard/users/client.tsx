"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { createUser, deleteUser } from "@/app/actions/admin"
import { toast } from "sonner"
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal"
import { getPasswordHelpText, validatePassword } from "@/lib/password"

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
  const router = useRouter()
  const [users, setUsers] = useState(initUsers)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "RECEPTIONIST" })
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const canDeleteUsers = currentRole === "ADMIN"
  const availableRoles = currentRole === "ADMIN"
    ? [{ v: "RECEPTIONIST", l: "Réceptionniste" }, { v: "DG", l: "Directeur Général" }, { v: "ADMIN", l: "Administrateur" }]
    : [{ v: "RECEPTIONIST", l: "Réceptionniste" }, { v: "DG", l: "Directeur Général" }]

  const handleCreate = () => {
    if (!form.name || !form.email || !form.password) {
      toast.error("Veuillez remplir tous les champs obligatoires.")
      return
    }

    const passwordValidation = validatePassword(form.password)
    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.message)
      return
    }

    startTransition(async () => {
      try {
        await createUser(form)
        setForm({ name: "", email: "", password: "", role: "RECEPTIONIST" })
        setShowForm(false)
        toast.success(`Compte de ${form.name} créé avec succès.`)
        router.refresh()
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Erreur de création du compte.")
      }
    })
  }

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    const { id, label } = deleteTarget
    setDeleteTarget(null)
    startTransition(async () => {
      try {
        await deleteUser(id)
        setUsers(prev => prev.filter(u => u.id !== id))
        toast.success(`Compte de ${label} supprimé.`)
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Erreur lors de la suppression.")
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {deleteTarget && (
        <ConfirmDeleteModal
          label={deleteTarget.label}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div>
        <h1 className="font-serif text-3xl font-bold text-zinc-900">Équipe</h1>
        <p className="text-zinc-500 mt-1 text-sm">Gestion des comptes du personnel</p>
      </div>

      <div className="card-base">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-50">
          <h2 className="font-bold text-zinc-800">{users.length} membre(s)</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary h-9 px-4"
          >
            <Plus size={15} /> Nouveau membre
          </button>
        </div>

        {showForm && (
          <div className="px-6 py-4 border-b border-zinc-50 bg-zinc-50">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                <label className="label-base">Nom complet</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Jean Dupont"
                  className="input-base" />
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-[170px]">
                <label className="label-base">E-mail</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="jean@larevelation.com"
                  className="input-base" />
              </div>
              <div className="flex flex-col gap-1 w-36">
                <label className="label-base">Mot de passe</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="input-base" />
                <p className="text-[11px] text-zinc-500">{getPasswordHelpText()}</p>
              </div>
              <div className="flex flex-col gap-1 w-40">
                <label className="label-base">Rôle</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                  className="select-base">
                  {availableRoles.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
                </select>
              </div>
              <button onClick={handleCreate} disabled={isPending}
                className="btn-secondary h-10">
                {isPending ? <><Loader2 size={13} className="animate-spin" /> Traitement...</> : "Créer"}
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
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
              <tr key={u.id} className="border-t border-zinc-50 hover:bg-zinc-50 transition-colors">
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
                    <button
                      onClick={() => setDeleteTarget({ id: u.id, label: u.name || u.email })}
                      className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-sm transition-colors"
                    >
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
    </div>
  )
}