import { Response } from 'express';
import { findingService } from '../services/finding.service.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export class FindingController {
  async listFindings(req: AuthenticatedRequest, res: Response) {
    try {
      const { projectId } = req.query;
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      if (!projectId || typeof projectId !== 'string') {
        return res.status(400).json({ error: "Query parameter 'projectId' is required." });
      }

      const findings = await findingService.getProjectFindings(projectId, req.user.organization_id);
      return res.json(findings);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async getFinding(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const details = await findingService.getFindingById(id, req.user.organization_id);
      return res.json(details);
    } catch (err: any) {
      return res.status(404).json({ error: err.message });
    }
  }

  async createFinding(req: AuthenticatedRequest, res: Response) {
    try {
      const { project_id, title, description, severity, cvss_score, status, recommendations, references, owner, affectedAssetIds } = req.body;
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      if (!project_id) {
        return res.status(400).json({ error: "Field 'project_id' is required." });
      }

      const finding = await findingService.createFinding(
        project_id,
        req.user.organization_id,
        { title, description, severity, cvss_score, status: status || 'draft', recommendations: recommendations || '', references: references || [], owner: owner || req.user.name, affectedAssetIds },
        req.user,
        req.ip
      );
      return res.status(201).json(finding);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async updateFinding(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { title, description, severity, cvss_score, status, recommendations, references, owner, affectedAssetIds } = req.body;
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const updated = await findingService.updateFinding(
        id,
        req.user.organization_id,
        { title, description, severity, cvss_score, status, recommendations, references, owner, affectedAssetIds },
        req.user,
        req.ip
      );
      return res.json(updated);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async deleteFinding(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      await findingService.deleteFinding(id, req.user.organization_id, req.user, req.ip);
      return res.json({ message: "Finding deleted successfully" });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  // --- Evidence Operations ---
  async listEvidence(req: AuthenticatedRequest, res: Response) {
    try {
      const { findingId } = req.params;
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const items = await findingService.getEvidence(findingId, req.user.organization_id);
      return res.json(items);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async createEvidence(req: AuthenticatedRequest, res: Response) {
    try {
      const { findingId } = req.params;
      const { type, value, notes, metadata } = req.body;
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const item = await findingService.createEvidence(findingId, req.user.organization_id, {
        type, value, notes, metadata: metadata || {}
      });
      return res.status(201).json(item);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async deleteEvidence(req: AuthenticatedRequest, res: Response) {
    try {
      const { evidenceId } = req.params;
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      await findingService.deleteEvidence(evidenceId, req.user.organization_id);
      return res.json({ message: "Evidence artifact deleted successfully" });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  // --- Reports Operations ---
  async listReports(req: AuthenticatedRequest, res: Response) {
    try {
      const { projectId } = req.query;
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      if (!projectId || typeof projectId !== 'string') {
        return res.status(400).json({ error: "Query parameter 'projectId' is required." });
      }

      const reports = await findingService.getProjectReports(projectId, req.user.organization_id);
      return res.json(reports);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async getReport(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const report = await findingService.getReportById(id, req.user.organization_id);
      return res.json(report);
    } catch (err: any) {
      return res.status(404).json({ error: err.message });
    }
  }

  async createReport(req: AuthenticatedRequest, res: Response) {
    try {
      const { project_id, title, executive_summary, scope, risk_summary, appendices, status } = req.body;
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      if (!project_id) {
        return res.status(400).json({ error: "Field 'project_id' is required." });
      }

      const report = await findingService.createReport(
        project_id,
        req.user.organization_id,
        { title, executive_summary: executive_summary || '', scope: scope || '', risk_summary: risk_summary || '', appendices: appendices || '', status: status || 'draft' },
        req.user,
        req.ip
      );
      return res.status(201).json(report);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async updateReport(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { title, executive_summary, scope, risk_summary, appendices, status } = req.body;
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const updated = await findingService.updateReport(
        id,
        req.user.organization_id,
        { title, executive_summary, scope, risk_summary, appendices, status },
        req.user,
        req.ip
      );
      return res.json(updated);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async deleteReport(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      await findingService.deleteReport(id, req.user.organization_id, req.user, req.ip);
      return res.json({ message: "Report deleted successfully" });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async exportReport(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { format } = req.query;
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const exportFormat = typeof format === 'string' ? format : 'markdown';
      const result = await findingService.exportReport(id, exportFormat, req.user.organization_id, req.user);

      res.setHeader('Content-Type', result.mime);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      
      if (result.mime === 'application/json') {
        return res.json(result.data);
      } else {
        return res.send(result.data);
      }
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}

export const findingController = new FindingController();
