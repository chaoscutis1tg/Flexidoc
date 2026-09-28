/**
 * Layout Utilities for Document Renderer
 * Conversions: mm, pt, px, twips
 */

// Screen DPI conversion (Standard 96 DPI: 1 inch = 96px = 25.4mm)
export const MM_TO_PX = 3.7795275591;
export const PT_TO_PX = 1.3333333333;

/**
 * Convert millimeters to pixels at 96 DPI with optional zoom scale
 */
export const mmToPx = (mm, scale = 1) => {
  if (mm === undefined || mm === null) return 0;
  return mm * MM_TO_PX * scale;
};

/**
 * Convert points to pixels at 96 DPI
 */
export const ptToPx = (pt, scale = 1) => {
  if (pt === undefined || pt === null) return 0;
  return pt * PT_TO_PX * scale;
};

/**
 * Build inline CSS style object for paragraph elements
 */
export const buildParagraphStyle = (paragraph, scale = 1) => {
  if (!paragraph) return {};

  const style = {};

  // Text alignment
  if (paragraph.alignment) {
    style.textAlign = paragraph.alignment === 'both' ? 'justify' : paragraph.alignment;
  } else {
    style.textAlign = 'left';
  }

  // Indents
  if (paragraph.indent) {
    const left = paragraph.indent.left || 0;
    const right = paragraph.indent.right || 0;
    const firstLine = paragraph.indent.firstLine || 0;
    const hanging = paragraph.indent.hanging || 0;

    if (hanging > 0) {
      style.paddingLeft = `${mmToPx(hanging, scale)}px`;
      style.textIndent = `-${mmToPx(hanging, scale)}px`;
    } else if (firstLine > 0) {
      style.textIndent = `${mmToPx(firstLine, scale)}px`;
    }

    if (left > 0 && hanging === 0) {
      style.marginLeft = `${mmToPx(left, scale)}px`;
    }
    if (right > 0) {
      style.marginRight = `${mmToPx(right, scale)}px`;
    }
  }

  // Spacing before & after
  const beforePt = paragraph.spacing?.before || 0;
  const afterPt = paragraph.spacing?.after || 0;
  style.marginTop = `${ptToPx(beforePt, scale)}px`;
  style.marginBottom = `${ptToPx(afterPt, scale)}px`;

  // Line height
  const lineSpacing = paragraph.spacing?.line || 1.15;
  if (typeof lineSpacing === 'number') {
    style.lineHeight = lineSpacing;
  } else if (typeof lineSpacing === 'string' && lineSpacing.endsWith('pt')) {
    style.lineHeight = lineSpacing;
  } else {
    style.lineHeight = 1.15;
  }

  // Keep with next / page break
  if (paragraph.pageBreakBefore) {
    style.pageBreakBefore = 'always';
    style.breakBefore = 'page';
  }

  return style;
};

/**
 * Build inline CSS style object for text runs
 */
export const buildRunStyle = (run, scale = 1) => {
  if (!run) return {};

  const style = {};

  if (run.fontFamily) {
    style.fontFamily = `"${run.fontFamily}", 'Times New Roman', Times, serif`;
  }

  if (run.fontSize) {
    style.fontSize = `${ptToPx(run.fontSize, scale)}px`;
  }

  if (run.bold) {
    style.fontWeight = 'bold';
  }

  if (run.italic) {
    style.fontStyle = 'italic';
  }

  if (run.underline) {
    style.textDecoration = 'underline';
    if (run.strike) {
      style.textDecoration = 'underline line-through';
    }
  } else if (run.strike) {
    style.textDecoration = 'line-through';
  }

  if (run.color && run.color !== '#000000') {
    style.color = run.color;
  }

  if (run.highlight) {
    style.backgroundColor = run.highlight;
  }

  if (run.caps) {
    style.textTransform = 'uppercase';
  }

  return style;
};

/**
 * Format CSS border string from border object { style, width, color }
 */
export const formatCssBorder = (border) => {
  if (!border || border.style === 'none' || border.style === 'nil') {
    return 'none';
  }
  const widthPx = Math.max(1, Math.round(border.width || 1));
  const borderStyle = border.style === 'double' ? 'double' : border.style === 'dashed' ? 'dashed' : 'solid';
  const color = border.color || '#000000';
  return `${widthPx}px ${borderStyle} ${color}`;
};
