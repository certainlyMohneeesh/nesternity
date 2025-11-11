import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Currency symbols mapping - Industry standard ISO 4217 currency codes
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  JPY: '¥',
  CNY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF',
  SEK: 'kr',
  NZD: 'NZ$',
  SGD: 'S$',
  HKD: 'HK$',
  NOK: 'kr',
  KRW: '₩',
  MXN: '$',
  BRL: 'R$',
  ZAR: 'R',
  RUB: '₽',
  AED: 'د.إ',
  SAR: '﷼',
  TRY: '₺',
};

/**
 * Get currency symbol for a given currency code
 * @param currencyCode - ISO 4217 currency code (e.g., 'USD', 'INR', 'EUR')
 * @returns Currency symbol (e.g., '$', '₹', '€')
 */
export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCY_SYMBOLS[currencyCode.toUpperCase()] || currencyCode;
}

/**
 * Format amount with currency symbol
 * @param amount - The amount to format
 * @param currencyCode - ISO 4217 currency code
 * @param locale - Optional locale for number formatting (defaults to 'en-US')
 * @returns Formatted currency string (e.g., '₹14,400.00')
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'USD',
  locale: string = 'en-US'
): string {
  const symbol = getCurrencySymbol(currencyCode);
  const formattedAmount = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  
  return `${symbol}${formattedAmount}`;
}
