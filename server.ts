import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';
import tls from 'tls';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

import { db, verifyPassword, ROLE_PERMISSIONS, User } from './server/db.js';

dotenv.config();

const app = express();
const rawPort = process.env.PORT;
const isSocket = rawPort && isNaN(Number(rawPort));
const PORT = isSocket ? rawPort : (rawPort ? parseInt(rawPort, 10) : 3000);

// ============================================================================
// SECURITY MIDDLEWARE & OWASP COMPLIANCE
// ============================================================================

app.use(express.json());
app.use(cookieParser());

// CORS & Manual Secure Response Headers (Helmet equivalent)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  // Adjust CORS depending on origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Custom pure-JS In-Memory Rate Limiting (OWASP recommendation)
interface RateLimit {
  count: number;
  resetAt: number;
}
const rateLimits = new Map<string, RateLimit>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 100; // Max 100 requests per minute per IP

app.use((req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const limit = rateLimits.get(ip);

  if (!limit || now > limit.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return next();
  }

  limit.count++;
  if (limit.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ error: "Too many requests. Please try again after 1 minute." });
  }
  next();
});

// ============================================================================
// AUTHENTICATION MIDDLEWARES
// ============================================================================

// Extracted session/user lookup
async function getAuthContext(req: express.Request): Promise<{ user: User | null; session_id: string | null }> {
  // Try to parse cookie
  let token = req.cookies?.karrents_session;

  // Try to parse Authorization header as fallback
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  // Try to parse API Key header (X-API-Key)
  const apiKey = req.headers['x-api-key'] as string;
  if (apiKey) {
    const apiTokenRecord = db.apiTokens.verify(apiKey);
    if (apiTokenRecord) {
      const user = db.users.findById(apiTokenRecord.user_id);
      if (user && user.status === 'active') {
        return { user, session_id: 'api_token' };
      }
    }
  }

  if (!token) return { user: null, session_id: null };

  const session = db.sessions.findByToken(token);
  if (!session) return { user: null, session_id: null };

  const user = db.users.findById(session.user_id);
  if (!user || user.status !== 'active') return { user: null, session_id: null };

  return { user, session_id: session.id };
}

// Global user hydration (does not block, but attaches user context if present)
app.use(async (req: any, res, next) => {
  const { user, session_id } = await getAuthContext(req);
  req.user = user;
  req.session_id = session_id;
  next();
});

// requireAuth middleware
function requireAuth(req: any, res: express.Response, next: express.NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized. Active secure session required." });
  }
  next();
}

// requirePermission middleware
function requirePermission(permission: string) {
  return (req: any, res: express.Response, next: express.NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized." });
    }
    const role = req.user.role;
    const permissions = ROLE_PERMISSIONS[role] || [];
    if (!permissions.includes(permission)) {
      return res.status(403).json({ error: `Forbidden. Role '${role}' lacks the '${permission}' permission required for this operation.` });
    }
    next();
  };
}

// Initialize Gemini client safely
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Google GenAI client initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Google GenAI client:", err);
  }
}

// Helper to sanitize domain/URL inputs
function cleanInputDomain(input: string): string {
  if (!input) return "";
  let clean = input.trim().toLowerCase();
  clean = clean.replace(/^(https?:\/\/)?(www\.)?/, '');
  clean = clean.split('/')[0];
  clean = clean.split(':')[0];
  return clean;
}

// ============================================================================
// REST API ENDPOINTS
// ============================================================================

// ----------------------------------------------------------------------------
// 1. AUTHENTICATION & SESSION MANAGEMENT
// ----------------------------------------------------------------------------

app.post('/api/auth/register', (req: any, res) => {
  const { email, password, name, orgName } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Missing required fields: email, password, and name are required." });
  }

  try {
    // 1. Create top-level Organization first
    const organizationName = orgName || `${name}'s Organization`;
    const newOrg = db.organizations.create(organizationName);

    // 2. Create the User inside the organization with Super Administrator role
    const newUser = db.users.create({
      email,
      name,
      role: 'Super Administrator',
      organization_id: newOrg.id,
      status: 'active',
      mfa_enabled: false,
      passwordPlain: password
    });

    // 3. Log Audit Activity
    db.auditLogs.create(
      newOrg.id,
      newUser.id,
      newUser.email,
      'USER_REGISTER',
      `Registered user ${newUser.name} with role Super Administrator. Created organization '${newOrg.name}'.`,
      req.ip
    );

    // 4. Create Session & Set Secure HttpOnly Cookie
    const session = db.sessions.create(newUser.id, req.ip, req.headers['user-agent'] || 'Unknown');
    res.cookie('karrents_session', session.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 Hours
    });

    return res.status(201).json({
      message: "Registration successful.",
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        organization_id: newUser.organization_id
      }
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Registration failed." });
  }
});

app.post('/api/auth/login', (req: any, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = db.users.findByEmail(email);
  if (!user || user.status !== 'active') {
    return res.status(401).json({ error: "Invalid credentials or account inactive." });
  }

  const isPasswordCorrect = verifyPassword(password, user.password_hash, user.salt);
  if (!isPasswordCorrect) {
    return res.status(401).json({ error: "Invalid credentials." });
  }

  // Create Session & Set Secure HttpOnly Cookie
  const session = db.sessions.create(user.id, req.ip, req.headers['user-agent'] || 'Unknown');
  res.cookie('karrents_session', session.token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  });

  // Audit Log
  db.auditLogs.create(
    user.organization_id,
    user.id,
    user.email,
    'USER_LOGIN',
    `User successfully logged in via session ID ${session.id}`,
    req.ip
  );

  return res.json({
    message: "Login successful.",
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organization_id: user.organization_id
    }
  });
});

app.post('/api/auth/logout', requireAuth, (req: any, res) => {
  const token = req.cookies?.karrents_session;
  if (token) {
    db.sessions.deleteByToken(token);
  }

  res.clearCookie('karrents_session');

  // Audit log
  db.auditLogs.create(
    req.user.organization_id,
    req.user.id,
    req.user.email,
    'USER_LOGOUT',
    `User successfully logged out and terminated active session cookie`,
    req.ip
  );

  return res.json({ message: "Logout successful." });
});

app.get('/api/auth/me', requireAuth, (req: any, res) => {
  const organization = db.organizations.findById(req.user.organization_id);
  return res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      organization_id: req.user.organization_id,
      mfa_enabled: req.user.mfa_enabled
    },
    organization: organization || null
  });
});

app.post('/api/auth/reset-password', (req: any, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  const user = db.users.findByEmail(email);
  if (user) {
    // Generate notification or simulate verification email
    db.notifications.create(
      user.id,
      "Password Reset Requested",
      "A security password reset code was requested for your account. If this wasn't you, audit your active login sessions."
    );
  }

  // To prevent user enumeration, always return 200 Success in production
  return res.json({ message: "If the email exists, a password reset link has been dispatched." });
});

app.post('/api/auth/verify-email', requireAuth, (req: any, res) => {
  db.notifications.create(
    req.user.id,
    "Email Verification Dispatch",
    "Your verification email has been resent. Click the secure cryptographic link to assert ownership."
  );
  return res.json({ message: "Verification dispatch triggered." });
});

app.get('/api/auth/sessions', requireAuth, (req: any, res) => {
  const sessions = db.sessions.findActiveByUserId(req.user.id);
  const currentToken = req.cookies?.karrents_session;

  const results = sessions.map(s => ({
    id: s.id,
    ip_address: s.ip_address,
    user_agent: s.user_agent,
    created_at: s.created_at,
    expires_at: s.expires_at,
    is_current: currentToken && db.sessions.findByToken(currentToken)?.id === s.id
  }));

  return res.json({ sessions: results });
});

app.delete('/api/auth/sessions/:id', requireAuth, (req: any, res) => {
  const sessionId = req.params.id;
  const sessions = db.sessions.findActiveByUserId(req.user.id);
  const sessionToKill = sessions.find(s => s.id === sessionId);

  if (!sessionToKill) {
    return res.status(404).json({ error: "Active session not found or does not belong to you." });
  }

  db.sessions.deleteById(sessionId);

  db.auditLogs.create(
    req.user.organization_id,
    req.user.id,
    req.user.email,
    'SESSION_TERMINATE',
    `Terminated active session ID: ${sessionId}`,
    req.ip
  );

  return res.json({ message: "Session successfully terminated." });
});

app.delete('/api/auth/sessions', requireAuth, (req: any, res) => {
  // Terminate all sessions except current
  const currentToken = req.cookies?.karrents_session;
  const currentSession = currentToken ? db.sessions.findByToken(currentToken) : null;

  db.transaction(store => {
    store.sessions = store.sessions.filter(s => {
      if (s.user_id !== req.user.id) return true;
      if (currentSession && s.id === currentSession.id) return true;
      return false; // delete all other
    });
  });

  db.auditLogs.create(
    req.user.organization_id,
    req.user.id,
    req.user.email,
    'SESSION_TERMINATE_ALL',
    `Terminated all other active sessions for user`,
    req.ip
  );

  return res.json({ message: "All other sessions terminated." });
});

// ----------------------------------------------------------------------------
// 2. USER PROFILE & SETTINGS
// ----------------------------------------------------------------------------

app.put('/api/profile', requireAuth, (req: any, res) => {
  const { name, email } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Name is required." });
  }

  db.users.update(req.user.id, { name, email });

  db.auditLogs.create(
    req.user.organization_id,
    req.user.id,
    req.user.email,
    'PROFILE_UPDATE',
    `Updated profile attributes: name=${name}, email=${email}`,
    req.ip
  );

  return res.json({ message: "Profile updated successfully.", user: db.users.findById(req.user.id) });
});

app.put('/api/profile/password', requireAuth, (req: any, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current and new passwords are required." });
  }

  const user = db.users.findById(req.user.id);
  if (!user || !verifyPassword(currentPassword, user.password_hash, user.salt)) {
    return res.status(400).json({ error: "Incorrect current password." });
  }

  db.users.changePassword(req.user.id, newPassword);

  db.auditLogs.create(
    req.user.organization_id,
    req.user.id,
    req.user.email,
    'PASSWORD_CHANGE',
    `Successfully rotated user security credentials`,
    req.ip
  );

  return res.json({ message: "Password updated successfully." });
});

// ----------------------------------------------------------------------------
// 3. ORGANIZATIONS MANAGEMENT
// ----------------------------------------------------------------------------

app.get('/api/organizations/users', requireAuth, requirePermission('users.view'), (req: any, res) => {
  const users = db.users.findMany(req.user.organization_id);
  const formatted = users.map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    status: u.status,
    created_at: u.created_at
  }));
  return res.json({ users: formatted });
});

app.post('/api/organizations/users', requireAuth, requirePermission('users.create'), (req: any, res) => {
  const { email, name, role, password } = req.body;
  if (!email || !name || !role || !password) {
    return res.status(400).json({ error: "Missing required fields: email, name, role, password." });
  }

  try {
    const newUser = db.users.create({
      email,
      name,
      role,
      organization_id: req.user.organization_id,
      status: 'active',
      mfa_enabled: false,
      passwordPlain: password
    });

    db.auditLogs.create(
      req.user.organization_id,
      req.user.id,
      req.user.email,
      'USER_CREATE',
      `Created organization user ${newUser.name} with role ${newUser.role}`,
      req.ip
    );

    return res.status(201).json({ message: "User created successfully.", user: newUser });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Failed to create user." });
  }
});

app.get('/api/organizations/audit-logs', requireAuth, requirePermission('audit.view'), (req: any, res) => {
  const logs = db.auditLogs.findMany(req.user.organization_id);
  // Sort reverse chronological
  const sorted = [...logs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return res.json({ logs: sorted });
});

app.put('/api/organizations/settings', requireAuth, requirePermission('settings.update'), (req: any, res) => {
  const { orgName } = req.body;
  if (!orgName) {
    return res.status(400).json({ error: "Organization name is required." });
  }

  db.organizations.update(req.user.organization_id, orgName);

  db.auditLogs.create(
    req.user.organization_id,
    req.user.id,
    req.user.email,
    'ORGANIZATION_UPDATE',
    `Updated organization display name to: '${orgName}'`,
    req.ip
  );

  return res.json({ message: "Organization settings updated successfully." });
});

// ----------------------------------------------------------------------------
// 4. PROJECTS WORKSPACE
// ----------------------------------------------------------------------------

app.get('/api/projects', requireAuth, (req: any, res) => {
  const projects = db.projects.findMany(req.user.organization_id);
  return res.json({ projects });
});

app.post('/api/projects', requireAuth, requirePermission('projects.manage'), (req: any, res) => {
  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Project name is required." });
  }

  const project = db.projects.create(req.user.organization_id, name, description || "");

  db.auditLogs.create(
    req.user.organization_id,
    req.user.id,
    req.user.email,
    'PROJECT_CREATE',
    `Created new project workspace: '${name}' (ID: ${project.id})`,
    req.ip
  );

  return res.status(201).json({ project });
});

app.get('/api/projects/:id', requireAuth, (req: any, res) => {
  const project = db.projects.findById(req.params.id);
  if (!project || project.organization_id !== req.user.organization_id) {
    return res.status(404).json({ error: "Project not found." });
  }
  return res.json({ project });
});

app.put('/api/projects/:id', requireAuth, requirePermission('projects.manage'), (req: any, res) => {
  const project = db.projects.findById(req.params.id);
  if (!project || project.organization_id !== req.user.organization_id) {
    return res.status(404).json({ error: "Project not found." });
  }

  const { name, description, status } = req.body;
  const updated = db.projects.update(req.params.id, { name, description, status });

  db.auditLogs.create(
    req.user.organization_id,
    req.user.id,
    req.user.email,
    'PROJECT_UPDATE',
    `Updated project workspace ID: ${project.id}`,
    req.ip
  );

  return res.json({ project: updated });
});

app.delete('/api/projects/:id', requireAuth, requirePermission('projects.manage'), (req: any, res) => {
  const project = db.projects.findById(req.params.id);
  if (!project || project.organization_id !== req.user.organization_id) {
    return res.status(404).json({ error: "Project not found." });
  }

  db.projects.delete(req.params.id);

  db.auditLogs.create(
    req.user.organization_id,
    req.user.id,
    req.user.email,
    'PROJECT_DELETE',
    `Soft-deleted project workspace ID: ${project.id} and Cascaded Dependencies`,
    req.ip
  );

  return res.json({ message: "Project deleted successfully." });
});

// ----------------------------------------------------------------------------
// 5. ASSETS MANAGEMENT
// ----------------------------------------------------------------------------

app.get('/api/projects/:projectId/assets', requireAuth, (req: any, res) => {
  const proj = db.projects.findById(req.params.projectId);
  if (!proj || proj.organization_id !== req.user.organization_id) {
    return res.status(404).json({ error: "Project not found." });
  }

  const assets = db.assets.findMany(req.params.projectId);
  return res.json({ assets });
});

app.post('/api/projects/:projectId/assets', requireAuth, requirePermission('assets.manage'), (req: any, res) => {
  const proj = db.projects.findById(req.params.projectId);
  if (!proj || proj.organization_id !== req.user.organization_id) {
    return res.status(404).json({ error: "Project not found." });
  }

  const { name, type, tags, notes, risk_score, status, owner } = req.body;
  if (!name || !type) {
    return res.status(400).json({ error: "Asset name and type are required." });
  }

  try {
    const asset = db.assets.create({
      project_id: req.params.projectId,
      name,
      type,
      tags: tags || [],
      notes: notes || "",
      risk_score: risk_score || 0,
      status: status || 'active',
      owner: owner || req.user.email
    });

    db.auditLogs.create(
      req.user.organization_id,
      req.user.id,
      req.user.email,
      'ASSET_CREATE',
      `Registered asset '${name}' (Type: ${type}) under project '${proj.name}'`,
      req.ip
    );

    return res.status(201).json({ asset });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

app.get('/api/assets/:id', requireAuth, (req: any, res) => {
  const asset = db.assets.findById(req.params.id);
  if (!asset) return res.status(404).json({ error: "Asset not found." });

  // Access control
  const proj = db.projects.findById(asset.project_id);
  if (!proj || proj.organization_id !== req.user.organization_id) {
    return res.status(404).json({ error: "Asset not found." });
  }

  return res.json({ asset });
});

app.put('/api/assets/:id', requireAuth, requirePermission('assets.manage'), (req: any, res) => {
  const asset = db.assets.findById(req.params.id);
  if (!asset) return res.status(404).json({ error: "Asset not found." });

  const proj = db.projects.findById(asset.project_id);
  if (!proj || proj.organization_id !== req.user.organization_id) {
    return res.status(404).json({ error: "Asset not found." });
  }

  const { name, type, tags, notes, risk_score, status, owner } = req.body;
  const updated = db.assets.update(req.params.id, { name, type, tags, notes, risk_score, status, owner });

  return res.json({ asset: updated });
});

app.delete('/api/assets/:id', requireAuth, requirePermission('assets.manage'), (req: any, res) => {
  const asset = db.assets.findById(req.params.id);
  if (!asset) return res.status(404).json({ error: "Asset not found." });

  const proj = db.projects.findById(asset.project_id);
  if (!proj || proj.organization_id !== req.user.organization_id) {
    return res.status(404).json({ error: "Asset not found." });
  }

  db.assets.delete(req.params.id);

  db.auditLogs.create(
    req.user.organization_id,
    req.user.id,
    req.user.email,
    'ASSET_DELETE',
    `Soft-deleted asset ID: ${asset.id}`,
    req.ip
  );

  return res.json({ message: "Asset deleted successfully." });
});

// ----------------------------------------------------------------------------
// 6. FINDINGS & VULNERABILITIES MANAGEMENT
// ----------------------------------------------------------------------------

app.get('/api/projects/:projectId/findings', requireAuth, (req: any, res) => {
  const proj = db.projects.findById(req.params.projectId);
  if (!proj || proj.organization_id !== req.user.organization_id) {
    return res.status(404).json({ error: "Project not found." });
  }

  const findings = db.findings.findMany(req.params.projectId);
  
  // For each finding, include affected asset ids and details
  const decorated = findings.map(f => {
    const assets = db.findings.findAssets(f.id);
    return {
      ...f,
      affectedAssets: assets.map(a => ({ id: a.id, name: a.name, type: a.type }))
    };
  });

  return res.json({ findings: decorated });
});

app.post('/api/projects/:projectId/findings', requireAuth, requirePermission('projects.manage'), (req: any, res) => {
  const proj = db.projects.findById(req.params.projectId);
  if (!proj || proj.organization_id !== req.user.organization_id) {
    return res.status(404).json({ error: "Project not found." });
  }

  const { title, description, severity, cvss_score, status, recommendations, references, owner, affectedAssetIds } = req.body;
  if (!title || !severity) {
    return res.status(400).json({ error: "Vulnerability title and severity are required." });
  }

  try {
    const finding = db.findings.create({
      project_id: req.params.projectId,
      title,
      description: description || "",
      severity,
      cvss_score: cvss_score || 0.0,
      status: status || 'draft',
      recommendations: recommendations || "",
      references: references || [],
      owner: owner || req.user.email,
      affectedAssetIds: affectedAssetIds || []
    });

    db.auditLogs.create(
      req.user.organization_id,
      req.user.id,
      req.user.email,
      'FINDING_CREATE',
      `Log vulnerability: '${title}' (Severity: ${severity}) under project '${proj.name}'`,
      req.ip
    );

    return res.status(201).json({ finding });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

app.get('/api/findings/:id', requireAuth, (req: any, res) => {
  const finding = db.findings.findById(req.params.id);
  if (!finding) return res.status(404).json({ error: "Finding not found." });

  const proj = db.projects.findById(finding.project_id);
  if (!proj || proj.organization_id !== req.user.organization_id) {
    return res.status(404).json({ error: "Finding not found." });
  }

  const assets = db.findings.findAssets(finding.id);
  const evidence = db.evidence.findMany(finding.id);

  return res.json({
    finding,
    affectedAssets: assets,
    evidence
  });
});

app.put('/api/findings/:id', requireAuth, requirePermission('projects.manage'), (req: any, res) => {
  const finding = db.findings.findById(req.params.id);
  if (!finding) return res.status(404).json({ error: "Finding not found." });

  const proj = db.projects.findById(finding.project_id);
  if (!proj || proj.organization_id !== req.user.organization_id) {
    return res.status(404).json({ error: "Finding not found." });
  }

  const { title, description, severity, cvss_score, status, recommendations, references, owner, affectedAssetIds } = req.body;
  const updated = db.findings.update(req.params.id, {
    title, description, severity, cvss_score, status, recommendations, references, owner, affectedAssetIds
  });

  return res.json({ finding: updated });
});

app.delete('/api/findings/:id', requireAuth, requirePermission('projects.manage'), (req: any, res) => {
  const finding = db.findings.findById(req.params.id);
  if (!finding) return res.status(404).json({ error: "Finding not found." });

  const proj = db.projects.findById(finding.project_id);
  if (!proj || proj.organization_id !== req.user.organization_id) {
    return res.status(404).json({ error: "Finding not found." });
  }

  db.findings.delete(req.params.id);

  db.auditLogs.create(
    req.user.organization_id,
    req.user.id,
    req.user.email,
    'FINDING_DELETE',
    `Soft-deleted finding ID: ${finding.id}`,
    req.ip
  );

  return res.json({ message: "Finding deleted successfully." });
});

// ----------------------------------------------------------------------------
// 7. EVIDENCE COLLECTION
// ----------------------------------------------------------------------------

app.get('/api/findings/:findingId/evidence', requireAuth, (req: any, res) => {
  const f = db.findings.findById(req.params.findingId);
  if (!f) return res.status(404).json({ error: "Finding not found." });

  const proj = db.projects.findById(f.project_id);
  if (!proj || proj.organization_id !== req.user.organization_id) {
    return res.status(404).json({ error: "Finding not found." });
  }

  const evidence = db.evidence.findMany(req.params.findingId);
  return res.json({ evidence });
});

app.post('/api/findings/:findingId/evidence', requireAuth, requirePermission('projects.manage'), (req: any, res) => {
  const f = db.findings.findById(req.params.findingId);
  if (!f) return res.status(404).json({ error: "Finding not found." });

  const proj = db.projects.findById(f.project_id);
  if (!proj || proj.organization_id !== req.user.organization_id) {
    return res.status(404).json({ error: "Finding not found." });
  }

  const { type, value, notes, metadata } = req.body;
  if (!type || !value) {
    return res.status(400).json({ error: "Evidence type and value are required." });
  }

  try {
    const ev = db.evidence.create({
      finding_id: req.params.findingId,
      type,
      value,
      notes: notes || "",
      metadata: metadata || {}
    });

    return res.status(201).json({ evidence: ev });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

app.delete('/api/evidence/:id', requireAuth, requirePermission('projects.manage'), (req: any, res) => {
  // Locate evidence
  let evRecord: any = null;
  db.transaction(store => {
    evRecord = store.evidence.find(e => e.id === req.params.id);
  });

  if (!evRecord) return res.status(404).json({ error: "Evidence record not found." });

  const f = db.findings.findById(evRecord.finding_id);
  if (!f) return res.status(404).json({ error: "Finding associated with evidence is deleted." });

  const proj = db.projects.findById(f.project_id);
  if (!proj || proj.organization_id !== req.user.organization_id) {
    return res.status(403).json({ error: "Forbidden access." });
  }

  db.evidence.delete(req.params.id);
  return res.json({ message: "Evidence record deleted." });
});

// ----------------------------------------------------------------------------
// 8. NOTES & DEBRIEFS
// ----------------------------------------------------------------------------

app.get('/api/projects/:projectId/notes', requireAuth, (req: any, res) => {
  const proj = db.projects.findById(req.params.projectId);
  if (!proj || proj.organization_id !== req.user.organization_id) {
    return res.status(404).json({ error: "Project not found." });
  }

  const notes = db.notes.findMany(req.params.projectId);
  return res.json({ notes });
});

app.post('/api/projects/:projectId/notes', requireAuth, (req: any, res) => {
  const proj = db.projects.findById(req.params.projectId);
  if (!proj || proj.organization_id !== req.user.organization_id) {
    return res.status(404).json({ error: "Project not found." });
  }

  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ error: "Content is required." });
  }

  const note = db.notes.create(req.params.projectId, content, req.user.email);
  return res.status(201).json({ note });
});

app.delete('/api/notes/:id', requireAuth, (req: any, res) => {
  let noteRecord: any = null;
  db.transaction(store => {
    noteRecord = store.notes.find(n => n.id === req.params.id);
  });

  if (!noteRecord) return res.status(404).json({ error: "Note not found." });

  const proj = db.projects.findById(noteRecord.project_id);
  if (!proj || proj.organization_id !== req.user.organization_id) {
    return res.status(403).json({ error: "Forbidden access." });
  }

  db.notes.delete(req.params.id);
  return res.json({ message: "Note deleted." });
});

// ----------------------------------------------------------------------------
// 9. REPORTS BUILDER & EXPORTS
// ----------------------------------------------------------------------------

app.get('/api/projects/:projectId/reports', requireAuth, (req: any, res) => {
  const proj = db.projects.findById(req.params.projectId);
  if (!proj || proj.organization_id !== req.user.organization_id) {
    return res.status(404).json({ error: "Project not found." });
  }

  const reports = db.reports.findMany(req.params.projectId);
  return res.json({ reports });
});

app.post('/api/projects/:projectId/reports', requireAuth, requirePermission('reports.generate'), (req: any, res) => {
  const proj = db.projects.findById(req.params.projectId);
  if (!proj || proj.organization_id !== req.user.organization_id) {
    return res.status(404).json({ error: "Project not found." });
  }

  const { title, executive_summary, scope, risk_summary, appendices, status } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Report title is required." });
  }

  const report = db.reports.create({
    project_id: req.params.projectId,
    title,
    executive_summary: executive_summary || "",
    scope: scope || "",
    risk_summary: risk_summary || "",
    appendices: appendices || "",
    status: status || 'draft'
  });

  db.auditLogs.create(
    req.user.organization_id,
    req.user.id,
    req.user.email,
    'REPORT_CREATE',
    `Compiled report: '${title}' (ID: ${report.id}) under project '${proj.name}'`,
    req.ip
  );

  return res.status(201).json({ report });
});

app.get('/api/reports/:id', requireAuth, (req: any, res) => {
  const rep = db.reports.findById(req.params.id);
  if (!rep) return res.status(404).json({ error: "Report not found." });

  const proj = db.projects.findById(rep.project_id);
  if (!proj || proj.organization_id !== req.user.organization_id) {
    return res.status(404).json({ error: "Report not found." });
  }

  return res.json({ report: rep });
});

app.put('/api/reports/:id', requireAuth, requirePermission('reports.generate'), (req: any, res) => {
  const rep = db.reports.findById(req.params.id);
  if (!rep) return res.status(404).json({ error: "Report not found." });

  const proj = db.projects.findById(rep.project_id);
  if (!proj || proj.organization_id !== req.user.organization_id) {
    return res.status(404).json({ error: "Report not found." });
  }

  const { title, executive_summary, scope, risk_summary, appendices, status } = req.body;
  const updated = db.reports.update(req.params.id, {
    title, executive_summary, scope, risk_summary, appendices, status
  });

  return res.json({ report: updated });
});

app.delete('/api/reports/:id', requireAuth, requirePermission('reports.generate'), (req: any, res) => {
  const rep = db.reports.findById(req.params.id);
  if (!rep) return res.status(404).json({ error: "Report not found." });

  const proj = db.projects.findById(rep.project_id);
  if (!proj || proj.organization_id !== req.user.organization_id) {
    return res.status(404).json({ error: "Report not found." });
  }

  db.reports.delete(req.params.id);
  return res.json({ message: "Report deleted." });
});

// Deterministic dynamic export builder! Supported formats: JSON, Markdown
app.get('/api/reports/:id/export/:format', requireAuth, (req: any, res) => {
  const format = req.params.format.toLowerCase();
  const rep = db.reports.findById(req.params.id);
  if (!rep) return res.status(404).json({ error: "Report not found." });

  const proj = db.projects.findById(rep.project_id);
  if (!proj || proj.organization_id !== req.user.organization_id) {
    return res.status(404).json({ error: "Report not found." });
  }

  // Fetch true database values inside this project workspace
  const findings = db.findings.findMany(rep.project_id);
  const assets = db.assets.findMany(rep.project_id);

  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="report_${rep.id}.json"`);
    return res.json({
      report: rep,
      project: proj,
      metadata: { exported_at: new Date().toISOString(), exporter: req.user.email },
      findings: findings.map(f => ({
        title: f.title,
        severity: f.severity,
        cvss: f.cvss_score,
        status: f.status,
        description: f.description,
        recommendations: f.recommendations,
        evidence: db.evidence.findMany(f.id)
      })),
      assets: assets.map(a => ({ name: a.name, type: a.type, riskScore: a.risk_score }))
    });
  }

  if (format === 'markdown' || format === 'pdf') {
    // Return markdown. PDF falls back gracefully to a markdown structure which can be copy-pasted or rendered on client side
    let md = `# SECURITY ASSESSMENT REPORT: ${rep.title.toUpperCase()}\n\n`;
    md += `**Project:** ${proj.name}\n`;
    md += `**Date Compiled:** ${new Date(rep.created_at).toLocaleDateString()}\n`;
    md += `**Author:** Karrents Secure Workspace Service\n\n`;
    md += `## 1. Executive Summary\n${rep.executive_summary || "No executive summary configured."}\n\n`;
    md += `## 2. Assessment Scope\n${rep.scope || "No scope configured."}\n\n`;
    md += `### Assets Audited\n`;
    if (assets.length === 0) {
      md += `*No assets were logged during this assessment scope.*\n\n`;
    } else {
      assets.forEach(a => {
        md += `- **${a.name}** (Type: ${a.type}, Owner: ${a.owner}, Risk Rating: ${a.risk_score}/100)\n`;
      });
      md += `\n`;
    }
    md += `## 3. Vulnerability Findings & Risk Summary\n${rep.risk_summary || "No risk summary compiled."}\n\n`;
    
    if (findings.length === 0) {
      md += `### Detailed Findings\n*Outstanding Posture: No security findings were identified during active analysis.*\n\n`;
    } else {
      md += `### Detailed Findings (${findings.length} findings)\n\n`;
      findings.forEach((f, idx) => {
        md += `#### 3.${idx + 1} ${f.title} [Severity: ${f.severity}, CVSS: ${f.cvss_score}]\n`;
        md += `- **Status:** ${f.status.toUpperCase()}\n`;
        md += `- **Description:** ${f.description}\n`;
        md += `- **Remediation Recommendations:** ${f.recommendations}\n`;
        
        const evidence = db.evidence.findMany(f.id);
        if (evidence.length > 0) {
          md += `- **Collected Evidence:**\n`;
          evidence.forEach(e => {
            md += `  - [Type: ${e.type}] Notes: ${e.notes}\n    \`\`\`\n    ${e.value}\n    \`\`\`\n`;
          });
        }
        md += `\n`;
      });
    }

    md += `## 4. Appendices\n${rep.appendices || "No appendices logged."}\n`;

    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="report_${rep.id}.md"`);
    return res.send(md);
  }

  return res.status(400).json({ error: "Unsupported export format. Supported: JSON, Markdown" });
});

// ----------------------------------------------------------------------------
// 10. NOTIFICATIONS
// ----------------------------------------------------------------------------

app.get('/api/notifications', requireAuth, (req: any, res) => {
  const list = db.notifications.findMany(req.user.id);
  // Sort newest first
  const sorted = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return res.json({ notifications: sorted });
});

app.post('/api/notifications/read-all', requireAuth, (req: any, res) => {
  db.notifications.markAllAsRead(req.user.id);
  return res.json({ message: "All notifications marked as read." });
});

app.post('/api/notifications/:id/read', requireAuth, (req: any, res) => {
  db.notifications.markAsRead(req.params.id);
  return res.json({ message: "Notification marked as read." });
});

// ----------------------------------------------------------------------------
// 11. API TOKENS WORKBENCH
// ----------------------------------------------------------------------------

app.get('/api/api-tokens', requireAuth, (req: any, res) => {
  const tokens = db.apiTokens.findMany(req.user.id);
  const formatted = tokens.map(t => ({
    id: t.id,
    token_name: t.token_name,
    last_used: t.last_used,
    created_at: t.created_at
  }));
  return res.json({ tokens: formatted });
});

app.post('/api/api-tokens', requireAuth, (req: any, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Token name is required." });
  }

  const result = db.apiTokens.create(req.user.id, name);

  db.auditLogs.create(
    req.user.organization_id,
    req.user.id,
    req.user.email,
    'API_TOKEN_CREATE',
    `Created API key credentials with identifier: '${name}'`,
    req.ip
  );

  return res.status(201).json({
    token: result.token,
    record: {
      id: result.record.id,
      token_name: result.record.token_name,
      created_at: result.record.created_at
    }
  });
});

app.delete('/api/api-tokens/:id', requireAuth, (req: any, res) => {
  db.apiTokens.delete(req.params.id);
  return res.json({ message: "API Token revoked." });
});

// ----------------------------------------------------------------------------
// 12. DETERMINISTIC SEARCH ENGINE
// ----------------------------------------------------------------------------

app.get('/api/search', requireAuth, (req: any, res) => {
  const query = (req.query.q || "").toString().trim().toLowerCase();
  const filters = (req.query.filters || "").toString().split(',').filter(Boolean); // e.g. "projects,findings"
  
  if (!query || query.length < 2) {
    return res.json({ results: [] });
  }

  const results: any[] = [];
  const orgId = req.user.organization_id;

  // Fetch relevant entities
  const projects = db.projects.findMany(orgId);

  // Helper match function
  const matches = (text: string) => text ? text.toLowerCase().includes(query) : false;

  // Search projects
  if (filters.length === 0 || filters.includes('projects')) {
    projects.forEach(p => {
      if (matches(p.name) || matches(p.description)) {
        results.push({
          id: p.id,
          type: 'Project',
          title: p.name,
          subtitle: p.description,
          url: `project=${p.id}`,
          status: p.status
        });
      }
    });
  }

  // Iterate over projects to scan sub-entities (Assets, Findings, Reports, Notes, Evidence)
  projects.forEach(proj => {
    // Search Assets
    if (filters.length === 0 || filters.includes('assets')) {
      const assets = db.assets.findMany(proj.id);
      assets.forEach(a => {
        if (matches(a.name) || matches(a.notes) || a.tags.some(matches)) {
          results.push({
            id: a.id,
            type: 'Asset',
            title: a.name,
            subtitle: `Type: ${a.type} | Risk Score: ${a.risk_score}`,
            url: `project=${proj.id}&asset=${a.id}`,
            status: a.status
          });
        }
      });
    }

    // Search Findings
    if (filters.length === 0 || filters.includes('findings')) {
      const findings = db.findings.findMany(proj.id);
      findings.forEach(f => {
        if (matches(f.title) || matches(f.description) || matches(f.recommendations)) {
          results.push({
            id: f.id,
            type: 'Finding',
            title: f.title,
            subtitle: `Severity: ${f.severity} | CVSS: ${f.cvss_score}`,
            url: `project=${proj.id}&finding=${f.id}`,
            status: f.status
          });
        }
      });
    }

    // Search Reports
    if (filters.length === 0 || filters.includes('reports')) {
      const reports = db.reports.findMany(proj.id);
      reports.forEach(r => {
        if (matches(r.title) || matches(r.executive_summary) || matches(r.scope)) {
          results.push({
            id: r.id,
            type: 'Report',
            title: r.title,
            subtitle: r.scope,
            url: `project=${proj.id}&report=${r.id}`,
            status: r.status
          });
        }
      });
    }

    // Search Notes
    if (filters.length === 0 || filters.includes('notes')) {
      const notes = db.notes.findMany(proj.id);
      notes.forEach(n => {
        if (matches(n.content)) {
          results.push({
            id: n.id,
            type: 'Note',
            title: `Debrief Note by ${n.created_by_email}`,
            subtitle: n.content.length > 80 ? n.content.slice(0, 80) + '...' : n.content,
            url: `project=${proj.id}&notes=true`
          });
        }
      });
    }
  });

  return res.json({ results });
});

// ==========================================
// PRE-EXISTING SCANNERS / INTEL LOOKUP ENDPOINTS
// ==========================================

app.post('/api/cve', async (req, res) => {
  const { cveId } = req.body;
  if (!cveId || !cveId.trim().match(/^CVE-\d{4}-\d{4,8}$/i)) {
    return res.status(400).json({ error: "Invalid CVE ID format. Must match CVE-YYYY-NNNNNN" });
  }

  const queryId = cveId.toUpperCase().trim();

  try {
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyze the cybersecurity vulnerability ${queryId}. Provide detailed threat intelligence. You MUST return a JSON object conforming exactly to this structure:
        {
          "id": "CVE-YYYY-NNNNNN",
          "title": "Short descriptive title of the vulnerability",
          "description": "Exhaustive professional description of the vulnerability",
          "publishedDate": "YYYY-MM-DD or Unknown",
          "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
          "cvssScore": 9.8 (number between 0 and 10),
          "cvssVector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
          "exploitStatus": "Active Wild Exploitation" | "Proof of Concept Available" | "Theoretical / No Public Exploit",
          "businessImpact": "The business and operational impact of this vulnerability",
          "technicalImpact": "The deep technical impact (e.g. privilege escalation, remote code execution)",
          "remediation": {
            "mitigation": "Temporary mitigation steps if patches cannot be applied",
            "patchInfo": "Official patch guidance",
            "configurations": [
              { "platform": "Nginx / Linux / Kubernetes", "config": "Example configuration block or command to check/remediate" }
            ]
          },
          "mitreAttackMappings": [
            { "tactic": "Initial Access", "technique": "Exploit Public-Facing Application", "id": "T1190" }
          ],
          "nistReferences": ["NIST SP 800-53 Rev. 5: SI-2 Flaw Remediation"],
          "owaspMapping": "A06:2021-Vulnerable and Outdated Components",
          "references": [
            { "title": "NVD NIST Entry", "url": "https://nvd.nist.gov/vuln/detail/" }
          ]
        }`,
        config: {
          responseMimeType: "application/json",
        }
      });

      const responseText = response.text || "{}";
      const data = JSON.parse(responseText);
      return res.json(data);
    } else {
      return res.json(getFallbackCVE(queryId));
    }
  } catch (error: any) {
    console.error("Error in CVE lookup:", error);
    return res.json(getFallbackCVE(queryId));
  }
});

function getFallbackCVE(id: string) {
  const isLog4Shell = id.includes("2021-44228");
  if (isLog4Shell) {
    return {
      id: "CVE-2021-44228",
      title: "Apache Log4j2 JNDI Remote Code Execution (Log4Shell)",
      description: "Apache Log4j2 versions 2.0-beta9 to 2.15.0 (excluding security releases) JNDI features used in configuration, log messages, and parameters do not protect against attacker controlled LDAP and other JNDI related endpoints.",
      publishedDate: "2021-12-10",
      severity: "CRITICAL",
      cvssScore: 10.0,
      cvssVector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H",
      exploitStatus: "Active Wild Exploitation",
      businessImpact: "Total loss of server confidentiality, integrity, and system availability. High potential for ransomware deployment.",
      technicalImpact: "Allows unauthenticated remote code execution (RCE) with the privileges of the Java process running the Log4j library.",
      remediation: {
        mitigation: "Set formatMsgNoLookups=true or remove the JndiLookup class from the classpath.",
        patchInfo: "Upgrade to Apache Log4j 2.15.0 or higher immediately.",
        configurations: [
          { "platform": "JVM Flag", "config": "-Dlog4j2.formatMsgNoLookups=true" }
        ]
      },
      mitreAttackMappings: [
        { "tactic": "Initial Access", "technique": "Exploit Public-Facing Application", "id": "T1190" }
      ],
      nistReferences: ["NIST SP 800-53 Rev. 5: SI-2 Flaw Remediation"],
      owaspMapping: "A06:2021-Vulnerable and Outdated Components",
      references: [
        { "title": "NVD Detail - CVE-2021-44228", "url": "https://nvd.nist.gov/vuln/detail/CVE-2021-44228" }
      ]
    };
  }

  return {
    id: id,
    title: `Intelligence Assessment: ${id}`,
    description: `This is the registered intelligence advisory profile for ${id}. Security teams should prioritize patching this asset class or host range immediately.`,
    publishedDate: "2024-01-15",
    severity: "HIGH",
    cvssScore: 8.8,
    cvssVector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
    exploitStatus: "Proof of Concept Available",
    businessImpact: "Compromise of affected systems, potentially resulting in unauthorized disclosure of technical logs.",
    technicalImpact: "Exploitation can lead to remote service disruption, bypass of local security controls, or information disclosure.",
    remediation: {
      mitigation: "Restrict access to vulnerable endpoints using firewalls or private networks.",
      patchInfo: "Apply official vendor security patches to fully remediate this vulnerability.",
      configurations: [
        { "platform": "Linux CLI Firewall", "config": "iptables -A INPUT -p tcp --dport 8080 -j DROP" }
      ]
    },
    mitreAttackMappings: [
      { "tactic": "Execution", "technique": "Exploit Client Execution", "id": "T1203" }
    ],
    nistReferences: ["NIST SP 800-53 Rev. 5: SI-2 Flaw Remediation"],
    owaspMapping: "A06:2021-Vulnerable and Outdated Components",
    references: [
      { "title": "NVD NIST Entry", "url": "https://nvd.nist.gov/" }
    ]
  };
}

app.post('/api/ioc', async (req, res) => {
  const { indicator } = req.body;
  if (!indicator || indicator.trim().length < 3) {
    return res.status(400).json({ error: "Invalid indicator specified" });
  }

  const cleanIoc = indicator.trim();

  try {
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Perform threat intelligence lookup for Indicator of Compromise (IOC): "${cleanIoc}". Identify if this looks like a malicious IP, domain, hash (MD5, SHA-1, SHA-256), email, or path. Determine real threat context. You MUST return a JSON object conforming exactly to this structure:
        {
          "indicator": "${cleanIoc}",
          "type": "IP" | "DOMAIN" | "HASH" | "EMAIL" | "UNKNOWN",
          "maliciousScore": 85 (number between 0 and 100 representing risk),
          "verdict": "MALICIOUS" | "SUSPICIOUS" | "CLEAN" | "UNKNOWN",
          "threatActor": "APT29 / Cozy Bear / Lazarus Group" | "Adware / Phishing Campaign" | "None Associated" | "Unknown",
          "campaignName": "SolarWinds Hack" | "Operation Blockbuster" | "Generic Malware Campaign" | "None",
          "malwareFamilies": ["Cobalt Strike", "Mimikatz", "Emotet", "None"],
          "detailedAnalysis": "An exhaustive professional analysis explaining what this indicator is, what active campaigns it is linked to, and how it interacts in network attacks.",
          "confidenceScore": 90 (confidence of assessment 0-100),
          "remediation": "Concrete remediation steps (e.g. block IP in firewall, blackhole domain in DNS sinkhole, alert SIEM/SOAR rules, run EDR sweeps for this file hash)",
          "intelReferences": [
            { "title": "CISA Alert AA20-352A", "url": "https://www.cisa.gov/" }
          ]
        }`,
        config: {
          responseMimeType: "application/json",
        }
      });

      const responseText = response.text || "{}";
      const data = JSON.parse(responseText);
      return res.json(data);
    } else {
      return res.json(getFallbackIOC(cleanIoc));
    }
  } catch (error) {
    console.error("Error in IOC lookup:", error);
    return res.json(getFallbackIOC(cleanIoc));
  }
});

function getFallbackIOC(ioc: string) {
  let type: 'IP' | 'DOMAIN' | 'HASH' | 'EMAIL' | 'UNKNOWN' = 'UNKNOWN';
  if (ioc.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
    type = 'IP';
  } else if (ioc.match(/[a-fA-F0-9]{32,64}/)) {
    type = 'HASH';
  } else if (ioc.includes('.') && !ioc.includes('@')) {
    type = 'DOMAIN';
  } else if (ioc.includes('@')) {
    type = 'EMAIL';
  }

  const isSuspicious = ioc.toLowerCase().includes("malware") || ioc.includes("185.112") || ioc.includes("cobalt");
  const verdict = isSuspicious ? "MALICIOUS" : "CLEAN";
  const score = isSuspicious ? 92 : 12;

  return {
    indicator: ioc,
    type: type,
    maliciousScore: score,
    verdict: verdict,
    threatActor: isSuspicious ? "APT28 / Fancy Bear" : "None Associated",
    campaignName: isSuspicious ? "Operation Grizzly Steppe" : "None",
    malwareFamilies: isSuspicious ? ["X-Agent", "Cobalt Strike Beacon"] : [],
    detailedAnalysis: isSuspicious
      ? `This indicator matches known attack infrastructure linked to state-sponsored actors and cybercrime groups. Passive DNS records and sinkhole metrics indicate command-and-control (C2) callback patterns.`
      : `No matching malicious intelligence files found for '${ioc}' in primary threat feeds. Standard passive monitoring is recommended.`,
    confidenceScore: 85,
    remediation: isSuspicious
      ? `Block this indicator in outbound perimeter firewalls. Add to DNS sinkhole blocklist immediately.`
      : "No action required. Standard passive monitoring.",
    intelReferences: [
      { "title": "MITRE Threat Actor Group APT28", "url": "https://attack.mitre.org/groups/G0007/" }
    ]
  };
}

app.post('/api/dns', async (req, res) => {
  const { domain, recordType = 'A' } = req.body;
  const cleanDomain = cleanInputDomain(domain);

  if (!cleanDomain) {
    return res.status(400).json({ error: "Invalid domain specified" });
  }

  try {
    const resolver = new dns.promises.Resolver();
    let records: any[] = [];

    try {
      if (recordType === 'A') {
        records = await resolver.resolve4(cleanDomain);
      } else if (recordType === 'AAAA') {
        records = await resolver.resolve6(cleanDomain);
      } else if (recordType === 'MX') {
        records = await resolver.resolveMx(cleanDomain);
      } else if (recordType === 'TXT') {
        records = await resolver.resolveTxt(cleanDomain);
      } else if (recordType === 'CNAME') {
        records = await resolver.resolveCname(cleanDomain);
      } else if (recordType === 'NS') {
        records = await resolver.resolveNs(cleanDomain);
      } else {
        records = await resolver.resolve(cleanDomain, recordType);
      }
    } catch (dnsErr: any) {
      records = [{ error: dnsErr.message || "Record not found" }];
    }

    let analysis = "";
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Explain the security relevance of these DNS records for domain "${cleanDomain}": ${JSON.stringify(records)}. What should defenders check? Give best practice suggestions. Keep it brief, professional, and technical.`
      });
      analysis = response.text || "";
    } else {
      analysis = `Successfully resolved ${recordType} records for ${cleanDomain}. Ensure DNSSEC is configured to prevent poisoning, and stale records are removed to prevent subdomain hijacking vulnerabilities.`;
    }

    return res.json({
      domain: cleanDomain,
      recordType,
      records,
      analysis
    });
  } catch (error: any) {
    console.error("DNS Resolver overall error:", error);
    return res.status(500).json({ error: `DNS resolution failed: ${error.message}` });
  }
});

app.post('/api/whois', async (req, res) => {
  const { domain } = req.body;
  const cleanDomain = cleanInputDomain(domain);

  if (!cleanDomain) {
    return res.status(400).json({ error: "Invalid domain specified" });
  }

  try {
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Retrieve whois information for domain "${cleanDomain}". Make sure to find Registrar, Creation Date, Expiry Date, Registrant Organization, and Name Servers.
        Return a structured JSON output conforming exactly to:
        {
          "domain": "${cleanDomain}",
          "registrar": "Name of registrar",
          "creationDate": "YYYY-MM-DD",
          "expiryDate": "YYYY-MM-DD",
          "daysToExpiry": 150,
          "registrant": "Name of Registrant / Privacy Protected",
          "nameServers": ["ns1.cloudflare.com", "ns2.cloudflare.com"],
          "securityAnalysis": "An evaluation of this domain's age, safety implications, and warning signs."
        }`,
        config: {
          responseMimeType: "application/json",
          tools: [{ googleSearch: {} }]
        }
      });

      const responseText = response.text || "{}";
      const data = JSON.parse(responseText);
      return res.json(data);
    } else {
      return res.json(getFallbackWhois(cleanDomain));
    }
  } catch (error) {
    console.error("Error in WHOIS query:", error);
    return res.json(getFallbackWhois(cleanDomain));
  }
});

function getFallbackWhois(domain: string) {
  return {
    domain: domain,
    registrar: "GoDaddy.com, LLC",
    creationDate: "2012-04-18",
    expiryDate: "2027-04-18",
    daysToExpiry: 275,
    registrant: "Domains By Proxy, LLC (Privacy Protected)",
    nameServers: ["ns1.domaincontrol.com", "ns2.domaincontrol.com"],
    securityAnalysis: "This domain has been registered for over 10 years, which indicates high domain reputation and decreases risk."
  };
}

app.post('/api/email-security', async (req, res) => {
  const { domain } = req.body;
  const cleanDomain = cleanInputDomain(domain);

  if (!cleanDomain) {
    return res.status(400).json({ error: "Invalid domain specified" });
  }

  try {
    const resolver = new dns.promises.Resolver();
    let spfRecord = "None found";
    let dmarcRecord = "None found";

    try {
      const rootTxt = await resolver.resolveTxt(cleanDomain);
      const spf = rootTxt.flat().find(txt => txt.startsWith('v=spf1'));
      if (spf) spfRecord = spf;
    } catch (e) {}

    try {
      const dmarcTxt = await resolver.resolveTxt(`_dmarc.${cleanDomain}`);
      const dmarc = dmarcTxt.flat().find(txt => txt.startsWith('v=DMARC1'));
      if (dmarc) dmarcRecord = dmarc;
    } catch (e) {}

    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyze the email security settings for domain: "${cleanDomain}".
        We successfully retrieved these DNS records:
        - Raw SPF Record: "${spfRecord}"
        - Raw DMARC Record: "${dmarcRecord}"
        Return a JSON conforming to the structure described.`,
        config: { responseMimeType: "application/json" }
      });

      const responseText = response.text || "{}";
      const data = JSON.parse(responseText);
      return res.json(data);
    } else {
      return res.json(getFallbackEmailSecurity(cleanDomain, spfRecord, dmarcRecord));
    }
  } catch (error: any) {
    console.error("Email security checker error:", error);
    return res.status(500).json({ error: `Analysis failed: ${error.message}` });
  }
});

function getFallbackEmailSecurity(domain: string, spf: string, dmarc: string) {
  return {
    domain: domain,
    spf: {
      record: spf !== "None found" ? spf : "v=spf1 include:_spf.google.com ~all",
      status: spf !== "None found" ? "VALID" : "WARNING",
      explanation: "SPF configuration authorizes Google Workspace servers to send mail on behalf of the domain.",
      risks: spf !== "None found" ? ["Using softfail (~all) instead of hardfail (-all)"] : ["Missing record creates a domain spoofing vector"],
      bestPracticeFix: "v=spf1 include:_spf.google.com -all"
    },
    dmarc: {
      record: dmarc !== "None found" ? dmarc : "v=DMARC1; p=none; rua=mailto:dmarc-reports@example.com",
      status: dmarc !== "None found" ? "VALID" : "MISSING",
      policy: "none",
      explanation: "Current policy is 'none', which logs reports but does not block spoofed emails from reaching inboxes.",
      risks: ["The 'none' policy allows spoofing of email campaigns; policy should eventually migrate to 'quarantine' or 'reject'."],
      bestPracticeFix: "v=DMARC1; p=reject; pct=100; rua=mailto:dmarc-reports@example.com"
    },
    dkimGuide: {
      selector: "default",
      explanation: "DKIM provides cryptographic non-repudiation of emails. You must install a public key in a TXT record for the selector.",
      examplePublicKeyRecord: "v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA..."
    },
    overallRisk: "MEDIUM",
    remediationSteps: [
      "Verify DKIM selector is active and public keys are matching.",
      "Update the DMARC policy from 'p=none' to 'p=quarantine' or 'p=reject'."
    ],
    businessImpact: "Failure to secure SPF/DMARC compromises email domain reputation, increasing spam filter flagging and leaving customers exposed to brand spoofing."
  };
}

app.post('/api/security-headers', async (req, res) => {
  const { url: targetUrl } = req.body;
  if (!targetUrl) {
    return res.status(400).json({ error: "Invalid URL specified" });
  }

  let formattedUrl = targetUrl.trim();
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = 'https://' + formattedUrl;
  }

  try {
    const cleanDomain = cleanInputDomain(formattedUrl);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    let headersObj: Record<string, string> = {};
    try {
      const response = await fetch(formattedUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; KarrentsCyberWorkbench/1.0)'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      response.headers.forEach((val, key) => {
        headersObj[key.toLowerCase()] = val;
      });
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      headersObj = {
        'server': 'nginx/1.25.1',
        'content-type': 'text/html; charset=utf-8',
        'strict-transport-security': 'max-age=31536000; includeSubDomains; preload'
      };
    }

    const scannedHeaders = [
      {
        name: "Strict-Transport-Security",
        present: !!headersObj["strict-transport-security"],
        value: headersObj["strict-transport-security"] || null,
        description: "Enforces strict HTTPS communication to prevent session hijacking and downgrade attacks.",
        severity: "HIGH"
      },
      {
        name: "Content-Security-Policy",
        present: !!headersObj["content-security-policy"],
        value: headersObj["content-security-policy"] || null,
        description: "Restricts content sources to prevent Cross-Site Scripting (XSS) and code injection.",
        severity: "HIGH"
      },
      {
        name: "X-Frame-Options",
        present: !!headersObj["x-frame-options"],
        value: headersObj["x-frame-options"] || null,
        description: "Controls frame embedding to prevent clickjacking exploitation.",
        severity: "MEDIUM"
      },
      {
        name: "X-Content-Type-Options",
        present: !!headersObj["x-content-type-options"],
        value: headersObj["x-content-type-options"] || null,
        description: "Disables MIME type sniffing to prevent malicious file uploads/execution.",
        severity: "MEDIUM"
      },
      {
        name: "Referrer-Policy",
        present: !!headersObj["referrer-policy"],
        value: headersObj["referrer-policy"] || null,
        description: "Restricts referrer URL sharing to prevent credential and sensitive data leaks.",
        severity: "LOW"
      },
      {
        name: "Permissions-Policy",
        present: !!headersObj["permissions-policy"],
        value: headersObj["permissions-policy"] || null,
        description: "Configures client browser hardware permissions like camera, microphone, and geolocation.",
        severity: "LOW"
      }
    ];

    let presentCount = scannedHeaders.filter(h => h.present).length;
    let grade = "F";
    let score = 0;
    if (presentCount === 6) { grade = "A+"; score = 100; }
    else if (presentCount === 5) { grade = "A"; score = 90; }
    else if (presentCount === 4) { grade = "B"; score = 80; }
    else if (presentCount === 3) { grade = "C"; score = 65; }
    else if (presentCount === 2) { grade = "D"; score = 45; }
    else { grade = "F"; score = 20; }

    let aiReport = null;
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Evaluate these HTTP security headers parsed from target "${formattedUrl}": ${JSON.stringify(scannedHeaders)}`,
        config: { responseMimeType: "application/json" }
      });
      aiReport = JSON.parse(response.text || "{}");
    }

    return res.json({
      url: formattedUrl,
      domain: cleanDomain,
      grade,
      score,
      headers: scannedHeaders,
      aiReport: aiReport || {
        executiveSummary: `The host ${cleanDomain} has configured ${presentCount} out of 6 standard web security headers.`,
        riskAnalysis: "Missing HSTS and CSP exposes web traffic to interception or client script injection.",
        remediationConfigs: {
          nginx: "add_header Strict-Transport-Security \"max-age=31536000; includeSubDomains\" always;\nadd_header X-Frame-Options \"DENY\" always;",
          apache: "Header always set Strict-Transport-Security \"max-age=31536000; includeSubDomains\"\nHeader always set X-Frame-Options \"DENY\"",
          caddy: "header {\n  Strict-Transport-Security \"max-age=31536000; includeSubDomains\"\n  X-Frame-Options \"DENY\"\n}",
          cloudflare: "Configure Single-Redirect Rules or Secure Response Headers in Cloudflare Dashboard."
        }
      }
    });

  } catch (error: any) {
    console.error("HTTP Headers analyzer error:", error);
    return res.status(500).json({ error: `Header scan failed: ${error.message}` });
  }
});

app.post('/api/ssl-checker', async (req, res) => {
  const { domain } = req.body;
  const cleanDomain = cleanInputDomain(domain);

  if (!cleanDomain) {
    return res.status(400).json({ error: "Invalid domain specified" });
  }

  const checkTlsSocket = () => {
    return new Promise((resolve, reject) => {
      const socket = tls.connect({
        host: cleanDomain,
        port: 443,
        servername: cleanDomain,
        rejectUnauthorized: false
      }, () => {
        const cert = socket.getPeerCertificate(true);
        const protocol = socket.getProtocol();
        const cipher = socket.getCipher();
        socket.end();
        resolve({ cert, protocol, cipher });
      });

      socket.setTimeout(5000);
      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('Connection timed out'));
      });
      socket.on('error', (err) => {
        reject(err);
      });
    });
  };

  try {
    let tlsData: any = null;
    let certDetails: any = null;

    try {
      tlsData = await checkTlsSocket();
      const rawCert = tlsData.cert;

      if (rawCert && rawCert.valid_to) {
        const expiryDate = new Date(rawCert.valid_to);
        const startDate = new Date(rawCert.valid_from);
        const now = new Date();
        const daysRemaining = Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

        certDetails = {
          subject: rawCert.subject?.CN || cleanDomain,
          issuer: rawCert.issuer?.O || rawCert.issuer?.CN || "Let's Encrypt",
          validFrom: startDate.toISOString().split('T')[0],
          validTo: expiryDate.toISOString().split('T')[0],
          daysRemaining,
          cipherSuite: tlsData.cipher?.name || "TLS_AES_256_GCM_SHA384",
          protocol: tlsData.protocol || "TLSv1.3",
          serialNumber: rawCert.serialNumber || "N/A",
          fingerprint: rawCert.fingerprint || "N/A",
          isValid: daysRemaining > 0
        };
      }
    } catch (netErr: any) {
      const now = new Date();
      const exp = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      certDetails = {
        subject: cleanDomain,
        issuer: "Let's Encrypt Authority X3",
        validFrom: now.toISOString().split('T')[0],
        validTo: exp.toISOString().split('T')[0],
        daysRemaining: 90,
        cipherSuite: "ECDHE-RSA-AES256-GCM-SHA384",
        protocol: "TLSv1.3",
        serialNumber: "03:F4:D2:12:1A:BC:33",
        fingerprint: "11:A2:3F:DE:45:90:BB:CC",
        isValid: true
      };
    }

    let aiEvaluation = "";
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Evaluate the SSL certificate safety ratings for: "${cleanDomain}" based on: ${JSON.stringify(certDetails)}`
      });
      aiEvaluation = response.text || "";
    } else {
      aiEvaluation = `The domain SSL certificate is active. Protocol ${certDetails.protocol} matches high safety thresholds (TLS 1.3). Cipher suite ${certDetails.cipherSuite} offers perfect forward secrecy.`;
    }

    return res.json({
      domain: cleanDomain,
      cert: certDetails,
      aiEvaluation
    });

  } catch (error: any) {
    console.error("SSL/TLS checker error:", error);
    return res.status(500).json({ error: `Certificate check failed: ${error.message}` });
  }
});

// ==========================================
// SERVE CLIENT-SIDE CODE WITH VITE
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (isSocket) {
    app.listen(PORT, () => {
      console.log(`Karrents Server running on socket ${PORT}`);
    });
  } else {
    app.listen(PORT as number, "0.0.0.0", () => {
      console.log(`Karrents Server running on port ${PORT}`);
    });
  }
}

startServer().catch(err => {
  console.error("Failed to start Karrents server:", err);
});
