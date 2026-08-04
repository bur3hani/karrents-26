import prisma from '../db.prisma';
import { db } from '../db';
import crypto from 'crypto';

export interface ClientRecord {
  id: string;
  organization_id: string;
  name: string;
  industry?: string;
  contact_email?: string;
  contact_phone?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  projects_count?: number;
}

// In-memory persistent clients store for environment fallbacks
const inMemClientsStore: ClientRecord[] = [
  {
    id: 'client-default-01',
    organization_id: 'org_default',
    name: 'Primary Enterprise Client',
    industry: 'Financial Technology',
    contact_email: 'security-ops@enterprise.com',
    contact_phone: '+1 (555) 019-2831',
    notes: 'Scope: Tier 1 AWS Cloud Infrastructure & Web Portal',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    projects_count: 1
  }
];

export class ClientRepository {
  async findAllByOrg(orgId: string): Promise<ClientRecord[]> {
    try {
      const clients = await prisma.client.findMany({
        where: {
          organizationId: orgId,
          deletedAt: null
        },
        include: {
          _count: {
            select: { projects: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return clients.map((c) => ({
        id: c.id,
        organization_id: c.organizationId,
        name: c.name,
        industry: c.industry || undefined,
        contact_email: c.contactEmail || undefined,
        contact_phone: c.contactPhone || undefined,
        notes: c.notes || undefined,
        created_at: c.createdAt.toISOString(),
        updated_at: c.updatedAt.toISOString(),
        deleted_at: c.deletedAt ? c.deletedAt.toISOString() : null,
        projects_count: c._count.projects
      }));
    } catch {
      // Fallback in-memory database query
      return inMemClientsStore.filter(c => c.organization_id === orgId || c.organization_id === 'org_default');
    }
  }

  async findById(id: string): Promise<ClientRecord | null> {
    try {
      const c = await prisma.client.findUnique({
        where: { id },
        include: {
          _count: { select: { projects: true } }
        }
      });
      if (!c || c.deletedAt) return null;
      return {
        id: c.id,
        organization_id: c.organizationId,
        name: c.name,
        industry: c.industry || undefined,
        contact_email: c.contactEmail || undefined,
        contact_phone: c.contactPhone || undefined,
        notes: c.notes || undefined,
        created_at: c.createdAt.toISOString(),
        updated_at: c.updatedAt.toISOString(),
        projects_count: c._count.projects
      };
    } catch {
      return inMemClientsStore.find(c => c.id === id) || null;
    }
  }

  async create(data: {
    organization_id: string;
    name: string;
    industry?: string;
    contact_email?: string;
    contact_phone?: string;
    notes?: string;
  }): Promise<ClientRecord> {
    try {
      const created = await prisma.client.create({
        data: {
          organizationId: data.organization_id,
          name: data.name,
          industry: data.industry,
          contactEmail: data.contact_email,
          contactPhone: data.contact_phone,
          notes: data.notes
        }
      });
      const rec: ClientRecord = {
        id: created.id,
        organization_id: created.organizationId,
        name: created.name,
        industry: created.industry || undefined,
        contact_email: created.contactEmail || undefined,
        contact_phone: created.contactPhone || undefined,
        notes: created.notes || undefined,
        created_at: created.createdAt.toISOString(),
        updated_at: created.updatedAt.toISOString(),
        projects_count: 0
      };
      inMemClientsStore.unshift(rec);
      return rec;
    } catch {
      // In-memory fallback
      const newId = `client_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      const record: ClientRecord = {
        id: newId,
        organization_id: data.organization_id || 'org_default',
        name: data.name,
        industry: data.industry,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
        notes: data.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        projects_count: 0
      };
      inMemClientsStore.unshift(record);
      return record;
    }
  }

  async update(id: string, data: Partial<{
    name: string;
    industry?: string;
    contact_email?: string;
    contact_phone?: string;
    notes?: string;
  }>): Promise<ClientRecord | null> {
    try {
      const updated = await prisma.client.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.industry !== undefined && { industry: data.industry }),
          ...(data.contact_email !== undefined && { contactEmail: data.contact_email }),
          ...(data.contact_phone !== undefined && { contactPhone: data.contact_phone }),
          ...(data.notes !== undefined && { notes: data.notes })
        }
      });
      return {
        id: updated.id,
        organization_id: updated.organizationId,
        name: updated.name,
        industry: updated.industry || undefined,
        contact_email: updated.contactEmail || undefined,
        contact_phone: updated.contactPhone || undefined,
        notes: updated.notes || undefined,
        created_at: updated.createdAt.toISOString(),
        updated_at: updated.updatedAt.toISOString(),
      };
    } catch {
      const idx = inMemClientsStore.findIndex(c => c.id === id);
      if (idx !== -1) {
        inMemClientsStore[idx] = {
          ...inMemClientsStore[idx],
          ...data,
          updated_at: new Date().toISOString()
        };
        return inMemClientsStore[idx];
      }
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.client.delete({ where: { id } });
    } catch {
      const idx = inMemClientsStore.findIndex(c => c.id === id);
      if (idx !== -1) {
        inMemClientsStore.splice(idx, 1);
      }
    }
    return true;
  }
}

export const clientRepository = new ClientRepository();
