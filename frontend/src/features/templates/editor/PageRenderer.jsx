import React from 'react';
import { mmToPx } from './layoutUtils.js';
import { BlockRenderer } from './BlockRenderer.jsx';

export const PageRenderer = ({
  section,
  pageIndex = 0,
  totalPages = 1,
  fieldsMap,
  selectedFieldKey,
  onFieldClick,
  templateId,
  versionId,
  scale = 1,
  isEditable = true,
}) => {
  if (!section) return null;

  const page = section.page || {
    width: 210,
    height: 297,
    marginTop: 20,
    marginBottom: 20,
    marginLeft: 30,
    marginRight: 20,
  };

  const pageWidthPx = mmToPx(page.width, scale);
  const pageMinHeightPx = mmToPx(page.height, scale);
  const paddingTopPx = mmToPx(page.marginTop, scale);
  const paddingBottomPx = mmToPx(page.marginBottom, scale);
  const paddingLeftPx = mmToPx(page.marginLeft, scale);
  const paddingRightPx = mmToPx(page.marginRight, scale);

  return (
    <div
      style={{
        width: `${pageWidthPx}px`,
        minHeight: `${pageMinHeightPx}px`,
        paddingTop: `${paddingTopPx}px`,
        paddingBottom: `${paddingBottomPx}px`,
        paddingLeft: `${paddingLeftPx}px`,
        paddingRight: `${paddingRightPx}px`,
        backgroundColor: '#ffffff',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
        borderRadius: '2px',
        margin: '0 auto 32px auto',
        position: 'relative',
        boxSizing: 'border-box',
        transition: 'all 0.2s ease',
      }}
      className="doc-page-sheet"
    >
      {/* Page Header if present */}
      {section.header && section.header.blocks && section.header.blocks.length > 0 && (
        <div style={{ position: 'absolute', top: '10mm', left: `${paddingLeftPx}px`, right: `${paddingRightPx}px`, fontSize: '0.85em', color: '#64748b' }}>
          {section.header.blocks.map((b, idx) => (
            <BlockRenderer key={idx} block={b} fieldsMap={fieldsMap} selectedFieldKey={selectedFieldKey} onFieldClick={onFieldClick} scale={scale} isEditable={isEditable} />
          ))}
        </div>
      )}

      {/* Main Blocks */}
      {section.blocks &&
        section.blocks.map((block, idx) => (
          <BlockRenderer
            key={idx}
            block={block}
            fieldsMap={fieldsMap}
            selectedFieldKey={selectedFieldKey}
            onFieldClick={onFieldClick}
            templateId={templateId}
            versionId={versionId}
            scale={scale}
            isEditable={isEditable}
          />
        ))}

      {/* Page Footer if present */}
      {section.footer && section.footer.blocks && section.footer.blocks.length > 0 && (
        <div style={{ position: 'absolute', bottom: '10mm', left: `${paddingLeftPx}px`, right: `${paddingRightPx}px`, fontSize: '0.85em', color: '#64748b' }}>
          {section.footer.blocks.map((b, idx) => (
            <BlockRenderer key={idx} block={b} fieldsMap={fieldsMap} selectedFieldKey={selectedFieldKey} onFieldClick={onFieldClick} scale={scale} isEditable={isEditable} />
          ))}
        </div>
      )}

      {/* Page Number Badge */}
      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          right: '16px',
          fontSize: '11px',
          color: '#94a3b8',
          fontFamily: 'sans-serif',
          userSelect: 'none',
        }}
      >
        Trang {pageIndex + 1} / {totalPages}
      </div>
    </div>
  );
};
