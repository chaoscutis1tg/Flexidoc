/**
 * Image Parser — Parse drawing/image elements from DOCX
 * 
 * Images in DOCX can appear as:
 * - <w:drawing> → <wp:inline> or <wp:anchor> (Office 2007+)
 * - <w:pict> → <v:imagedata> (legacy VML format)
 */
import { emuToMm, round2 } from './unit-converter.js';

/**
 * Parse image from a <w:drawing> element
 * @param {Element} drawingEl - The <w:drawing> DOM element
 * @returns {object|null} - Image block or null
 */
export const parseDrawing = (drawingEl) => {
  if (!drawingEl) return null;

  // Try inline first, then anchor
  let containerEl = null;
  let isInline = true;

  for (let i = 0; i < drawingEl.childNodes.length; i++) {
    const child = drawingEl.childNodes[i];
    if (child.nodeType !== 1) continue;
    if (child.nodeName === 'wp:inline') {
      containerEl = child;
      isInline = true;
      break;
    }
    if (child.nodeName === 'wp:anchor') {
      containerEl = child;
      isInline = false;
      break;
    }
  }

  if (!containerEl) return null;

  const image = {
    type: 'image',
    inline: isInline,
  };

  // Extent (size)
  const extent = getChildByName(containerEl, 'wp:extent');
  if (extent) {
    image.width = round2(emuToMm(extent.getAttribute('cx') || '0'));
    image.height = round2(emuToMm(extent.getAttribute('cy') || '0'));
  }

  // Alt text
  const docPr = getChildByName(containerEl, 'wp:docPr');
  if (docPr) {
    image.altText = docPr.getAttribute('descr') || docPr.getAttribute('name') || '';
  }

  // Position (for anchored images)
  if (!isInline) {
    const posH = getChildByName(containerEl, 'wp:positionH');
    if (posH) {
      image.positionH = {
        relativeFrom: posH.getAttribute('relativeFrom') || 'column',
        offset: null,
        align: null,
      };
      const posOffset = getChildByName(posH, 'wp:posOffset');
      if (posOffset) image.positionH.offset = round2(emuToMm(posOffset.textContent || '0'));
      const align = getChildByName(posH, 'wp:align');
      if (align) image.positionH.align = align.textContent || 'left';
    }

    const posV = getChildByName(containerEl, 'wp:positionV');
    if (posV) {
      image.positionV = {
        relativeFrom: posV.getAttribute('relativeFrom') || 'paragraph',
        offset: null,
        align: null,
      };
      const posOffset = getChildByName(posV, 'wp:posOffset');
      if (posOffset) image.positionV.offset = round2(emuToMm(posOffset.textContent || '0'));
      const align = getChildByName(posV, 'wp:align');
      if (align) image.positionV.align = align.textContent || 'top';
    }

    // Wrap type
    const wrapTypes = ['wp:wrapSquare', 'wp:wrapTight', 'wp:wrapThrough', 'wp:wrapTopAndBottom', 'wp:wrapNone'];
    for (const wt of wrapTypes) {
      if (getChildByName(containerEl, wt)) {
        image.wrapType = wt.split(':')[1];
        break;
      }
    }
  }

  // Relationship ID (for the actual image file)
  const graphic = getChildByName(containerEl, 'a:graphic');
  if (graphic) {
    const graphicData = getChildByName(graphic, 'a:graphicData');
    if (graphicData) {
      const pic = getChildByName(graphicData, 'pic:pic');
      if (pic) {
        const blipFill = getChildByName(pic, 'pic:blipFill');
        if (blipFill) {
          const blip = getChildByName(blipFill, 'a:blip');
          if (blip) {
            image.relationshipId = blip.getAttribute('r:embed') || blip.getAttribute('r:link');
          }
        }
      }
    }
  }

  return image;
};

/**
 * Parse image from a legacy <w:pict> element (VML)
 */
export const parsePict = (pictEl) => {
  if (!pictEl) return null;

  const image = {
    type: 'image',
    inline: true,
  };

  // Look for v:imagedata
  const shape = findDescendant(pictEl, 'v:shape') || findDescendant(pictEl, 'v:rect');
  if (shape) {
    const style = shape.getAttribute('style') || '';
    const widthMatch = style.match(/width:\s*([\d.]+)(pt|in|cm|mm|px)/);
    const heightMatch = style.match(/height:\s*([\d.]+)(pt|in|cm|mm|px)/);

    if (widthMatch) {
      image.width = round2(convertToMm(parseFloat(widthMatch[1]), widthMatch[2]));
    }
    if (heightMatch) {
      image.height = round2(convertToMm(parseFloat(heightMatch[1]), heightMatch[2]));
    }

    const imageData = findDescendant(shape, 'v:imagedata');
    if (imageData) {
      image.relationshipId = imageData.getAttribute('r:id');
    }
  }

  return image.relationshipId ? image : null;
};

// Helper: find child by nodeName (handles namespace prefixes)
function getChildByName(parent, name) {
  if (!parent || !parent.childNodes) return null;
  for (let i = 0; i < parent.childNodes.length; i++) {
    const node = parent.childNodes[i];
    if (node.nodeType === 1 && node.nodeName === name) return node;
  }
  return null;
}

// Helper: find descendant recursively
function findDescendant(parent, name) {
  if (!parent || !parent.childNodes) return null;
  for (let i = 0; i < parent.childNodes.length; i++) {
    const node = parent.childNodes[i];
    if (node.nodeType === 1) {
      if (node.nodeName === name) return node;
      const found = findDescendant(node, name);
      if (found) return found;
    }
  }
  return null;
}

// Convert various units to mm
function convertToMm(value, unit) {
  switch (unit) {
    case 'pt': return value * 25.4 / 72;
    case 'in': return value * 25.4;
    case 'cm': return value * 10;
    case 'mm': return value;
    case 'px': return value * 25.4 / 96;
    default: return value;
  }
}
