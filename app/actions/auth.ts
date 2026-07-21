"use server"

import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { createAndSendOtp, verifyOtp } from "@/lib/otp"
import { checkActivationToken, consumeActivationToken } from "@/lib/invitations"
import { validatePassword } from "@/lib/password"

// --- Étape 1 de la connexion : vérifie email + mot de passe, puis envoie l'OTP ---
export async function requestLoginOtp(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return { ok: false, error: "Identifiants incorrects." }

  if (user.status === "PENDING") {
    return { ok: false, error: "Ce compte n'est pas encore activé. Consultez votre boîte mail pour l'activer." }
  }
  if (!user.password) {
    return { ok: false, error: "Ce compte utilise la connexion Google. Utilisez le bouton « Continuer avec Google »." }
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return { ok: false, error: "Identifiants incorrects." }

  await createAndSendOtp(email, "LOGIN")
  return { ok: true }
}

// --- Activation d'un compte invité : vérifie le token puis affiche l'identité du compte ---
export async function getActivationInfo(token: string) {
  return checkActivationToken(token)
}

// --- Activation par mot de passe : étape finale du flux d'invitation ---
export async function activateWithPassword(token: string, password: string, confirmPassword: string) {
  const check = await checkActivationToken(token)
  if (!check.ok) {
    const messages = {
      invalid: "Lien d'activation invalide.",
      expired: "Ce lien d'activation a expiré. Demandez à un administrateur de vous en renvoyer un.",
      already_active: "Ce compte est déjà activé.",
    } as const
    return { ok: false, error: messages[check.reason] }
  }

  if (password !== confirmPassword) {
    return { ok: false, error: "Les mots de passe ne correspondent pas." }
  }
  const passwordValidation = validatePassword(password)
  if (!passwordValidation.isValid) {
    return { ok: false, error: passwordValidation.message }
  }

  const hashed = await bcrypt.hash(password, 10)
  await prisma.user.update({
    where: { id: check.userId },
    data: { password: hashed, authMethod: "CREDENTIALS", status: "ACTIVE" },
  })
  await consumeActivationToken(token)

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