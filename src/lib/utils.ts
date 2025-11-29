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

/**
 * Format a number to a currency string using Intl.NumberFormat with explicit currencyDisplay.
 * CurrencyDisplay can be 'symbol' (₹, $) or 'code' (INR, USD).
 */
export function formatCurrencyWithDisplay(
  amount: number,
  currencyCode: string = 'USD',
  locale: string = 'en-US',
  currencyDisplay: 'symbol' | 'code' | 'name' = 'symbol'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode.toUpperCase(),
    currencyDisplay,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Replace known currency symbols within a text string with their ISO currency codes.
 * Example: '₹ 35,000' -> 'INR 35,000'
 */
export function replaceSymbolWithCurrencyCode(text: string | undefined): string | undefined {
  if (!text) return text;
  // Build reverse map from symbol -> code
  const symbolToCode: Record<string, string> = {};
  Object.keys(CURRENCY_SYMBOLS).forEach((code) => {
    const symbol = CURRENCY_SYMBOLS[code as keyof typeof CURRENCY_SYMBOLS];
    if (symbol) symbolToCode[symbol] = code;
  });
  let replaced = text;
  Object.entries(symbolToCode).forEach(([symbol, code]) => {
    // Add space after code for readability
    const re = new RegExp(`\\${symbol}\\s*`, 'g');
    replaced = replaced.replace(re, `${code} `);
  });
  return replaced;
}
