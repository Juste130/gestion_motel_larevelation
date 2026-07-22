import { describe, it, expect } from "vitest"
import { computeDuration, formatMoney } from "@/lib/utils"

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
})
