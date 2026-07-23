import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatMoney = (n: number | string) =>
  (Number(n) || 0).toLocaleString("fr-FR").replace(/,/g, " ") + " F";

// Helper to get current time in Benin
export const getBeninTime = () => {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Porto-Novo" }));
};

// Returns YYYY-MM-DD in Benin time
export const todayStr = () => {
  const d = getBeninTime();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Returns HH:MM in Benin time
export const currentTimeStr = () => {
  const d = getBeninTime();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${mins}`;
};
export function prettyDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" });
}

export function computeDuration(arrival: string, departure: string) {
  if (!arrival || !departure) return "";
  const [ah, am] = arrival.split(":").map(Number);
  const [dh, dm] = departure.split(":").map(Number);
  let mins = (dh * 60 + dm) - (ah * 60 + am);
  if (mins < 0) mins += 24 * 60; // passed midnight
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, "0")}`;
}

// ─── Règles Horaire / Nuitée ───────────────────────────────────────
// Une nuitée se termine à 12h00, avec une marge de 10 min. Passé 12h10,
// une nuitée supplémentaire est considérée comme entamée.
export const NIGHT_CHECKOUT_MINUTES = 12 * 60 // 12h00
export const NIGHT_CHECKOUT_GRACE_MINUTES = 10 // marge de 10 min (jusqu'à 12h10)

function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

/**
 * Nombre de nuitées facturées entre une date d'arrivée et une date/heure de
 * départ, selon la règle du checkout à 12h00 (+10 min de marge). Minimum 1
 * nuitée.
 */
export function computeNights(arrivalDate: string, departureDate: string, departureTime: string) {
  const arr = new Date(`${arrivalDate}T00:00:00`)
  const dep = new Date(`${departureDate}T00:00:00`)
  const dayDiff = Math.round((dep.getTime() - arr.getTime()) / (1000 * 60 * 60 * 24))

  const extraNight = timeToMinutes(departureTime) > NIGHT_CHECKOUT_MINUTES + NIGHT_CHECKOUT_GRACE_MINUTES ? 1 : 0

  return Math.max(1, dayDiff + extraNight)
}

/** Nombre d'heures entamées après 12h00 (0 si le départ est avant/à midi) */
export function computeOvershootHours(departureTime: string) {
  const overshootMinutes = timeToMinutes(departureTime) - NIGHT_CHECKOUT_MINUTES
  if (overshootMinutes <= 0) return 0
  return Math.ceil(overshootMinutes / 60)
}

/**
 * Nombre d'heures facturables entre une arrivée et un départ (date + heure),
 * en tenant compte des séjours qui s'étalent sur plusieurs jours. Toute heure
 * entamée est facturée en entier (pratique standard pour la facturation à
 * l'heure).
 */
export function computeBillableHours(arrivalDate: string, arrivalTime: string, departureDate: string, departureTime: string) {
  if (!arrivalTime || !departureTime) return 0
  const arr = new Date(`${arrivalDate}T${arrivalTime}:00`)
  const dep = new Date(`${departureDate}T${departureTime}:00`)
  const diffMs = dep.getTime() - arr.getTime()
  if (diffMs <= 0) return 0
  return Math.ceil(diffMs / (1000 * 60 * 60))
}