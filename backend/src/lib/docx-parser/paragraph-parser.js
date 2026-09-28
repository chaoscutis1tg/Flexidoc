/**
 * Paragraph Parser — Parse <w:p> elements into paragraph blocks
 */
import { twipsToMm, round2 } from './unit-converter.js';
import { getChild, parseParagraphProps, parseRunProps } from './style-resolver.js';
import { parseRun } from './run-parser.js';

/**
 * Parse a <w:p> element into a paragraph block
 * @param {Element} pEl - The <w:p> DOM element
 * @param {object} styleMap - Map of styleId → resolved style
 * @param {object} numberingMap - Numbering resolver { getNumbering }
 * @param {object} relMap - Relationship map for hyperlinks
 * @param {object} defaults - Document default properties
 * @returns {object} - Paragraph block
 */
export const parseParagraph = (pEl, styleMap, numberingMap, relMap, defaults = {}) => {
  const pPrEl = getChild(pEl, 'w:pPr');

  // Get paragraph style
  let styleId = null;
  let styleParagraphProps = {};
  let styleRunProps = {};

  if (pPrEl) {
    const pStyleEl = getChild(pPrEl, 'w:pStyle');
    if (pStyleEl) {
      styleId = pStyleEl.getAttribute('w:val');
      const resolvedStyle = styleMap[styleId];
      if (resolvedStyle) {
        styleParagraphProps = resolvedStyle.paragraphProps || {};
        styleRunProps = resolvedStyle.runProps || {};
      }
    }
  }

  // Parse direct paragraph properties
  const directProps = pPrEl ? parseParagraphProps(pPrEl) : {};

  // Merge: direct > style > defaults
  const defaultPProps = (styleMap['__defaults__'] || {}).paragraphProps || {};
  const mergedProps = { ...defaultPProps, ...styleParagraphProps, ...directProps };

  // Build paragraph block
  const paragraph = {
    type: 'paragraph',
    styleId: styleId || 'Normal',
  };

  // Alignment (convert 'both' to 'justify')
  const alignment = mergedProps.alignment || 'left';
  paragraph.alignment = alignment === 'both' ? 'justify' : alignment;

  // Indent
  if (mergedProps.indent) {
    paragraph.indent = { ...mergedProps.indent };
  }

  // Spacing
  if (mergedProps.spacing) {
    paragraph.spacing = { ...mergedProps.spacing };
  }

  // Keep with next
  if (mergedProps.keepWithNext) paragraph.keepWithNext = true;

  // Page break before
  if (mergedProps.pageBreakBefore) paragraph.pageBreakBefore = true;

  // Numbering
  if (pPrEl) {
    const numPrEl = getChild(pPrEl, 'w:numPr');
    if (numPrEl) {
      const numIdEl = getChild(numPrEl, 'w:numId');
      const ilvlEl = getChild(numPrEl, 'w:ilvl');
      if (numIdEl) {
        const numId = numIdEl.getAttribute('w:val');
        const ilvl = ilvlEl ? ilvlEl.getAttribute('w:val') : '0';
        const numDef = numberingMap.getNumbering(numId, ilvl);

        paragraph.numbering = {
          numId,
          level: parseInt(ilvl),
          format: numDef?.format || 'decimal',
          text: numDef?.text || '',
          start: numDef?.start || 1,
        };

        // If numbering has indent and paragraph doesn't have direct indent, use numbering indent
        if (numDef?.indent && !directProps.indent) {
          paragraph.indent = { ...numDef.indent, right: 0 };
        }
      }
    }
  }

  // Parse runs
  paragraph.runs = [];
  const defaultRunProps = (styleMap['__defaults__'] || {}).runProps || {};
  const mergedRunDefaults = { ...defaultRunProps, ...styleRunProps };

  for (let i = 0; i < pEl.childNodes.length; i++) {
    const child = pEl.childNodes[i];
    if (child.nodeType !== 1) continue;

    switch (child.nodeName) {
      case 'w:r': {
        const run = parseRun(child, mergedRunDefaults, defaultRunProps);
        if (run) {
          if (Array.isArray(run)) {
            paragraph.runs.push(...run);
          } else {
            paragraph.runs.push(run);
          }
        }
        break;
      }

      case 'w:hyperlink': {
        const rId = child.getAttribute('r:id');
        let href = null;
        if (rId && relMap[rId]) {
          href = relMap[rId].target;
        }
        // Parse runs inside hyperlink
        for (let j = 0; j < child.childNodes.length; j++) {
          const hChild = child.childNodes[j];
          if (hChild.nodeType === 1 && hChild.nodeName === 'w:r') {
            const run = parseRun(hChild, mergedRunDefaults, defaultRunProps);
            if (run) {
              const applyHyperlink = (r) => ({
                ...r,
                hyperlink: href,
                color: r.color || '#0563C1',
                underline: r.underline || 'single',
              });

              if (Array.isArray(run)) {
                paragraph.runs.push(...run.map(applyHyperlink));
              } else {
                paragraph.runs.push(applyHyperlink(run));
              }
            }
          }
        }
        break;
      }

      case 'w:bookmarkStart':
      case 'w:bookmarkEnd':
      case 'w:proofErr':
      case 'w:pPr':
        // Skip non-content elements
        break;

      case 'w:sdt': {
        // Structured Document Tag — extract runs inside it
        const sdtContent = getChild(child, 'w:sdtContent');
        if (sdtContent) {
          for (let j = 0; j < sdtContent.childNodes.length; j++) {
            const sdtChild = sdtContent.childNodes[j];
            if (sdtChild.nodeType === 1 && sdtChild.nodeName === 'w:r') {
              const run = parseRun(sdtChild, mergedRunDefaults, defaultRunProps);
              if (run) {
                if (Array.isArray(run)) paragraph.runs.push(...run);
                else paragraph.runs.push(run);
              }
            }
          }
        }
        break;
      }
    }
  }

  return paragraph;
};
