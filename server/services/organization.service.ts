import { organizationRepository } from '../repositories/organization.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { User, AuditLog } from '../db.js';
import { UserRole } from '../types.js';

export class OrganizationService {
  async getOrganizationUsers(orgId: string): Promise<Omit<User, 'password_hash' | 'salt'>[]> {
    const users = await userRepository.findMany(orgId);
    return users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      status: u.status,
      organization_id: u.organization_id,
      mfa_enabled: u.mfa_enabled,
      created_at: u.created_at,
      updated_at: u.updated_at
    }));
  }

  async createOrganizationUser(
    adminUser: User,
    email: string,
    name: string,
    role: UserRole,
    passwordPlain: string,
    ip?: string
  ): Promise<User> {
    const newUser = await userRepository.create({
      email,
      name,
      role,
      organization_id: adminUser.organization_id,
      status: 'active',
      mfa_enabled: false,
      passwordPlain
    });

    await organizationRepository.createAuditLog(
      adminUser.organization_id,
      adminUser.id,
      adminUser.email,
      'USER_CREATE',
      `Created organization user ${newUser.name} with role ${newUser.role}`,
      ip || '127.0.0.1'
    );

    return newUser;
  }

  async getAuditLogs(orgId: string): Promise<AuditLog[]> {
    const logs = await organizationRepository.findAuditLogs(orgId);
    return [...logs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async updateSettings(orgId: string, orgName: string, user: User, ip?: string): Promise<void> {
    await organizationRepository.update(orgId, orgName);

    await organizationRepository.createAuditLog(
      orgId,
      user.id,
      user.email,
      'ORGANIZATION_UPDATE',
      `Updated organization display name to: '${orgName}'`,
      ip || '127.0.0.1'
    );
  }
}

export const organizationService = new OrganizationService();
