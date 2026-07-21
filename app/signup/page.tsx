"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, UserPlus, Mail } from "lucide-react"
import { requestSignupOtp, submitAccessRequest } from "@/app/actions/auth"

export default function SignupPage() {
  const [step, setStep] = useState<"form" | "otp" | "done">("form")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    const res = await requestSignupOtp(email)
    setLoading(false)
    if (!res.ok) {
      setError(res.error || "Impossible d'envoyer le code.")
      return
    }
    setInfo(`Un code de vérification a été envoyé à ${email}.`)
    setStep("otp")
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    const res = await submitAccessRequest(name, email, code, message || undefined)
    setLoading(false)
    if (!res.ok) {
      setError(res.error || "Code invalide.")
      return
    }
    setStep("done")
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
            Rejoindre<br />
            <span className="text-amber-400">l&apos;équipe</span>
          </h2>
          <p className="text-zinc-400 text-base leading-relaxed max-w-xs">
            Envoyez votre demande d&apos;accès, la direction validera votre compte sous peu.
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
            <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900">
              <ArrowLeft size={16} />
              Retour à la connexion
            </Link>
            <h1 className="mt-4 text-3xl font-bold text-zinc-800">Demande de compte</h1>
            <p className="mt-2 text-base text-zinc-500">
              Remplissez ce formulaire pour demander un accès à la plateforme.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-base">
              {error}
            </div>
          )}

          {step === "done" ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-base">
              Votre e-mail a été vérifié et votre demande enregistrée. La direction pourra valider votre accès prochainement.
            </div>
          ) : step === "form" ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="text-base font-semibold text-zinc-700">Nom complet</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Votre nom"
                  required
                  className="w-full h-12 px-4 text-base rounded-xl border border-zinc-200 bg-white text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-base font-semibold text-zinc-700">Adresse e-mail</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  required
                  className="w-full h-12 px-4 text-base rounded-xl border border-zinc-200 bg-white text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="message" className="text-base font-semibold text-zinc-700">Message</label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Expliquez rapidement votre besoin d’accès"
                  rows={4}
                  className="rounded-xl border border-zinc-200 px-4 py-3 text-base text-zinc-800 bg-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? (
                  <span className="animate-pulse">Envoi du code...</span>
                ) : (
                  <>
                    <UserPlus size={16} />
                    Envoyer la demande
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="flex flex-col gap-5">
              {info && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-base">
                  {info}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <label htmlFor="code" className="text-base font-semibold text-zinc-700">Code de vérification</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    required
                    autoFocus
                    className="w-full h-12 pl-11 pr-4 text-base tracking-[0.3em] font-mono rounded-xl border border-zinc-200 bg-white text-zinc-800 placeholder:text-zinc-400 placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading || code.length !== 6} className="btn-primary w-full mt-2">
                {loading ? (
                  <span className="animate-pulse">Vérification...</span>
                ) : (
                  <>
                    <UserPlus size={16} />
                    Confirmer et envoyer la demande
                  </>
                )}
              </button>

              <button type="button" onClick={() => setStep("form")} className="text-sm text-zinc-500 hover:text-zinc-700 self-start">
                ← Revenir en arrière
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}