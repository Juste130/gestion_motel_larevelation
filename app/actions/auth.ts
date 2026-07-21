"use server"

import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { createAndSendOtp, verifyOtp } from "@/lib/otp"

// --- Étape 1 de la connexion : vérifie email + mot de passe, puis envoie l'OTP ---
export async function requestLoginOtp(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return { ok: false, error: "Identifiants incorrects." }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return { ok: false, error: "Identifiants incorrects." }

  await createAndSendOtp(email, "LOGIN")
  return { ok: true }
}

// --- Demande d'accès (signup) : étape 1, envoie l'OTP pour vérifier l'email ---
export async function requestSignupOtp(email: string) {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { ok: false, error: "Un compte existe déjà avec cet e-mail." }

  await createAndSendOtp(email, "SIGNUP")
  return { ok: true }
}

// --- Demande d'accès (signup) : étape 2, vérifie l'OTP puis enregistre la demande ---
export async function submitAccessRequest(name: string, email: string, code: string, message?: string) {
  const valid = await verifyOtp(email, code, "SIGNUP")
  if (!valid) return { ok: false, error: "Code invalide ou expiré." }

  await prisma.accessRequest.create({ data: { name, email, message } })
  return { ok: true }
}