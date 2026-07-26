import crypto from "crypto"
import { prisma } from "./prisma"
import { sendEmail } from "./mailer"

const RESET_TOKEN_TTL_MS = 2 * 60 * 60 * 1000 // 2 heures

function baseUrl() {
  return process.env.NEXTAUTH_URL || "http://localhost:3000"
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export async function createAndSendPasswordReset(userId: string, name: string | null, email: string) {
  const token = crypto.randomBytes(32).toString("hex")
  const tokenHash = hashToken(token)

  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({
      where: { userId, consumedAt: null },
      data: { consumedAt: new Date() },
    }),
    prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    }),
  ])

  const resetUrl = `${baseUrl()}/reset-password/${token}`

  await sendEmail({
    to: email,
    subject: "Réinitialisation de votre mot de passe — La Révélation",
    html: `
      <div style="font-family: sans-serif; max-width: 460px; margin: 0 auto;">
        <h2 style="color: #18181b;">La Révélation — Gestion</h2>
        <p style="color: #52525b;">Bonjour ${name || ""},</p>
        <p style="color: #52525b;">Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en définir un nouveau :</p>
        <p style="text-align: center; margin: 28px 0;">
          <a href="${resetUrl}" style="background: #18181b; color: #fbbf24; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            Réinitialiser mon mot de passe
          </a>
        </p>
        <p style="color: #a1a1aa; font-size: 13px;">Ce lien expire dans 2 heures. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>
        <p style="color: #a1a1aa; font-size: 12px; word-break: break-all;">Ou copiez ce lien : ${resetUrl}</p>
      </div>
    `,
  })
}

export type PasswordResetCheck =
  | { ok: true; userId: string; email: string }
  | { ok: false; reason: "invalid" | "expired" }

export async function checkPasswordResetToken(token: string): Promise<PasswordResetCheck> {
  const tokenHash = hashToken(token)
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  })

  if (!record) return { ok: false, reason: "invalid" }
  if (record.consumedAt || record.expiresAt < new Date()) return { ok: false, reason: "expired" }

  return { ok: true, userId: record.userId, email: record.user.email }
}

export async function consumePasswordResetToken(token: string) {
  const tokenHash = hashToken(token)
  await prisma.passwordResetToken.updateMany({
    where: { tokenHash, consumedAt: null },
    data: { consumedAt: new Date() },
  })
}
