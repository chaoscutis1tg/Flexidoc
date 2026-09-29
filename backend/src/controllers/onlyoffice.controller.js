import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { templateService } from '../services/template.service.js';

const ONLYOFFICE_JWT_SECRET = process.env.ONLYOFFICE_JWT_SECRET || 'flexidoc_onlyoffice_secret_2026';
const ONLYOFFICE_PUBLIC_URL = process.env.ONLYOFFICE_PUBLIC_URL || 'http://localhost:8080';
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5000';

/**
 * Generate ONLYOFFICE editor config for a template.
 * Frontend uses this config to open the DOCX in ONLYOFFICE editor.
 */
export const getEditorConfig = async (req, res, next) => {
  try {
    const { id } = req.params;
    const mode = req.query.mode || 'edit'; // 'edit' | 'view'

    const details = await templateService.getTemplateDetails(id, req.tenantContext);
    const version = details.currentVersionData;

    if (!version || !version.originalFileKey) {
      return res.status(404).json({ success: false, message: 'Template không có file DOCX gốc' });
    }

    const fileName = version.originalFileKey.split('/').pop();
    const fileUrl = `${SERVER_BASE_URL}/api/v1/onlyoffice/download/${id}`;
    const callbackUrl = `${SERVER_BASE_URL}/api/v1/onlyoffice/callback/${id}`;
    const documentKey = `${id}_v${details.template.currentVersion}_${Date.now()}`;

    const config = {
      document: {
        fileType: 'docx',
        key: documentKey,
        title: details.template.name || fileName,
        url: fileUrl,
        permissions: {
          edit: mode === 'edit',
          download: true,
          print: true,
          review: false,
          comment: false,
        },
      },
      editorConfig: {
        mode: mode,
        callbackUrl: callbackUrl,
        lang: 'vi',
        customization: {
          autosave: true,
          chat: false,
          comments: false,
          compactHeader: true,
          compactToolbar: false,
          feedback: false,
          forcesave: true,
          help: false,
          hideRightMenu: false,
          hideRulers: false,
          logo: {
            image: '',
            imageEmbedded: '',
            url: SERVER_BASE_URL,
          },
          toolbarNoTabs: false,
          uiTheme: 'theme-light',
        },
        user: {
          id: req.tenantContext?.userId || 'anonymous',
          name: req.user?.name || req.user?.email || 'Người dùng',
        },
      },
    };

    // Sign the config with JWT for ONLYOFFICE security
    const token = jwt.sign(config, ONLYOFFICE_JWT_SECRET);
    config.token = token;

    return res.json({
      success: true,
      data: {
        config,
        onlyofficeUrl: ONLYOFFICE_PUBLIC_URL,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Serve the DOCX file for ONLYOFFICE to download.
 * ONLYOFFICE calls this URL to fetch the document.
 */
export const downloadFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find template — no tenant check here because ONLYOFFICE server calls this
    const Template = (await import('../models/template.model.js')).default;
    const TemplateVersion = (await import('../models/template-version.model.js')).default;
    
    const template = await Template.findById(id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template không tồn tại' });
    }

    const version = await TemplateVersion.findOne({
      templateId: template._id,
      version: template.currentVersion,
    });

    if (!version || !version.originalFileKey) {
      return res.status(404).json({ success: false, message: 'File DOCX không tồn tại' });
    }

    const filePath = path.resolve(process.cwd(), version.originalFileKey);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File DOCX không tồn tại trên ổ đĩa' });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
    return res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};

/**
 * ONLYOFFICE callback handler.
 * Called by ONLYOFFICE when user saves the document.
 * Status codes: https://api.onlyoffice.com/editors/callback
 *   0 = no document yet
 *   1 = document being edited  
 *   2 = document ready for saving
 *   3 = document saving error
 *   4 = document closed with no changes
 *   6 = document being edited, force save requested
 *   7 = force save error
 */
export const callback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, url, key } = req.body;

    console.log(`[ONLYOFFICE Callback] Template ${id} | Status: ${status} | Key: ${key}`);

    // Status 2 (ready for saving) or 6 (force save)
    if (status === 2 || status === 6) {
      if (!url) {
        console.error('[ONLYOFFICE Callback] No download URL provided');
        return res.json({ error: 0 });
      }

      try {
        // Download the updated file from ONLYOFFICE
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to download from ONLYOFFICE: ${response.status}`);
        }
        const buffer = Buffer.from(await response.arrayBuffer());

        // Find and update the template file
        const Template = (await import('../models/template.model.js')).default;
        const TemplateVersion = (await import('../models/template-version.model.js')).default;
        
        const template = await Template.findById(id);
        if (!template) {
          console.error(`[ONLYOFFICE Callback] Template ${id} not found`);
          return res.json({ error: 0 });
        }

        const version = await TemplateVersion.findOne({
          templateId: template._id,
          version: template.currentVersion,
        });

        if (version && version.originalFileKey) {
          const filePath = path.resolve(process.cwd(), version.originalFileKey);
          fs.writeFileSync(filePath, buffer);
          console.log(`[ONLYOFFICE Callback] File saved: ${filePath} (${buffer.length} bytes)`);
        }
      } catch (saveErr) {
        console.error('[ONLYOFFICE Callback] Save error:', saveErr.message);
      }
    }

    // Always respond with error: 0 (success)
    return res.json({ error: 0 });
  } catch (error) {
    console.error('[ONLYOFFICE Callback] Error:', error);
    return res.json({ error: 0 });
  }
};
