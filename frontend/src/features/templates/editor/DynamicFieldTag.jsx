import React from 'react';

export const DynamicFieldTag = ({ fieldKey, fieldInfo, isSelected, onClick, isEditable = true }) => {
  const label = fieldInfo?.label || fieldKey;

  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick(fieldKey);
      }}
      title={`Dynamic Field: {{${fieldKey}}} (${fieldInfo?.type || 'TEXT'})`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        background: isSelected ? '#dbeafe' : '#eff6ff',
        color: isSelected ? '#1e40af' : '#2563eb',
        border: `1px ${isSelected ? 'solid' : 'dashed'} ${isSelected ? '#2563eb' : '#60a5fa'}`,
        borderRadius: '4px',
        padding: '1px 6px',
        margin: '0 2px',
        fontSize: '0.9em',
        fontWeight: 600,
        fontFamily: 'sans-serif',
        cursor: isEditable ? 'pointer' : 'default',
        userSelect: 'none',
        verticalAlign: 'baseline',
        boxShadow: isSelected ? '0 0 0 2px rgba(37, 99, 235, 0.2)' : 'none',
        transition: 'all 0.15s ease-in-out',
      }}
      className="dynamic-field-tag-pill"
    >
      <span style={{ fontSize: '0.8em', opacity: 0.7 }}>⚡</span>
      <span>{label}</span>
      <span style={{ fontSize: '0.75em', opacity: 0.6, fontStyle: 'italic' }}>
        {`{{${fieldKey}}}`}
      </span>
    </span>
  );
};
