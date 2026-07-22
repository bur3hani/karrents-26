import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { organizationController } from '../controllers/organization.controller.js';
import { projectController } from '../controllers/project.controller.ts';
import { assetController } from '../controllers/asset.controller.js';
import { findingController } from '../controllers/finding.controller.js';
import { billingController } from '../controllers/billing.controller.js';
import { searchController } from '../controllers/search.controller.js';
import { hydrateAuth, requireAuth, requirePermission } from '../middleware/auth.js';
import { rateLimiter, csrfProtection, validateInput } from '../middleware/security.js';

const router = Router();

// ============================================================================
// 1. AUTHENTICATION & PROFILE ENDPOINTS
// ============================================================================
router.post(
  '/auth/register',
  rateLimiter(60000, 10), // stricter rate limits for registration
  validateInput({
    body: {
      email: 'email',
      password: 'required',
      name: 'required'
    }
  }),
  authController.register
);

router.post(
  '/auth/login',
  rateLimiter(60000, 15), // login rate limiter
  validateInput({
    body: {
      email: 'email',
      password: 'required'
    }
  }),
  authController.login
);

router.post('/auth/logout', hydrateAuth, authController.logout);

router.post('/auth/sso', authController.sso);

// GitHub OAuth Routes
router.get('/auth/github/url', authController.githubUrl);
router.get('/auth/github/callback', authController.githubCallback);

// Google Authenticator (MFA) Routes
router.post('/auth/mfa/setup', hydrateAuth, requireAuth, authController.mfaSetup);
router.post('/auth/mfa/enable', hydrateAuth, requireAuth, authController.mfaEnable);
router.post('/auth/mfa/disable', hydrateAuth, requireAuth, authController.mfaDisable);
router.post('/auth/mfa/verify', authController.mfaVerify);

router.get('/auth/me', hydrateAuth, authController.me);

router.put(
  '/auth/profile',
  hydrateAuth,
  requireAuth,
  csrfProtection,
  validateInput({
    body: {
      name: 'string',
      email: 'email'
    }
  }),
  authController.updateProfile
);

router.put(
  '/auth/password',
  hydrateAuth,
  requireAuth,
  csrfProtection,
  validateInput({
    body: {
      currentPassword: 'required',
      newPassword: 'required'
    }
  }),
  authController.updatePassword
);

// Sessions Management
router.get('/auth/sessions', hydrateAuth, requireAuth, authController.listSessions);
router.delete('/auth/sessions/:id', hydrateAuth, requireAuth, csrfProtection, authController.revokeSession);

// API Keys Management
router.get('/auth/api-keys', hydrateAuth, requireAuth, authController.listApiKeys);
router.post('/auth/api-keys', hydrateAuth, requireAuth, csrfProtection, authController.createApiKey);
router.delete('/auth/api-keys/:id', hydrateAuth, requireAuth, csrfProtection, authController.revokeApiKey);

// ============================================================================
// 2. ORGANIZATION & ADMINISTRATIVE ENDPOINTS
// ============================================================================
router.get(
  '/org/users',
  hydrateAuth,
  requireAuth,
  requirePermission('users.view'),
  organizationController.listUsers
);

router.post(
  '/org/users',
  hydrateAuth,
  requireAuth,
  requirePermission('users.manage'),
  csrfProtection,
  validateInput({
    body: {
      email: 'email',
      name: 'required',
      role: 'required',
      password: 'required'
    }
  }),
  organizationController.createUser
);

router.delete(
  '/org/users/:id',
  hydrateAuth,
  requireAuth,
  requirePermission('users.manage'),
  csrfProtection,
  organizationController.deleteUser
);

router.get(
  '/org/audit',
  hydrateAuth,
  requireAuth,
  requirePermission('audit.view'),
  organizationController.listAuditLogs
);

router.put(
  '/org/settings',
  hydrateAuth,
  requireAuth,
  requirePermission('settings.update'),
  csrfProtection,
  validateInput({
    body: {
      organizationName: 'required'
    }
  }),
  organizationController.updateSettings
);

// ============================================================================
// 3. WORKSPACE PROJECTS & NOTES ENDPOINTS
// ============================================================================
router.get('/projects', hydrateAuth, requireAuth, projectController.listProjects);

router.post(
  '/projects',
  hydrateAuth,
  requireAuth,
  requirePermission('projects.manage'),
  csrfProtection,
  validateInput({
    body: {
      name: 'required',
      description: 'string'
    }
  }),
  projectController.createProject
);

router.get('/projects/:id', hydrateAuth, requireAuth, projectController.getProject);

router.put(
  '/projects/:id',
  hydrateAuth,
  requireAuth,
  requirePermission('projects.manage'),
  csrfProtection,
  validateInput({
    body: {
      name: 'string',
      status: 'string'
    }
  }),
  projectController.updateProject
);

router.delete(
  '/projects/:id',
  hydrateAuth,
  requireAuth,
  requirePermission('projects.manage'),
  csrfProtection,
  projectController.deleteProject
);

// Notes nested inside project context
router.get('/projects/:id/notes', hydrateAuth, requireAuth, projectController.listNotes);

router.post(
  '/projects/:id/notes',
  hydrateAuth,
  requireAuth,
  csrfProtection,
  validateInput({
    body: {
      content: 'required'
    }
  }),
  projectController.createNote
);

router.delete('/notes/:noteId', hydrateAuth, requireAuth, csrfProtection, projectController.deleteNote);

// ============================================================================
// 4. CLIENT ASSETS ENDPOINTS
// ============================================================================
router.get('/assets', hydrateAuth, requireAuth, assetController.listAssets);

router.post(
  '/assets',
  hydrateAuth,
  requireAuth,
  requirePermission('assets.manage'),
  csrfProtection,
  validateInput({
    body: {
      project_id: 'required',
      type: 'required',
      name: 'required'
    }
  }),
  assetController.createAsset
);

router.get('/assets/:id', hydrateAuth, requireAuth, assetController.getAsset);

router.put(
  '/assets/:id',
  hydrateAuth,
  requireAuth,
  requirePermission('assets.manage'),
  csrfProtection,
  assetController.updateAsset
);

router.delete(
  '/assets/:id',
  hydrateAuth,
  requireAuth,
  requirePermission('assets.manage'),
  csrfProtection,
  assetController.deleteAsset
);

// ============================================================================
// 5. SECURITY FINDINGS & EVIDENCE ENDPOINTS
// ============================================================================
router.get('/findings', hydrateAuth, requireAuth, findingController.listFindings);

router.post(
  '/findings',
  hydrateAuth,
  requireAuth,
  requirePermission('projects.manage'),
  csrfProtection,
  validateInput({
    body: {
      project_id: 'required',
      title: 'required',
      severity: 'required',
      cvss_score: 'number'
    }
  }),
  findingController.createFinding
);

router.get('/findings/:id', hydrateAuth, requireAuth, findingController.getFinding);

router.put(
  '/findings/:id',
  hydrateAuth,
  requireAuth,
  requirePermission('projects.manage'),
  csrfProtection,
  findingController.updateFinding
);

router.delete(
  '/findings/:id',
  hydrateAuth,
  requireAuth,
  requirePermission('projects.manage'),
  csrfProtection,
  findingController.deleteFinding
);

// Evidence nested inside finding context
router.get('/findings/:findingId/evidence', hydrateAuth, requireAuth, findingController.listEvidence);

router.post(
  '/findings/:findingId/evidence',
  hydrateAuth,
  requireAuth,
  requirePermission('projects.manage'),
  csrfProtection,
  validateInput({
    body: {
      type: 'required',
      value: 'required',
      notes: 'string'
    }
  }),
  findingController.createEvidence
);

router.delete(
  '/evidence/:evidenceId',
  hydrateAuth,
  requireAuth,
  requirePermission('projects.manage'),
  csrfProtection,
  findingController.deleteEvidence
);

// ============================================================================
// 6. COMPLIANCE & EXPORTABLE REPORTS ENDPOINTS
// ============================================================================
router.get('/reports', hydrateAuth, requireAuth, findingController.listReports);

router.post(
  '/reports',
  hydrateAuth,
  requireAuth,
  requirePermission('reports.generate'),
  csrfProtection,
  validateInput({
    body: {
      project_id: 'required',
      title: 'required'
    }
  }),
  findingController.createReport
);

router.get('/reports/:id', hydrateAuth, requireAuth, findingController.getReport);

router.put(
  '/reports/:id',
  hydrateAuth,
  requireAuth,
  requirePermission('reports.generate'),
  csrfProtection,
  findingController.updateReport
);

router.delete(
  '/reports/:id',
  hydrateAuth,
  requireAuth,
  requirePermission('reports.generate'),
  csrfProtection,
  findingController.deleteReport
);

router.get('/reports/:id/export', hydrateAuth, requireAuth, findingController.exportReport);

// ============================================================================
// 7. NOTIFICATIONS & ALERTS
// ============================================================================
router.get('/notifications', hydrateAuth, requireAuth, projectController.listNotifications);
router.post('/notifications/read-all', hydrateAuth, requireAuth, projectController.readAllNotifications);
router.post('/notifications/:id/read', hydrateAuth, requireAuth, projectController.readNotification);

// ============================================================================
// 8. BILLING, STRIPE PAYMENTS & INSTANT PLAN SWITCHING
// ============================================================================
router.post('/billing/switch-plan', hydrateAuth, billingController.switchPlan);
router.post('/billing/checkout', hydrateAuth, billingController.createCheckoutSession);
router.post('/billing/portal', hydrateAuth, billingController.createPortalSession);
router.get('/billing/status', hydrateAuth, billingController.getStatus);

// ============================================================================
// 9. UNIFIED PRODUCTION SEARCH
// ============================================================================
router.get('/search', hydrateAuth, searchController.search);

export default router;
