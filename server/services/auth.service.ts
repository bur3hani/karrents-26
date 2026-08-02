import crypto from 'crypto';
import { userRepository } from '../repositories/user.repository.js';
import { organizationRepository } from '../repositories/organization.repository.js';
import { hashPassword, verifyPassword, User, Session, ApiToken } from '../db.js';

export interface EmailMfaChallenge {
  challengeToken: string;
  userId: string;
  email: string;
  code: string;
  attempts: number;
  expiresAt: number;
}

// Memory vault for zero-trust Email MFA challenges
const mfaChallengeVault = new Map<string, EmailMfaChallenge>();

export class AuthService {
  createMfaChallenge(userId: string, email: string): EmailMfaChallenge {
    const challengeToken = 'mfa_ch_' + crypto.randomBytes(24).toString('hex');
    const code = String(crypto.randomInt(100000, 999999));
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    const challenge: EmailMfaChallenge = {
      challengeToken,
      userId,
      email,
      code,
      attempts: 0,
      expiresAt
    };

    mfaChallengeVault.set(challengeToken, challenge);
    return challenge;
  }

  async verifyMfaCode(challengeToken: string, inputCode: string): Promise<{ user: User }> {
    const challenge = mfaChallengeVault.get(challengeToken);
    if (!challenge) {
      throw new Error('Invalid or expired MFA challenge token.');
    }

    if (Date.now() > challenge.expiresAt) {
      mfaChallengeVault.delete(challengeToken);
      throw new Error('Verification code has expired. Please request a new code.');
    }

    if (challenge.attempts >= 3) {
      mfaChallengeVault.delete(challengeToken);
      throw new Error('Too many failed verification attempts. Challenge revoked.');
    }

    if (challenge.code !== inputCode.trim()) {
      challenge.attempts += 1;
      const remaining = 3 - challenge.attempts;
      if (remaining <= 0) {
        mfaChallengeVault.delete(challengeToken);
        throw new Error('Too many failed verification attempts. Challenge revoked.');
      }
      throw new Error(`Invalid verification code. ${remaining} attempt(s) remaining.`);
    }

    // Code verified! Remove challenge token
    mfaChallengeVault.delete(challengeToken);

    const user = await userRepository.findById(challenge.userId);
    if (!user || user.status !== 'active') {
      throw new Error('User account is invalid or suspended.');
    }

    return { user };
  }

  resendMfaCode(challengeToken: string): EmailMfaChallenge {
    const challenge = mfaChallengeVault.get(challengeToken);
    if (!challenge) {
      throw new Error('MFA challenge session not found or expired.');
    }

    const newCode = String(crypto.randomInt(100000, 999999));
    challenge.code = newCode;
    challenge.attempts = 0;
    challenge.expiresAt = Date.now() + 5 * 60 * 1000;

    return challenge;
  }

  async register(email: string, passwordPlain: string, name: string, orgName?: string, ip?: string): Promise<{ user: User; session: Session }> {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists.');
    }

    // Create organization first
    const finalOrgName = orgName || `${name}'s Organization`;
    const newOrg = await organizationRepository.create(finalOrgName);

    // Create the User inside organization with Super Admin role
    const newUser = await userRepository.create({
      email,
      name,
      role: 'Super Admin',
      organization_id: newOrg.id,
      status: 'active',
      mfa_enabled: false,
      passwordPlain
    });

    // Create audit log
    await organizationRepository.createAuditLog(
      newOrg.id,
      newUser.id,
      newUser.email,
      'USER_REGISTER',
      `Registered user ${newUser.name} as Super Admin. Created organization '${newOrg.name}'.`,
      ip || '127.0.0.1'
    );

    // Generate Session
    const session = await userRepository.createSession(newUser.id, ip || '127.0.0.1', 'Unknown');

    return { user: newUser, session };
  }

  async login(email: string, passwordPlain: string, ip?: string, userAgent?: string): Promise<{ user: User; session: Session }> {
    const user = await userRepository.findByEmail(email);
    if (!user || user.status !== 'active') {
      throw new Error('Invalid credentials or account inactive.');
    }

    const isPasswordCorrect = verifyPassword(passwordPlain, user.password_hash, user.salt);
    if (!isPasswordCorrect) {
      throw new Error('Invalid credentials.');
    }

    // Allocate Session
    const session = await userRepository.createSession(user.id, ip || '127.0.0.1', userAgent || 'Unknown');

    // Add Login Audit Entry
    await organizationRepository.createAuditLog(
      user.organization_id,
      user.id,
      user.email,
      'USER_LOGIN',
      `User successfully logged in via session ID ${session.id}`,
      ip || '127.0.0.1'
    );

    return { user, session };
  }

  async logout(user: User, token?: string, ip?: string): Promise<void> {
    if (token) {
      await userRepository.deleteSessionByToken(token);
    }

    await organizationRepository.createAuditLog(
      user.organization_id,
      user.id,
      user.email,
      'USER_LOGOUT',
      `User successfully logged out and terminated session`,
      ip || '127.0.0.1'
    );
  }

  async updatePassword(userId: string, currentPasswordPlain: string, newPasswordPlain: string, ip?: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }

    const isValid = verifyPassword(currentPasswordPlain, user.password_hash, user.salt);
    if (!isValid) {
      throw new Error('Incorrect current password.');
    }

    await userRepository.changePassword(userId, newPasswordPlain);

    await organizationRepository.createAuditLog(
      user.organization_id,
      user.id,
      user.email,
      'PASSWORD_CHANGE',
      `Successfully rotated user security credentials`,
      ip || '127.0.0.1'
    );
  }

  async updateProfile(userId: string, name: string, email: string, ip?: string): Promise<User> {
    const updated = await userRepository.update(userId, { name, email });
    if (!updated) {
      throw new Error('User profile update failed.');
    }

    await organizationRepository.createAuditLog(
      updated.organization_id,
      updated.id,
      updated.email,
      'PROFILE_UPDATE',
      `Updated profile attributes: name=${name}, email=${email}`,
      ip || '127.0.0.1'
    );

    return updated;
  }

  async oauthAuth(email: string, name: string, ip?: string, userAgent?: string): Promise<{ user: User; session: Session }> {
    let user = await userRepository.findByEmail(email);
    if (!user) {
      // Create organization first
      const finalOrgName = `${name}'s Organization`;
      const newOrg = await organizationRepository.create(finalOrgName);

      // Create the User inside organization with Super Admin role
      user = await userRepository.create({
        email,
        name,
        role: 'Super Admin',
        organization_id: newOrg.id,
        status: 'active',
        mfa_enabled: false,
        passwordPlain: crypto.randomBytes(16).toString('hex')
      });

      await organizationRepository.createAuditLog(
        newOrg.id,
        user.id,
        user.email,
        'USER_OAUTH_REGISTER',
        `Registered user ${user.name} as Super Admin via GitHub OAuth. Created organization '${newOrg.name}'.`,
        ip || '127.0.0.1'
      );
    }

    const session = await userRepository.createSession(user.id, ip || '127.0.0.1', userAgent || 'Unknown');

    await organizationRepository.createAuditLog(
      user.organization_id,
      user.id,
      user.email,
      'USER_OAUTH_LOGIN',
      `User successfully logged in via GitHub OAuth session ID ${session.id}`,
      ip || '127.0.0.1'
    );

    return { user, session };
  }
}

export const authService = new AuthService();
