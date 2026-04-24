import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : value ?? 0
  if (!Number.isFinite(n)) return "$0"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n as number)
}

export function formatPercent(value: number | string | null | undefined, fractionDigits = 1): string {
  const n = typeof value === "string" ? Number(value) : value ?? 0
  if (!Number.isFinite(n)) return "0%"
  return `${(n as number).toFixed(fractionDigits)}%`
}
