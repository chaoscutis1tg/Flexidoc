import React from 'react';
import { mmToPx, formatCssBorder } from './layoutUtils.js';
import { ParagraphRenderer } from './ParagraphRenderer.jsx';

export const TableRenderer = ({ table, fieldsMap, selectedFieldKey, onFieldClick, scale = 1, isEditable = true }) => {
  if (!table || !table.rows) return null;

  const tableStyle = {
    width: table.width ? `${mmToPx(table.width, scale)}px` : table.widthPercent ? `${table.widthPercent}%` : '100%',
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
    marginTop: '6px',
    marginBottom: '10px',
    marginLeft: table.alignment === 'center' ? 'auto' : table.alignment === 'right' ? 'auto' : table.indentLeft ? `${mmToPx(table.indentLeft, scale)}px` : '0',
    marginRight: table.alignment === 'center' ? 'auto' : table.alignment === 'right' ? '0' : 'auto',
  };

  const defaultBorders = table.borders || {};

  return (
    <table style={tableStyle} className="doc-table">
      {table.columnWidths && table.columnWidths.length > 0 && (
        <colgroup>
          {table.columnWidths.map((w, idx) => (
            <col key={idx} style={{ width: `${mmToPx(w, scale)}px` }} />
          ))}
        </colgroup>
      )}
      <tbody>
        {table.rows.map((row, rIdx) => {
          const rowStyle = {};
          if (row.height) {
            rowStyle.height = `${mmToPx(row.height, scale)}px`;
          }

          return (
            <tr key={rIdx} style={rowStyle}>
              {row.cells.map((cell, cIdx) => {
                // If vMerge is 'continue', skip rendering this cell (it's covered by rowSpan above)
                if (cell.vMerge === 'continue') {
                  return null;
                }

                // Calculate rowSpan if vMerge is restart
                let rowSpan = 1;
                if (cell.vMerge === 'restart') {
                  for (let nextR = rIdx + 1; nextR < table.rows.length; nextR++) {
                    const nextCell = table.rows[nextR].cells[cIdx];
                    if (nextCell && nextCell.vMerge === 'continue') {
                      rowSpan++;
                    } else {
                      break;
                    }
                  }
                }

                const cellBorders = cell.borders || {};
                const borderTop = formatCssBorder(cellBorders.top || defaultBorders.top || defaultBorders.insideH);
                const borderBottom = formatCssBorder(cellBorders.bottom || defaultBorders.bottom || defaultBorders.insideH);
                const borderLeft = formatCssBorder(cellBorders.left || defaultBorders.left || defaultBorders.insideV);
                const borderRight = formatCssBorder(cellBorders.right || defaultBorders.right || defaultBorders.insideV);

                const cellStyle = {
                  verticalAlign: cell.vertAlign || 'top',
                  backgroundColor: cell.shading || 'transparent',
                  borderTop,
                  borderBottom,
                  borderLeft,
                  borderRight,
                  padding: '4px 6px',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                };

                if (cell.width) {
                  cellStyle.width = `${mmToPx(cell.width, scale)}px`;
                }

                return (
                  <td key={cIdx} colSpan={cell.colSpan || 1} rowSpan={rowSpan} style={cellStyle}>
                    {cell.blocks &&
                      cell.blocks.map((block, bIdx) => (
                        <ParagraphRenderer
                          key={bIdx}
                          paragraph={block}
                          fieldsMap={fieldsMap}
                          selectedFieldKey={selectedFieldKey}
                          onFieldClick={onFieldClick}
                          scale={scale}
                          isEditable={isEditable}
                        />
                      ))}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
