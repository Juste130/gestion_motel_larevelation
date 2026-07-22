"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react"
import { requestPasswordReset } from "@/app/actions/auth"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await requestPasswordReset(email)
      if (res.ok) {
        setSubmitted(true)
      } else {
        setError("Une erreur s'est produite. Veuillez réessayer.")
      }
    } catch {
      setError("Une erreur inattendue est survenue.")
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
            Récupération<br />
            <span className="text-amber-400">d&apos;accès</span>
          </h2>
          <p className="text-zinc-400 text-base leading-relaxed max-w-xs">
            Réinitialisez votre mot de passe en toute sécurité pour retrouver l&apos;accès à votre espace.
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
            <h1 className="mt-4 text-3xl font-bold text-zinc-800">Mot de passe oublié</h1>
            <p className="mt-2 text-base text-zinc-500">
              Saisissez votre e-mail pour recevoir un lien de réinitialisation.
            </p>
          </div>

          {submitted ? (
            <div className="flex flex-col items-center text-center py-6 space-y-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h2 className="font-bold text-zinc-800 text-lg">Vérifiez vos e-mails</h2>
                <p className="text-sm text-zinc-600 mt-1">
                  Si un compte existe pour <strong>{email}</strong>, un lien y a été envoyé.
                </p>
                <p className="text-xs text-zinc-400 mt-2">
                  Ce lien est valide pendant 2 heures. Vérifiez vos spams si besoin.
                </p>
              </div>
              <Link
                href="/login"
                className="btn-primary w-full mt-4 inline-flex items-center justify-center gap-2"
              >
                <ArrowLeft size={16} />
                Retour à la connexion
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
                <label htmlFor="reset-email" className="text-base font-semibold text-zinc-700">
                  Adresse e-mail
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    required
                    className="w-full h-12 pl-11 pr-4 text-base rounded-xl border border-zinc-200 bg-white text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full h-12 text-base mt-2"
              >
                {loading ? "Envoi du lien..." : "Envoyer le lien de réinitialisation"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
