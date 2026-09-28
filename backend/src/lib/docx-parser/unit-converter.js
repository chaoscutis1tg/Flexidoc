/**
 * Unit converter for DOCX units → standard units (mm, pt, px)
 * 
 * DOCX unit systems:
 * - Twips (twentieths of a point): 1 inch = 1440 twips, 1 pt = 20 twips
 * - Half-points: font size (e.g., w:val="26" = 13pt)
 * - EMU (English Metric Units): 1 inch = 914400 EMU
 * - Eighth-points: border width (e.g., w:sz="4" = 0.5pt)
 * - Fiftieths of a percent: table width (e.g., w:w="5000" = 100%)
 */

// Constants
const TWIPS_PER_INCH = 1440;
const TWIPS_PER_PT = 20;
const EMU_PER_INCH = 914400;
const MM_PER_INCH = 25.4;
const PX_PER_INCH = 96;
const PT_PER_INCH = 72;

// Twips conversions
export const twipsToMm = (twips) => {
  if (!twips || isNaN(twips)) return 0;
  return (parseFloat(twips) / TWIPS_PER_INCH) * MM_PER_INCH;
};

export const twipsToPt = (twips) => {
  if (!twips || isNaN(twips)) return 0;
  return parseFloat(twips) / TWIPS_PER_PT;
};

export const twipsToPx = (twips) => {
  if (!twips || isNaN(twips)) return 0;
  return (parseFloat(twips) / TWIPS_PER_INCH) * PX_PER_INCH;
};

// Half-point conversions (used for font sizes: w:sz)
export const halfPtToPt = (halfPt) => {
  if (!halfPt || isNaN(halfPt)) return 0;
  return parseFloat(halfPt) / 2;
};

// EMU conversions (used for images, drawings)
export const emuToMm = (emu) => {
  if (!emu || isNaN(emu)) return 0;
  return (parseFloat(emu) / EMU_PER_INCH) * MM_PER_INCH;
};

export const emuToPx = (emu) => {
  if (!emu || isNaN(emu)) return 0;
  return parseFloat(emu) / 9525; // 914400 / 96
};

// Eighth-point conversions (used for border widths: w:sz in tblBorders)
export const eighthPtToPt = (eighthPt) => {
  if (!eighthPt || isNaN(eighthPt)) return 0;
  return parseFloat(eighthPt) / 8;
};

// Line spacing conversions
// w:line value depends on w:lineRule:
// - "auto" or default: value is in 240ths of a line (240 = single, 360 = 1.5, 480 = double)
// - "exact" or "atLeast": value is in twips
export const lineSpacingToMultiplier = (lineValue, lineRule) => {
  if (!lineValue || isNaN(lineValue)) return 1.0;
  const val = parseFloat(lineValue);
  if (lineRule === 'exact' || lineRule === 'atLeast') {
    // Return in pt
    return twipsToPt(val);
  }
  // Auto: 240ths of a line
  return val / 240;
};

// Percentage conversions (used for table widths: w:type="pct", value in fiftieths of a percent)
export const fiftiethPercentToPercent = (val) => {
  if (!val || isNaN(val)) return 0;
  return parseFloat(val) / 50;
};

// DXA (twips) to percentage of page width
export const dxaToMm = twipsToMm; // DXA is same as twips

// Color: OOXML stores colors as 6-digit hex without #
export const normalizeColor = (color) => {
  if (!color || color === 'auto' || color === 'none') return null;
  if (color.startsWith('#')) return color;
  if (/^[0-9a-fA-F]{6}$/.test(color)) return `#${color}`;
  return null;
};

// Round to 2 decimal places
export const round2 = (val) => Math.round(val * 100) / 100;
