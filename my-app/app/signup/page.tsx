"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, UserPlus } from "lucide-react"

export default function SignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4 py-10">
      <div className="w-full max-w-xl rounded-md border border-zinc-200 bg-white p-8 shadow-sm">
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

        {submitted ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
            Votre demande a bien été enregistrée. La direction pourra valider votre accès prochainement.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-semibold text-zinc-700">Nom complet</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre nom"
                required
                className="h-12 rounded-md border border-zinc-200 px-4 text-base text-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-semibold text-zinc-700">Adresse e-mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                required
                className="h-12 rounded-md border border-zinc-200 px-4 text-base text-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="message" className="text-sm font-semibold text-zinc-700">Message</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Expliquez rapidement votre besoin d’accès"
                rows={4}
                className="rounded-md border border-zinc-200 px-4 py-3 text-base text-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <button type="submit" className="btn-primary mt-2 inline-flex items-center justify-center gap-2">
              <UserPlus size={16} />
              Envoyer la demande
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
