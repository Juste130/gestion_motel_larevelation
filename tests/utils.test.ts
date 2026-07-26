import { describe, it, expect } from "vitest"
import { computeDuration, formatMoney, computeNights, computeOvershootHours, computeBillableHours, computeWorkdayDate } from "@/lib/utils"

describe("utils", () => {
  describe("formatMoney", () => {
    it("formats numbers with space separator and F suffix", () => {
      expect(formatMoney(5000)).toBe("5 000 F")
      expect(formatMoney(0)).toBe("0 F")
    })
  })

  describe("computeDuration", () => {
    it("computes duration within same day", () => {
      expect(computeDuration("14:00", "16:30")).toBe("2h30")
      expect(computeDuration("10:00", "12:00")).toBe("2h")
      expect(computeDuration("08:15", "08:45")).toBe("30min")
    })

    it("handles overnight stays passing midnight", () => {
      expect(computeDuration("23:00", "01:00")).toBe("2h")
    })
  })

  describe("computeNights (cutoff 13h00 / 24h glissant, tolérance zéro)", () => {
    it("arrivée après 13h00 : cutoff fixe au 13h00 du lendemain", () => {
      // Arrivée 20h00 J1, départ 11h50 J2 (avant le cutoff) → 1 nuitée
      expect(computeNights("2026-07-20", "20:00", "2026-07-21", "11:50")).toBe(1)
      // Départ pile à 13h00 J2 (sur le cutoff, tolérance zéro mais pas dépassé) → 1 nuitée
      expect(computeNights("2026-07-20", "20:00", "2026-07-21", "13:00")).toBe(1)
      // Départ à 13h01 J2 (1 minute après le cutoff) → 2 nuitées (zéro tolérance)
      expect(computeNights("2026-07-20", "20:00", "2026-07-21", "13:01")).toBe(2)
    })

    it("arrivée avant 13h00 : cutoff glissant à 24h exactement après l'arrivée", () => {
      // Arrivée 10h00 J1 → cutoff 10h00 J2 pile
      expect(computeNights("2026-07-20", "10:00", "2026-07-21", "10:00")).toBe(1)
      expect(computeNights("2026-07-20", "10:00", "2026-07-21", "10:01")).toBe(2)
      expect(computeNights("2026-07-20", "10:00", "2026-07-21", "09:59")).toBe(1)
    })

    it("plusieurs nuitées consécutives", () => {
      // Arrivée 20h00 J1 → cutoffs à J2 13h00, J3 13h00, J4 13h00...
      // Départ pile sur le 3e cutoff (J4 13h00) → exactement 3 nuitées
      expect(computeNights("2026-07-20", "20:00", "2026-07-23", "13:00")).toBe(3)
      // 1 minute après ce même cutoff → une 4e nuitée est entamée (tolérance zéro)
      expect(computeNights("2026-07-20", "20:00", "2026-07-23", "13:01")).toBe(4)
    })
  })

  describe("computeOvershootHours", () => {
    it("aucun dépassement avant/à le cutoff", () => {
      expect(computeOvershootHours("2026-07-20", "20:00", "2026-07-21", "13:00")).toBe(0)
    })
    it("dépassement arrondi à l'heure entamée supérieure, tolérance zéro", () => {
      expect(computeOvershootHours("2026-07-20", "20:00", "2026-07-21", "15:00")).toBe(2)
      expect(computeOvershootHours("2026-07-20", "20:00", "2026-07-21", "13:01")).toBe(1)
    })
  })

  describe("computeBillableHours (marge de 10 min sur la durée totale)", () => {
    it("une heure entamée de moins de 10 min n'est pas facturée", () => {
      expect(computeBillableHours("2026-07-20", "10:00", "2026-07-20", "13:08")).toBe(3)
    })
    it("au-delà de 10 min, l'heure entamée est facturée en entier", () => {
      expect(computeBillableHours("2026-07-20", "10:00", "2026-07-20", "13:11")).toBe(4)
    })
    it("minimum 1 heure facturée pour tout séjour", () => {
      expect(computeBillableHours("2026-07-20", "10:00", "2026-07-20", "10:05")).toBe(1)
    })
  })

  describe("computeWorkdayDate (journée de travail 7h00 → 06h59)", () => {
    it("avant 7h00 : rattaché à la journée de travail de la veille", () => {
      expect(computeWorkdayDate(new Date("2026-07-21T03:00:00"))).toBe("2026-07-20")
      expect(computeWorkdayDate(new Date("2026-07-21T06:59:00"))).toBe("2026-07-20")
    })
    it("à 7h00 pile et après : journée de travail du jour calendaire courant", () => {
      expect(computeWorkdayDate(new Date("2026-07-21T07:00:00"))).toBe("2026-07-21")
      expect(computeWorkdayDate(new Date("2026-07-21T23:59:00"))).toBe("2026-07-21")
    })
  })
})