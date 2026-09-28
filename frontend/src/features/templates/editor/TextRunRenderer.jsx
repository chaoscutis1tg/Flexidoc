import React from 'react';
import { buildRunStyle } from './layoutUtils.js';
import { DynamicFieldTag } from './DynamicFieldTag.jsx';

export const TextRunRenderer = ({ run, fieldsMap, selectedFieldKey, onFieldClick, scale = 1, isEditable = true }) => {
  if (!run) return null;

  const style = buildRunStyle(run, scale);

  if (run.type === 'tab') {
    return <span style={{ display: 'inline-block', width: '2rem' }}>&emsp;&emsp;</span>;
  }

  if (run.type === 'lineBreak') {
    return <br />;
  }

  if (run.type === 'symbol') {
    return <span style={style}>{run.char || '•'}</span>;
  }

  if (!run.text) {
    return null;
  }

  // Parse text for {{placeholder}}
  const regex = /(\{\{[a-zA-Z0-9_.]+\}\})/g;
  const parts = run.text.split(regex);

  const renderContent = () => {
    return parts.map((part, index) => {
      const match = part.match(/^\{\{([a-zA-Z0-9_.]+)\}\}$/);
      if (match) {
        const fieldKey = match[1];
        const fieldInfo = fieldsMap ? fieldsMap[fieldKey] : null;
        return (
          <DynamicFieldTag
            key={index}
            fieldKey={fieldKey}
            fieldInfo={fieldInfo}
            isSelected={selectedFieldKey === fieldKey}
            onClick={onFieldClick}
            isEditable={isEditable}
          />
        );
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };

  let element = <span style={style}>{renderContent()}</span>;

  if (run.superscript) {
    element = <sup>{element}</sup>;
  } else if (run.subscript) {
    element = <sub>{element}</sub>;
  }

  if (run.hyperlink) {
    element = (
      <a href={run.hyperlink} target="_blank" rel="noopener noreferrer" style={{ ...style, color: run.color || '#2563eb', textDecoration: 'underline' }}>
        {element}
      </a>
    );
  }

  return element;
};
