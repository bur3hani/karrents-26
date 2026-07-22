import { assetRepository } from '../repositories/asset.repository.js';
import { projectService } from './project.service.js';
import { organizationRepository } from '../repositories/organization.repository.js';
import { Asset, User } from '../db.js';

export class AssetService {
  async getProjectAssets(projectId: string | undefined | null, orgId: string): Promise<Asset[]> {
    if (projectId && projectId !== 'all') {
      await projectService.getProjectById(projectId, orgId); // Auth check
      return assetRepository.findMany(projectId);
    }
    const projects = await projectService.getProjects(orgId);
    const projIds = new Set(projects.map(p => p.id));
    const allAssets = await assetRepository.findMany();
    return allAssets.filter(a => projIds.has(a.project_id));
  }

  async createAsset(projectId: string, orgId: string, data: Omit<Asset, 'id' | 'project_id' | 'created_at' | 'updated_at' | 'deleted_at'>, user: User, ip?: string): Promise<Asset> {
    const project = await projectService.getProjectById(projectId, orgId); // Auth check
    
    const asset = await assetRepository.create({
      project_id: projectId,
      ...data
    });

    await organizationRepository.createAuditLog(
      orgId,
      user.id,
      user.email,
      'ASSET_CREATE',
      `Registered asset '${data.name}' (Type: ${data.type}) under project '${project.name}'`,
      ip || '127.0.0.1'
    );

    return asset;
  }

  async getAssetById(id: string, orgId: string): Promise<Asset> {
    const asset = await assetRepository.findById(id);
    if (!asset) {
      throw new Error('Asset not found.');
    }
    await projectService.getProjectById(asset.project_id, orgId); // Auth check
    return asset;
  }

  async updateAsset(id: string, orgId: string, fields: Partial<Omit<Asset, 'id' | 'project_id' | 'created_at' | 'updated_at' | 'deleted_at'>>, user: User, ip?: string): Promise<Asset> {
    const asset = await this.getAssetById(id, orgId); // Auth check
    const updated = await assetRepository.update(id, fields);
    if (!updated) {
      throw new Error('Asset update failed.');
    }
    return updated;
  }

  async deleteAsset(id: string, orgId: string, user: User, ip?: string): Promise<void> {
    const asset = await this.getAssetById(id, orgId); // Auth check
    await assetRepository.delete(id);

    await organizationRepository.createAuditLog(
      orgId,
      user.id,
      user.email,
      'ASSET_DELETE',
      `Soft-deleted asset ID: ${asset.id}`,
      ip || '127.0.0.1'
    );
  }
}

export const assetService = new AssetService();
