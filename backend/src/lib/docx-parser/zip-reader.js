/**
 * ZIP Reader — Extract XML files from DOCX package using PizZip
 * DOCX files are ZIP archives containing XML files.
 */
import PizZip from 'pizzip';

/**
 * Extract multiple files from a DOCX ZIP archive
 * @param {Buffer} buffer - DOCX file buffer
 * @param {string[]} fileNames - Array of file paths to extract (e.g., 'word/document.xml')
 * @returns {{ [fileName: string]: string }} - Map of fileName → XML content
 */
export const extractDocxFiles = (buffer) => {
  const zip = new PizZip(buffer);
  const results = {};

  // Get all file entries in the ZIP
  const entries = Object.keys(zip.files);

  for (const entry of entries) {
    const file = zip.files[entry];
    if (file.dir) continue;

    // Only extract text-based files (XML, rels)
    if (entry.endsWith('.xml') || entry.endsWith('.rels')) {
      try {
        results[entry] = zip.file(entry).asText();
      } catch {
        // Skip files that can't be read as text
      }
    }
  }

  return results;
};

/**
 * Extract a single file from the DOCX ZIP
 * @param {Buffer} buffer - DOCX file buffer
 * @param {string} fileName - File path to extract
 * @returns {string|null} - File content or null
 */
export const extractDocxFile = (buffer, fileName) => {
  const zip = new PizZip(buffer);
  const file = zip.file(fileName);
  if (!file) return null;
  return file.asText();
};

/**
 * Extract binary files (images) from the DOCX ZIP
 * @param {Buffer} buffer - DOCX file buffer
 * @param {string} filePath - File path inside ZIP (e.g., 'word/media/image1.png')
 * @returns {Buffer|null} - File buffer or null
 */
export const extractDocxBinary = (buffer, filePath) => {
  const zip = new PizZip(buffer);
  const file = zip.file(filePath);
  if (!file) return null;
  return file.asNodeBuffer();
};

/**
 * List all media files in the DOCX
 * @param {Buffer} buffer - DOCX file buffer
 * @returns {string[]} - Array of media file paths
 */
export const listMediaFiles = (buffer) => {
  const zip = new PizZip(buffer);
  return Object.keys(zip.files).filter(
    name => name.startsWith('word/media/') && !zip.files[name].dir
  );
};

/**
 * Extract all media files as a map of path → Buffer
 * @param {Buffer} buffer - DOCX file buffer
 * @returns {{ [mediaPath: string]: Buffer }} - Map of media path to Buffer
 */
export const extractAllMediaFiles = (buffer) => {
  const zip = new PizZip(buffer);
  const mediaMap = {};
  const mediaNames = Object.keys(zip.files).filter(
    name => name.startsWith('word/media/') && !zip.files[name].dir
  );
  for (const name of mediaNames) {
    try {
      mediaMap[name] = zip.file(name).asNodeBuffer();
    } catch {
      // Skip failed media extractions
    }
  }
  return mediaMap;
};

