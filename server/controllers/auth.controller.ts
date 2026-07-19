import { Response } from 'express';
import { authService } from '../services/auth.service.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { setCsrfToken } from '../middleware/security.js';
import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';
import { userRepository } from '../repositories/user.repository.js';
import { verifyPassword } from '../db.js';

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
      const user = await userRepository.findByEmail(email);
      if (!user || user.status !== 'active') {
        return res.status(400).json({ error: "Invalid credentials or account inactive." });
      }

      const isPasswordCorrect = verifyPassword(password, user.password_hash, user.salt);
      if (!isPasswordCorrect) {
        return res.status(400).json({ error: "Invalid credentials." });
      }

      if (user.mfa_enabled) {
        return res.json({
          mfaRequired: true,
          userId: user.id,
          email: user.email
        });
      }

      const session = await userRepository.createSession(user.id, req.ip || '127.0.0.1', req.headers['user-agent'] || 'Unknown');

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

  async mfaSetup(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const secret = generateSecret();
      const otpauth = generateURI({ secret, label: req.user.email, issuer: 'Karrents Security' });
      const qrCodeDataUrl = await QRCode.toDataURL(otpauth);
      return res.json({ secret, qrCodeDataUrl });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async mfaEnable(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { secret, code } = req.body;
      if (!secret || !code) {
        return res.status(400).json({ error: "Secret and verification code are required." });
      }

      const isValid = verifySync({ token: code, secret }).valid;
      if (!isValid) {
        return res.status(400).json({ error: "Invalid verification code. Please check your authenticator app." });
      }

      await userRepository.update(req.user.id, { mfa_enabled: true, mfa_secret: secret });
      return res.json({ success: true, message: "Google Authenticator MFA enabled successfully!" });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async mfaDisable(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      await userRepository.update(req.user.id, { mfa_enabled: false, mfa_secret: '' });
      return res.json({ success: true, message: "Multi-Factor Authentication disabled successfully." });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async mfaVerify(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        return res.status(400).json({ error: "Email and verification code are required." });
      }

      const user = await userRepository.findByEmail(email);
      if (!user || !user.mfa_secret) {
        return res.status(400).json({ error: "MFA not configured or user not found." });
      }

      const isValid = verifySync({ token: code, secret: user.mfa_secret }).valid;
      if (!isValid) {
        return res.status(400).json({ error: "Invalid verification code. Access denied." });
      }

      const session = await userRepository.createSession(user.id, req.ip || '127.0.0.1', req.headers['user-agent'] || 'Unknown');

      res.cookie('karrents_session', session.token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 * 1000
      });

      const xsrfToken = setCsrfToken(req, res);

      const { password_hash, salt, ...safeUser } = user;
      return res.json({
        message: "MFA verification successful",
        user: safeUser,
        xsrfToken,
        sessionToken: session.token
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async githubUrl(req: AuthenticatedRequest, res: Response) {
    const clientId = process.env.GITHUB_CLIENT_ID || 'dummy_client_id';
    const protocol = req.headers['x-forwarded-proto'] === 'https' || req.secure ? 'https' : 'http';
    const host = req.headers.host || req.get('host') || 'localhost:3000';
    const origin = process.env.APP_URL || `${protocol}://${host}`;
    const redirectUri = `${origin.replace(/\/$/, '')}/api/auth/github/callback`;
    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`;
    return res.json({ url });
  }

  async githubCallback(req: AuthenticatedRequest, res: Response) {
    const { code } = req.query;
    if (!code) {
      return res.status(400).send('<h1>Error</h1><p>Missing authorization code from GitHub.</p>');
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      const protocol = req.headers['x-forwarded-proto'] === 'https' || req.secure ? 'https' : 'http';
      const host = req.headers.host || req.get('host') || 'localhost:3000';
      const origin = process.env.APP_URL || `${protocol}://${host}`;
      const formattedUrl = origin.replace(/\/$/, '') + '/api/auth/github/callback';
      return res.send(`
        <html>
          <body style="font-family: sans-serif; background: #09090b; color: #f4f4f5; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; box-sizing: border-box;">
            <div style="max-width: 500px; background: #18181b; border: 1px solid #27272a; padding: 30px; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
              <h1 style="font-size: 1.25rem; color: #ef4444; margin-top: 0; display: flex; align-items: center; gap: 8px;">
                ⚠️ GitHub OAuth Not Configured
              </h1>
              <p style="font-size: 0.875rem; color: #a1a1aa; line-height: 1.5;">
                The backend is missing the required GitHub OAuth variables in your environment.
              </p>
              <div style="background: #09090b; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 0.75rem; color: #3b82f6; margin: 16px 0;">
                GITHUB_CLIENT_ID<br/>
                GITHUB_CLIENT_SECRET
              </div>
              <p style="font-size: 0.875rem; color: #a1a1aa; line-height: 1.5;">
                Please set these variables in your AI Studio Settings menu under "Secrets". Use the following callback URL:
              </p>
              <div style="background: #09090b; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 0.75rem; color: #10b981; margin: 16px 0; word-break: break-all;">
                ${formattedUrl}
              </div>
              <button onclick="window.close()" style="background: #3f3f46; border: none; color: white; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-size: 0.875rem; width: 100%; font-weight: bold;">Close Window</button>
            </div>
          </body>
        </html>
      `);
    }

    try {
      // Exchange code for token
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code
        })
      });

      const tokenData: any = await tokenResponse.json();
      if (!tokenData.access_token) {
        throw new Error(tokenData.error_description || 'Failed to exchange code for GitHub token.');
      }

      const accessToken = tokenData.access_token;

      // Fetch GitHub profile
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${accessToken}`,
          'User-Agent': 'Karrents-OAuth-Agent'
        }
      });
      const githubUser: any = await userResponse.json();

      let email = githubUser.email;

      // If email is private or not returned, fetch user emails
      if (!email) {
        const emailsResponse = await fetch('https://api.github.com/user/emails', {
          headers: {
            'Authorization': `token ${accessToken}`,
            'User-Agent': 'Karrents-OAuth-Agent'
          }
        });
        const emails: any = await emailsResponse.json();
        if (Array.isArray(emails)) {
          const primaryEmailObj = emails.find((e: any) => e.primary && e.verified) || emails[0];
          if (primaryEmailObj) {
            email = primaryEmailObj.email;
          }
        }
      }

      if (!email) {
        throw new Error('Could not retrieve a verified email from your GitHub account.');
      }

      // Check if user exists or register them via SSO
      const { user, session } = await authService.sso(email, githubUser.name || githubUser.login || email.split('@')[0], req.ip, req.headers['user-agent']);

      // Secure HTTP-Only Cookie Session Configuration
      res.cookie('karrents_session', session.token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none', // Required for cross-origin iframe
        path: '/',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 Days
      });

      // Send postMessage and self-close popup
      return res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'OAUTH_AUTH_SUCCESS',
                  email: ${JSON.stringify(user.email)},
                  sessionToken: ${JSON.stringify(session.token)}
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (err: any) {
      return res.status(500).send(`
        <html>
          <body style="font-family: sans-serif; background: #09090b; color: #f4f4f5; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px;">
            <div style="max-width: 500px; background: #18181b; border: 1px solid #27272a; padding: 30px; border-radius: 12px;">
              <h1 style="color: #ef4444; font-size: 1.25rem; margin-top: 0;">OAuth Authentication Failed</h1>
              <p style="color: #a1a1aa; font-size: 0.875rem; line-height: 1.5;">${err.message || 'An unexpected error occurred during GitHub login.'}</p>
              <button onclick="window.close()" style="background: #3f3f46; border: none; color: white; padding: 8px 16px; border-radius: 6px; cursor: pointer; width: 100%;">Close Window</button>
            </div>
          </body>
        </html>
      `);
    }
  }
}

export const authController = new AuthController();
