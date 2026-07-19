import { Response } from 'express';
import { authService } from '../services/auth.service.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { setCsrfToken } from '../middleware/security.js';

export class AuthController {
  async register(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, password, name, orgName } = req.body;
      const { user, session } = await authService.register(email, password, name, orgName, req.ip);

      // Secure HTTP-Only Cookie Session Configuration
      res.cookie('karrents_session', session.token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 Days
      });

      // Synchronize client-side CSRF Token
      const xsrfToken = setCsrfToken(req, res);

      const { password_hash, salt, ...safeUser } = user;
      return res.status(201).json({ 
        message: "Registration successful", 
        user: safeUser,
        xsrfToken,
        sessionToken: session.token
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async login(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, password } = req.body;
      const { user, session } = await authService.login(email, password, req.ip, req.headers['user-agent']);

      // Secure HTTP-Only Cookie Session Configuration
      res.cookie('karrents_session', session.token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 Days
      });

      // Synchronize client-side CSRF Token
      const xsrfToken = setCsrfToken(req, res);

      const { password_hash, salt, ...safeUser } = user;
      return res.json({ 
        message: "Login successful", 
        user: safeUser,
        xsrfToken,
        sessionToken: session.token
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || "Invalid credentials." });
    }
  }

  async logout(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user) {
        await authService.logout(req.user, req.cookies?.karrents_session, req.ip);
      }

      res.clearCookie('karrents_session', { path: '/' });
      res.clearCookie('xsrf-token', { path: '/' });

      return res.json({ message: "Logout successful" });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async me(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized. Session stale or expired." });
    }
    
    // Always refresh client's CSRF token during me/hydration checks
    const xsrfToken = setCsrfToken(req, res);

    const { password_hash, salt, ...safeUser } = req.user;
    return res.json({ user: safeUser, xsrfToken });
  }

  async updatePassword(req: AuthenticatedRequest, res: Response) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      await authService.updatePassword(req.user.id, currentPassword, newPassword, req.ip);
      return res.json({ message: "Password updated successfully" });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, email } = req.body;
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const updated = await authService.updateProfile(req.user.id, name, email, req.ip);
      const { password_hash, salt, ...safeUser } = updated;
      return res.json({ message: "Profile updated successfully", user: safeUser });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async sso(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, name } = req.body;
      const { user, session } = await authService.sso(email, name || email.split('@')[0], req.ip, req.headers['user-agent']);

      // Secure HTTP-Only Cookie Session Configuration
      res.cookie('karrents_session', session.token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 Days
      });

      const xsrfToken = setCsrfToken(req, res);

      const { password_hash, salt, ...safeUser } = user;
      return res.json({ 
        message: "SSO login successful", 
        user: safeUser,
        xsrfToken,
        sessionToken: session.token
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || "SSO login failed." });
    }
  }
}

export const authController = new AuthController();
