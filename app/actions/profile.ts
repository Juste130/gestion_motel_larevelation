"use server"

import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/session"
import { validatePassword } from "@/lib/password"
import { updateNameSchema, changePasswordSchema } from "@/lib/validations"

/** Récupère les infos complètes du compte connecté (pour la page de profil) */
export async function getMyProfile() {
  const { user } = await getSessionUser()
  const me = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, email: true, role: true, status: true, authMethod: true, createdAt: true },
  })
  if (!me) throw new Error("Compte introuvable")
  return me
}

/** Modifie le nom affiché du compte connecté */
export async function updateMyName(name: string) {
  const { user } = await getSessionUser()
  const validated = updateNameSchema.parse({ name })

  await prisma.user.update({ where: { id: user.id }, data: { name: validated.name } })
  revalidatePath("/dashboard", "layout")
  return { ok: true }
}

/**
 * Change le mot de passe du compte connecté. Réservé aux comptes activés en
 * CREDENTIALS — un compte GOOGLE n'a pas de mot de passe à changer ici (il
 * devrait passer par la révocation d'accès Google côté administrateur, hors
 * périmètre de cette action).
 */
export async function changeMyPassword(currentPassword: string, newPassword: string, confirmPassword: string) {
  const { user } = await getSessionUser()
  changePasswordSchema.parse({ currentPassword, newPassword, confirmPassword })

  const me = await prisma.user.findUnique({ where: { id: user.id } })
  if (!me) return { ok: false, error: "Compte introuvable." }
  if (me.authMethod !== "CREDENTIALS" || !me.password) {
    return { ok: false, error: "Ce compte utilise la connexion Google — il n'y a pas de mot de passe à changer ici." }
  }

  const valid = await bcrypt.compare(currentPassword, me.password)
  if (!valid) return { ok: false, error: "Le mot de passe actuel est incorrect." }

  if (newPassword !== confirmPassword) {
    return { ok: false, error: "Les nouveaux mots de passe ne correspondent pas." }
  }
  const validation = validatePassword(newPassword)
  if (!validation.isValid) return { ok: false, error: validation.message }

  const hashed = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })
  return { ok: true }
}