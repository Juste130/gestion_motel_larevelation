"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { User, Mail, ShieldCheck, KeyRound, Save, Loader2, Eye, EyeOff, CalendarDays } from "lucide-react"
import { updateMyName, changeMyPassword } from "@/app/actions/profile"
import { getPasswordHelpText } from "@/lib/password"
import { toast } from "sonner"

type Me = {
  id: string; name: string | null; email: string; role: string
  status: string; authMethod: string | null; createdAt: Date
}

const ROLE_LABELS: Record<string, string> = { ADMIN: "Administrateur", DG: "Directeur Général", RECEPTIONIST: "Réceptionniste" }

export function ProfilePageClient({ me }: { me: Me }) {
  const router = useRouter()
  const [name, setName] = useState(me.name || "")
  const [savingName, setSavingName] = useState(false)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPasswords, setShowPasswords] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const nameChanged = name.trim() !== (me.name || "") && name.trim().length >= 2

  const handleSaveName = async () => {
    setSavingName(true)
    try {
      await updateMyName(name.trim())
      toast.success("Nom mis à jour.")
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de la mise à jour.")
    } finally {
      setSavingName(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Veuillez remplir les trois champs.")
      return
    }
    setSavingPassword(true)
    try {
      const res = await changeMyPassword(currentPassword, newPassword, confirmPassword)
      if (!res.ok) {
        toast.error(res.error || "Erreur lors du changement de mot de passe.")
        return
      }
      toast.success("Mot de passe changé avec succès.")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur lors du changement de mot de passe.")
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h1 className="font-serif text-3xl font-bold text-zinc-900">Mon profil</h1>
        <p className="text-zinc-500 mt-1 text-sm">Gérez vos informations personnelles et votre sécurité</p>
      </div>

      {/* Carte identité */}
      <div className="card-base card-body flex flex-wrap items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
          <span className="text-xl font-bold text-amber-700">{(me.name || me.email)[0].toUpperCase()}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-zinc-900 text-lg truncate">{me.name || "Utilisateur"}</p>
          <p className="text-sm text-zinc-500 truncate">{me.email}</p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-violet-50 text-violet-700 border border-violet-100 flex-shrink-0">
          {ROLE_LABELS[me.role] ?? me.role}
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
      {/* Informations */}
      <section className="card-base card-body space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-zinc-800">
          <User size={18} className="text-primary" /> Informations
        </h2>

        <div className="flex flex-col gap-1.5">
          <label className="label-base">Nom complet</label>
          <div className="flex flex-wrap gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-base flex-1 min-w-[200px]"
              placeholder="Votre nom"
            />
            <button
              onClick={handleSaveName}
              disabled={!nameChanged || savingName}
              className="btn-secondary h-10 px-4 disabled:opacity-40 flex-shrink-0"
            >
              {savingName ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Enregistrer
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-100">
          <div className="flex items-center gap-2 text-sm text-zinc-500 min-w-0">
            <Mail size={15} className="text-zinc-400 flex-shrink-0" />
            <span className="truncate">{me.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-500 min-w-0">
            <CalendarDays size={15} className="text-zinc-400 flex-shrink-0" />
            <span className="truncate">Membre depuis le {new Date(me.createdAt).toLocaleDateString("fr-FR")}</span>
          </div>
        </div>
      </section>

      {/* Sécurité */}
      <section className="card-base card-body space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-zinc-800">
          <ShieldCheck size={18} className="text-primary" /> Sécurité
        </h2>

        {me.authMethod === "GOOGLE" ? (
          <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-md border border-zinc-100 text-sm text-zinc-600">
            <svg width="18" height="18" viewBox="0 0 18 18" className="flex-shrink-0">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.09-1.8 2.73v2.27h2.9c1.7-1.57 2.7-3.87 2.7-6.64z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.27c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.34C2.44 15.98 5.48 18 9 18z"/>
              <path fill="#FBBC05" d="M3.95 10.69A5.4 5.4 0 013.68 9c0-.59.1-1.16.27-1.69V4.97H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.03l2.99-2.34z"/>
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.97l2.99 2.34C4.66 5.17 6.65 3.58 9 3.58z"/>
            </svg>
            <span>Vous êtes connecté(e) via <span className="font-semibold">Google</span>. Il n&apos;y a pas de mot de passe à gérer ici — la sécurité de ce compte dépend de celle de votre compte Google.</span>
          </div>
        ) : (
          <>
            <p className="text-xs text-zinc-500 -mt-2">{getPasswordHelpText()}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="label-base">Mot de passe actuel</label>
                <input
                  type={showPasswords ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input-base"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="label-base">Nouveau mot de passe</label>
                <input
                  type={showPasswords ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-base"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="label-base">Confirmer le nouveau mot de passe</label>
                <input
                  type={showPasswords ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-base"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="text-xs text-zinc-500 hover:text-zinc-700 inline-flex items-center gap-1.5"
              >
                {showPasswords ? <EyeOff size={13} /> : <Eye size={13} />}
                {showPasswords ? "Masquer" : "Afficher"} les mots de passe
              </button>
              <button
                onClick={handleChangePassword}
                disabled={savingPassword}
                className="btn-primary h-10 px-4 disabled:opacity-60"
              >
                {savingPassword ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                Changer le mot de passe
              </button>
            </div>
          </>
        )}
      </section>
      </div>
    </div>
  )
}