import { useState, useCallback, useMemo } from 'react';

export const useDocumentModel = (initialModel = null, initialFields = []) => {
  const [documentModel, setDocumentModel] = useState(initialModel);
  const [fields, setFields] = useState(initialFields);
  const [selectedFieldKey, setSelectedFieldKey] = useState(null);
  const [zoom, setZoom] = useState(1); // 1 = 100%
  const [isEditable, setIsEditable] = useState(true);

  // Map of field key -> field object for fast lookup
  const fieldsMap = useMemo(() => {
    const map = {};
    fields.forEach((f) => {
      if (f.key) map[f.key] = f;
    });
    return map;
  }, [fields]);

  // Update zoom level safely within 50% - 200%
  const changeZoom = useCallback((delta) => {
    setZoom((prev) => Math.min(2, Math.max(0.5, Math.round((prev + delta) * 10) / 10)));
  }, []);

  // Update field properties
  const updateField = useCallback((oldKey, updatedProps) => {
    setFields((prevFields) => {
      return prevFields.map((f) => {
        if (f.key === oldKey) {
          return { ...f, ...updatedProps };
        }
        return f;
      });
    });

    if (updatedProps.key && updatedProps.key !== oldKey) {
      setSelectedFieldKey(updatedProps.key);
    }
  }, []);

  // Delete a field by key
  const deleteField = useCallback((key) => {
    setFields((prev) => prev.filter((f) => f.key !== key));
    if (selectedFieldKey === key) {
      setSelectedFieldKey(null);
    }
  }, [selectedFieldKey]);

  // Add a new blank field
  const addField = useCallback((newFieldProps = {}) => {
    const defaultKey = `field_${Date.now().toString().slice(-4)}`;
    const newField = {
      id: defaultKey,
      key: defaultKey,
      label: 'Trường dữ liệu mới',
      type: 'TEXT',
      required: false,
      defaultValue: '',
      placeholder: '',
      ...newFieldProps,
    };
    setFields((prev) => [...prev, newField]);
    setSelectedFieldKey(newField.key);
    return newField;
  }, []);

  // Synchronize placeholders from Document Model automatically
  const syncPlaceholdersFromModel = useCallback((model, currentFields = []) => {
    if (!model || !model.sections) return;

    const detectedKeys = new Set();
    const regex = /\{\{([a-zA-Z0-9_.]+)\}\}/g;

    function searchBlocks(blocks) {
      if (!blocks) return;
      for (const block of blocks) {
        if (block.type === 'paragraph' && block.runs) {
          for (const run of block.runs) {
            if (run.text) {
              let match;
              while ((match = regex.exec(run.text)) !== null) {
                detectedKeys.add(match[1]);
              }
            }
          }
        } else if (block.type === 'table' && block.rows) {
          for (const row of block.rows) {
            for (const cell of row.cells) {
              searchBlocks(cell.blocks);
            }
          }
        }
      }
    }

    model.sections.forEach((sec) => searchBlocks(sec.blocks));

    const existingKeys = new Set(currentFields.map((f) => f.key));
    const newFields = [...currentFields];

    detectedKeys.forEach((key) => {
      if (!existingKeys.has(key)) {
        // Auto infer type
        let type = 'TEXT';
        if (key.includes('ngay') || key.includes('date')) type = 'DATE_VN';
        else if (key.includes('gia') || key.includes('tien') || key.includes('luong') || key.includes('price') || key.includes('amount')) type = 'CURRENCY';
        else if (key.includes('email')) type = 'EMAIL';
        else if (key.includes('phone') || key.includes('sdt')) type = 'PHONE';

        const label = key
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());

        newFields.push({
          id: key,
          key,
          label,
          type,
          required: true,
          defaultValue: '',
          placeholder: `Nhập ${label.toLowerCase()}...`,
        });
      }
    });

    setFields(newFields);
  }, []);

  return {
    documentModel,
    setDocumentModel,
    fields,
    setFields,
    fieldsMap,
    selectedFieldKey,
    setSelectedFieldKey,
    zoom,
    setZoom,
    changeZoom,
    isEditable,
    setIsEditable,
    updateField,
    deleteField,
    addField,
    syncPlaceholdersFromModel,
  };
};
