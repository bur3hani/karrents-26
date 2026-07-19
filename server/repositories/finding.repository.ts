import { db, Finding, Asset, Evidence, Report } from '../db.js';

export class FindingRepository {
  async findById(id: string): Promise<Finding | undefined> {
    return db.findings.findById(id);
  }

  async findMany(projectId: string): Promise<Finding[]> {
    return db.findings.findMany(projectId);
  }

  async create(data: Omit<Finding, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & { affectedAssetIds?: string[] }): Promise<Finding> {
    return db.findings.create(data);
  }

  async update(id: string, fields: Partial<Omit<Finding, 'id' | 'project_id' | 'created_at' | 'updated_at' | 'deleted_at'>> & { affectedAssetIds?: string[] }): Promise<Finding | undefined> {
    return db.findings.update(id, fields);
  }

  async delete(id: string): Promise<Finding | undefined> {
    return db.findings.delete(id);
  }

  async findAssets(findingId: string): Promise<Asset[]> {
    return db.findings.findAssets(findingId);
  }

  async findFindingsByAsset(assetId: string): Promise<Finding[]> {
    return db.findings.findFindingsByAsset(assetId);
  }

  // --- Evidence Operations ---
  async findEvidence(findingId: string): Promise<Evidence[]> {
    return db.evidence.findMany(findingId);
  }

  async createEvidence(data: Omit<Evidence, 'id' | 'created_at'>): Promise<Evidence> {
    return db.evidence.create(data);
  }

  async deleteEvidence(id: string): Promise<Evidence | undefined> {
    return db.evidence.delete(id);
  }

  // --- Reports Operations ---
  async findReports(projectId: string): Promise<Report[]> {
    return db.reports.findMany(projectId);
  }

  async findReportById(id: string): Promise<Report | undefined> {
    return db.reports.findById(id);
  }

  async createReport(data: Omit<Report, 'id' | 'created_at' | 'updated_at'>): Promise<Report> {
    return db.reports.create(data);
  }

  async updateReport(id: string, fields: Partial<Omit<Report, 'id' | 'project_id' | 'created_at' | 'updated_at'>>): Promise<Report | undefined> {
    return db.reports.update(id, fields);
  }

  async deleteReport(id: string): Promise<Report | undefined> {
    return db.reports.delete(id);
  }
}

export const findingRepository = new FindingRepository();
