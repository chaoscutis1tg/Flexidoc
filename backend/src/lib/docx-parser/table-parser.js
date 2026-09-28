/**
 * Table Parser — Parse <w:tbl> elements into table blocks
 */
import { twipsToMm, normalizeColor, eighthPtToPt, round2 } from './unit-converter.js';
import { getChild } from './style-resolver.js';
import { parseParagraph } from './paragraph-parser.js';

/**
 * Parse a border element (e.g., <w:top w:val="single" w:sz="4" w:color="000000"/>)
 */
const parseBorder = (borderEl) => {
  if (!borderEl) return null;
  const val = borderEl.getAttribute('w:val');
  if (!val || val === 'none' || val === 'nil') return null;
  return {
    style: val, // single, double, dashed, dotted, etc.
    width: round2(eighthPtToPt(borderEl.getAttribute('w:sz') || '4')),
    color: normalizeColor(borderEl.getAttribute('w:color')) || '#000000',
  };
};

/**
 * Parse <w:tblBorders> element
 */
const parseTableBorders = (bordersEl) => {
  if (!bordersEl) return null;
  return {
    top: parseBorder(getChild(bordersEl, 'w:top')),
    bottom: parseBorder(getChild(bordersEl, 'w:bottom')),
    left: parseBorder(getChild(bordersEl, 'w:left')),
    right: parseBorder(getChild(bordersEl, 'w:right')),
    insideH: parseBorder(getChild(bordersEl, 'w:insideH')),
    insideV: parseBorder(getChild(bordersEl, 'w:insideV')),
  };
};

/**
 * Parse <w:tcBorders> element (cell-level borders)
 */
const parseCellBorders = (bordersEl) => {
  if (!bordersEl) return null;
  return {
    top: parseBorder(getChild(bordersEl, 'w:top')),
    bottom: parseBorder(getChild(bordersEl, 'w:bottom')),
    left: parseBorder(getChild(bordersEl, 'w:left')),
    right: parseBorder(getChild(bordersEl, 'w:right')),
  };
};

/**
 * Parse a <w:tbl> element into a table block
 * @param {Element} tblEl - The <w:tbl> DOM element
 * @param {object} styleMap - Style map
 * @param {object} numberingMap - Numbering map
 * @param {object} relMap - Relationship map
 * @param {object} defaults - Document defaults
 * @returns {object} - Table block
 */
export const parseTable = (tblEl, styleMap, numberingMap, relMap, defaults = {}) => {
  const table = {
    type: 'table',
    width: null,
    alignment: 'left',
    borders: null,
    rows: [],
  };

  // Table properties
  const tblPrEl = getChild(tblEl, 'w:tblPr');
  if (tblPrEl) {
    // Table width
    const tblW = getChild(tblPrEl, 'w:tblW');
    if (tblW) {
      const wType = tblW.getAttribute('w:type');
      const wVal = tblW.getAttribute('w:w');
      if (wType === 'dxa') {
        table.width = round2(twipsToMm(wVal));
      } else if (wType === 'pct') {
        table.widthPercent = round2(parseFloat(wVal) / 50); // fiftieths of a percent
      } else if (wType === 'auto') {
        table.width = null; // auto
      }
    }

    // Table alignment
    const jcEl = getChild(tblPrEl, 'w:jc');
    if (jcEl) table.alignment = jcEl.getAttribute('w:val') || 'left';

    // Table borders
    const tblBorders = getChild(tblPrEl, 'w:tblBorders');
    table.borders = parseTableBorders(tblBorders);

    // Table indent
    const tblInd = getChild(tblPrEl, 'w:tblInd');
    if (tblInd) {
      const indType = tblInd.getAttribute('w:type');
      const indW = tblInd.getAttribute('w:w');
      if (indType === 'dxa') table.indentLeft = round2(twipsToMm(indW));
    }

    // Cell margins (default for all cells)
    const tblCellMar = getChild(tblPrEl, 'w:tblCellMar');
    if (tblCellMar) {
      table.cellMargins = {
        top: round2(twipsToMm((getChild(tblCellMar, 'w:top') || {}).getAttribute?.('w:w') || '0')),
        bottom: round2(twipsToMm((getChild(tblCellMar, 'w:bottom') || {}).getAttribute?.('w:w') || '0')),
        left: round2(twipsToMm((getChild(tblCellMar, 'w:left') || getChild(tblCellMar, 'w:start') || {}).getAttribute?.('w:w') || '108')),
        right: round2(twipsToMm((getChild(tblCellMar, 'w:right') || getChild(tblCellMar, 'w:end') || {}).getAttribute?.('w:w') || '108')),
      };
    }

    // Table style
    const tblStyle = getChild(tblPrEl, 'w:tblStyle');
    if (tblStyle) table.styleId = tblStyle.getAttribute('w:val');
  }

  // Table grid (column widths)
  const tblGrid = getChild(tblEl, 'w:tblGrid');
  const columnWidths = [];
  if (tblGrid) {
    for (let i = 0; i < tblGrid.childNodes.length; i++) {
      const child = tblGrid.childNodes[i];
      if (child.nodeType === 1 && child.nodeName === 'w:gridCol') {
        columnWidths.push(round2(twipsToMm(child.getAttribute('w:w') || '0')));
      }
    }
  }
  if (columnWidths.length > 0) table.columnWidths = columnWidths;

  // Parse rows
  for (let i = 0; i < tblEl.childNodes.length; i++) {
    const child = tblEl.childNodes[i];
    if (child.nodeType !== 1 || child.nodeName !== 'w:tr') continue;

    const row = parseTableRow(child, styleMap, numberingMap, relMap, defaults);
    table.rows.push(row);
  }

  return table;
};

/**
 * Parse a <w:tr> element into a table row
 */
function parseTableRow(trEl, styleMap, numberingMap, relMap, defaults) {
  const row = {
    height: null,
    heightRule: null,
    cells: [],
  };

  // Row properties
  const trPrEl = getChild(trEl, 'w:trPr');
  if (trPrEl) {
    const trHeight = getChild(trPrEl, 'w:trHeight');
    if (trHeight) {
      row.height = round2(twipsToMm(trHeight.getAttribute('w:val') || '0'));
      row.heightRule = trHeight.getAttribute('w:hRule') || 'auto';
    }

    // Header row (repeats on page break)
    const tblHeader = getChild(trPrEl, 'w:tblHeader');
    if (tblHeader) row.isHeader = true;
  }

  // Parse cells
  for (let i = 0; i < trEl.childNodes.length; i++) {
    const child = trEl.childNodes[i];
    if (child.nodeType !== 1 || child.nodeName !== 'w:tc') continue;

    const cell = parseTableCell(child, styleMap, numberingMap, relMap, defaults);
    row.cells.push(cell);
  }

  return row;
}

/**
 * Parse a <w:tc> element into a table cell
 */
function parseTableCell(tcEl, styleMap, numberingMap, relMap, defaults) {
  const cell = {
    width: null,
    colSpan: 1,
    rowSpan: 1,
    vertAlign: 'top',
    shading: null,
    borders: null,
    blocks: [],
  };

  // Cell properties
  const tcPrEl = getChild(tcEl, 'w:tcPr');
  if (tcPrEl) {
    // Cell width
    const tcW = getChild(tcPrEl, 'w:tcW');
    if (tcW) {
      const wType = tcW.getAttribute('w:type');
      const wVal = tcW.getAttribute('w:w');
      if (wType === 'dxa') cell.width = round2(twipsToMm(wVal));
      else if (wType === 'pct') cell.widthPercent = round2(parseFloat(wVal) / 50);
    }

    // Column span
    const gridSpan = getChild(tcPrEl, 'w:gridSpan');
    if (gridSpan) cell.colSpan = parseInt(gridSpan.getAttribute('w:val') || '1');

    // Vertical merge
    const vMerge = getChild(tcPrEl, 'w:vMerge');
    if (vMerge) {
      const val = vMerge.getAttribute('w:val');
      if (val === 'restart') {
        cell.vMerge = 'restart'; // Start of merged cell
      } else {
        cell.vMerge = 'continue'; // Continuation (this cell is merged into the one above)
      }
    }

    // Horizontal merge
    const hMerge = getChild(tcPrEl, 'w:hMerge');
    if (hMerge) {
      const val = hMerge.getAttribute('w:val');
      cell.hMerge = val === 'restart' ? 'restart' : 'continue';
    }

    // Vertical alignment
    const vAlign = getChild(tcPrEl, 'w:vAlign');
    if (vAlign) cell.vertAlign = vAlign.getAttribute('w:val') || 'top';

    // Shading / background color
    const shd = getChild(tcPrEl, 'w:shd');
    if (shd) {
      const fill = normalizeColor(shd.getAttribute('w:fill'));
      if (fill) cell.shading = fill;
    }

    // Cell borders
    const tcBorders = getChild(tcPrEl, 'w:tcBorders');
    cell.borders = parseCellBorders(tcBorders);

    // Text direction
    const textDirection = getChild(tcPrEl, 'w:textDirection');
    if (textDirection) cell.textDirection = textDirection.getAttribute('w:val');
  }

  // Parse cell content (paragraphs, nested tables)
  for (let i = 0; i < tcEl.childNodes.length; i++) {
    const child = tcEl.childNodes[i];
    if (child.nodeType !== 1) continue;

    if (child.nodeName === 'w:p') {
      cell.blocks.push(parseParagraph(child, styleMap, numberingMap, relMap, defaults));
    } else if (child.nodeName === 'w:tbl') {
      cell.blocks.push(parseTable(child, styleMap, numberingMap, relMap, defaults));
    }
  }

  return cell;
}
