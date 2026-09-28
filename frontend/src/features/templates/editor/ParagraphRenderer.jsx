import React from 'react';
import { buildParagraphStyle } from './layoutUtils.js';
import { TextRunRenderer } from './TextRunRenderer.jsx';

export const ParagraphRenderer = ({ paragraph, fieldsMap, selectedFieldKey, onFieldClick, scale = 1, isEditable = true }) => {
  if (!paragraph) return null;

  const style = buildParagraphStyle(paragraph, scale);

  const renderNumbering = () => {
    if (!paragraph.numbering) return null;
    const { text, format } = paragraph.numbering;
    return (
      <span
        style={{
          display: 'inline-block',
          marginRight: '0.5em',
          fontWeight: 'inherit',
          color: 'inherit',
          userSelect: 'none',
        }}
      >
        {text || '•'}
      </span>
    );
  };

  const isEmpty = (!paragraph.runs || paragraph.runs.length === 0) && !paragraph.numbering;

  return (
    <p style={{ ...style, minHeight: isEmpty ? '1.2em' : 'auto' }} className={`doc-paragraph ${paragraph.styleId ? `style-${paragraph.styleId}` : ''}`}>
      {renderNumbering()}
      {paragraph.runs &&
        paragraph.runs.map((run, i) => (
          <TextRunRenderer
            key={i}
            run={run}
            fieldsMap={fieldsMap}
            selectedFieldKey={selectedFieldKey}
            onFieldClick={onFieldClick}
            scale={scale}
            isEditable={isEditable}
          />
        ))}
    </p>
  );
};
