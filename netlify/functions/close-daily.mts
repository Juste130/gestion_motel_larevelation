import type { Config } from "@netlify/functions"
import { prisma } from "../../lib/prisma"
import { runDailyClosuresForAllReceptionists } from "../../lib/closures"

function yesterdayStr() {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

export default async () => {
  const date = yesterdayStr()
  const results = await runDailyClosuresForAllReceptionists(date)
  const created = results.filter(r => r.closure).length
  console.log(`[close-daily] ${date} — ${created}/${results.length} clôture(s) journalière(s) créée(s)`)
  await prisma.$disconnect()
  return new Response(JSON.stringify({ date, created, total: results.length }), {
    headers: { "content-type": "application/json" },
  })
}

// 23:05 UTC = 00:05 heure du Bénin (UTC+1) — juste après minuit local,
// pour clôturer la journée locale qui vient de se terminer.
export const config: Config = { schedule: "5 23 * * *" }