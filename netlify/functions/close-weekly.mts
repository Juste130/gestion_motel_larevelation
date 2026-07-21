import type { Config } from "@netlify/functions"
import { prisma } from "../../lib/prisma"
import { runWeeklyClosuresForAllReceptionists } from "../../lib/closures"

export default async () => {
  // "Hier" = dimanche = dernier jour de la semaine locale qui vient de se terminer
  const ref = new Date()
  ref.setUTCDate(ref.getUTCDate() - 1)

  const results = await runWeeklyClosuresForAllReceptionists(ref)
  const created = results.filter(r => r.closure).length
  console.log(`[close-weekly] semaine de ${ref.toISOString().slice(0, 10)} — ${created}/${results.length} clôture(s) hebdomadaire(s) créée(s)`)
  await prisma.$disconnect()
  return new Response(JSON.stringify({ created, total: results.length }), {
    headers: { "content-type": "application/json" },
  })
}

// Dimanche 23:10 UTC = Lundi 00:10 heure du Bénin (UTC+1) — juste après minuit
// local le lundi, pour clôturer la semaine locale (lundi->dimanche) qui vient
// de se terminer. Programmée 5 minutes après close-daily pour que le dernier
// DAILY de la semaine (le dimanche) soit déjà créé.
export const config: Config = { schedule: "10 23 * * 0" }