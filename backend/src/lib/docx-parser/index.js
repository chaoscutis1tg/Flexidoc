/**
 * DOCX Parser — Main entry point
 * 
 * Parses a DOCX file buffer into a Document Model JSON structure.
 * This is the ONLY public API for the parser module.
 * 
 * Usage:
 *   import { parseDocx } from '../lib/docx-parser/index.js';
 *   const { documentModel, images, placeholders } = await parseDocx(fileBuffer);
 */
import { DOMParser } from '@xmldom/xmldom';
import { extractDocxFiles, extractAllMediaFiles } from './zip-reader.js';

import { buildStyleMap, getChild } from './style-resolver.js';
import { buildNumberingMap } from './numbering-resolver.js';
import { buildRelationshipMap, resolveRelationship } from './relationship-resolver.js';
import { parseSectionProperties, getDefaultPageSettings } from './section-parser.js';
import { parseParagraph } from './paragraph-parser.js';
import { parseTable } from './table-parser.js';
import { parseDrawing, parsePict } from './image-parser.js';

/**
 * Parse a DOCX file buffer into a Document Model
 * @param {Buffer} fileBuffer - DOCX file buffer
 * @param {object} options - Parser options
 * @returns {{ documentModel: object, images: object[], placeholders: string[] }}
 */
export const parseDocx = (fileBuffer, options = {}) => {
  // 1. Extract all XML files from the DOCX ZIP
  const files = extractDocxFiles(fileBuffer);

  const documentXml = files['word/document.xml'];
  if (!documentXml) {
    throw new Error('Invalid DOCX file: word/document.xml not found');
  }

  // 2. Build resolver maps
  const styleMap = buildStyleMap(files['word/styles.xml']);
  const numberingMap = buildNumberingMap(files['word/numbering.xml']);
  const relMap = buildRelationshipMap(files['word/_rels/document.xml.rels']);

  // 3. Parse document.xml
  const docDom = new DOMParser().parseFromString(documentXml, 'text/xml');
  const bodyEl = docDom.getElementsByTagName('w:body')[0];

  if (!bodyEl) {
    throw new Error('Invalid DOCX file: w:body not found');
  }

  // 4. Parse all blocks in the body
  const blocks = [];
  let lastSectPr = null;

  for (let i = 0; i < bodyEl.childNodes.length; i++) {
    const child = bodyEl.childNodes[i];
    if (child.nodeType !== 1) continue;

    switch (child.nodeName) {
      case 'w:p': {
        // Check if this paragraph contains a drawing/image
        const drawingBlocks = extractDrawingsFromParagraph(child, relMap);

        // Check for section break in this paragraph's properties
        const pPr = getChild(child, 'w:pPr');
        if (pPr) {
          const sectPr = getChild(pPr, 'w:sectPr');
          if (sectPr) {
            // This paragraph marks a section break — save it for section creation
            lastSectPr = sectPr;
          }
        }

        const paragraph = parseParagraph(child, styleMap, numberingMap, relMap);

        // If paragraph has drawings, inject them after the paragraph
        if (drawingBlocks.length > 0) {
          // If paragraph has text runs too, add paragraph first
          if (paragraph.runs.length > 0) {
            blocks.push(paragraph);
          }
          blocks.push(...drawingBlocks);
        } else {
          blocks.push(paragraph);
        }
        break;
      }

      case 'w:tbl': {
        const table = parseTable(child, styleMap, numberingMap, relMap);
        blocks.push(table);
        break;
      }

      case 'w:sectPr': {
        // Final section properties (at the end of body)
        lastSectPr = child;
        break;
      }

      case 'w:sdt': {
        // Structured Document Tag at body level — extract content
        const sdtContent = getChild(child, 'w:sdtContent');
        if (sdtContent) {
          for (let j = 0; j < sdtContent.childNodes.length; j++) {
            const sdtChild = sdtContent.childNodes[j];
            if (sdtChild.nodeType !== 1) continue;
            if (sdtChild.nodeName === 'w:p') {
              blocks.push(parseParagraph(sdtChild, styleMap, numberingMap, relMap));
            } else if (sdtChild.nodeName === 'w:tbl') {
              blocks.push(parseTable(sdtChild, styleMap, numberingMap, relMap));
            }
          }
        }
        break;
      }
    }
  }

  // 5. Parse section/page settings
  const page = lastSectPr
    ? parseSectionProperties(lastSectPr)
    : getDefaultPageSettings();

  // 6. Build Document Model
  const documentModel = {
    meta: {
      parsedAt: new Date().toISOString(),
      parserVersion: '1.0',
    },
    defaultStyle: buildDefaultStyle(styleMap),
    sections: [{
      page,
      blocks,
    }],
  };

  // 7. Extract image references
  const images = extractImageReferences(blocks, relMap);

  // 8. Detect placeholders
  const placeholders = detectPlaceholders(blocks);

  // 9. Extract media files as path -> Buffer map
  const mediaFiles = extractAllMediaFiles(fileBuffer);

  return { documentModel, images, placeholders, mediaFiles };
};


/**
 * Extract drawing elements from a paragraph and return as image blocks
 */
function extractDrawingsFromParagraph(pEl, relMap) {
  const images = [];

  for (let i = 0; i < pEl.childNodes.length; i++) {
    const child = pEl.childNodes[i];
    if (child.nodeType !== 1) continue;

    if (child.nodeName === 'w:r') {
      for (let j = 0; j < child.childNodes.length; j++) {
        const rChild = child.childNodes[j];
        if (rChild.nodeType !== 1) continue;

        if (rChild.nodeName === 'w:drawing') {
          const img = parseDrawing(rChild);
          if (img) {
            // Resolve image path
            if (img.relationshipId && relMap[img.relationshipId]) {
              img.mediaPath = relMap[img.relationshipId].target;
              if (!img.mediaPath.startsWith('word/') && !img.mediaPath.startsWith('/') && !img.mediaPath.startsWith('http')) {
                img.mediaPath = 'word/' + img.mediaPath;
              }
            }
            images.push(img);
          }
        }

        if (rChild.nodeName === 'w:pict') {
          const img = parsePict(rChild);
          if (img) {
            if (img.relationshipId && relMap[img.relationshipId]) {
              img.mediaPath = relMap[img.relationshipId].target;
              if (!img.mediaPath.startsWith('word/') && !img.mediaPath.startsWith('/') && !img.mediaPath.startsWith('http')) {
                img.mediaPath = 'word/' + img.mediaPath;
              }
            }
            images.push(img);
          }
        }
      }
    }
  }

  return images;
}

/**
 * Build default document style from style map
 */
function buildDefaultStyle(styleMap) {
  const defaults = styleMap['__defaults__'] || {};
  const normalStyle = styleMap['Normal'] || {};

  const runProps = { ...(defaults.runProps || {}), ...(normalStyle.runProps || {}) };
  const pProps = { ...(defaults.paragraphProps || {}), ...(normalStyle.paragraphProps || {}) };

  return {
    fontFamily: runProps.fontFamily || 'Times New Roman',
    fontSize: runProps.fontSize || 12,
    color: runProps.color || '#000000',
    lineSpacing: pProps.spacing?.line || 1.0,
    alignment: pProps.alignment || 'left',
  };
}

/**
 * Extract all image references from blocks (recursive)
 */
function extractImageReferences(blocks, relMap) {
  const images = [];

  function walkBlocks(blockList) {
    for (const block of blockList) {
      if (block.type === 'image' && block.relationshipId) {
        const resolved = resolveRelationship(block.relationshipId, relMap);
        if (resolved) {
          images.push({
            relationshipId: block.relationshipId,
            mediaPath: resolved.path,
            width: block.width,
            height: block.height,
          });
        }
      }
      if (block.type === 'table') {
        for (const row of block.rows) {
          for (const cell of row.cells) {
            walkBlocks(cell.blocks);
          }
        }
      }
    }
  }

  walkBlocks(blocks);
  return images;
}

/**
 * Detect all {{placeholder}} patterns in text runs (recursive)
 */
function detectPlaceholders(blocks) {
  const placeholders = new Set();
  const regex = /\{\{([a-zA-Z0-9_.]+)\}\}/g;

  function walkBlocks(blockList) {
    for (const block of blockList) {
      if (block.type === 'paragraph' && block.runs) {
        for (const run of block.runs) {
          if (run.text) {
            let match;
            while ((match = regex.exec(run.text)) !== null) {
              placeholders.add(match[1]);
            }
          }
        }
      }
      if (block.type === 'table') {
        for (const row of block.rows) {
          for (const cell of row.cells) {
            walkBlocks(cell.blocks);
          }
        }
      }
    }
  }

  walkBlocks(blocks);
  return Array.from(placeholders);
}
