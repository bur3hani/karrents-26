import { db, Organization, AuditLog } from '../db.js';

export class OrganizationRepository {
  async findById(id: string): Promise<Organization | undefined> {
    return db.organizations.findById(id);
  }

  async findMany(): Promise<Organization[]> {
    return db.organizations.findMany();
  }

  async create(name: string): Promise<Organization> {
    return db.organizations.create(name);
  }

  async update(id: string, name: string): Promise<Organization | undefined> {
    return db.organizations.update(id, name);
  }

  // --- Audit Logs ---
  async createAuditLog(
    orgId: string, 
    userId: string, 
    userEmail: string, 
    action: string, 
    details: string, 
    ipAddress: string
  ): Promise<AuditLog> {
    return db.auditLogs.create(orgId, userId, userEmail, action, details, ipAddress);
  }

  async findAuditLogs(orgId: string): Promise<AuditLog[]> {
    return db.auditLogs.findMany(orgId);
  }
}

export const organizationRepository = new OrganizationRepository();
