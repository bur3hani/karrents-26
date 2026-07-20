import { Response } from 'express';
import { organizationService } from '../services/organization.service.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export class OrganizationController {
  async listUsers(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const users = await organizationService.getOrganizationUsers(req.user.organization_id);
      return res.json(users);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async createUser(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, name, role, password } = req.body;
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const newUser = await organizationService.createOrganizationUser(
        req.user,
        email,
        name,
        role,
        password,
        req.ip
      );

      const { password_hash, salt, ...safeUser } = newUser;
      return res.status(201).json(safeUser);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async deleteUser(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const deleted = await organizationService.deleteOrganizationUser(req.user, id, req.ip);
      if (deleted) {
        return res.json({ success: true, message: "User deleted successfully" });
      } else {
        return res.status(404).json({ error: "User not found" });
      }
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async listAuditLogs(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const logs = await organizationService.getAuditLogs(req.user.organization_id);
      return res.json(logs);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async updateSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const { organizationName } = req.body;
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      await organizationService.updateSettings(req.user.organization_id, organizationName, req.user, req.ip);
      return res.json({ message: "Settings updated successfully" });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}

export const organizationController = new OrganizationController();
