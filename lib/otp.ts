import { prisma } from "./prisma"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const OTP_TTL_MS = 5 * 60 * 1000 // 5 minutes
const FROM_EMAIL = process.env.OTP_FROM_EMAIL || "onboarding@resend.dev"

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function createAndSendOtp(email: string, purpose: "LOGIN" | "SIGNUP") {
  const code = generateCode()

  await prisma.otpCode.create({
    data: { email, code, purpose, expiresAt: new Date(Date.now() + OTP_TTL_MS) },
  })

  const subject = purpose === "LOGIN" ? "Votre code de connexion" : "Vérification de votre adresse e-mail"

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 420px; margin: 0 auto;">
        <h2 style="color: #18181b;">La Révélation — Gestion</h2>
        <p style="color: #52525b;">${subject}. Voici votre code :</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #18181b; background: #f4f4f5; padding: 16px; border-radius: 8px; text-align: center;">${code}</p>
        <p style="color: #a1a1aa; font-size: 13px;">Ce code expire dans 5 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>
      </div>
    `,
  })
}

export async function verifyOtp(email: string, code: string, purpose: "LOGIN" | "SIGNUP") {
  const otp = await prisma.otpCode.findFirst({
    where: { email, code, purpose, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  })
  if (!otp) return false

  await prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } })
  return true
}