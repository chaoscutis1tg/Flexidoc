import React, { useEffect, useRef, useState } from 'react';
import { renderAsync } from 'docx-preview';
import JSZip from 'jszip';
import Mark from 'mark.js';

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
        span.className = (span.className || '') + ' symbol-font-fixed';
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
      
    el.className = (el.className || '') + ' symbol-font-fixed';
    el.style.fontFamily = "'Segoe UI Symbol', sans-serif";
  });
};

export const DocxPreviewRenderer = ({ file, fileUrl, zoom = 1, fields = [], onRenderComplete, onError }) => {
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

        // --- PRE-PROCESS DOCX BUFFER ---
        // docx-preview drops <w:sdt> elements, which causes checkboxes inside tables to vanish.
        // We use JSZip to strip the <w:sdt> envelope and convert w14:checkbox to plain text.
        // We also remove continuous section breaks (<w:sectPr> inside <w:pPr>) so docx-preview doesn't split the page visually.
        try {
          const zip = await JSZip.loadAsync(buffer);
          const docXmlFile = zip.file("word/document.xml");
          if (docXmlFile) {
            let xml = await docXmlFile.async("string");
            
            // Strip <w:sdt> envelope around <w:tc>
            xml = xml.replace(/<w:sdt>.*?<w:sdtContent>\s*(<w:tc(\s|>)[^]*?<\/w:tc>)\s*<\/w:sdtContent>\s*<\/w:sdt>/g, '$1');
            
            // Convert w14:checkbox to unicode characters so they render natively
            xml = xml.replace(/<w14:checked w14:val="0"\/>/g, '<w:t>☐</w:t>');
            xml = xml.replace(/<w14:checked w14:val="1"\/>/g, '<w:t>☑</w:t>');
            
            // Fix table indentation: docx-preview ignores w:w on w:tblInd, but supports w:left.
            // Copy w:w value into w:left so tables with negative indents (like Quốc hiệu) shift correctly.
            xml = xml.replace(/<w:tblInd([^>]*?)w:w="(-?[0-9]+)"([^>]*?)\/>/g, '<w:tblInd$1w:w="$2" w:left="$2"$3/>');
            
            // Remove all <w:sectPr> except the LAST ONE
            // This prevents docx-preview from splitting the page, while preserving the document's page size/margins.
            const sectPrRegex = /<w:sectPr[^>]*>.*?<\/w:sectPr>/gs;
            const matches = xml.match(sectPrRegex);
            if (matches && matches.length > 1) {
                let count = 0;
                xml = xml.replace(sectPrRegex, (match) => {
                    count++;
                    if (count < matches.length) return '';
                    return match;
                });
            }
            
            zip.file("word/document.xml", xml);
            buffer = await zip.generateAsync({ type: "arraybuffer" });
          }
        } catch (zipErr) {
          console.warn("Lỗi khi tiền xử lý DOCX bằng JSZip:", zipErr);
          // If it fails, continue with original buffer
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

          // Post-process to fix specific layout quirks in docx-preview
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

  // Effect to highlight variables whenever fields or loading changes
  useEffect(() => {
    if (loading || !containerRef.current) return;
    
    const container = containerRef.current;
    const instance = new Mark(container);
    
    // First, unmark everything
    instance.unmark({
      done: () => {
        if (!fields || fields.length === 0) return;
        
        // Mark each field's original text
        fields.forEach(field => {
          if (field.originalText) {
            instance.mark(field.originalText, {
              acrossElements: true,
              separateWordSearch: false,
              className: 'field-highlight',
              each: (element) => {
                element.style.backgroundColor = '#fef08a';
                element.style.color = '#854d0e';
                element.style.padding = '2px 4px';
                element.style.borderRadius = '4px';
                element.style.fontWeight = 'bold';
                element.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                element.title = `Biến: {{${field.key}}} (${field.label})`;
                
                // Also, optionally, we could replace the text content with {{key}}, 
                // but highlighting the original text is safer and preserves the visual flow exactly as the user selected it.
              }
            });
          }
        });
      }
    });
    
    return () => {
      // Cleanup unmark on unmount if needed, but not strictly necessary since the DOM will be destroyed.
      instance.unmark();
    };
  }, [fields, loading]);

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      <style>{`
        .docx-preview-paper *:not(.symbol-font-fixed) {
          font-family: "Times New Roman", Times, serif !important;
        }
      `}</style>
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
