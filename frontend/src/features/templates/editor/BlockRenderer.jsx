import React from 'react';
import { ParagraphRenderer } from './ParagraphRenderer.jsx';
import { TableRenderer } from './TableRenderer.jsx';
import { ImageRenderer } from './ImageRenderer.jsx';

export const BlockRenderer = ({ block, fieldsMap, selectedFieldKey, onFieldClick, templateId, versionId, scale = 1, isEditable = true }) => {
  if (!block) return null;

  switch (block.type) {
    case 'paragraph':
      return (
        <ParagraphRenderer
          paragraph={block}
          fieldsMap={fieldsMap}
          selectedFieldKey={selectedFieldKey}
          onFieldClick={onFieldClick}
          scale={scale}
          isEditable={isEditable}
        />
      );

    case 'table':
      return (
        <TableRenderer
          table={block}
          fieldsMap={fieldsMap}
          selectedFieldKey={selectedFieldKey}
          onFieldClick={onFieldClick}
          scale={scale}
          isEditable={isEditable}
        />
      );

    case 'image':
      return (
        <ImageRenderer
          image={block}
          templateId={templateId}
          versionId={versionId}
          scale={scale}
        />
      );

    case 'pageBreak':
      return (
        <div
          style={{
            pageBreakBefore: 'always',
            breakBefore: 'page',
            borderBottom: '2px dashed #cbd5e1',
            margin: '20px 0',
            position: 'relative',
          }}
          className="page-break-divider"
        >
          <span
            style={{
              position: 'absolute',
              right: 0,
              top: '-10px',
              background: '#f8fafc',
              padding: '0 8px',
              fontSize: '11px',
              color: '#64748b',
              fontWeight: 500,
            }}
          >
            Ngắt trang (Page Break)
          </span>
        </div>
      );

    default:
      return null;
  }
};
