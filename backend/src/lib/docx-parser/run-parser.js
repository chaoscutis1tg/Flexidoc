/**
 * Run Parser — Parse <w:r> elements into text run objects
 * 
 * A "run" is a contiguous piece of text with the same formatting.
 * Each <w:r> can contain <w:t> (text), <w:tab>, <w:br>, etc.
 */
import { halfPtToPt, normalizeColor } from './unit-converter.js';
import { getChild } from './style-resolver.js';

/**
 * Parse a single <w:r> element into a run object
 * @param {Element} rEl - The <w:r> DOM element
 * @param {object} styleRunProps - Default run properties from the paragraph's style
 * @param {object} defaultRunProps - Document default run properties
 * @returns {object} - Run object
 */
export const parseRun = (rEl, styleRunProps = {}, defaultRunProps = {}) => {
  // Parse run properties
  const rPrEl = getChild(rEl, 'w:rPr');
  const directProps = rPrEl ? parseRunProperties(rPrEl) : {};

  // Merge: direct > style > defaults
  const merged = { ...defaultRunProps, ...styleRunProps, ...directProps };

  // Collect text content
  const textParts = [];
  for (let i = 0; i < rEl.childNodes.length; i++) {
    const child = rEl.childNodes[i];
    if (child.nodeType !== 1) continue;

    switch (child.nodeName) {
      case 'w:t':
        textParts.push({
          type: 'text',
          text: child.textContent || '',
        });
        break;

      case 'w:tab':
        textParts.push({ type: 'tab' });
        break;

      case 'w:br': {
        const brType = child.getAttribute('w:type');
        if (brType === 'page') {
          textParts.push({ type: 'pageBreak' });
        } else if (brType === 'column') {
          textParts.push({ type: 'columnBreak' });
        } else {
          textParts.push({ type: 'lineBreak' });
        }
        break;
      }

      case 'w:sym': {
        const font = child.getAttribute('w:font');
        const charCode = child.getAttribute('w:char');
        textParts.push({
          type: 'symbol',
          font,
          char: charCode ? String.fromCharCode(parseInt(charCode, 16)) : '',
        });
        break;
      }

      // Skip run properties (already parsed)
      case 'w:rPr':
        break;
    }
  }

  // If this run has only one text part, flatten it
  if (textParts.length === 1 && textParts[0].type === 'text') {
    return {
      type: 'text',
      text: textParts[0].text,
      ...buildRunStyle(merged),
    };
  }

  // If this run is a tab or break
  if (textParts.length === 1 && textParts[0].type !== 'text') {
    return { ...textParts[0], ...buildRunStyle(merged) };
  }

  // Multiple parts: return as compound run
  if (textParts.length === 0) {
    return null; // Empty run
  }

  // Flatten into multiple runs
  return textParts.map(part => ({
    ...part,
    ...buildRunStyle(merged),
  }));
};

/**
 * Parse <w:rPr> element into properties object
 */
function parseRunProperties(rPrEl) {
  const props = {};

  // Font family
  const rFonts = getChild(rPrEl, 'w:rFonts');
  if (rFonts) {
    props.fontFamily = rFonts.getAttribute('w:ascii')
      || rFonts.getAttribute('w:hAnsi')
      || rFonts.getAttribute('w:eastAsia')
      || rFonts.getAttribute('w:cs')
      || undefined;
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
  const bCs = getChild(rPrEl, 'w:bCs');
  if (bCs && props.bold === undefined) {
    const val = bCs.getAttribute('w:val');
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

  // Double strike
  const dstrike = getChild(rPrEl, 'w:dstrike');
  if (dstrike) {
    const val = dstrike.getAttribute('w:val');
    if (val !== '0' && val !== 'false') props.strike = 'double';
  }

  // Color
  const color = getChild(rPrEl, 'w:color');
  if (color) {
    const c = normalizeColor(color.getAttribute('w:val'));
    if (c) props.color = c;
  }

  // Highlight
  const highlight = getChild(rPrEl, 'w:highlight');
  if (highlight) props.highlight = highlight.getAttribute('w:val');

  // Shading (background color)
  const shd = getChild(rPrEl, 'w:shd');
  if (shd) {
    const fill = normalizeColor(shd.getAttribute('w:fill'));
    if (fill) props.highlight = fill;
  }

  // Superscript / Subscript
  const vertAlign = getChild(rPrEl, 'w:vertAlign');
  if (vertAlign) {
    const val = vertAlign.getAttribute('w:val');
    if (val === 'superscript') props.superscript = true;
    if (val === 'subscript') props.subscript = true;
  }

  // Caps
  const caps = getChild(rPrEl, 'w:caps');
  if (caps) {
    const val = caps.getAttribute('w:val');
    props.caps = val !== '0' && val !== 'false';
  }

  // Small caps
  const smallCaps = getChild(rPrEl, 'w:smallCaps');
  if (smallCaps) {
    const val = smallCaps.getAttribute('w:val');
    props.smallCaps = val !== '0' && val !== 'false';
  }

  return props;
}

/**
 * Build a clean run style object from merged properties
 */
function buildRunStyle(props) {
  const style = {};
  if (props.fontFamily) style.fontFamily = props.fontFamily;
  if (props.fontSize) style.fontSize = props.fontSize;
  if (props.bold) style.bold = true;
  if (props.italic) style.italic = true;
  if (props.underline) style.underline = props.underline;
  if (props.strike) style.strike = props.strike === 'double' ? 'double' : true;
  if (props.color) style.color = props.color;
  if (props.highlight) style.highlight = props.highlight;
  if (props.superscript) style.superscript = true;
  if (props.subscript) style.subscript = true;
  if (props.caps) style.caps = true;
  if (props.smallCaps) style.smallCaps = true;
  return style;
}
