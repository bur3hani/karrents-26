import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { userRepository } from '../repositories/user.repository.js';
import { organizationRepository } from '../repositories/organization.repository.js';
import { db } from '../db.js';

export class AdminController {
  // Fetch all users across all organizations with organization name
  async listAllUsers(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Ensure requester is Super Admin or Master Account
      if (req.user.email !== 'engr.buru@gmail.com' && req.user.role !== 'Super Admin') {
        return res.status(403).json({ error: "Forbidden: Master Super Admin access required." });
      }

      const allUsers = await userRepository.findMany();
      const allOrgs = await organizationRepository.findMany();
      const orgMap = new Map(allOrgs.map(o => [o.id, o.name]));

      const enrichedUsers = allUsers.map(u => {
        const { password_hash, salt, ...safeUser } = u;
        return {
          ...safeUser,
          organization_name: orgMap.get(u.organization_id) || 'Master Organization',
          isMasterAccount: u.email.toLowerCase() === 'engr.buru@gmail.com'
        };
      });

      return res.json(enrichedUsers);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Update a user's security role
  async updateUserRole(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (req.user.email !== 'engr.buru@gmail.com' && req.user.role !== 'Super Admin') {
        return res.status(403).json({ error: "Forbidden: Master Super Admin access required." });
      }

      const targetUser = await userRepository.findById(id);
      if (!targetUser) {
        return res.status(404).json({ error: "User not found." });
      }

      // Master Account protection check
      if (targetUser.email.toLowerCase() === 'engr.buru@gmail.com' && role !== 'Super Admin') {
        return res.status(400).json({ error: "Cannot demote Master Super Admin account engr.buru@gmail.com." });
      }

      const updated = await userRepository.update(id, { role });
      if (!updated) {
        return res.status(400).json({ error: "Failed to update user role." });
      }

      // Log security audit entry
      await organizationRepository.createAuditLog(
        req.user.organization_id,
        req.user.id,
        req.user.email,
        'ROLE_CHANGE',
        `Updated role for user ${targetUser.email} from '${targetUser.role}' to '${role}'`,
        req.ip || '127.0.0.1'
      );

      const { password_hash, salt, ...safeUser } = updated;
      return res.json({ message: "User role updated successfully", user: safeUser });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  // Update a user's status (active / suspended)
  async updateUserStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (req.user.email !== 'engr.buru@gmail.com' && req.user.role !== 'Super Admin') {
        return res.status(403).json({ error: "Forbidden: Master Super Admin access required." });
      }

      const targetUser = await userRepository.findById(id);
      if (!targetUser) {
        return res.status(404).json({ error: "User not found." });
      }

      // Master Account protection check
      if (targetUser.email.toLowerCase() === 'engr.buru@gmail.com' && status !== 'active') {
        return res.status(400).json({ error: "Cannot suspend Master Super Admin account engr.buru@gmail.com." });
      }

      const updated = await userRepository.update(id, { status });
      if (!updated) {
        return res.status(400).json({ error: "Failed to update user status." });
      }

      await organizationRepository.createAuditLog(
        req.user.organization_id,
        req.user.id,
        req.user.email,
        'USER_STATUS_CHANGE',
        `Changed status for user ${targetUser.email} to '${status}'`,
        req.ip || '127.0.0.1'
      );

      const { password_hash, salt, ...safeUser } = updated;
      return res.json({ message: "User status updated successfully", user: safeUser });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  // Fetch all system security audit logs across all organizations
  async listAllAuditLogs(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (req.user.email !== 'engr.buru@gmail.com' && req.user.role !== 'Super Admin') {
        return res.status(403).json({ error: "Forbidden: Master Super Admin access required." });
      }

      // Query all audit logs from database
      const allLogs = db.transaction(store => store.audit_logs || []);
      const sortedLogs = [...allLogs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return res.json(sortedLogs);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}

export const adminController = new AdminController();
