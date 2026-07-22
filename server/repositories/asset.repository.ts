import { db, Asset } from '../db.js';

export class AssetRepository {
  async findById(id: string): Promise<Asset | undefined> {
    return db.assets.findById(id);
  }

  async findMany(projectId?: string): Promise<Asset[]> {
    return db.assets.findMany(projectId);
  }

  async create(data: Omit<Asset, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<Asset> {
    return db.assets.create(data);
  }

  async update(id: string, fields: Partial<Omit<Asset, 'id' | 'project_id' | 'created_at' | 'updated_at' | 'deleted_at'>>): Promise<Asset | undefined> {
    return db.assets.update(id, fields);
  }

  async delete(id: string): Promise<Asset | undefined> {
    return db.assets.delete(id);
  }
}

export const assetRepository = new AssetRepository();
