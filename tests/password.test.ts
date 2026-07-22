import { describe, it, expect } from "vitest"
import { validatePassword } from "@/lib/password"

describe("validatePassword", () => {
  it("rejects short passwords", () => {
    const res = validatePassword("Pass1!")
    expect(res.isValid).toBe(false)
    expect(res.issues).toContain("au moins 8 caractères")
  })

  it("rejects passwords without uppercase letters", () => {
    const res = validatePassword("password123!")
    expect(res.isValid).toBe(false)
    expect(res.issues).toContain("une lettre majuscule")
  })

  it("rejects passwords without special characters", () => {
    const res = validatePassword("Password123")
    expect(res.isValid).toBe(false)
    expect(res.issues).toContain("un caractère spécial")
  })

  it("accepts valid passwords meeting all criteria", () => {
    const res = validatePassword("MotDePasseFort123!")
    expect(res.isValid).toBe(true)
    expect(res.issues).toHaveLength(0)
  })
})
