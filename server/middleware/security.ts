import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// ============================================================================
// 1. RATE LIMITING MIDDLEWARE
// ============================================================================
interface RateLimitInfo {
  count: number;
  resetAt: number;
}

const limitStore = new Map<string, RateLimitInfo>();

export function rateLimiter(windowMs: number = 60000, maxRequests: number = 100) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const limitInfo = limitStore.get(ip);

    if (!limitInfo || now > limitInfo.resetAt) {
      limitStore.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    limitInfo.count++;
    if (limitInfo.count > maxRequests) {
      return res.status(429).json({ 
        error: "Too many requests. Cyber workbench throttling applied. Please try again later." 
      });
    }
    
    next();
  };
}

// ============================================================================
// 2. CSRF (CROSS-SITE REQUEST FORGERY) PROTECTION (Double-Submit Cookie Pattern)
// ============================================================================
export function setCsrfToken(req: Request, res: Response) {
  // Generate cryptographically secure token
  const csrfToken = crypto.randomBytes(24).toString('hex');
  
  // Set in non-HTTP-only cookie so client-side JavaScript can read and send in header
  res.cookie('xsrf-token', csrfToken, {
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000 // 24 Hours
  });
  
  return csrfToken;
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Allow safe methods
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  const cookieToken = req.cookies['xsrf-token'];
  const headerToken = req.headers['x-xsrf-token'] || req.headers['x-csrf-token'];

  // Skip CSRF validation for API Keys
  if (req.headers['x-api-key']) {
    return next();
  }

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ 
      error: "CSRF token validation failed. Security perimeter rejected state modification request." 
    });
  }

  next();
}

// ============================================================================
// 3. INPUT VALIDATION MIDDLEWARE
// ============================================================================
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
}

export function validateInput(rules: {
  body?: Record<string, 'string' | 'number' | 'boolean' | 'email' | 'array' | 'required'>;
  params?: Record<string, 'string' | 'required'>;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Validate request body
    if (rules.body) {
      for (const [key, expectedType] of Object.entries(rules.body)) {
        const val = req.body?.[key];

        if (expectedType === 'required' || val !== undefined) {
          if (val === undefined || val === null || val === '') {
            return res.status(400).json({ error: `Validation Error: Field '${key}' is required.` });
          }
        }

        if (val !== undefined && val !== null) {
          if (expectedType === 'string' && typeof val !== 'string') {
            return res.status(400).json({ error: `Validation Error: Field '${key}' must be a string.` });
          }
          if (expectedType === 'number' && typeof val !== 'number') {
            return res.status(400).json({ error: `Validation Error: Field '${key}' must be a number.` });
          }
          if (expectedType === 'boolean' && typeof val !== 'boolean') {
            return res.status(400).json({ error: `Validation Error: Field '${key}' must be a boolean.` });
          }
          if (expectedType === 'array' && !Array.isArray(val)) {
            return res.status(400).json({ error: `Validation Error: Field '${key}' must be an array.` });
          }
          if (expectedType === 'email') {
            if (typeof val !== 'string' || !validateEmail(val)) {
              return res.status(400).json({ error: `Validation Error: Field '${key}' must be a valid email address.` });
            }
          }
        }
      }
    }

    // Validate params
    if (rules.params) {
      for (const [key, expectedType] of Object.entries(rules.params)) {
        const val = req.params?.[key];
        if (expectedType === 'required' && (val === undefined || val === null || val === '')) {
          return res.status(400).json({ error: `Validation Error: Path parameter '${key}' is required.` });
        }
      }
    }

    next();
  };
}
