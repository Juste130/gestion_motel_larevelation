import { z } from "zod"

export const entryProductSchema = z.object({
  id: z.string().min(1, "L'ID du produit est requis"),
  qty: z.number().int().positive("La quantité doit être supérieure à 0"),
  price: z.number().nonnegative("Le prix doit être positif ou nul"),
})

export const addEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (AAAA-MM-JJ)"),
  receiptNo: z.string().optional(),
  roomNum: z.string().min(1, "Le numéro de chambre est requis"),
  roomType: z.string().min(1, "Le type de chambre est requis"),
  roomTypeLabel: z.string().min(1, "Le libellé du type est requis"),
  arrival: z.string().optional(),
  departure: z.string().optional(),
  duration: z.string().optional(),
  roomAmount: z.number().nonnegative("Le montant de la chambre doit être supérieur ou égal à 0"),
  condomAmount: z.number().nonnegative("Le montant des préservatifs doit être supérieur ou égal à 0"),
  products: z.array(entryProductSchema),
})

export const closeEntrySchema = z.object({
  departure: z.string().min(1, "L'heure de départ est requise"),
  duration: z.string().optional(),
  roomAmount: z.number().nonnegative("Le montant de la chambre doit être supérieur ou égal à 0"),
  products: z.array(entryProductSchema),
  currentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide"),
})

export const addProductToEntrySchema = z.object({
  entryId: z.string().min(1, "L'ID du séjour est requis"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide"),
  products: z.array(entryProductSchema).min(1, "Au moins un produit doit être sélectionné"),
})

export const stockMovementSchema = z.object({
  type: z.enum(["IN", "OUT"], { message: "Type de mouvement invalide" }),
  qty: z.number().int().positive("La quantité doit être supérieure à 0"),
  price: z.number().nonnegative().optional(),
  motif: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide"),
  productId: z.string().min(1, "L'ID du produit est requis"),
})

export const cashMovementSchema = z.object({
  label: z.string().min(1, "Le libellé est requis"),
  amount: z.number().positive("Le montant doit être supérieur à 0"),
  type: z.enum(["depense", "recette"], { message: "Type de mouvement invalide" }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide"),
})

export const inviteUserSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Adresse email invalide"),
  role: z.enum(["ADMIN", "DG", "RECEPTIONIST"], { message: "Rôle invalide" }),
})

export const roomSchema = z.object({
  num: z.string().min(1, "Le numéro de chambre est requis"),
  type: z.string().min(1, "Le type de chambre est requis"),
  label: z.string().min(1, "Le libellé est requis"),
  price: z.number().nonnegative("Le prix doit être positif"),
})

export const productSchema = z.object({
  name: z.string().min(1, "Le nom du produit est requis"),
  category: z.string().min(1, "La catégorie est requise"),
  price: z.number().positive("Le prix doit être supérieur à 0"),
  stock: z.number().int().nonnegative("Le stock doit être supérieur ou égal à 0"),
})
