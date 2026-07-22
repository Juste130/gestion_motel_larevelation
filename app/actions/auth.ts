"use server"

import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { createAndSendOtp, verifyOtp } from "@/lib/otp"
import { checkActivationToken, consumeActivationToken, issueGoogleActivationTicket } from "@/lib/invitations"
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

// --- Étape préalable à l'activation par Google : dépose la preuve d'origine (cookie), à appeler juste avant signIn("google") ---
export async function beginGoogleActivation(token: string) {
  const check = await issueGoogleActivationTicket(token)
  if (!check.ok) {
    const messages = {
      invalid: "Lien d'activation invalide.",
      expired: "Ce lien d'activation a expiré. Demandez à un administrateur de vous en renvoyer un.",
      already_active: "Ce compte est déjà activé.",
    } as const
    return { ok: false, error: messages[check.reason] }
  }
  return { ok: true }
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

// --- Mot de passe oublié : Étape 1, demande de réinitialisation ---
export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || user.status !== "ACTIVE" || !user.password) {
    // Pour des raisons de sécurité, ne pas divulguer si l'email existe
    return { ok: true }
  }

  const { createAndSendPasswordReset } = await import("@/lib/password-reset")
  await createAndSendPasswordReset(user.id, user.name, user.email)
  return { ok: true }
}

// --- Mot de passe oublié : Étape 2, modification du mot de passe avec le token ---
export async function resetPasswordWithToken(token: string, password: string, confirmPassword: string) {
  const { checkPasswordResetToken, consumePasswordResetToken } = await import("@/lib/password-reset")
  const check = await checkPasswordResetToken(token)

  if (!check.ok) {
    const messages = {
      invalid: "Lien de réinitialisation invalide.",
      expired: "Ce lien a expiré. Veuillez refaire une demande de réinitialisation.",
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
    data: { password: hashed },
  })

  await consumePasswordResetToken(token)
  return { ok: true }
}