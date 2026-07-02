import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classes condicionais (clsx) e resolve conflitos de utilitários
 * Tailwind (tailwind-merge). Utilitário base de todo o Design System.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
