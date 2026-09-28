/**
 * Style Resolver — Parse word/styles.xml and resolve style inheritance
 * 
 * Word styles have inheritance: a style can be "basedOn" another style.
 * This module resolves the full property chain for any given styleId.
 */
import { DOMParser } from '@xmldom/xmldom';
import { twipsToMm, halfPtToPt, normalizeColor, round2 } from './unit-converter.js';

/**
 * Parse a <w:ind> element into indent object
 */
const parseIndent = (indEl) => {
  if (!indEl) return null;
  const left = twipsToMm(indEl.getAttribute('w:left') || indEl.getAttribute('w:start') || '0');
  const right = twipsToMm(indEl.getAttribute('w:right') || indEl.getAttribute('w:end') || '0');
  const firstLine = twipsToMm(indEl.getAttribute('w:firstLine') || '0');
  const hanging = twipsToMm(indEl.getAttribute('w:hanging') || '0');
  if (left === 0 && right === 0 && firstLine === 0 && hanging === 0) return null;
  return { left: round2(left), right: round2(right), firstLine: round2(firstLine), hanging: round2(hanging) };
};

/**
 * Parse a <w:spacing> element into spacing object
 */
const parseSpacing = (spacingEl) => {
  if (!spacingEl) return null;
  const before = spacingEl.getAttribute('w:before');
  const after = spacingEl.getAttribute('w:after');
  const line = spacingEl.getAttribute('w:line');
  const lineRule = spacingEl.getAttribute('w:lineRule') || 'auto';

  let lineVal = null;
  if (line) {
    if (lineRule === 'exact' || lineRule === 'atLeast') {
      lineVal = round2(parseFloat(line) / 20); // twips → pt
    } else {
      lineVal = round2(parseFloat(line) / 240); // 240ths → multiplier
    }
  }

  return {
    before: before ? round2(parseFloat(before) / 20) : 0, // twips → pt
    after: after ? round2(parseFloat(after) / 20) : 0,
    line: lineVal || 1.0,
    lineRule,
  };
};

/**
 * Parse paragraph properties from a <w:pPr> element
 */
const parseParagraphProps = (pPrEl) => {
  if (!pPrEl) return {};
  const props = {};

  // Alignment
  const jcEl = getChild(pPrEl, 'w:jc');
  if (jcEl) props.alignment = jcEl.getAttribute('w:val') || 'left';

  // Indent
  const indEl = getChild(pPrEl, 'w:ind');
  const indent = parseIndent(indEl);
  if (indent) props.indent = indent;

  // Spacing
  const spacingEl = getChild(pPrEl, 'w:spacing');
  const spacing = parseSpacing(spacingEl);
  if (spacing) props.spacing = spacing;

  // Keep with next
  if (getChild(pPrEl, 'w:keepNext')) props.keepWithNext = true;

  // Page break before
  if (getChild(pPrEl, 'w:pageBreakBefore')) props.pageBreakBefore = true;

  // Outline level (heading level)
  const outlineLvl = getChild(pPrEl, 'w:outlineLvl');
  if (outlineLvl) props.outlineLevel = parseInt(outlineLvl.getAttribute('w:val') || '0');

  return props;
};

/**
 * Parse run properties from a <w:rPr> element
 */
const parseRunProps = (rPrEl) => {
  if (!rPrEl) return {};
  const props = {};

  // Font family
  const rFonts = getChild(rPrEl, 'w:rFonts');
  if (rFonts) {
    props.fontFamily = rFonts.getAttribute('w:ascii')
      || rFonts.getAttribute('w:hAnsi')
      || rFonts.getAttribute('w:eastAsia')
      || rFonts.getAttribute('w:cs');
  }

  // Font size
  const sz = getChild(rPrEl, 'w:sz');
  if (sz) props.fontSize = halfPtToPt(sz.getAttribute('w:val'));
  const szCs = getChild(rPrEl, 'w:szCs');
  if (szCs && !props.fontSize) props.fontSize = halfPtToPt(szCs.getAttribute('w:val'));

  // Bold
  const b = getChild(rPrEl, 'w:b');
  if (b) {
    const val = b.getAttribute('w:val');
    props.bold = val !== '0' && val !== 'false';
  }

  // Italic
  const i = getChild(rPrEl, 'w:i');
  if (i) {
    const val = i.getAttribute('w:val');
    props.italic = val !== '0' && val !== 'false';
  }

  // Underline
  const u = getChild(rPrEl, 'w:u');
  if (u) {
    const val = u.getAttribute('w:val');
    props.underline = val && val !== 'none' ? val : null;
  }

  // Strike
  const strike = getChild(rPrEl, 'w:strike');
  if (strike) {
    const val = strike.getAttribute('w:val');
    props.strike = val !== '0' && val !== 'false';
  }

  // Color
  const color = getChild(rPrEl, 'w:color');
  if (color) props.color = normalizeColor(color.getAttribute('w:val'));

  // Highlight
  const highlight = getChild(rPrEl, 'w:highlight');
  if (highlight) props.highlight = highlight.getAttribute('w:val');

  // Superscript / Subscript
  const vertAlign = getChild(rPrEl, 'w:vertAlign');
  if (vertAlign) {
    const val = vertAlign.getAttribute('w:val');
    if (val === 'superscript') props.superscript = true;
    if (val === 'subscript') props.subscript = true;
  }

  return props;
};

/**
 * Helper: get first child element with a given tag name
 */
function getChild(parent, tagName) {
  if (!parent || !parent.childNodes) return null;
  const local = tagName.includes(':') ? tagName.split(':')[1] : tagName;
  for (let i = 0; i < parent.childNodes.length; i++) {
    const node = parent.childNodes[i];
    if (node.nodeType === 1) {
      if (node.nodeName === tagName || node.localName === local || node.nodeName.endsWith(':' + local)) {
        return node;
      }
    }
  }
  return null;
}


/**
 * Build a map of styleId → style properties from styles.xml
 * @param {string} stylesXml - Content of word/styles.xml
 * @returns {{ [styleId: string]: { paragraphProps, runProps, basedOn, type, name } }}
 */
export const buildStyleMap = (stylesXml) => {
  if (!stylesXml) return {};

  const doc = new DOMParser().parseFromString(stylesXml, 'text/xml');
  const styleEls = doc.getElementsByTagName('w:style');
  const rawMap = {};

  // First pass: extract raw properties for each style
  for (let i = 0; i < styleEls.length; i++) {
    const styleEl = styleEls[i];
    const styleId = styleEl.getAttribute('w:styleId');
    if (!styleId) continue;

    const entry = {
      type: styleEl.getAttribute('w:type') || 'paragraph',
      name: '',
      basedOn: null,
      paragraphProps: {},
      runProps: {},
    };

    // Style name
    const nameEl = getChild(styleEl, 'w:name');
    if (nameEl) entry.name = nameEl.getAttribute('w:val') || '';

    // Based on
    const basedOnEl = getChild(styleEl, 'w:basedOn');
    if (basedOnEl) entry.basedOn = basedOnEl.getAttribute('w:val');

    // Paragraph properties
    const pPrEl = getChild(styleEl, 'w:pPr');
    entry.paragraphProps = parseParagraphProps(pPrEl);

    // Run properties
    const rPrEl = getChild(styleEl, 'w:rPr');
    entry.runProps = parseRunProps(rPrEl);

    rawMap[styleId] = entry;
  }

  // Second pass: resolve inheritance (up to 10 levels deep)
  const resolvedMap = {};
  for (const styleId of Object.keys(rawMap)) {
    resolvedMap[styleId] = resolveStyle(styleId, rawMap, 0);
  }

  // Extract document defaults
  const docDefaults = doc.getElementsByTagName('w:docDefaults');
  if (docDefaults.length > 0) {
    const rPrDefault = getChild(getChild(docDefaults[0], 'w:rPrDefault'), 'w:rPr');
    const pPrDefault = getChild(getChild(docDefaults[0], 'w:pPrDefault'), 'w:pPr');
    resolvedMap['__defaults__'] = {
      type: 'defaults',
      name: 'Document Defaults',
      basedOn: null,
      paragraphProps: parseParagraphProps(pPrDefault),
      runProps: parseRunProps(rPrDefault),
    };
  }

  return resolvedMap;
};

/**
 * Resolve a style by following the basedOn chain
 */
function resolveStyle(styleId, rawMap, depth) {
  if (depth > 10) return rawMap[styleId]; // prevent infinite recursion
  const style = rawMap[styleId];
  if (!style) return null;

  if (!style.basedOn || !rawMap[style.basedOn]) {
    return { ...style };
  }

  const parent = resolveStyle(style.basedOn, rawMap, depth + 1);
  if (!parent) return { ...style };

  // Merge: child overrides parent
  return {
    type: style.type,
    name: style.name,
    basedOn: style.basedOn,
    paragraphProps: { ...parent.paragraphProps, ...style.paragraphProps },
    runProps: { ...parent.runProps, ...style.runProps },
  };
}

export { getChild, parseParagraphProps, parseRunProps, parseIndent, parseSpacing };
