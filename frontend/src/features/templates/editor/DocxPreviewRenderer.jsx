import React, { useEffect, useRef, useState } from 'react';
import { renderAsync } from 'docx-preview';

/**
 * Minimal post-processor: ONLY fixes Wingdings/Symbol font glyphs.
 * Does NOT touch fonts, layout, or spacing — docx-preview handles those.
 */
const fixWingdingsSymbols = (container) => {
  if (!container) return;

  // Wingdings font characters → Unicode equivalents
  const wingdingsMap = new Map([
    // Checked checkboxes
    [0xFE, '☑'], [0xFD, '☑'], [0x52, '☑'], [0x78, '☑'],
    // Unchecked checkboxes
    [0xA8, '☐'], [0xA3, '☐'], [0x6F, '☐'], [0xA1, '☐'], [0x71, '☐'], [0x6E, '☐'],
    // Checkmarks
    [0xFC, '✓'], [0x50, '✓'], [0x61, '✓'],
    // Bullets
    [0xB7, '•'], [0xA7, '•'], [0x6C, '•'],
    // Arrows
    [0xE0, '→'], [0xE8, '→'], [0xD8, '→'], [0xF0, '→'],
  ]);

  // 1. Fix <span> elements with Wingdings/Symbol font-family
  container.querySelectorAll('span').forEach((span) => {
    const font = (span.style.fontFamily || '');
    if (!/wingdings|webdings|symbol|ms\s*gothic/i.test(font)) return;

    const text = span.textContent || '';
    if (text.length === 1) {
      const code = text.charCodeAt(0);
      const replacement = wingdingsMap.get(code);
      if (replacement) {
        span.textContent = replacement;
        span.style.fontFamily = "'Segoe UI Symbol', sans-serif";
      }
    }
  });

  // 2. Fix PUA Unicode characters (U+F000–U+F0FF) anywhere in the DOM
  container.querySelectorAll('span, p, td, th, li, div').forEach((el) => {
    if (el.children.length > 0) return;
    const text = el.textContent || '';
    if (!/[\uF000-\uF0FF\u2610-\u2612]/.test(text)) return;

    el.textContent = text
      .replace(/[\uF0FE\uF0FD\uF058\uF046\u2611\u2612]/g, '☑')
      .replace(/[\uF0A8\uF0A3\uF0A0\uF0AA\uF06F\u2610]/g, '☐')
      .replace(/[\uF0FC]/g, '✓')
      .replace(/[\uF0B7\uF0A7]/g, '•')
      .replace(/[\uF000-\uF0FF]/g, '');
  });
};

export const DocxPreviewRenderer = ({ file, fileUrl, zoom = 1, onRenderComplete, onError }) => {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let isMounted = true;

    const renderDocx = async () => {
      if (!containerRef.current) return;
      setLoading(true);
      setErrorMsg('');
      containerRef.current.innerHTML = '';

      try {
        let buffer = null;

        if (file instanceof ArrayBuffer) {
          buffer = file;
        } else if (file instanceof Blob) {
          buffer = await file.arrayBuffer();
        } else if (fileUrl) {
          const res = await fetch(fileUrl);
          if (!res.ok) throw new Error('Không thể tải file Word từ máy chủ');
          buffer = await res.arrayBuffer();
        }

        if (!buffer) {
          setLoading(false);
          return;
        }

        if (isMounted && containerRef.current) {
          // Let docx-preview handle EVERYTHING: fonts, layout, page breaks, margins.
          // We only provide minimal configuration.
          await renderAsync(buffer, containerRef.current, null, {
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            ignoreFonts: false,
            breakPages: false,
            experimental: true,
            className: 'docx-preview-paper',
            useBase64URL: true,
          });

          // Only fix: convert Wingdings symbol characters to Unicode
          if (isMounted && containerRef.current) {
            fixWingdingsSymbols(containerRef.current);
            setLoading(false);
            if (onRenderComplete) onRenderComplete();
          }
        }
      } catch (err) {
        console.error('DocxPreviewRenderer error:', err);
        if (isMounted) {
          setErrorMsg(err.message || 'Lỗi hiển thị file DOCX');
          setLoading(false);
          if (onError) onError(err);
        }
      }
    };

    renderDocx();
    return () => { isMounted = false; };
  }, [file, fileUrl]);

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      {loading && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px', fontWeight: 600 }}>
          ⏳ Đang đọc và dựng bản in Word gốc...
        </div>
      )}

      {errorMsg && (
        <div style={{ padding: '20px', color: '#dc2626', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fca5a5', margin: '20px' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      <div
        ref={containerRef}
        className="docx-preview-container-wrapper"
        style={{
          transform: zoom !== 1 ? `scale(${zoom})` : 'none',
          transformOrigin: 'top center',
          transition: 'transform 0.2s ease',
          display: loading ? 'none' : 'block',
          width: '100%',
        }}
      />
    </div>
  );
};
