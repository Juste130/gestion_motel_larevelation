"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Loader2, Mail, RefreshCw, Check, X, Clock, CheckCircle2 } from "lucide-react"
import { inviteUser, deleteUser, resendInvitation, approveAccessRequest, rejectAccessRequest } from "@/app/actions/admin"
import { toast } from "sonner"
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal"

type UserRow = {
  id: string; name: string | null; email: string; role: string
  status: string; authMethod: string | null; createdAt: Date
}
type AccessRequestRow = { id: string; name: string; email: string; message: string | null; createdAt: Date }

const ROLE_LABELS: Record<string, string> = { ADMIN: "Administrateur", DG: "Directeur Général", RECEPTIONIST: "Réceptionniste" }
const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-violet-50 text-violet-700 border border-violet-100",
  DG: "bg-amber-50 text-amber-700 border border-amber-100",
  RECEPTIONIST: "bg-zinc-100 text-zinc-600",
}
const AUTH_LABELS: Record<string, string> = { CREDENTIALS: "Mot de passe", GOOGLE: "Google" }

export function UsersPageClient({ users: initUsers, accessRequests: initRequests, currentRole }: {
  users: UserRow[]; accessRequests: AccessRequestRow[]; currentRole: string
}) {
  const router = useRouter()
  const [users, setUsers] = useState(initUsers)
  const [requests, setRequests] = useState(initRequests)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", role: "RECEPTIONIST" })
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [approveRole, setApproveRole] = useState("RECEPTIONIST")
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const canDeleteUsers = currentRole === "ADMIN"
  const availableRoles = currentRole === "ADMIN"
    ? [{ v: "RECEPTIONIST", l: "Réceptionniste" }, { v: "DG", l: "Directeur Général" }, { v: "ADMIN", l: "Administrateur" }]
    : [{ v: "RECEPTIONIST", l: "Réceptionniste" }, { v: "DG", l: "Directeur Général" }]

  const handleInvite = () => {
    if (!form.name || !form.email) {
      toast.error("Veuillez remplir le nom et l'e-mail.")
      return
    }
    startTransition(async () => {
      try {
        await inviteUser(form)
        setForm({ name: "", email: "", role: "RECEPTIONIST" })
        setShowForm(false)
        toast.success(`Invitation envoyée à ${form.name}.`)
        router.refresh()
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Erreur lors de l'invitation.")
      }
    })
  }

  const handleResend = (id: string, label: string) => {
    startTransition(async () => {
      try {
        await resendInvitation(id)
        toast.success(`Invitation renvoyée à ${label}.`)
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Erreur lors du renvoi.")
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

  const handleApprove = (id: string) => {
    startTransition(async () => {
      try {
        await approveAccessRequest(id, approveRole)
        setRequests(prev => prev.filter(r => r.id !== id))
        setApprovingId(null)
        toast.success("Demande approuvée, invitation envoyée.")
        router.refresh()
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Erreur lors de l'approbation.")
      }
    })
  }

  const handleReject = (id: string) => {
    startTransition(async () => {
      try {
        await rejectAccessRequest(id)
        setRequests(prev => prev.filter(r => r.id !== id))
        toast.success("Demande rejetée.")
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Erreur lors du rejet.")
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

      {/* Demandes d'accès en attente */}
      {requests.length > 0 && (
        <div className="card-base">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-zinc-50">
            <Clock size={16} className="text-amber-500" />
            <h2 className="font-bold text-zinc-800">{requests.length} demande(s) d&apos;accès en attente</h2>
          </div>
          <div className="divide-y divide-zinc-50">
            {requests.map(r => (
              <div key={r.id} className="px-6 py-4 flex flex-wrap items-center gap-3 justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-zinc-800">{r.name}</p>
                  <p className="text-sm text-zinc-500">{r.email}</p>
                  {r.message && <p className="text-xs text-zinc-400 mt-1 italic">&laquo; {r.message} &raquo;</p>}
                </div>

                {approvingId === r.id ? (
                  <div className="flex items-center gap-2">
                    <select value={approveRole} onChange={e => setApproveRole(e.target.value)} className="select-base h-9">
                      {availableRoles.map(role => <option key={role.v} value={role.v}>{role.l}</option>)}
                    </select>
                    <button onClick={() => handleApprove(r.id)} disabled={isPending} className="btn-primary h-9 px-3 text-xs disabled:opacity-50">
                      {isPending ? <Loader2 size={13} className="animate-spin" /> : "Confirmer"}
                    </button>
                    <button onClick={() => setApprovingId(null)} className="btn-ghost h-9 px-3">Annuler</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => { setApprovingId(r.id); setApproveRole("RECEPTIONIST") }}
                      className="btn-secondary h-9 px-3 inline-flex items-center gap-1.5"
                    >
                      <Check size={14} /> Approuver
                    </button>
                    <button
                      onClick={() => handleReject(r.id)}
                      className="h-9 px-3 rounded-md border border-zinc-200 text-zinc-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
                    >
                      <X size={14} /> Rejeter
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card-base">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-zinc-50">
          <h2 className="font-bold text-zinc-800">{users.length} membre(s)</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary h-9 px-4"
          >
            <Plus size={15} /> Inviter un membre
          </button>
        </div>

        {showForm && (
          <div className="px-6 py-4 border-b border-zinc-50 bg-zinc-50">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
                <label className="label-base">Nom complet</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Jean Dupont"
                  className="input-base" />
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-[190px]">
                <label className="label-base">E-mail</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="jean@larevelation.com"
                  className="input-base" />
              </div>
              <div className="flex flex-col gap-1 w-40">
                <label className="label-base">Rôle</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                  className="select-base">
                  {availableRoles.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
                </select>
              </div>
              <button onClick={handleInvite} disabled={isPending}
                className="btn-secondary h-10 inline-flex items-center gap-1.5">
                {isPending ? <><Loader2 size={13} className="animate-spin" /> Envoi...</> : <><Mail size={14} /> Envoyer l&apos;invitation</>}
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 mt-2">
              Aucun mot de passe à définir ici — la personne invitée choisira elle-même sa méthode de connexion (mot de passe ou Google) par e-mail.
            </p>
          </div>
        )}

        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="bg-zinc-50 text-xs font-bold text-zinc-400 uppercase tracking-wider">
              <th className="text-left px-6 py-3">Nom</th>
              <th className="text-left px-6 py-3">E-mail</th>
              <th className="text-left px-6 py-3">Rôle</th>
              <th className="text-left px-6 py-3">Statut</th>
              <th className="text-left px-6 py-3">Créé le</th>
              <th className="px-6 py-3" />
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
                <td className="px-6 py-3.5">
                  {u.status === "ACTIVE" ? (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <CheckCircle2 size={11} /> Actif · {AUTH_LABELS[u.authMethod ?? ""] ?? "—"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-zinc-100 text-zinc-500">
                      <Clock size={11} /> En attente d&apos;activation
                    </span>
                  )}
                </td>
                <td className="px-6 py-3.5 text-zinc-400 font-mono text-xs">
                  {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-6 py-3.5 text-right whitespace-nowrap">
                  <div className="inline-flex items-center gap-1">
                    {u.status === "PENDING" && (
                      <button
                        onClick={() => handleResend(u.id, u.name || u.email)}
                        disabled={isPending}
                        title="Renvoyer l'invitation"
                        className="p-1.5 text-zinc-400 hover:text-amber-600 hover:bg-amber-50 rounded-sm transition-colors disabled:opacity-50"
                      >
                        <RefreshCw size={14} />
                      </button>
                    )}
                    {canDeleteUsers && (
                      <button
                        onClick={() => setDeleteTarget({ id: u.id, label: u.name || u.email })}
                        title="Supprimer"
                        className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-sm transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
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