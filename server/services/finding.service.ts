import { findingRepository } from '../repositories/finding.repository.js';
import { projectService } from './project.service.js';
import { assetRepository } from '../repositories/asset.repository.js';
import { organizationRepository } from '../repositories/organization.repository.js';
import { Finding, Evidence, Report, User, Asset } from '../db.js';

export interface DecoratedFinding extends Finding {
  affectedAssets: { id: string; name: string; type: string }[];
}

export class FindingService {
  async getProjectFindings(projectId: string, orgId: string): Promise<DecoratedFinding[]> {
    await projectService.getProjectById(projectId, orgId); // Auth check
    const findings = await findingRepository.findMany(projectId);
    
    const decorated: DecoratedFinding[] = [];
    for (const f of findings) {
      const assets = await findingRepository.findAssets(f.id);
      decorated.push({
        ...f,
        affectedAssets: assets.map(a => ({ id: a.id, name: a.name, type: a.type }))
      });
    }

    return decorated;
  }

  async createFinding(projectId: string, orgId: string, data: Omit<Finding, 'id' | 'project_id' | 'created_at' | 'updated_at' | 'deleted_at'> & { affectedAssetIds?: string[] }, user: User, ip?: string): Promise<Finding> {
    const project = await projectService.getProjectById(projectId, orgId); // Auth check

    const finding = await findingRepository.create({
      project_id: projectId,
      ...data
    });

    await organizationRepository.createAuditLog(
      orgId,
      user.id,
      user.email,
      'FINDING_CREATE',
      `Logged vulnerability: '${data.title}' (Severity: ${data.severity}) under project '${project.name}'`,
      ip || '127.0.0.1'
    );

    return finding;
  }

  async getFindingById(id: string, orgId: string): Promise<{ finding: Finding; affectedAssets: Asset[]; evidence: Evidence[] }> {
    const finding = await findingRepository.findById(id);
    if (!finding) {
      throw new Error('Finding not found.');
    }
    await projectService.getProjectById(finding.project_id, orgId); // Auth check

    const affectedAssets = await findingRepository.findAssets(finding.id);
    const evidence = await findingRepository.findEvidence(finding.id);

    return { finding, affectedAssets, evidence };
  }

  async updateFinding(id: string, orgId: string, fields: Partial<Omit<Finding, 'id' | 'project_id' | 'created_at' | 'updated_at' | 'deleted_at'>> & { affectedAssetIds?: string[] }, user: User, ip?: string): Promise<Finding> {
    const { finding } = await this.getFindingById(id, orgId); // Auth check
    const updated = await findingRepository.update(id, fields);
    if (!updated) {
      throw new Error('Finding update failed.');
    }
    return updated;
  }

  async deleteFinding(id: string, orgId: string, user: User, ip?: string): Promise<void> {
    const { finding } = await this.getFindingById(id, orgId); // Auth check
    await findingRepository.delete(id);

    await organizationRepository.createAuditLog(
      orgId,
      user.id,
      user.email,
      'FINDING_DELETE',
      `Soft-deleted finding ID: ${finding.id}`,
      ip || '127.0.0.1'
    );
  }

  // --- Evidence Operations ---
  async getEvidence(findingId: string, orgId: string): Promise<Evidence[]> {
    const { finding } = await this.getFindingById(findingId, orgId); // Auth check
    return findingRepository.findEvidence(findingId);
  }

  async createEvidence(findingId: string, orgId: string, data: Omit<Evidence, 'id' | 'finding_id' | 'created_at'>): Promise<Evidence> {
    await this.getFindingById(findingId, orgId); // Auth check
    return findingRepository.createEvidence({
      finding_id: findingId,
      ...data
    });
  }

  async deleteEvidence(evidenceId: string, orgId: string): Promise<void> {
    // We would fetch evidence, verify ownership, then delete
    await findingRepository.deleteEvidence(evidenceId);
  }

  // --- Reports Operations ---
  async getProjectReports(projectId: string, orgId: string): Promise<Report[]> {
    await projectService.getProjectById(projectId, orgId); // Auth check
    return findingRepository.findReports(projectId);
  }

  async createReport(projectId: string, orgId: string, data: Omit<Report, 'id' | 'project_id' | 'created_at' | 'updated_at'>, user: User, ip?: string): Promise<Report> {
    const project = await projectService.getProjectById(projectId, orgId); // Auth check
    const report = await findingRepository.createReport({
      project_id: projectId,
      ...data
    });

    await organizationRepository.createAuditLog(
      orgId,
      user.id,
      user.email,
      'REPORT_CREATE',
      `Compiled report: '${data.title}' (ID: ${report.id}) under project '${project.name}'`,
      ip || '127.0.0.1'
    );

    return report;
  }

  async getReportById(id: string, orgId: string): Promise<Report> {
    const report = await findingRepository.findReportById(id);
    if (!report) {
      throw new Error('Report not found.');
    }
    await projectService.getProjectById(report.project_id, orgId); // Auth check
    return report;
  }

  async updateReport(id: string, orgId: string, fields: Partial<Omit<Report, 'id' | 'project_id' | 'created_at' | 'updated_at'>>, user: User, ip?: string): Promise<Report> {
    await this.getReportById(id, orgId); // Auth check
    const updated = await findingRepository.updateReport(id, fields);
    if (!updated) {
      throw new Error('Report update failed.');
    }
    return updated;
  }

  async deleteReport(id: string, orgId: string, user: User, ip?: string): Promise<void> {
    const report = await this.getReportById(id, orgId); // Auth check
    await findingRepository.deleteReport(id);
  }

  // --- Export Build Utilities ---
  async exportReport(id: string, format: string, orgId: string, user: User): Promise<{ data: any; mime: string; filename: string }> {
    const rep = await this.getReportById(id, orgId);
    const proj = await projectService.getProjectById(rep.project_id, orgId);
    const findings = await findingRepository.findMany(rep.project_id);
    const assets = await assetRepository.findMany(rep.project_id);

    if (format.toLowerCase() === 'json') {
      const decoratedFindings = [];
      for (const f of findings) {
        const evidence = await findingRepository.findEvidence(f.id);
        decoratedFindings.push({
          title: f.title,
          severity: f.severity,
          cvss: f.cvss_score,
          status: f.status,
          description: f.description,
          recommendations: f.recommendations,
          evidence
        });
      }

      return {
        data: {
          report: rep,
          project: proj,
          metadata: { exported_at: new Date().toISOString(), exporter: user.email },
          findings: decoratedFindings,
          assets: assets.map(a => ({ name: a.name, type: a.type, riskScore: a.risk_score }))
        },
        mime: 'application/json',
        filename: `report_${rep.id}.json`
      };
    }

    // Default to markdown (pdf fallback is markdown layout as well)
    let md = `# SECURITY ASSESSMENT REPORT: ${rep.title.toUpperCase()}\n\n`;
    md += `**Project:** ${proj.name}\n`;
    md += `**Date Compiled:** ${new Date(rep.created_at).toLocaleDateString()}\n`;
    md += `**Author:** Karrents Secure Workspace Service\n\n`;
    md += `## 1. Executive Summary\n${rep.executive_summary || "No executive summary configured."}\n\n`;
    md += `## 2. Assessment Scope\n${rep.scope || "No scope configured."}\n\n`;
    md += `### Assets Audited\n`;
    
    if (assets.length === 0) {
      md += `*No assets were logged during this assessment scope.*\n\n`;
    } else {
      assets.forEach(a => {
        md += `- **${a.name}** (Type: ${a.type}, Owner: ${a.owner}, Risk Rating: ${a.risk_score}/100)\n`;
      });
      md += `\n`;
    }

    md += `## 3. Vulnerability Findings & Risk Summary\n${rep.risk_summary || "No risk summary compiled."}\n\n`;
    
    if (findings.length === 0) {
      md += `### Detailed Findings\n*Outstanding Posture: No security findings were identified during active analysis.*\n\n`;
    } else {
      md += `### Detailed Findings (${findings.length} findings)\n\n`;
      for (let idx = 0; idx < findings.length; idx++) {
        const f = findings[idx];
        md += `#### 3.${idx + 1} ${f.title} [Severity: ${f.severity}, CVSS: ${f.cvss_score}]\n`;
        md += `- **Status:** ${f.status.toUpperCase()}\n`;
        md += `- **Description:** ${f.description}\n`;
        md += `- **Remediation Recommendations:** ${f.recommendations}\n`;
        
        const evidence = await findingRepository.findEvidence(f.id);
        if (evidence.length > 0) {
          md += `- **Collected Evidence:**\n`;
          evidence.forEach(e => {
            md += `  - [Type: ${e.type}] Notes: ${e.notes}\n    \`\`\`\n    ${e.value}\n    \`\`\`\n`;
          });
        }
        md += `\n`;
      }
    }

    md += `## 4. Appendices\n${rep.appendices || "No appendices logged."}\n`;

    return {
      data: md,
      mime: 'text/markdown',
      filename: `report_${rep.id}.md`
    };
  }
}

export const findingService = new FindingService();
