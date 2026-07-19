import { Response } from 'express';
import { assetService } from '../services/asset.service.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export class AssetController {
  async listAssets(req: AuthenticatedRequest, res: Response) {
    try {
      const { projectId } = req.query;
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      if (!projectId || typeof projectId !== 'string') {
        return res.status(400).json({ error: "Query parameter 'projectId' is required." });
      }

      const assets = await assetService.getProjectAssets(projectId, req.user.organization_id);
      return res.json(assets);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async getAsset(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const asset = await assetService.getAssetById(id, req.user.organization_id);
      return res.json(asset);
    } catch (err: any) {
      return res.status(404).json({ error: err.message });
    }
  }

  async createAsset(req: AuthenticatedRequest, res: Response) {
    try {
      const { project_id, type, name, tags, notes, risk_score, status, owner } = req.body;
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      if (!project_id) {
        return res.status(400).json({ error: "Field 'project_id' is required." });
      }

      const asset = await assetService.createAsset(
        project_id,
        req.user.organization_id,
        { type, name, tags: tags || [], notes: notes || '', risk_score: risk_score || 0, status: status || 'active', owner: owner || req.user.name },
        req.user,
        req.ip
      );
      return res.status(201).json(asset);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async updateAsset(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { type, name, tags, notes, risk_score, status, owner } = req.body;
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const updated = await assetService.updateAsset(
        id,
        req.user.organization_id,
        { type, name, tags, notes, risk_score, status, owner },
        req.user,
        req.ip
      );
      return res.json(updated);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async deleteAsset(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      await assetService.deleteAsset(id, req.user.organization_id, req.user, req.ip);
      return res.json({ message: "Asset deleted successfully" });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}

export const assetController = new AssetController();
