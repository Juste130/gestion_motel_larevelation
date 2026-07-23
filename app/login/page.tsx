"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Lock, Eye, EyeOff, Mail } from "lucide-react"
import { requestLoginOtp } from "@/app/actions/auth"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [step, setStep] = useState<"credentials" | "otp">("credentials")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (searchParams.get("reason") === "inactivity") {
      setInfo("Vous avez été déconnecté après 10 minutes d'inactivité.")
    }
  }, [searchParams])

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await requestLoginOtp(email, password)
    setLoading(false)

    if (!res.ok) {
      setError(res.error || "Identifiants incorrects. Vérifiez vos informations.")
      return
    }
    setInfo(`Un code de vérification a été envoyé à ${email}.`)
    setStep("otp")
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res: any = await signIn("credentials", { redirect: false, email, code })

    if (res?.error) {
      setError("Code invalide ou expiré.")
      setLoading(false)
    } else {
      router.push("/dashboard")
      router.refresh()
    }
  }

  const handleResend = async () => {
    setError("")
    const res = await requestLoginOtp(email, password)
    if (res.ok) setInfo("Un nouveau code vient d'être envoyé.")
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
              Connexion
            </h1>
            <p className="text-zinc-500 text-base mt-2">
              Entrez vos identifiants pour accéder à votre espace.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-base">
              {error}
            </div>
          )}
          {info && (
            <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-base">
              {info}
            </div>
          )}

          {step === "credentials" ? (
            <>
              <form onSubmit={handleCredentialsSubmit} className="flex flex-col gap-5">
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
                  <div className="flex justify-between items-center">
                    <label htmlFor="password" className="text-base font-semibold text-zinc-700">Mot de passe</label>
                    <Link href="/forgot-password" className="text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors">
                      Mot de passe oublié ?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
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
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full mt-2"
                >
                  {loading ? (
                    <span className="animate-pulse">Envoi du code...</span>
                  ) : (
                    <>
                      <Lock size={16} />
                      Continuer
                    </>
                  )}
                </button>
              </form>

              <div className="flex items-center gap-3 my-6">
                <div className="h-px bg-zinc-200 flex-1" />
                <span className="text-xs text-zinc-400 uppercase font-semibold">ou</span>
                <div className="h-px bg-zinc-200 flex-1" />
              </div>

              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                className="w-full h-12 rounded-xl border border-zinc-200 flex items-center justify-center gap-3 font-semibold text-zinc-700 cursor-pointer hover:bg-zinc-200 hover:text-zinc-600 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.09-1.8 2.73v2.27h2.9c1.7-1.57 2.7-3.87 2.7-6.64z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.27c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.34C2.44 15.98 5.48 18 9 18z"/>
                  <path fill="#FBBC05" d="M3.95 10.69A5.4 5.4 0 013.68 9c0-.59.1-1.16.27-1.69V4.97H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.03l2.99-2.34z"/>
                  <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.97l2.99 2.34C4.66 5.17 6.65 3.58 9 3.58z"/>
                </svg>
                Continuer avec Google
              </button>
            </>
          ) : (
            <form onSubmit={handleOtpSubmit} className="flex flex-col gap-5">
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

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="btn-primary w-full mt-2"
              >
                {loading ? (
                  <span className="animate-pulse">Vérification...</span>
                ) : (
                  <>
                    <Lock size={16} />
                    Se connecter
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={() => setStep("credentials")} className="text-zinc-500 hover:text-zinc-700">
                  ← Revenir en arrière
                </button>
                <button type="button" onClick={handleResend} className="text-amber-600 hover:text-amber-700 font-medium">
                  Renvoyer le code
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link href="/signup" className="btn-ghost inline-flex items-center justify-center">
              Demander la création d&apos;un compte
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}