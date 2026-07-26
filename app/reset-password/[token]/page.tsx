"use client"

import { useState, use } from "react"
import Link from "next/link"
import { Lock, Eye, EyeOff, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react"
import { resetPasswordWithToken } from "@/app/actions/auth"
import { validatePassword, getPasswordHelpText } from "@/lib/password"

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const passwordValidation = validatePassword(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message)
      return
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await resetPasswordWithToken(token, password, confirmPassword)
      if (res.ok) {
        setSuccess(true)
      } else {
        setError(res.error || "Lien invalide ou expiré.")
      }
    } catch {
      setError("Une erreur s'est produite. Veuillez réessayer.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL — Brand */}
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
            Nouveau<br />
            <span className="text-amber-400">mot de passe</span>
          </h2>
          <p className="text-zinc-400 text-base leading-relaxed max-w-xs">
            Choisissez un nouveau mot de passe fort pour sécuriser votre compte.
          </p>
        </div>

        <p className="text-zinc-500 text-sm relative z-10">Hôtel · Bar · VIP · Restauration</p>
      </div>

      {/* RIGHT PANEL — Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-zinc-50">
        <div className="w-full max-w-md">

          {/* Logo mobile */}
          <div className="flex lg:hidden justify-center mb-8">
            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg ring-2 ring-amber-400/30">
              <img src="/la_revelation_logo.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="mb-6">
            <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
              <ArrowLeft size={16} />
              Retour à la connexion
            </Link>
            <h1 className="mt-4 text-3xl font-bold text-zinc-800">Nouveau mot de passe</h1>
            <p className="mt-2 text-base text-zinc-500">
              Définissez votre nouveau mot de passe d&apos;accès.
            </p>
          </div>

          {success ? (
            <div className="flex flex-col items-center text-center py-6 space-y-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h2 className="font-bold text-zinc-800 text-lg">Mot de passe réinitialisé !</h2>
                <p className="text-sm text-zinc-600 mt-1">
                  Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant vous connecter.
                </p>
              </div>
              <Link
                href="/login"
                className="btn-primary w-full mt-4 inline-flex items-center justify-center gap-2"
              >
                Se connecter maintenant
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-base">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label htmlFor="new-password" className="text-base font-semibold text-zinc-700">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
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
                <p className="text-xs text-zinc-400 mt-0.5">
                  {getPasswordHelpText()}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="confirm-password" className="text-base font-semibold text-zinc-700">
                  Confirmer le mot de passe
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-12 px-4 text-base rounded-xl border border-zinc-200 bg-white text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !password}
                className="btn-primary w-full h-12 text-base font-semibold mt-2"
              >
                {loading ? "Mise à jour..." : "Enregistrer le mot de passe"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
