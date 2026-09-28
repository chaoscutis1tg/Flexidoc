/**
 * Numbering Resolver — Parse word/numbering.xml and resolve list numbering definitions
 * 
 * OOXML numbering has 3 levels:
 * 1. <w:abstractNum> — defines numbering format for each level (0-8)
 * 2. <w:num> — references an abstractNum by ID
 * 3. <w:numPr> in paragraph — references a num by numId + ilvl
 */
import { DOMParser } from '@xmldom/xmldom';
import { twipsToMm, round2 } from './unit-converter.js';
import { getChild } from './style-resolver.js';

/**
 * Parse numbering.xml and build a lookup map
 * @param {string} numberingXml - Content of word/numbering.xml
 * @returns {{ getNumbering: (numId, ilvl) => object|null }}
 */
export const buildNumberingMap = (numberingXml) => {
  if (!numberingXml) return { getNumbering: () => null };

  const doc = new DOMParser().parseFromString(numberingXml, 'text/xml');

  // 1. Parse abstractNum definitions
  const absNumMap = {};
  const absNumEls = doc.getElementsByTagName('w:abstractNum');
  for (let i = 0; i < absNumEls.length; i++) {
    const absEl = absNumEls[i];
    const absId = absEl.getAttribute('w:abstractNumId');
    if (!absId) continue;

    const levels = {};
    const lvlEls = absEl.getElementsByTagName('w:lvl');
    for (let j = 0; j < lvlEls.length; j++) {
      const lvlEl = lvlEls[j];
      const ilvl = lvlEl.getAttribute('w:ilvl') || '0';

      const level = {
        ilvl: parseInt(ilvl),
        format: 'decimal',
        text: '',
        start: 1,
        indent: null,
        suffix: 'tab',
      };

      // Number format (decimal, lowerLetter, upperLetter, lowerRoman, upperRoman, bullet, none)
      const numFmt = getChild(lvlEl, 'w:numFmt');
      if (numFmt) level.format = numFmt.getAttribute('w:val') || 'decimal';

      // Level text (e.g., "%1.", "%1.%2.", "•")
      const lvlText = getChild(lvlEl, 'w:lvlText');
      if (lvlText) level.text = lvlText.getAttribute('w:val') || '';

      // Start value
      const startEl = getChild(lvlEl, 'w:start');
      if (startEl) level.start = parseInt(startEl.getAttribute('w:val') || '1');

      // Indent from pPr
      const pPr = getChild(lvlEl, 'w:pPr');
      if (pPr) {
        const indEl = getChild(pPr, 'w:ind');
        if (indEl) {
          level.indent = {
            left: round2(twipsToMm(indEl.getAttribute('w:left') || indEl.getAttribute('w:start') || '0')),
            hanging: round2(twipsToMm(indEl.getAttribute('w:hanging') || '0')),
            firstLine: round2(twipsToMm(indEl.getAttribute('w:firstLine') || '0')),
          };
        }
      }

      // Suffix (tab, space, nothing)
      const suff = getChild(lvlEl, 'w:suff');
      if (suff) level.suffix = suff.getAttribute('w:val') || 'tab';

      // Run properties (for bullet symbol font)
      const rPr = getChild(lvlEl, 'w:rPr');
      if (rPr) {
        const rFonts = getChild(rPr, 'w:rFonts');
        if (rFonts) {
          level.bulletFont = rFonts.getAttribute('w:ascii') || rFonts.getAttribute('w:hAnsi');
        }
      }

      levels[ilvl] = level;
    }

    absNumMap[absId] = levels;
  }

  // 2. Parse num → abstractNum mapping
  const numToAbsMap = {};
  const numEls = doc.getElementsByTagName('w:num');
  for (let i = 0; i < numEls.length; i++) {
    const numEl = numEls[i];
    const numId = numEl.getAttribute('w:numId');
    if (!numId) continue;

    const absIdRef = getChild(numEl, 'w:abstractNumId');
    if (absIdRef) {
      numToAbsMap[numId] = absIdRef.getAttribute('w:val');
    }

    // Check for level overrides
    const lvlOverrides = numEl.getElementsByTagName('w:lvlOverride');
    for (let j = 0; j < lvlOverrides.length; j++) {
      const override = lvlOverrides[j];
      const ilvl = override.getAttribute('w:ilvl');
      const startOverride = getChild(override, 'w:startOverride');
      if (startOverride && ilvl && numToAbsMap[numId]) {
        const absId = numToAbsMap[numId];
        if (absNumMap[absId] && absNumMap[absId][ilvl]) {
          // Create a copy with overridden start
          absNumMap[absId][ilvl] = {
            ...absNumMap[absId][ilvl],
            start: parseInt(startOverride.getAttribute('w:val') || '1'),
          };
        }
      }
    }
  }

  // 3. Build lookup function
  const getNumbering = (numId, ilvl = '0') => {
    const absId = numToAbsMap[numId];
    if (!absId || !absNumMap[absId]) return null;
    return absNumMap[absId][ilvl] || null;
  };

  return { getNumbering, absNumMap, numToAbsMap };
};
