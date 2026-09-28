/**
 * Section Parser — Parse section properties from <w:sectPr>
 * 
 * Sections define page layout: size, margins, orientation, columns, headers/footers
 */
import { twipsToMm, round2 } from './unit-converter.js';
import { getChild } from './style-resolver.js';

/**
 * Parse <w:sectPr> element into page settings
 * @param {Element} sectPrEl - The <w:sectPr> DOM element
 * @returns {object} - Page settings
 */
export const parseSectionProperties = (sectPrEl) => {
  if (!sectPrEl) {
    // Default A4 portrait
    return getDefaultPageSettings();
  }

  const page = {};

  // Page size
  const pgSz = getChild(sectPrEl, 'w:pgSz');
  if (pgSz) {
    page.width = round2(twipsToMm(pgSz.getAttribute('w:w') || '11906')); // A4 default
    page.height = round2(twipsToMm(pgSz.getAttribute('w:h') || '16838'));
    const orient = pgSz.getAttribute('w:orient');
    page.orientation = orient === 'landscape' ? 'landscape' : 'portrait';
  } else {
    page.width = 210;
    page.height = 297;
    page.orientation = 'portrait';
  }

  // Page margins
  const pgMar = getChild(sectPrEl, 'w:pgMar');
  if (pgMar) {
    page.marginTop = round2(twipsToMm(pgMar.getAttribute('w:top') || '1440'));
    page.marginBottom = round2(twipsToMm(pgMar.getAttribute('w:bottom') || '1440'));
    page.marginLeft = round2(twipsToMm(pgMar.getAttribute('w:left') || '1800'));
    page.marginRight = round2(twipsToMm(pgMar.getAttribute('w:right') || '1800'));
    page.marginHeader = round2(twipsToMm(pgMar.getAttribute('w:header') || '720'));
    page.marginFooter = round2(twipsToMm(pgMar.getAttribute('w:footer') || '720'));
    page.marginGutter = round2(twipsToMm(pgMar.getAttribute('w:gutter') || '0'));
  } else {
    page.marginTop = 25.4;
    page.marginBottom = 25.4;
    page.marginLeft = 31.75;
    page.marginRight = 31.75;
    page.marginHeader = 12.7;
    page.marginFooter = 12.7;
    page.marginGutter = 0;
  }

  // Columns
  const cols = getChild(sectPrEl, 'w:cols');
  if (cols) {
    page.columns = parseInt(cols.getAttribute('w:num') || '1');
    page.columnSpace = round2(twipsToMm(cols.getAttribute('w:space') || '720'));
  }

  // Header/Footer references
  page.headerFooterRefs = [];
  for (let i = 0; i < sectPrEl.childNodes.length; i++) {
    const child = sectPrEl.childNodes[i];
    if (child.nodeType !== 1) continue;
    if (child.nodeName === 'w:headerReference' || child.nodeName === 'w:footerReference') {
      page.headerFooterRefs.push({
        type: child.nodeName === 'w:headerReference' ? 'header' : 'footer',
        hfType: child.getAttribute('w:type') || 'default', // default, first, even
        rId: child.getAttribute('r:id'),
      });
    }
  }

  // Page borders
  const pgBorders = getChild(sectPrEl, 'w:pgBorders');
  if (pgBorders) {
    page.pageBorders = true; // Simplified — can be expanded later
  }

  return page;
};

/**
 * Get default A4 page settings
 */
export const getDefaultPageSettings = () => ({
  width: 210,
  height: 297,
  orientation: 'portrait',
  marginTop: 25.4,
  marginBottom: 25.4,
  marginLeft: 31.75,
  marginRight: 31.75,
  marginHeader: 12.7,
  marginFooter: 12.7,
  marginGutter: 0,
});
