import crypto from "crypto"
import { cookies } from "next/headers"
import { prisma } from "./prisma"
import { sendEmail } from "./mailer"

const ACTIVATION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 jours
const GOOGLE_TICKET_COOKIE = "ga_ticket"
const GOOGLE_TICKET_TTL_S = 5 * 60 // 5 minutes — le temps de faire l'aller-retour OAuth Google

function baseUrl() {
  return process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

/**
 * Crée un nouveau token d'activation pour un utilisateur PENDING et lui envoie
 * l'e-mail d'invitation. Invalide silencieusement les tokens précédents non
 * consommés pour cet utilisateur (un seul lien valide à la fois).
 */
export async function createAndSendActivation(userId: string, name: string | null, email: string) {
  const token = crypto.randomBytes(32).toString("hex")
  const tokenHash = hashToken(token)

  await prisma.$transaction([
    prisma.activationToken.updateMany({
      where: { userId, consumedAt: null },
      data: { consumedAt: new Date() }, // invalidation des liens précédents
    }),
    prisma.activationToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt: new Date(Date.now() + ACTIVATION_TTL_MS),
      },
    }),
  ])

  const activationUrl = `${baseUrl()}/activate/${token}`

  await sendEmail({
    to: email,
    subject: "Votre compte La Révélation — Gestion",
    html: `
      <div style="font-family: sans-serif; max-width: 460px; margin: 0 auto;">
        <h2 style="color: #18181b;">La Révélation — Gestion</h2>
        <p style="color: #52525b;">Bonjour ${name || ""},</p>
        <p style="color: #52525b;">Un compte vient d'être créé pour vous sur la plateforme de gestion du motel. Activez-le en cliquant sur le bouton ci-dessous :</p>
        <p style="text-align: center; margin: 28px 0;">
          <a href="${activationUrl}" style="background: #18181b; color: #fbbf24; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            Activer mon compte
          </a>
        </p>
        <p style="color: #a1a1aa; font-size: 13px;">Ce lien expire dans 7 jours. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>
        <p style="color: #a1a1aa; font-size: 12px; word-break: break-all;">Ou copiez ce lien dans votre navigateur : ${activationUrl}</p>
      </div>
    `,
  })
}

export type ActivationCheck =
  | { ok: true; userId: string; name: string | null; email: string }
  | { ok: false; reason: "invalid" | "expired" | "already_active" }

/** Vérifie la validité d'un token d'activation reçu par e-mail (sans le consommer) */
export async function checkActivationToken(token: string): Promise<ActivationCheck> {
  const tokenHash = hashToken(token)
  const record = await prisma.activationToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  })

  if (!record) return { ok: false, reason: "invalid" }
  if (record.user.status === "ACTIVE") return { ok: false, reason: "already_active" }
  if (record.consumedAt || record.expiresAt < new Date()) return { ok: false, reason: "expired" }

  return { ok: true, userId: record.userId, name: record.user.name, email: record.user.email }
}

/** Consomme le token — appelé uniquement après activation réussie (mot de passe défini) */
export async function consumeActivationToken(token: string) {
  const tokenHash = hashToken(token)
  await prisma.activationToken.updateMany({
    where: { tokenHash, consumedAt: null },
    data: { consumedAt: new Date() },
  })
}

/**
 * Étape préalable obligatoire avant de lancer signIn("google") depuis la page
 * d'activation : revalide le token, puis dépose un cookie httpOnly de courte
 * durée (5 min) contenant son hash. C'est ce cookie — jamais l'appel Google
 * en lui-même — qui prouve au callback signIn() de NextAuth que la tentative
 * vient bien du lien d'invitation, et non d'un simple clic "Google" sur la
 * page de connexion classique avec un e-mail deviné/connu.
 */
export async function issueGoogleActivationTicket(token: string): Promise<ActivationCheck> {
  const check = await checkActivationToken(token)
  if (!check.ok) return check

  const jar = await cookies()
  jar.set(GOOGLE_TICKET_COOKIE, hashToken(token), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: GOOGLE_TICKET_TTL_S,
    path: "/",
  })
  return check
}

/** Lit (sans le consommer) le ticket déposé par issueGoogleActivationTicket, pour le callback NextAuth */
export async function readGoogleActivationTicket(): Promise<string | null> {
  const jar = await cookies()
  return jar.get(GOOGLE_TICKET_COOKIE)?.value ?? null
}

/** Supprime le ticket une fois utilisé (succès ou échec) pour empêcher toute réutilisation */
export async function clearGoogleActivationTicket() {
  const jar = await cookies()
  jar.delete(GOOGLE_TICKET_COOKIE)
}

/**
 * Valide le ticket contre la base (le hash doit correspondre à un
 * ActivationToken non consommé, non expiré, appartenant bien à cet
 * utilisateur) puis le consomme. Utilisé uniquement par le callback signIn().
 */
export async function consumeGoogleActivationTicket(userId: string): Promise<boolean> {
  const ticketHash = await readGoogleActivationTicket()
  await clearGoogleActivationTicket()
  if (!ticketHash) return false

  const record = await prisma.activationToken.findUnique({ where: { tokenHash: ticketHash } })
  if (!record) return false
  if (record.userId !== userId) return false
  if (record.consumedAt || record.expiresAt < new Date()) return false

  await prisma.activationToken.update({ where: { id: record.id }, data: { consumedAt: new Date() } })
  return true
}