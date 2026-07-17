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
