import { Router } from 'express';
import multer from 'multer';
import { createTemplate, addFieldsToTemplate, publishTemplate, archiveTemplate, deleteTemplate, getTemplates, getTemplateDetails, parseDocx, updateTemplateDocument, getTemplateImage } from '../controllers/template.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { tenantContextMiddleware } from '../middlewares/tenant-context.middleware.js';
import { rbacGuard } from '../middlewares/rbac-guard.js';

const upload = multer({ limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB limit
const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware);

router.get('/', getTemplates);
router.get('/:id', getTemplateDetails);
router.post('/', upload.single('file'), rbacGuard(['SUPER_ADMIN', 'ORGANIZATION_ADMIN', 'STAFF']), createTemplate);
router.post('/parse-docx', upload.single('file'), parseDocx);
router.put('/:id/document', rbacGuard(['SUPER_ADMIN', 'ORGANIZATION_ADMIN', 'STAFF']), updateTemplateDocument);
router.get('/:templateId/images/:versionId/:imageName', getTemplateImage);
router.post('/:id/fields', rbacGuard(['SUPER_ADMIN', 'ORGANIZATION_ADMIN', 'STAFF']), addFieldsToTemplate);
router.post('/:id/publish', rbacGuard(['SUPER_ADMIN', 'ORGANIZATION_ADMIN']), publishTemplate);
router.post('/:id/archive', rbacGuard(['SUPER_ADMIN', 'ORGANIZATION_ADMIN']), archiveTemplate);
router.delete('/:id', rbacGuard(['SUPER_ADMIN', 'ORGANIZATION_ADMIN', 'STAFF']), deleteTemplate);

export default router;

