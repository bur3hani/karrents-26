import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { db } from '../db.js';

export class SearchController {
  /**
   * Unified production search across Projects, Assets, Findings, Users, Reports, Knowledge Base, MITRE ATT&CK, CVEs, and Documentation.
   */
  async search(req: AuthenticatedRequest, res: Response) {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
      const category = typeof req.query.category === 'string' ? req.query.category.trim().toLowerCase() : 'all';
      const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy.trim().toLowerCase() : 'relevance';
      const limit = Math.min(Number(req.query.limit) || 20, 50);

      if (!q || q.length < 1) {
        return res.json({
          query: q,
          total: 0,
          results: {
            projects: [],
            assets: [],
            findings: [],
            users: [],
            reports: [],
            knowledge: [],
            mitre: [],
            cves: [],
            docs: []
          }
        });
      }

      const results: {
        projects: any[];
        assets: any[];
        findings: any[];
        users: any[];
        reports: any[];
        knowledge: any[];
        mitre: any[];
        cves: any[];
        docs: any[];
      } = {
        projects: [],
        assets: [],
        findings: [],
        users: [],
        reports: [],
        knowledge: [],
        mitre: [],
        cves: [],
        docs: []
      };

      const userOrgId = req.user?.organization_id || 'org-1';

      // 1. Projects
      if (category === 'all' || category === 'projects') {
        const allProjects = db.projects.findMany(userOrgId);
        results.projects = allProjects
          .filter(p => !p.deleted_at && (
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.status.toLowerCase().includes(q)
          ))
          .slice(0, limit)
          .map(p => ({
            id: p.id,
            title: p.name,
            subtitle: `Project • ${p.status.toUpperCase()}`,
            type: 'project',
            details: p.description,
            status: p.status,
            date: p.updated_at
          }));
      }

      // 2. Assets
      if (category === 'all' || category === 'assets') {
        const allAssets = db.assets.findMany();
        results.assets = allAssets
          .filter(a => !a.deleted_at && (
            a.name.toLowerCase().includes(q) ||
            a.type.toLowerCase().includes(q) ||
            a.owner.toLowerCase().includes(q) ||
            a.notes.toLowerCase().includes(q) ||
            (a.tags && a.tags.some(t => t.toLowerCase().includes(q)))
          ))
          .slice(0, limit)
          .map(a => ({
            id: a.id,
            projectId: a.project_id,
            title: a.name,
            subtitle: `Asset • ${a.type} (${a.owner})`,
            type: 'asset',
            details: a.notes || `Risk Score: ${a.risk_score}/100`,
            status: a.status,
            riskScore: a.risk_score,
            date: a.updated_at
          }));
      }

      // 3. Findings
      if (category === 'all' || category === 'findings') {
        const allFindings = db.findings.findMany();
        results.findings = allFindings
          .filter(f => !f.deleted_at && (
            f.title.toLowerCase().includes(q) ||
            f.description.toLowerCase().includes(q) ||
            f.severity.toLowerCase().includes(q) ||
            f.recommendations.toLowerCase().includes(q)
          ))
          .slice(0, limit)
          .map(f => ({
            id: f.id,
            projectId: f.project_id,
            title: f.title,
            subtitle: `Finding • Severity: ${f.severity} (CVSS ${f.cvss_score})`,
            type: 'finding',
            details: f.description,
            severity: f.severity,
            cvss: f.cvss_score,
            status: f.status,
            date: f.updated_at
          }));
      }

      // 4. Users
      if (category === 'all' || category === 'users') {
        const allUsers = db.users.findMany(userOrgId);
        results.users = allUsers
          .filter(u => 
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            u.role.toLowerCase().includes(q)
          )
          .slice(0, limit)
          .map(u => ({
            id: u.id,
            title: u.name,
            subtitle: `User • ${u.role}`,
            type: 'user',
            details: u.email,
            role: u.role,
            status: u.status
          }));
      }

      // 5. Reports
      if (category === 'all' || category === 'reports') {
        const allReports = db.reports.findMany();
        results.reports = allReports
          .filter(r => 
            r.title.toLowerCase().includes(q) ||
            r.executive_summary.toLowerCase().includes(q) ||
            r.scope.toLowerCase().includes(q)
          )
          .slice(0, limit)
          .map(r => ({
            id: r.id,
            projectId: r.project_id,
            title: r.title,
            subtitle: `Report • ${r.status.toUpperCase()}`,
            type: 'report',
            details: r.executive_summary,
            status: r.status,
            date: r.updated_at
          }));
      }

      // 6. Knowledge Base Articles
      if (category === 'all' || category === 'knowledge') {
        const kbArticles = [
          { id: 'kb-1', title: 'Hardening TLS 1.3 & Forward Secrecy', category: 'TLS/SSL', tags: ['ssl', 'tls', 'crypto'], details: 'Guidance on disabling legacy TLS 1.0/1.1 and enforcing strong cipher suites.' },
          { id: 'kb-2', title: 'HTTP Security Headers Compliance Guide', category: 'Web Security', tags: ['headers', 'hsts', 'csp', 'owasp'], details: 'Comprehensive implementation checklist for HSTS, CSP, X-Frame-Options and Permissions-Policy.' },
          { id: 'kb-3', title: 'Email Authentication: SPF, DKIM, DMARC Enforcement', category: 'Email Security', tags: ['email', 'spf', 'dmarc', 'spoofing'], details: 'Step-by-step instructions for transitioning DMARC from p=none to p=reject.' },
          { id: 'kb-4', title: 'Log4Shell (CVE-2021-44228) Detection & Remediation', category: 'Vulnerability Management', tags: ['cve', 'log4j', 'rce', 'mitre'], details: 'Mitigation strategies, JVM parameters, and dependency patching for Java applications.' },
          { id: 'kb-5', title: 'MITRE ATT&CK T1190 Initial Access Defense', category: 'Threat Intelligence', tags: ['mitre', 't1190', 'exploitation'], details: 'Analyzing and defending public-facing applications against remote exploitation.' }
        ];

        results.knowledge = kbArticles
          .filter(k => 
            k.title.toLowerCase().includes(q) ||
            k.category.toLowerCase().includes(q) ||
            k.details.toLowerCase().includes(q) ||
            k.tags.some(t => t.toLowerCase().includes(q))
          )
          .map(k => ({
            id: k.id,
            title: k.title,
            subtitle: `Knowledge Base • ${k.category}`,
            type: 'knowledge',
            details: k.details
          }));
      }

      // 7. MITRE ATT&CK
      if (category === 'all' || category === 'mitre') {
        const mitreTechniques = [
          { id: 'T1190', name: 'Exploit Public-Facing Application', tactic: 'Initial Access', description: 'Adversaries may attempt to exploit a weakness in an Internet-facing application.' },
          { id: 'T1189', name: 'Drive-by Compromise', tactic: 'Initial Access', description: 'Adversaries may gain access to a system through a user visiting a website during normal browsing.' },
          { id: 'T1566', name: 'Phishing', tactic: 'Initial Access', description: 'Adversaries may send phishing messages to gain access to victim systems.' },
          { id: 'T1059', name: 'Command and Scripting Interpreter', tactic: 'Execution', description: 'Adversaries may abuse command and script interpreters to execute commands.' },
          { id: 'T1078', name: 'Valid Accounts', tactic: 'Persistence', description: 'Adversaries may obtain and abuse credentials of existing accounts.' },
          { id: 'T1068', name: 'Exploitation for Privilege Escalation', tactic: 'Privilege Escalation', description: 'Adversaries may exploit software vulnerabilities in an attempt to elevate privileges.' },
          { id: 'T1114', name: 'Email Collection', tactic: 'Collection', description: 'Adversaries may target user email accounts to collect sensitive information.' }
        ];

        results.mitre = mitreTechniques
          .filter(m => 
            m.id.toLowerCase().includes(q) ||
            m.name.toLowerCase().includes(q) ||
            m.tactic.toLowerCase().includes(q) ||
            m.description.toLowerCase().includes(q)
          )
          .map(m => ({
            id: m.id,
            title: `${m.id}: ${m.name}`,
            subtitle: `MITRE ATT&CK • ${m.tactic}`,
            type: 'mitre',
            details: m.description
          }));
      }

      // 8. CVEs
      if (category === 'all' || category === 'cves') {
        const cveCatalog = [
          { id: 'CVE-2021-44228', title: 'Log4Shell RCE', severity: 'CRITICAL', cvss: 10.0, description: 'Apache Log4j2 JNDI feature unauthenticated RCE.' },
          { id: 'CVE-2023-38606', title: 'Apple iOS Triangulation Zero-Day', severity: 'HIGH', cvss: 8.8, description: 'Kernel memory corruption zero-day exploited in wild.' },
          { id: 'CVE-2024-3094', title: 'XZ Utils Backdoor', severity: 'CRITICAL', cvss: 10.0, description: 'Malicious code inserted into XZ Utils liblzma sshd authentication.' },
          { id: 'CVE-2024-21626', title: 'runc Container Escape', severity: 'HIGH', cvss: 8.6, description: 'File descriptor leak allowing host filesystem access from container.' }
        ];

        results.cves = cveCatalog
          .filter(c => 
            c.id.toLowerCase().includes(q) ||
            c.title.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q)
          )
          .map(c => ({
            id: c.id,
            title: `${c.id} - ${c.title}`,
            subtitle: `CVE Catalog • Severity: ${c.severity} (CVSS ${c.cvss})`,
            type: 'cve',
            details: c.description
          }));
      }

      // 9. Documentation
      if (category === 'all' || category === 'docs') {
        const docs = [
          { id: 'doc-1', title: 'REST API Authentication & Token Usage', section: 'API Reference', details: 'How to pass Bearer tokens and configure rate limits.' },
          { id: 'doc-2', title: 'Security Assessment Workflow & Report Generation', section: 'User Guide', details: 'Guiding projects from scoping assets through evidence upload and final PDF export.' },
          { id: 'doc-3', title: 'Acceptable Use Policy & Zero-Logs Privacy Statement', section: 'Legal & Governance', details: 'Operating rules for server-side scanning tools.' }
        ];

        results.docs = docs
          .filter(d => 
            d.title.toLowerCase().includes(q) ||
            d.section.toLowerCase().includes(q) ||
            d.details.toLowerCase().includes(q)
          )
          .map(d => ({
            id: d.id,
            title: d.title,
            subtitle: `Documentation • ${d.section}`,
            type: 'doc',
            details: d.details
          }));
      }

      // Sort results if specified
      const totalCount = 
        results.projects.length + 
        results.assets.length + 
        results.findings.length + 
        results.users.length + 
        results.reports.length + 
        results.knowledge.length + 
        results.mitre.length + 
        results.cves.length + 
        results.docs.length;

      return res.json({
        query: q,
        category,
        sortBy,
        total: totalCount,
        results
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Search failed.' });
    }
  }
}

export const searchController = new SearchController();
