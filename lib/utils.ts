import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatMoney = (n: number | string) =>
  (Number(n) || 0).toLocaleString("fr-FR").replace(/[\u202f\u00a0]/g, " ").replace(/,/g, " ") + " F";

// Helper to get current time in Benin
export const getBeninTime = () => {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Porto-Novo" }));
};

// Returns YYYY-MM-DD in Benin time, selon la "journée de travail" du motel :
// 7h00 → 6h59 le lendemain (et non minuit → minuit). Toute heure avant 7h00
// est donc rattachée à la journée de travail de la veille. C'est la date de
// référence utilisée dans TOUTE l'application (registre, caisse, stock,
// bilans, dashboard) — un décalage volontaire d'un seul endroit plutôt que
// dispersé dans chaque écran.
const WORKDAY_START_HOUR = 7

/** Fonction pure : formate une date (déjà en heure locale Bénin) en YYYY-MM-DD selon la journée de travail 7h-06h59. Exportée pour les tests. */
export function computeWorkdayDate(d: Date) {
  const shifted = new Date(d)
  shifted.setHours(shifted.getHours() - WORKDAY_START_HOUR);
  const year = shifted.getFullYear();
  const month = String(shifted.getMonth() + 1).padStart(2, '0');
  const day = String(shifted.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const todayStr = () => computeWorkdayDate(getBeninTime());

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
// Une nuitée se termine selon un point de bascule (« cutoff ») qui dépend de
// l'heure d'arrivée, à TOLÉRANCE ZÉRO (aucune marge, contrairement à
// l'ancienne règle des 12h10) :
//  - Arrivée à 13h00 ou après  → le cutoff est fixe : 13h00 le lendemain
//    (puis toutes les 24h ensuite).
//  - Arrivée avant 13h00       → le cutoff est glissant : exactement 24h
//    après l'heure d'arrivée (puis toutes les 24h ensuite). Ça évite un
//    cutoff à 13h00 le jour même, qui serait absurdement court pour une
//    arrivée matinale.
export const NIGHT_ANCHOR_MINUTES = 13 * 60 // 13h00
const DAY_MS = 24 * 60 * 60 * 1000

function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

/** Premier cutoff de nuitée (Date complète) suivant une arrivée donnée. */
function firstNightCutoff(arrivalDate: string, arrivalTime: string): Date {
  const arr = new Date(`${arrivalDate}T${arrivalTime}:00`)
  if (timeToMinutes(arrivalTime) >= NIGHT_ANCHOR_MINUTES) {
    // Cutoff fixe : prochain 13h00 (toujours le lendemain, puisque l'arrivée
    // est déjà à/après 13h00 ce jour-là)
    const cutoff = new Date(arr)
    cutoff.setHours(13, 0, 0, 0)
    cutoff.setDate(cutoff.getDate() + 1)
    return cutoff
  }
  // Cutoff glissant : exactement 24h après l'arrivée
  return new Date(arr.getTime() + DAY_MS)
}

/**
 * Dernier cutoff de nuitée valide à l'instant (ou avant) une date/heure de
 * référence donnée (typiquement l'heure de départ réelle). Sert de base à la
 * fois au calcul du nombre de nuitées et à la scission Nuitée → Horaire.
 */
export function computeLastNuiteeCutoff(arrivalDate: string, arrivalTime: string, refDate: string, refTime: string): Date {
  const ref = new Date(`${refDate}T${refTime}:00`)
  const first = firstNightCutoff(arrivalDate, arrivalTime)
  if (ref.getTime() <= first.getTime()) return first
  const extraBoundaries = Math.floor((ref.getTime() - first.getTime()) / DAY_MS)
  return new Date(first.getTime() + extraBoundaries * DAY_MS)
}

/**
 * Nombre de nuitées facturées entre une arrivée (date + heure) et un départ
 * (date + heure), selon la règle du cutoff 13h00/24h à tolérance zéro.
 * Minimum 1 nuitée.
 */
export function computeNights(arrivalDate: string, arrivalTime: string, departureDate: string, departureTime: string) {
  const dep = new Date(`${departureDate}T${departureTime}:00`)
  const first = firstNightCutoff(arrivalDate, arrivalTime)
  if (dep.getTime() <= first.getTime()) return 1
  return 1 + Math.ceil((dep.getTime() - first.getTime()) / DAY_MS)
}

/**
 * Nombre d'heures entamées après le dernier cutoff de nuitée valide (0 si le
 * départ est avant/à ce cutoff, tolérance zéro : la moindre minute de
 * dépassement compte comme une heure entamée).
 */
export function computeOvershootHours(arrivalDate: string, arrivalTime: string, departureDate: string, departureTime: string) {
  const dep = new Date(`${departureDate}T${departureTime}:00`)
  const cutoff = computeLastNuiteeCutoff(arrivalDate, arrivalTime, departureDate, departureTime)
  const overshootMs = dep.getTime() - cutoff.getTime()
  if (overshootMs <= 0) return 0
  return Math.ceil(overshootMs / (60 * 60 * 1000))
}

/** Formate un cutoff (Date) en heure locale "HH:MM", pour affichage/stockage */
export function formatCutoffTime(cutoff: Date) {
  return `${String(cutoff.getHours()).padStart(2, "0")}:${String(cutoff.getMinutes()).padStart(2, "0")}`
}

/**
 * Nombre d'heures facturables entre une arrivée et un départ (date + heure),
 * en tenant compte des séjours qui s'étalent sur plusieurs jours. Une marge
 * de 10 minutes est tolérée sur la DURÉE TOTALE du séjour (pas heure par
 * heure) : ex. un séjour de 3h peut se prolonger jusqu'à 3h10 sans qu'une 4e
 * heure ne soit facturée. Au-delà, l'heure entamée est facturée en entier.
 */
export function computeBillableHours(arrivalDate: string, arrivalTime: string, departureDate: string, departureTime: string) {
  if (!arrivalTime || !departureTime) return 0
  const arr = new Date(`${arrivalDate}T${arrivalTime}:00`)
  const dep = new Date(`${departureDate}T${departureTime}:00`)
  const diffMs = dep.getTime() - arr.getTime()
  if (diffMs <= 0) return 0
  const diffMinutes = diffMs / (60 * 1000)
  const wholeHours = Math.floor(diffMinutes / 60)
  const remainderMinutes = diffMinutes % 60
  const hours = remainderMinutes <= 10 ? wholeHours : wholeHours + 1
  return Math.max(1, hours)
}

/**
 * Montant théorique "couru" par un séjour encore en cours, calculé au tarif
 * catalogue de la chambre jusqu'à l'instant présent (pas jusqu'au départ,
 * puisqu'il n'a pas encore eu lieu). Sert uniquement à afficher un statut
 * "payé / partiellement payé / reste à payer" — n'est jamais enregistré ni
 * compté comme revenu tant que le séjour n'est pas soldé.
 */
export function computeAccruedAmount(
  stayType: "HORAIRE" | "NUITEE",
  arrivalDate: string,
  arrivalTime: string,
  room: { priceHourly: number; priceNightly: number }
) {
  const now = getBeninTime()
  const nowDate = todayStr()
  const nowTime = currentTimeStr()

  if (stayType === "HORAIRE") {
    const hours = computeBillableHours(arrivalDate, arrivalTime, nowDate, nowTime)
    return Math.max(hours, 1) * room.priceHourly
  }
  const nights = computeNights(arrivalDate, arrivalTime, nowDate, nowTime)
  return nights * room.priceNightly
}