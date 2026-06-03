/**
 * Format a number as INR currency
 * e.g. 12500.5 → "₹12,500.50"
 */
export function formatINR(amount, decimals = 2) {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(amount));
}

/**
 * Paise → INR
 */
export function paiseToInr(paise) {
  return Number(paise) / 100;
}

/**
 * INR → Paise
 */
export function inrToPaise(inr) {
  return Math.round(Number(inr) * 100);
}

/**
 * Format large numbers with Indian numbering (lakh/crore aware via Intl)
 */
export function formatNumber(num, decimals = 2) {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(Number(num));
}
