import { Resend } from "resend"
import nodemailer from "nodemailer"

// Bascule le fournisseur d'e-mail sans toucher au reste du code : "resend" (par
// défaut, structure conservée pour le jour où un domaine vérifié est disponible)
// ou "gmail" (SMTP Gmail, solution temporaire en attendant ce domaine).
const PROVIDER = (process.env.EMAIL_PROVIDER || "resend").toLowerCase()

const resend = new Resend(process.env.RESEND_API_KEY)
const RESEND_FROM_EMAIL = process.env.OTP_FROM_EMAIL || "onboarding@resend.dev"

let gmailTransporter: ReturnType<typeof nodemailer.createTransport> | null = null
function getGmailTransporter() {
  if (!gmailTransporter) {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error(
        "GMAIL_USER et GMAIL_APP_PASSWORD doivent être définis dans .env pour utiliser EMAIL_PROVIDER=gmail."
      )
    }
    gmailTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })
  }
  return gmailTransporter
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (PROVIDER === "gmail") {
    const transporter = getGmailTransporter()
    await transporter.sendMail({
      from: `"La Révélation — Gestion" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    })
    return
  }

  // Resend (par défaut) — code conservé tel quel, prêt à reprendre le relais
  // dès qu'un domaine vérifié sera configuré (il suffira de retirer/ajuster
  // EMAIL_PROVIDER dans .env, rien d'autre à changer).
  const { error } = await resend.emails.send({ from: RESEND_FROM_EMAIL, to, subject, html })
  if (error) {
    throw new Error(`Échec de l'envoi de l'e-mail à ${to} (Resend) : ${error.message}`)
  }
}