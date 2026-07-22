import { describe, it, expect } from "vitest"
import { addEntrySchema, stockMovementSchema } from "@/lib/validations"

describe("zod validations", () => {
  describe("addEntrySchema", () => {
    it("validates valid entry data", () => {
      const valid = addEntrySchema.safeParse({
        date: "2026-07-22",
        roomNum: "101",
        roomType: "V",
        roomTypeLabel: "Ventilée",
        roomAmount: 5000,
        condomAmount: 0,
        products: [],
      })
      expect(valid.success).toBe(true)
    })

    it("rejects negative room amounts", () => {
      const invalid = addEntrySchema.safeParse({
        date: "2026-07-22",
        roomNum: "101",
        roomType: "V",
        roomTypeLabel: "Ventilée",
        roomAmount: -100,
        condomAmount: 0,
        products: [],
      })
      expect(invalid.success).toBe(false)
    })
  })

  describe("stockMovementSchema", () => {
    it("rejects non-positive quantities", () => {
      const res = stockMovementSchema.safeParse({
        type: "IN",
        qty: 0,
        date: "2026-07-22",
        productId: "prod123",
      })
      expect(res.success).toBe(false)
    })
  })
})
