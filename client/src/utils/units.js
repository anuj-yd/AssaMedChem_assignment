/**
 * Client-side unit conversion utilities
 * Mirrors the server-side logic in server/utils/unitConversion.js
 */

export const CONVERSION_FACTORS = {
  g:    1,
  kg:   1000,
  mL:   1,
  L:    1000,
  unit: 1,
};

export const UNIT_LABELS = {
  g:    'grams (g)',
  kg:   'kilograms (kg)',
  mL:   'milliliters (mL)',
  L:    'liters (L)',
  unit: 'units (count)',
};

export const WEIGHT_UNITS  = ['g', 'kg'];
export const VOLUME_UNITS  = ['mL', 'L'];
export const COUNT_UNITS   = ['unit'];
export const ALL_UNITS     = [...WEIGHT_UNITS, ...VOLUME_UNITS, ...COUNT_UNITS];

export function getBaseUnit(unit) {
  if (WEIGHT_UNITS.includes(unit))  return 'g';
  if (VOLUME_UNITS.includes(unit))  return 'mL';
  if (COUNT_UNITS.includes(unit))   return 'unit';
  throw new Error(`Unknown unit: ${unit}`);
}

/**
 * Returns the compatible display units for a given base unit.
 * e.g. baseUnit='g' → ['g', 'kg']
 */
export function getCompatibleUnits(baseUnit) {
  const dim = getBaseUnit(baseUnit);
  if (dim === 'g')    return WEIGHT_UNITS;
  if (dim === 'mL')   return VOLUME_UNITS;
  if (dim === 'unit') return COUNT_UNITS;
  return [baseUnit];
}

/** Convert qty in fromUnit to base unit */
export function convertToBase(qty, fromUnit) {
  return Number(qty) * CONVERSION_FACTORS[fromUnit];
}

/** Convert qty in base unit to displayUnit */
export function convertFromBase(baseQty, toUnit) {
  return Number(baseQty) / CONVERSION_FACTORS[toUnit];
}

/**
 * Given basePricePerBaseUnit (in INR, NOT paise), derive price per displayUnit.
 * e.g. ₹0.25/g → ₹250/kg
 */
export function pricePerDisplayUnit(basePriceInr, displayUnit) {
  return basePriceInr * CONVERSION_FACTORS[displayUnit];
}

/**
 * Calculate line total in INR given:
 *   basePricePaise = price per base unit in paise (as stored in DB)
 *   orderedQty     = quantity in orderedUnit
 *   orderedUnit    = the unit the user chose
 */
export function calcLineTotal(basePricePaise, orderedQty, orderedUnit) {
  const factor = CONVERSION_FACTORS[orderedUnit];
  const pricePerOrderedUnitPaise = basePricePaise * factor;
  return (pricePerOrderedUnitPaise * Number(orderedQty)) / 100; // return INR
}
