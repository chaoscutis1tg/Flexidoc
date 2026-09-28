/**
 * Relationship Resolver — Parse word/_rels/document.xml.rels
 * 
 * Maps rId references to actual file paths (images, headers, footers, hyperlinks)
 */
import { DOMParser } from '@xmldom/xmldom';

/**
 * Build a map of rId → target from a .rels file
 * @param {string} relsXml - Content of the .rels file
 * @returns {{ [rId: string]: { target: string, type: string } }}
 */
export const buildRelationshipMap = (relsXml) => {
  if (!relsXml) return {};

  const doc = new DOMParser().parseFromString(relsXml, 'text/xml');
  const relEls = doc.getElementsByTagName('Relationship');
  const map = {};

  for (let i = 0; i < relEls.length; i++) {
    const rel = relEls[i];
    const id = rel.getAttribute('Id');
    const target = rel.getAttribute('Target');
    const type = rel.getAttribute('Type') || '';

    if (id && target) {
      // Extract relationship type from full URI
      const typeShort = type.split('/').pop() || '';
      map[id] = { target, type: typeShort, fullType: type };
    }
  }

  return map;
};

/**
 * Resolve a relationship ID to a full path within the DOCX ZIP
 * @param {string} rId - Relationship ID (e.g., "rId5")
 * @param {{ [rId: string]: { target: string, type: string } }} relMap - Relationship map
 * @param {string} basePath - Base path (e.g., "word/")
 * @returns {{ path: string, type: string } | null}
 */
export const resolveRelationship = (rId, relMap, basePath = 'word/') => {
  const rel = relMap[rId];
  if (!rel) return null;

  let resolvedPath = rel.target;
  // If target is relative, prepend base path
  if (!resolvedPath.startsWith('/') && !resolvedPath.startsWith('http')) {
    resolvedPath = basePath + resolvedPath;
  }
  // Remove leading slash
  if (resolvedPath.startsWith('/')) {
    resolvedPath = resolvedPath.substring(1);
  }

  return { path: resolvedPath, type: rel.type };
};
