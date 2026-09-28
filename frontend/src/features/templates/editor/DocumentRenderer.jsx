import React, { useState } from 'react';
import { PageRenderer } from './PageRenderer.jsx';
import { FieldEditorSidebar } from './FieldEditorSidebar.jsx';

export const DocumentRenderer = ({
  documentModel,
  fields = [],
  templateId,
  versionId,
  onFieldsChange,
  onSaveDocument,
  isSaving = false,
  readOnly = false,
}) => {
  const [selectedFieldKey, setSelectedFieldKey] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [showSidebar, setShowSidebar] = useState(true);

  if (!documentModel || !documentModel.sections || documentModel.sections.length === 0) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
        Chưa có dữ liệu Document Model để hiển thị.
      </div>
    );
  }

  const fieldsMap = {};
  fields.forEach((f) => {
    if (f.key) fieldsMap[f.key] = f;
  });

  const handleFieldClick = (fieldKey) => {
    setSelectedFieldKey(fieldKey);
    setShowSidebar(true);
  };

  const handleUpdateField = (oldKey, updatedProps) => {
    const newFields = fields.map((f) => {
      if (f.key === oldKey) {
        return { ...f, ...updatedProps };
      }
      return f;
    });

    if (updatedProps.key && updatedProps.key !== oldKey) {
      setSelectedFieldKey(updatedProps.key);
    }

    if (onFieldsChange) onFieldsChange(newFields);
  };

  const handleDeleteField = (key) => {
    const newFields = fields.filter((f) => f.key !== key);
    if (selectedFieldKey === key) setSelectedFieldKey(null);
    if (onFieldsChange) onFieldsChange(newFields);
  };

  const handleAddField = () => {
    const defaultKey = `field_${Date.now().toString().slice(-4)}`;
    const newField = {
      id: defaultKey,
      key: defaultKey,
      label: 'Trường mới',
      type: 'TEXT',
      required: false,
      defaultValue: '',
      placeholder: '',
    };
    const newFields = [...fields, newField];
    setSelectedFieldKey(newField.key);
    if (onFieldsChange) onFieldsChange(newFields);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        backgroundColor: '#f1f5f9',
        overflow: 'hidden',
      }}
      className="document-renderer-container"
    >
      {/* Document Top Toolbar */}
      <div
        style={{
          height: '48px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 16px',
          zIndex: 5,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>📄 Mẫu Hợp Đồng (DOCX Layout View)</span>
          <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
            {fields.length} Dynamic Fields
          </span>
        </div>

        {/* Controls: Zoom & Sidebar toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Zoom controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '2px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <button
              onClick={() => setZoom((z) => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))}
              style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', padding: '0 4px', color: '#475569' }}
              title="Thu nhỏ"
            >
              −
            </button>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155', minWidth: '42px', textAlign: 'center' }}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2.0, Math.round((z + 0.1) * 10) / 10))}
              style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', padding: '0 4px', color: '#475569' }}
              title="Phóng to"
            >
              +
            </button>
            <button
              onClick={() => setZoom(1.0)}
              style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '11px', color: '#2563eb', marginLeft: '4px' }}
              title="Đặt về 100%"
            >
              100%
            </button>
          </div>

          {/* Toggle Sidebar */}
          {!readOnly && (
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                backgroundColor: showSidebar ? '#eff6ff' : '#ffffff',
                color: showSidebar ? '#1d4ed8' : '#334155',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ⚡ {showSidebar ? 'Ẩn Panel Fields' : 'Hiện Panel Fields'}
            </button>
          )}

          {/* Save button if handler provided */}
          {onSaveDocument && !readOnly && (
            <button
              onClick={onSaveDocument}
              disabled={isSaving}
              style={{
                padding: '6px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.7 : 1,
              }}
            >
              {isSaving ? 'Đang lưu...' : '💾 Lưu Mẫu'}
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area (Paper Canvas + Sidebar) */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Paper Canvas Scroll Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'auto',
            padding: '32px 16px',
            backgroundColor: '#f1f5f9',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
          className="paper-canvas-scroll"
        >
          {documentModel.sections.map((section, idx) => (
            <PageRenderer
              key={idx}
              section={section}
              pageIndex={idx}
              totalPages={documentModel.sections.length}
              fieldsMap={fieldsMap}
              selectedFieldKey={selectedFieldKey}
              onFieldClick={handleFieldClick}
              templateId={templateId}
              versionId={versionId}
              scale={zoom}
              isEditable={!readOnly}
            />
          ))}
        </div>

        {/* Field Editor Sidebar */}
        {!readOnly && showSidebar && (
          <FieldEditorSidebar
            fields={fields}
            selectedFieldKey={selectedFieldKey}
            onSelectField={setSelectedFieldKey}
            onUpdateField={handleUpdateField}
            onDeleteField={handleDeleteField}
            onAddField={handleAddField}
            onClose={() => setShowSidebar(false)}
          />
        )}
      </div>
    </div>
  );
};
