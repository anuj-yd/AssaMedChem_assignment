// Unit conversion utility — server side
// Internal base units:
//   Weight → grams (g)
//   Volume → milliliters (mL)
//   Count  → unit

const CONVERSION_FACTORS = {
  // Weight
  g:  1,
  kg: 1000,
  // Volume
  mL: 1,
  L:  1000,
  // Count
  unit: 1,
};

// Dimensions groupings for validation
const WEIGHT_UNITS  = ['g', 'kg'];
const VOLUME_UNITS  = ['mL', 'L'];
const COUNT_UNITS   = ['unit'];

const ALL_UNITS = [...WEIGHT_UNITS, ...VOLUME_UNITS, ...COUNT_UNITS];

/**
 * Returns the base unit for a given unit.
 *   kg → g | L → mL | unit → unit
 */
function getBaseUnit(unit) {
  if (WEIGHT_UNITS.includes(unit))  return 'g';
  if (VOLUME_UNITS.includes(unit))  return 'mL';
  if (COUNT_UNITS.includes(unit))   return 'unit';
  throw new Error(`Unknown unit: ${unit}`);
}

/**
 * Convert a quantity FROM a given unit TO the base unit.
 * e.g. convertToBase(2, 'kg') → 2000 (grams)
 */
function convertToBase(qty, fromUnit) {
  const factor = CONVERSION_FACTORS[fromUnit];
  if (factor === undefined) throw new Error(`Unknown unit: ${fromUnit}`);
  return Number(qty) * factor;
}

/**
 * Convert a quantity FROM base unit TO a given display unit.
 * e.g. convertFromBase(2000, 'kg') → 2
 */
function convertFromBase(baseQty, toUnit) {
  const factor = CONVERSION_FACTORS[toUnit];
  if (factor === undefined) throw new Error(`Unknown unit: ${toUnit}`);
  return Number(baseQty) / factor;
}

/**
 * Given a base price (INR paise per base unit) and the desired display unit,
 * return the price per display unit.
 * e.g. basePricePerG = 0.5 paise/g → pricePerKg = 500 paise/kg
 */
function pricePerUnit(basePricePerBaseUnit, displayUnit) {
  const factor = CONVERSION_FACTORS[displayUnit];
  if (factor === undefined) throw new Error(`Unknown unit: ${displayUnit}`);
  return Number(basePricePerBaseUnit) * factor;
}

/**
 * Validate that fromUnit and toUnit share the same dimension.
 */
function validateCompatibleUnits(unitA, unitB) {
  const baseA = getBaseUnit(unitA);
  const baseB = getBaseUnit(unitB);
  if (baseA !== baseB) {
    throw new Error(
      `Incompatible units: ${unitA} (${baseA}) and ${unitB} (${baseB})`
    );
  }
}

module.exports = {
  CONVERSION_FACTORS,
  WEIGHT_UNITS,
  VOLUME_UNITS,
  COUNT_UNITS,
  ALL_UNITS,
  getBaseUnit,
  convertToBase,
  convertFromBase,
  pricePerUnit,
  validateCompatibleUnits,
};
