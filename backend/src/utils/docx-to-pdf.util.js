import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Convert a DOCX buffer to PDF using LibreOffice headless.
 * Returns a Buffer containing the PDF.
 */
export const convertDocxToPdf = (docxBuffer) => {
  // Create temp directory for conversion
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docx2pdf-'));
  const inputPath = path.join(tmpDir, 'input.docx');

  try {
    // Write DOCX buffer to temp file
    fs.writeFileSync(inputPath, docxBuffer);
    console.log(`[DOCX→PDF] Input file written: ${inputPath} (${docxBuffer.length} bytes)`);

    // Convert using LibreOffice headless
    // Use a unique UserInstallation profile to avoid lock conflicts with concurrent requests
    const profileDir = path.join(tmpDir, 'profile');
    const cmd = `libreoffice --headless --nolockcheck --nologo --norestore "-env:UserInstallation=file://${profileDir}" --convert-to pdf --outdir "${tmpDir}" "${inputPath}"`;
    
    console.log(`[DOCX→PDF] Running: ${cmd}`);

    const output = execSync(cmd, {
      timeout: 60000,
      stdio: 'pipe',
      env: {
        ...process.env,
        HOME: tmpDir,
      },
    });

    console.log(`[DOCX→PDF] LibreOffice output: ${output.toString()}`);

    // Read the generated PDF
    const outputPath = path.join(tmpDir, 'input.pdf');
    if (!fs.existsSync(outputPath)) {
      // List directory to debug
      const files = fs.readdirSync(tmpDir);
      console.error(`[DOCX→PDF] No PDF found! Files in tmpDir: ${files.join(', ')}`);
      throw new Error('LibreOffice conversion failed - no PDF output generated');
    }

    const pdfBuffer = fs.readFileSync(outputPath);
    console.log(`[DOCX→PDF] PDF generated: ${pdfBuffer.length} bytes`);
    return pdfBuffer;
  } catch (err) {
    console.error(`[DOCX→PDF] Conversion error:`, err.message);
    if (err.stderr) console.error(`[DOCX→PDF] stderr:`, err.stderr.toString());
    throw err;
  } finally {
    // Cleanup temp files (recursive)
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
};
