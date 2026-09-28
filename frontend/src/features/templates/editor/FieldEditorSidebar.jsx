import React from 'react';

export const FIELD_TYPES = [
  { value: 'TEXT', label: 'Văn bản ngắn (Text)' },
  { value: 'TEXTAREA', label: 'Văn bản dài (Textarea)' },
  { value: 'NUMBER', label: 'Số (Number)' },
  { value: 'CURRENCY', label: 'Số tiền (Currency)' },
  { value: 'DATE', label: 'Ngày tháng (YYYY-MM-DD)' },
  { value: 'DATE_VN', label: 'Ngày tháng VN (ngày DD tháng MM năm YYYY)' },
  { value: 'DATETIME', label: 'Ngày giờ (Datetime)' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'PHONE', label: 'Số điện thoại' },
  { value: 'ADDRESS', label: 'Địa chỉ' },
  { value: 'SELECT', label: 'Danh sách chọn (Dropdown)' },
  { value: 'RADIO', label: 'Tùy chọn duy nhất (Radio)' },
  { value: 'CHECKBOX', label: 'Hộp kiểm (Checkbox)' },
];

export const FieldEditorSidebar = ({
  fields = [],
  selectedFieldKey,
  onSelectField,
  onUpdateField,
  onDeleteField,
  onAddField,
  onClose,
}) => {
  const currentField = fields.find((f) => f.key === selectedFieldKey) || null;

  return (
    <div
      style={{
        width: '320px',
        backgroundColor: '#ffffff',
        borderLeft: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxShadow: '-4px 0 16px rgba(0,0,0,0.04)',
        zIndex: 10,
      }}
      className="field-editor-sidebar"
    >
      {/* Sidebar Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f8fafc',
        }}
      >
        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>
          ⚡ Danh sách Dynamic Fields ({fields.length})
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#64748b',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Field List & Editor Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {currentField ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#3b82f6', textTransform: 'uppercase' }}>
                Đang chỉnh sửa Field
              </span>
              <button
                onClick={() => onSelectField(null)}
                style={{ fontSize: '12px', border: 'none', background: 'none', color: '#64748b', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Quay lại danh sách
              </button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Key (Mã biến trong Word):
              </label>
              <input
                type="text"
                value={currentField.key || ''}
                onChange={(e) => onUpdateField(currentField.key, { key: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  backgroundColor: '#f8fafc',
                }}
              />
              <span style={{ fontSize: '11px', color: '#64748b' }}>Cú pháp sử dụng: {"{{"}{currentField.key}{"}}"}</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Nhãn hiển thị (Label):
              </label>
              <input
                type="text"
                value={currentField.label || ''}
                onChange={(e) => onUpdateField(currentField.key, { label: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Kiểu dữ liệu (Type):
              </label>
              <select
                value={currentField.type || 'TEXT'}
                onChange={(e) => onUpdateField(currentField.key, { type: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  backgroundColor: '#ffffff',
                }}
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="req-chk"
                checked={!!currentField.required}
                onChange={(e) => onUpdateField(currentField.key, { required: e.target.checked })}
              />
              <label htmlFor="req-chk" style={{ fontSize: '13px', fontWeight: 500, color: '#1e293b', cursor: 'pointer' }}>
                Bắt buộc nhập dữ liệu (Required)
              </label>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Gợi ý nhập (Placeholder):
              </label>
              <input
                type="text"
                value={currentField.placeholder || ''}
                onChange={(e) => onUpdateField(currentField.key, { placeholder: e.target.value })}
                placeholder="Ví dụ: Nhập họ và tên đầy đủ..."
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Giá trị mặc định (Default Value):
              </label>
              <input
                type="text"
                value={currentField.defaultValue || ''}
                onChange={(e) => onUpdateField(currentField.key, { defaultValue: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                }}
              />
            </div>

            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
              <button
                onClick={() => onDeleteField(currentField.key)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #fca5a5',
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                🗑 Xóa Field này
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {fields.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '32px 0', fontSize: '13px' }}>
                Chưa có Dynamic Field nào.
                <br />
                Đưa file DOCX lên để tự động nhận diện hoặc tạo mới bên dưới.
              </div>
            ) : (
              fields.map((field) => (
                <div
                  key={field.key}
                  onClick={() => onSelectField(field.key)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#f8fafc',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#93c5fd')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b' }}>
                      {field.label || field.key}
                    </span>
                    <span style={{ fontSize: '10px', background: '#dbeafe', color: '#1e40af', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                      {field.type || 'TEXT'}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                    {"{{"}{field.key}{"}}"}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      {!currentField && onAddField && (
        <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <button
            onClick={onAddField}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            + Thêm Dynamic Field Thủ Công
          </button>
        </div>
      )}
    </div>
  );
};
