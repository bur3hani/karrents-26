import { Request, Response, NextFunction } from 'express';
import { db, User } from '../db.js';
import { ROLE_PERMISSIONS } from '../db.js';
import { Permission } from '../types.js';
import { ApiKeyController } from '../controllers/apikey.controller.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
  session_id?: string;
}

// Extracted session/user context lookup
export async function getAuthContext(req: Request): Promise<{ user: User | null; session_id: string | null }> {
  // Try X-API-Key or Bearer krt_ header first
  let apiKey = req.headers['x-api-key'] as string;
  if (!apiKey && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts[0] === 'Bearer' && parts[1]?.startsWith('krt_')) {
      apiKey = parts[1];
    }
  }

  if (apiKey) {
    // 1. Check in-memory/ApiKeyController store
    const keyRecord = ApiKeyController.validateRawKey(apiKey);
    if (keyRecord) {
      const existingUser = db.users.findById(keyRecord.userId) || {
        id: keyRecord.userId,
        email: keyRecord.userEmail,
        name: keyRecord.name,
        role: 'Admin',
        organization_id: 'org_default',
        status: 'active',
        created_at: keyRecord.createdAt,
        updated_at: new Date().toISOString()
      };
      return { user: existingUser as User, session_id: `api_key_${keyRecord.id}` };
    }

    // 2. Check DB tokens fallback
    const apiTokenRecord = db.apiTokens.verify(apiKey);
    if (apiTokenRecord) {
      const user = db.users.findById(apiTokenRecord.user_id);
      if (user && user.status === 'active') {
        return { user, session_id: 'api_token' };
      }
    }
  }

  // Try cookie first
  let token = req.cookies?.karrents_session;

  // Try Bearer token fallback
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts[0] === 'Bearer' && !parts[1]?.startsWith('krt_')) {
      token = parts[1];
    }
  }

  if (!token) {
    return { user: null, session_id: null };
  }

  const session = db.sessions.findByToken(token);
  if (!session) {
    return { user: null, session_id: null };
  }

  const user = db.users.findById(session.user_id);
  if (!user || user.status !== 'active') {
    return { user: null, session_id: null };
  }

  return { user, session_id: session.id };
}

// Hydrates req.user and req.session_id for downstream usage
export async function hydrateAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { user, session_id } = await getAuthContext(req);
    if (user) {
      req.user = user;
    }
    if (session_id) {
      req.session_id = session_id;
    }
  } catch (err) {
    console.error("HydrateAuth error:", err);
  }
  next();
}

// Enforces that an authenticated user is present
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized. Active secure session required." });
  }
  next();
}

// Enforces a specific RBAC permission
export function requirePermission(permission: Permission) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized." });
    }
    
    const role = req.user.role;
    const permissions = ROLE_PERMISSIONS[role] || [];
    
    if (!permissions.includes(permission)) {
      return res.status(403).json({ 
        error: `Forbidden. Role '${role}' lacks the '${permission}' permission required for this operation.` 
      });
    }
    
    next();
  };
}
