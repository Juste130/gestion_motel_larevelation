"use client"

import { useState } from "react"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { Lock, Eye, EyeOff, KeyRound, CheckCircle2, XCircle } from "lucide-react"
import { activateWithPassword } from "@/app/actions/auth"
import { getPasswordHelpText, validatePassword } from "@/lib/password"

type ActivationCheck =
  | { ok: true; userId: string; name: string | null; email: string }
  | { ok: false; reason: "invalid" | "expired" | "already_active" }

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Ce lien d'activation est invalide.",
  expired: "Ce lien d'activation a expiré. Demandez à un administrateur de vous en renvoyer un nouveau.",
  already_active: "Ce compte est déjà activé. Vous pouvez vous connecter directement.",
}

export function ActivatePageClient({ token, check }: { token: string; check: ActivationCheck }) {
  const [mode, setMode] = useState<"choice" | "password" | "done">("choice")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.")
      return
    }
    const validation = validatePassword(password)
    if (!validation.isValid) {
      setError(validation.message)
      return
    }

    setLoading(true)
    const res = await activateWithPassword(token, password, confirmPassword)
    setLoading(false)

    if (!res.ok) {
      setError(res.error || "Impossible d'activer le compte.")
      return
    }
    setMode("done")
  }

  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL — Brand (identique au login) */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-zinc-800 p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-56 h-56 rounded-bl-full bg-amber-400/8" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-tr-full bg-amber-400/6" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-amber-400/40 shadow-md">
            <img src="/la_revelation_logo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-amber-400 text-xs font-bold tracking-widest uppercase">Motel</p>
            <p className="text-white font-serif text-3xl font-bold">La Révélation</p>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-white font-serif text-4xl font-bold leading-tight mb-4">
            Activez<br />
            <span className="text-amber-400">votre compte</span>
          </h2>
          <p className="text-zinc-400 text-base leading-relaxed max-w-xs">
            Dernière étape avant d&apos;accéder à votre espace de gestion.
          </p>
        </div>

        <p className="text-zinc-500 text-sm relative z-10">Hôtel · Bar · VIP · Restauration</p>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center p-8 bg-zinc-50">
        <div className="w-full max-w-md">
          <div className="flex lg:hidden justify-center mb-8">
            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg ring-2 ring-amber-400/30">
              <img src="/la_revelation_logo.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
          </div>

          {!check.ok ? (
            <div className="flex flex-col items-center text-center gap-4">
              <XCircle size={40} className="text-red-500" />
              <h1 className="text-2xl font-bold text-zinc-800">Lien inutilisable</h1>
              <p className="text-zinc-500 text-base">{ERROR_MESSAGES[check.reason]}</p>
              <Link href="/login" className="btn-primary mt-2">Aller à la connexion</Link>
            </div>
          ) : mode === "done" ? (
            <div className="flex flex-col items-center text-center gap-4">
              <CheckCircle2 size={40} className="text-emerald-500" />
              <h1 className="text-2xl font-bold text-zinc-800">Compte activé</h1>
              <p className="text-zinc-500 text-base">Votre mot de passe a été enregistré. Vous pouvez maintenant vous connecter.</p>
              <Link href="/login" className="btn-primary mt-2">Se connecter</Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-zinc-800">Bienvenue{check.name ? `, ${check.name}` : ""}</h1>
                <p className="text-zinc-500 text-base mt-2">
                  Activez le compte associé à <span className="font-semibold text-zinc-700">{check.email}</span>.
                </p>
              </div>

              {error && (
                <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-base">
                  {error}
                </div>
              )}

              {mode === "choice" && (
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => setMode("password")}
                    className="btn-primary w-full h-12"
                  >
                    <KeyRound size={16} />
                    Définir un mot de passe
                  </button>

                  <div className="flex items-center gap-3 my-2">
                    <div className="h-px bg-zinc-200 flex-1" />
                    <span className="text-xs text-zinc-400 uppercase font-semibold">ou</span>
                    <div className="h-px bg-zinc-200 flex-1" />
                  </div>

                  <button
                    type="button"
                    onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                    className="w-full h-12 rounded-xl border border-zinc-200 flex items-center justify-center gap-3 font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18">
                      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.09-1.8 2.73v2.27h2.9c1.7-1.57 2.7-3.87 2.7-6.64z"/>
                      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.27c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.34C2.44 15.98 5.48 18 9 18z"/>
                      <path fill="#FBBC05" d="M3.95 10.69A5.4 5.4 0 013.68 9c0-.59.1-1.16.27-1.69V4.97H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.03l2.99-2.34z"/>
                      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.97l2.99 2.34C4.66 5.17 6.65 3.58 9 3.58z"/>
                    </svg>
                    Continuer avec Google
                  </button>
                </div>
              )}

              {mode === "password" && (
                <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="password" className="text-base font-semibold text-zinc-700">Nouveau mot de passe</label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoFocus
                        className="w-full h-12 px-4 pr-12 text-base rounded-xl border border-zinc-200 bg-white text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                        aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                        className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <p className="text-[11px] text-zinc-500">{getPasswordHelpText()}</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="confirmPassword" className="text-base font-semibold text-zinc-700">Confirmez le mot de passe</label>
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full h-12 px-4 text-base rounded-xl border border-zinc-200 bg-white text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                    />
                  </div>

                  <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                    {loading ? (
                      <span className="animate-pulse">Activation...</span>
                    ) : (
                      <>
                        <Lock size={16} />
                        Activer mon compte
                      </>
                    )}
                  </button>

                  <button type="button" onClick={() => setMode("choice")} className="text-sm text-zinc-500 hover:text-zinc-700 self-start">
                    ← Revenir en arrière
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}