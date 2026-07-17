"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Lock, ArrowRight } from "lucide-react"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<"login" | "request">("login")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (mode === "request") {
      toast.success("Demande de compte envoyée à la direction !")
      setMode("login")
      setLoading(false)
      return
    }

    const res: any = await signIn("credentials", {
      redirect: false,
      email,
      password,
    })

    if (res?.error) {
      setError("Identifiants incorrects. Vérifiez vos informations.")
      setLoading(false)
    } else {
      router.push("/dashboard")
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL — Brand (slate-800 au lieu de noir pur) */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-zinc-800 p-12 relative overflow-hidden">
        {/* Très légère teinte or dans les coins */}
        <div className="absolute top-0 right-0 w-56 h-56 rounded-bl-full bg-amber-400/8" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-tr-full bg-amber-400/6" />

        {/* Logo + nom */}
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-amber-400/40 shadow-md">
            <img src="/la_revelation_logo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-amber-400 text-xs font-bold tracking-widest uppercase">Motel</p>
            <p className="text-white font-serif text-3xl font-bold">La Révélation</p>
          </div>
        </div>

        {/* Tagline */}
        <div className="relative z-10">
          <h2 className="text-white font-serif text-4xl font-bold leading-tight mb-4">
            Registre<br />
            <span className="text-amber-400">numérique</span>
          </h2>
          <p className="text-zinc-400 text-base leading-relaxed max-w-xs">
            Plateforme de gestion sécurisée pour la direction, l&apos;administration et les réceptionnistes.
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

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-zinc-800">
              {mode === "login" ? "Connexion" : "Demande de compte"}
            </h1>
            <p className="text-zinc-500 text-base mt-2">
              {mode === "login"
                ? "Entrez vos identifiants pour accéder à votre espace."
                : "Remplissez ce formulaire et la direction validera votre accès."}
            </p>
          </div>

          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-base">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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

            {mode === "login" && (
              <div className="flex flex-col gap-2">
                <label htmlFor="password" className="text-base font-semibold text-zinc-700">Mot de passe</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-12 px-4 text-base rounded-xl border border-zinc-200 bg-white text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? (
                <span className="animate-pulse">Chargement...</span>
              ) : mode === "login" ? (
                <>
                  <Lock size={16} />
                  Se connecter
                </>
              ) : (
                <>
                  Envoyer la demande
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setMode(mode === "login" ? "request" : "login")}
              className="btn-ghost"
            >
              {mode === "login"
                ? "Demander la création d'un compte"
                : "← Retour à la connexion"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
