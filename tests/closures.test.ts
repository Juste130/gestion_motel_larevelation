import { describe, it, expect } from "vitest"
import { weekRange, isoWeekId } from "@/lib/closures"

describe("closures utils", () => {
  describe("weekRange", () => {
    it("calcule correctement le lundi et le dimanche de la semaine ISO", () => {
      // 2026-07-26 est un dimanche
      const d = new Date(Date.UTC(2026, 6, 26)) // 26 juillet 2026
      const range = weekRange(d)
      expect(range.start).toBe("2026-07-20") // Lundi 20 juillet
      expect(range.end).toBe("2026-07-26")   // Dimanche 26 juillet
    })
  })

  describe("isoWeekId", () => {
    it("génère le bon identifiant de semaine au format YYYY-Www", () => {
      const d = new Date(Date.UTC(2026, 6, 26))
      expect(isoWeekId(d)).toBe("2026-W30")
    })
  })
})
