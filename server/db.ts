import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// ============================================================================
// DOMAIN MODELS & SCHEMAS (Normalized database)
// ============================================================================

export interface Organization {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  salt: string;
  name: string;
  role: 'Super Administrator' | 'Organization Administrator' | 'Security Analyst' | 'Researcher' | 'Viewer';
  organization_id: string;
  status: 'active' | 'suspended' | 'pending';
  mfa_enabled: boolean;
  mfa_secret?: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface Project {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Asset {
  id: string;
  project_id: string;
  type: 'Domain' | 'Subdomain' | 'Website' | 'Public IP' | 'Internal IP' | 'Host' | 'Server' | 'Application' | 'Repository' | 'Cloud Resource' | 'Email Domain';
  name: string;
  tags: string[];
  notes: string;
  risk_score: number; // 0 - 100
  status: 'active' | 'under-review' | 'decommissioned';
  owner: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Finding {
  id: string;
  project_id: string;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  cvss_score: number;
  status: 'draft' | 'open' | 'remediated' | 'risk-accepted' | 'false-positive';
  recommendations: string;
  references: string[];
  owner: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface FindingAsset {
  finding_id: string;
  asset_id: string;
}

export interface Evidence {
  id: string;
  finding_id: string;
  type: 'Screenshot' | 'File' | 'URL' | 'Note' | 'Command Output' | 'Log' | 'Hash' | 'Metadata';
  value: string; // The URL, filePath, command, or text content
  notes: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Note {
  id: string;
  project_id: string;
  content: string;
  created_by_email: string;
  created_at: string;
}

export interface Report {
  id: string;
  project_id: string;
  title: string;
  executive_summary: string;
  scope: string;
  risk_summary: string;
  appendices: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface Integration {
  id: string;
  organization_id: string;
  type: string;
  config: Record<string, any>;
  created_at: string;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  user_id: string;
  user_email: string;
  action: string;
  details: string;
  ip_address: string;
  created_at: string;
}

export interface Invitation {
  id: string;
  organization_id: string;
  email: string;
  role: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
}

export interface UserNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ApiToken {
  id: string;
  user_id: string;
  token_name: string;
  token_hash: string;
  last_used: string | null;
  created_at: string;
}

// Complete database scheme structure
export interface DatabaseSchema {
  organizations: Organization[];
  users: User[];
  sessions: Session[];
  projects: Project[];
  assets: Asset[];
  findings: Finding[];
  finding_assets: FindingAsset[];
  evidence: Evidence[];
  notes: Note[];
  reports: Report[];
  integrations: Integration[];
  audit_logs: AuditLog[];
  invitations: Invitation[];
  user_notifications: UserNotification[];
  api_tokens: ApiToken[];
}

// Role Permissions matrix
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  'Super Administrator': [
    'users.view', 'users.create', 'users.manage', 'projects.manage', 'reports.generate', 'assets.manage', 'settings.update', 'audit.view'
  ],
  'Organization Administrator': [
    'users.view', 'users.create', 'projects.manage', 'reports.generate', 'assets.manage', 'settings.update', 'audit.view'
  ],
  'Security Analyst': [
    'users.view', 'projects.manage', 'reports.generate', 'assets.manage'
  ],
  'Researcher': [
    'users.view', 'assets.manage'
  ],
  'Viewer': [
    'users.view'
  ]
};

// Database state
const DB_FILE = path.join(process.cwd(), 'karrents_db.json');
let dbCache: DatabaseSchema | null = null;

// ============================================================================
// SECURITY HELPERS (Standard scrypt Password Hashing)
// ============================================================================

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const verifyHash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
}

// ============================================================================
// ENGINE INTERNALS (Read / Write / Transactions)
// ============================================================================

function loadDatabase(): DatabaseSchema {
  if (dbCache) return dbCache;

  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      dbCache = JSON.parse(data);
      return dbCache!;
    } catch (err) {
      console.error("Failed to parse database file. Re-initializing.", err);
    }
  }

  // Seeding initial production database
  const defaultOrgId = 'org_default';
  const superAdminId = 'user_superadmin';
  const { hash: defaultHash, salt: defaultSalt } = hashPassword('Admin@Karrents2026');

  dbCache = {
    organizations: [
      {
        id: defaultOrgId,
        name: 'Karrents Intelligence Lab',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    users: [
      {
        id: superAdminId,
        email: 'engr.buru@gmail.com',
        password_hash: defaultHash,
        salt: defaultSalt,
        name: 'Buru Security',
        role: 'Super Administrator',
        organization_id: defaultOrgId,
        status: 'active',
        mfa_enabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'user_analyst',
        email: 'burhnaimtebgea@gmail.com',
        password_hash: defaultHash,
        salt: defaultSalt,
        name: 'Burhnaim Analyst',
        role: 'Security Analyst',
        organization_id: defaultOrgId,
        status: 'active',
        mfa_enabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    sessions: [],
    projects: [
      {
        id: 'proj_demo_external',
        organization_id: defaultOrgId,
        name: 'Corporate Infrastructure Perimeter Audit',
        description: 'Comprehensive external security audit covering subdomains, public-facing applications, and open port vulnerability analysis.',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null
      }
    ],
    assets: [
      {
        id: 'asset_domain_1',
        project_id: 'proj_demo_external',
        type: 'Domain',
        name: 'karrents.com',
        tags: ['Production', 'Public-Facing'],
        notes: 'Primary landing and corporate asset domain.',
        risk_score: 12,
        status: 'active',
        owner: 'engr.buru@gmail.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null
      },
      {
        id: 'asset_ip_1',
        project_id: 'proj_demo_external',
        type: 'Public IP',
        name: '185.112.144.50',
        tags: ['Hostinger', 'Web Server'],
        notes: 'Production reverse proxy gateway host.',
        risk_score: 45,
        status: 'active',
        owner: 'engr.buru@gmail.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null
      }
    ],
    findings: [
      {
        id: 'find_1',
        project_id: 'proj_demo_external',
        title: 'Missing HTTP Strict-Transport-Security (HSTS) Header',
        description: 'The production web application server fails to enforce HTTP Strict-Transport-Security (HSTS). This makes client connections vulnerable to protocol downgrade attacks (SSL stripping) and session hijacking.',
        severity: 'MEDIUM',
        cvss_score: 5.3,
        status: 'open',
        recommendations: 'Configure the Nginx or Cloudflare gateway to inject the HSTS header with max-age=31536000 and includeSubDomains.',
        references: ['OWASP Web Security Testing Guide: WSTG-CONF-02', 'RFC 6797'],
        owner: 'engr.buru@gmail.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null
      },
      {
        id: 'find_2',
        project_id: 'proj_demo_external',
        title: 'Outdated Apache HTTP Server v2.4.41 (Vulnerable and Outdated)',
        description: 'The perimeter server resolves to an Apache HTTP server version 2.4.41, which contains several unpatched critical and high-severity CVEs, including potential local privilege escalation and server side request forgery.',
        severity: 'HIGH',
        cvss_score: 7.5,
        status: 'open',
        recommendations: 'Upgrade the server to the latest stable release (v2.4.58 or higher) via package management tools.',
        references: ['CVE-2020-11984', 'CVE-2021-26691'],
        owner: 'engr.buru@gmail.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null
      }
    ],
    finding_assets: [
      { finding_id: 'find_1', asset_id: 'asset_domain_1' },
      { finding_id: 'find_2', asset_id: 'asset_ip_1' }
    ],
    evidence: [
      {
        id: 'ev_1',
        finding_id: 'find_1',
        type: 'Log',
        value: 'curl -I https://karrents.com\nHTTP/2 200 OK\nServer: nginx\nContent-Type: text/html\n(Missing Strict-Transport-Security header)',
        notes: 'Outbound header scan shows total lack of HSTS instructions.',
        metadata: { scan_source: 'curl-analyzer' },
        created_at: new Date().toISOString()
      }
    ],
    notes: [
      {
        id: 'note_1',
        project_id: 'proj_demo_external',
        content: 'Perimeter port scanning completed. Checked common 80, 443, 8080, 22 ports. Nginx gateway running with proper Hostinger SSL binds.',
        created_by_email: 'engr.buru@gmail.com',
        created_at: new Date().toISOString()
      }
    ],
    reports: [
      {
        id: 'rep_1',
        project_id: 'proj_demo_external',
        title: 'Q2 External Assessment Summary',
        executive_summary: 'This security assessment highlights vulnerabilities identified in the external infrastructure of Acme Corp. Focus was placed on the domain perimeter and server headers.',
        scope: 'External web assets, DNS configurations, and TLS configurations for karrents.com and associate IPs.',
        risk_summary: 'Overall risk posture is evaluated as MODERATE. Outdated server versions and missing HTTPS security enforcement represent the primary vectors.',
        appendices: 'Standard tooling used: Nmap, DNS resolvers, Curl header auditor, OWASP Zap.',
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    integrations: [],
    audit_logs: [
      {
        id: 'audit_1',
        organization_id: defaultOrgId,
        user_id: superAdminId,
        user_email: 'engr.buru@gmail.com',
        action: 'DB_INIT',
        details: 'Production Karrents Secure database initialized and seeded.',
        ip_address: '127.0.0.1',
        created_at: new Date().toISOString()
      }
    ],
    invitations: [],
    user_notifications: [],
    api_tokens: []
  };

  saveDatabase(dbCache);
  return dbCache;
}

function saveDatabase(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    dbCache = data;
  } catch (err) {
    console.error("Failed to write to database file:", err);
  }
}

// ============================================================================
// TRANSACTIONAL REPOSITORIES
// ============================================================================

export const db = {
  // Transaction wrapper to ensure data-safety
  transaction<T>(action: (store: DatabaseSchema) => T): T {
    const store = loadDatabase();
    const result = action(store);
    saveDatabase(store);
    return result;
  },

  // ORGANIZATIONS
  organizations: {
    findMany() {
      return loadDatabase().organizations;
    },
    findById(id: string) {
      return loadDatabase().organizations.find(o => o.id === id);
    },
    create(name: string) {
      return db.transaction(store => {
        const newOrg: Organization = {
          id: 'org_' + crypto.randomBytes(8).toString('hex'),
          name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        store.organizations.push(newOrg);
        return newOrg;
      });
    },
    update(id: string, name: string) {
      return db.transaction(store => {
        const org = store.organizations.find(o => o.id === id);
        if (org) {
          org.name = name;
          org.updated_at = new Date().toISOString();
        }
        return org;
      });
    }
  },

  // USERS
  users: {
    findMany(orgId?: string) {
      const users = loadDatabase().users;
      if (orgId) return users.filter(u => u.organization_id === orgId);
      return users;
    },
    findById(id: string) {
      return loadDatabase().users.find(u => u.id === id);
    },
    findByEmail(email: string) {
      const cleanEmail = email.trim().toLowerCase();
      return loadDatabase().users.find(u => u.email.toLowerCase() === cleanEmail);
    },
    create(data: Omit<User, 'id' | 'created_at' | 'updated_at' | 'password_hash' | 'salt'> & { passwordPlain: string }) {
      return db.transaction(store => {
        const cleanEmail = data.email.trim().toLowerCase();
        if (store.users.some(u => u.email.toLowerCase() === cleanEmail)) {
          throw new Error('User with this email already exists.');
        }
        const { hash, salt } = hashPassword(data.passwordPlain);
        const newUser: User = {
          id: 'user_' + crypto.randomBytes(8).toString('hex'),
          email: cleanEmail,
          password_hash: hash,
          salt: salt,
          name: data.name,
          role: data.role,
          organization_id: data.organization_id,
          status: data.status,
          mfa_enabled: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        store.users.push(newUser);
        return newUser;
      });
    },
    update(id: string, fields: Partial<Pick<User, 'name' | 'role' | 'status' | 'mfa_enabled' | 'mfa_secret' | 'email'>>) {
      return db.transaction(store => {
        const user = store.users.find(u => u.id === id);
        if (user) {
          if (fields.name !== undefined) user.name = fields.name;
          if (fields.role !== undefined) user.role = fields.role;
          if (fields.status !== undefined) user.status = fields.status;
          if (fields.mfa_enabled !== undefined) user.mfa_enabled = fields.mfa_enabled;
          if (fields.mfa_secret !== undefined) user.mfa_secret = fields.mfa_secret;
          if (fields.email !== undefined) user.email = fields.email.trim().toLowerCase();
          user.updated_at = new Date().toISOString();
        }
        return user;
      });
    },
    changePassword(id: string, passwordPlain: string) {
      return db.transaction(store => {
        const user = store.users.find(u => u.id === id);
        if (user) {
          const { hash, salt } = hashPassword(passwordPlain);
          user.password_hash = hash;
          user.salt = salt;
          user.updated_at = new Date().toISOString();
        }
        return user;
      });
    }
  },

  // SESSIONS
  sessions: {
    create(userId: string, ipAddress: string, userAgent: string) {
      return db.transaction(store => {
        const token = crypto.randomBytes(32).toString('hex');
        // Session lasts 24 hours
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const newSession: Session = {
          id: 'sess_' + crypto.randomBytes(12).toString('hex'),
          user_id: userId,
          token,
          expires_at: expiresAt,
          ip_address: ipAddress,
          user_agent: userAgent,
          created_at: new Date().toISOString()
        };
        store.sessions.push(newSession);
        return newSession;
      });
    },
    findByToken(token: string) {
      const session = loadDatabase().sessions.find(s => s.token === token);
      if (!session) return undefined;
      // Expired check
      if (new Date(session.expires_at).getTime() < Date.now()) {
        db.sessions.deleteByToken(token);
        return undefined;
      }
      return session;
    },
    findActiveByUserId(userId: string) {
      return loadDatabase().sessions.filter(s => s.user_id === userId && new Date(s.expires_at).getTime() > Date.now());
    },
    deleteByToken(token: string) {
      return db.transaction(store => {
        store.sessions = store.sessions.filter(s => s.token !== token);
      });
    },
    deleteByUserId(userId: string) {
      return db.transaction(store => {
        store.sessions = store.sessions.filter(s => s.user_id !== userId);
      });
    },
    deleteById(id: string) {
      return db.transaction(store => {
        store.sessions = store.sessions.filter(s => s.id !== id);
      });
    }
  },

  // PROJECTS
  projects: {
    findMany(orgId: string) {
      return loadDatabase().projects.filter(p => p.organization_id === orgId && p.deleted_at === null);
    },
    findById(id: string) {
      const project = loadDatabase().projects.find(p => p.id === id);
      if (project && project.deleted_at === null) return project;
      return undefined;
    },
    create(orgId: string, name: string, description: string) {
      return db.transaction(store => {
        const newProj: Project = {
          id: 'proj_' + crypto.randomBytes(8).toString('hex'),
          organization_id: orgId,
          name,
          description,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null
        };
        store.projects.push(newProj);
        return newProj;
      });
    },
    update(id: string, fields: Partial<Pick<Project, 'name' | 'description' | 'status'>>) {
      return db.transaction(store => {
        const proj = store.projects.find(p => p.id === id);
        if (proj && proj.deleted_at === null) {
          if (fields.name !== undefined) proj.name = fields.name;
          if (fields.description !== undefined) proj.description = fields.description;
          if (fields.status !== undefined) proj.status = fields.status;
          proj.updated_at = new Date().toISOString();
        }
        return proj;
      });
    },
    delete(id: string) {
      return db.transaction(store => {
        const proj = store.projects.find(p => p.id === id);
        if (proj) {
          proj.deleted_at = new Date().toISOString();
          // Soft delete related assets and findings
          store.assets.forEach(a => {
            if (a.project_id === id) a.deleted_at = new Date().toISOString();
          });
          store.findings.forEach(f => {
            if (f.project_id === id) f.deleted_at = new Date().toISOString();
          });
        }
        return proj;
      });
    }
  },

  // ASSETS
  assets: {
    findMany(projectId: string) {
      return loadDatabase().assets.filter(a => a.project_id === projectId && a.deleted_at === null);
    },
    findById(id: string) {
      const asset = loadDatabase().assets.find(a => a.id === id);
      if (asset && asset.deleted_at === null) return asset;
      return undefined;
    },
    create(data: Omit<Asset, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>) {
      return db.transaction(store => {
        // Verify project exists
        const proj = store.projects.find(p => p.id === data.project_id);
        if (!proj || proj.deleted_at !== null) {
          throw new Error('Project does not exist or has been deleted.');
        }

        const newAsset: Asset = {
          id: 'asset_' + crypto.randomBytes(8).toString('hex'),
          project_id: data.project_id,
          type: data.type,
          name: data.name,
          tags: data.tags,
          notes: data.notes,
          risk_score: data.risk_score,
          status: data.status,
          owner: data.owner,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null
        };
        store.assets.push(newAsset);
        return newAsset;
      });
    },
    update(id: string, fields: Partial<Omit<Asset, 'id' | 'project_id' | 'created_at' | 'updated_at' | 'deleted_at'>>) {
      return db.transaction(store => {
        const asset = store.assets.find(a => a.id === id);
        if (asset && asset.deleted_at === null) {
          if (fields.name !== undefined) asset.name = fields.name;
          if (fields.type !== undefined) asset.type = fields.type;
          if (fields.tags !== undefined) asset.tags = fields.tags;
          if (fields.notes !== undefined) asset.notes = fields.notes;
          if (fields.risk_score !== undefined) asset.risk_score = fields.risk_score;
          if (fields.status !== undefined) asset.status = fields.status;
          if (fields.owner !== undefined) asset.owner = fields.owner;
          asset.updated_at = new Date().toISOString();
        }
        return asset;
      });
    },
    delete(id: string) {
      return db.transaction(store => {
        const asset = store.assets.find(a => a.id === id);
        if (asset) {
          asset.deleted_at = new Date().toISOString();
          // Remove from association maps
          store.finding_assets = store.finding_assets.filter(fa => fa.asset_id !== id);
        }
        return asset;
      });
    }
  },

  // FINDINGS
  findings: {
    findMany(projectId: string) {
      return loadDatabase().findings.filter(f => f.project_id === projectId && f.deleted_at === null);
    },
    findById(id: string) {
      const finding = loadDatabase().findings.find(f => f.id === id);
      if (finding && finding.deleted_at === null) return finding;
      return undefined;
    },
    create(data: Omit<Finding, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & { affectedAssetIds?: string[] }) {
      return db.transaction(store => {
        const proj = store.projects.find(p => p.id === data.project_id);
        if (!proj || proj.deleted_at !== null) {
          throw new Error('Project does not exist or has been deleted.');
        }

        const newFinding: Finding = {
          id: 'find_' + crypto.randomBytes(8).toString('hex'),
          project_id: data.project_id,
          title: data.title,
          description: data.description,
          severity: data.severity,
          cvss_score: data.cvss_score,
          status: data.status,
          recommendations: data.recommendations,
          references: data.references,
          owner: data.owner,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null
        };
        store.findings.push(newFinding);

        // Associate with assets
        if (data.affectedAssetIds) {
          data.affectedAssetIds.forEach(assetId => {
            if (store.assets.some(a => a.id === assetId && a.deleted_at === null)) {
              store.finding_assets.push({ finding_id: newFinding.id, asset_id: assetId });
            }
          });
        }

        return newFinding;
      });
    },
    update(id: string, fields: Partial<Omit<Finding, 'id' | 'project_id' | 'created_at' | 'updated_at' | 'deleted_at'>> & { affectedAssetIds?: string[] }) {
      return db.transaction(store => {
        const finding = store.findings.find(f => f.id === id);
        if (finding && finding.deleted_at === null) {
          if (fields.title !== undefined) finding.title = fields.title;
          if (fields.description !== undefined) finding.description = fields.description;
          if (fields.severity !== undefined) finding.severity = fields.severity;
          if (fields.cvss_score !== undefined) finding.cvss_score = fields.cvss_score;
          if (fields.status !== undefined) finding.status = fields.status;
          if (fields.recommendations !== undefined) finding.recommendations = fields.recommendations;
          if (fields.references !== undefined) finding.references = fields.references;
          if (fields.owner !== undefined) finding.owner = fields.owner;
          finding.updated_at = new Date().toISOString();

          // Sync affected assets
          if (fields.affectedAssetIds !== undefined) {
            // Remove previous map
            store.finding_assets = store.finding_assets.filter(fa => fa.finding_id !== id);
            // Re-add
            fields.affectedAssetIds.forEach(assetId => {
              if (store.assets.some(a => a.id === assetId && a.deleted_at === null)) {
                store.finding_assets.push({ finding_id: id, asset_id: assetId });
              }
            });
          }
        }
        return finding;
      });
    },
    delete(id: string) {
      return db.transaction(store => {
        const finding = store.findings.find(f => f.id === id);
        if (finding) {
          finding.deleted_at = new Date().toISOString();
          // Clean dependencies
          store.finding_assets = store.finding_assets.filter(fa => fa.finding_id !== id);
          store.evidence = store.evidence.filter(e => e.finding_id !== id);
        }
        return finding;
      });
    },
    findAssets(findingId: string) {
      const links = loadDatabase().finding_assets.filter(fa => fa.finding_id === findingId);
      const assets = loadDatabase().assets;
      return links
        .map(link => assets.find(a => a.id === link.asset_id && a.deleted_at === null))
        .filter((a): a is Asset => !!a);
    },
    findFindingsByAsset(assetId: string) {
      const links = loadDatabase().finding_assets.filter(fa => fa.asset_id === assetId);
      const findings = loadDatabase().findings;
      return links
        .map(link => findings.find(f => f.id === link.finding_id && f.deleted_at === null))
        .filter((f): f is Finding => !!f);
    }
  },

  // EVIDENCE
  evidence: {
    findMany(findingId: string) {
      return loadDatabase().evidence.filter(e => e.finding_id === findingId);
    },
    create(data: Omit<Evidence, 'id' | 'created_at'>) {
      return db.transaction(store => {
        // Verify finding exists
        const finding = store.findings.find(f => f.id === data.finding_id);
        if (!finding || finding.deleted_at !== null) {
          throw new Error('Finding does not exist or has been deleted.');
        }

        const newEv: Evidence = {
          id: 'ev_' + crypto.randomBytes(8).toString('hex'),
          finding_id: data.finding_id,
          type: data.type,
          value: data.value,
          notes: data.notes,
          metadata: data.metadata || {},
          created_at: new Date().toISOString()
        };
        store.evidence.push(newEv);
        return newEv;
      });
    },
    delete(id: string) {
      return db.transaction(store => {
        const ev = store.evidence.find(e => e.id === id);
        store.evidence = store.evidence.filter(e => e.id !== id);
        return ev;
      });
    }
  },

  // NOTES
  notes: {
    findMany(projectId: string) {
      return loadDatabase().notes.filter(n => n.project_id === projectId);
    },
    create(projectId: string, content: string, createdByEmail: string) {
      return db.transaction(store => {
        const newNote: Note = {
          id: 'note_' + crypto.randomBytes(8).toString('hex'),
          project_id: projectId,
          content,
          created_by_email: createdByEmail,
          created_at: new Date().toISOString()
        };
        store.notes.push(newNote);
        return newNote;
      });
    },
    delete(id: string) {
      return db.transaction(store => {
        store.notes = store.notes.filter(n => n.id !== id);
      });
    }
  },

  // REPORTS
  reports: {
    findMany(projectId: string) {
      return loadDatabase().reports.filter(r => r.project_id === projectId);
    },
    findById(id: string) {
      return loadDatabase().reports.find(r => r.id === id);
    },
    create(data: Omit<Report, 'id' | 'created_at' | 'updated_at'>) {
      return db.transaction(store => {
        const newRep: Report = {
          id: 'rep_' + crypto.randomBytes(8).toString('hex'),
          project_id: data.project_id,
          title: data.title,
          executive_summary: data.executive_summary,
          scope: data.scope,
          risk_summary: data.risk_summary,
          appendices: data.appendices,
          status: data.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        store.reports.push(newRep);
        return newRep;
      });
    },
    update(id: string, fields: Partial<Omit<Report, 'id' | 'project_id' | 'created_at' | 'updated_at'>>) {
      return db.transaction(store => {
        const rep = store.reports.find(r => r.id === id);
        if (rep) {
          if (fields.title !== undefined) rep.title = fields.title;
          if (fields.executive_summary !== undefined) rep.executive_summary = fields.executive_summary;
          if (fields.scope !== undefined) rep.scope = fields.scope;
          if (fields.risk_summary !== undefined) rep.risk_summary = fields.risk_summary;
          if (fields.appendices !== undefined) rep.appendices = fields.appendices;
          if (fields.status !== undefined) rep.status = fields.status;
          rep.updated_at = new Date().toISOString();
        }
        return rep;
      });
    },
    delete(id: string) {
      return db.transaction(store => {
        const rep = store.reports.find(r => r.id === id);
        store.reports = store.reports.filter(r => r.id !== id);
        return rep;
      });
    }
  },

  // INTEGRATIONS
  integrations: {
    findMany(orgId: string) {
      return loadDatabase().integrations.filter(i => i.organization_id === orgId);
    },
    create(orgId: string, type: string, config: Record<string, any>) {
      return db.transaction(store => {
        const newInt: Integration = {
          id: 'int_' + crypto.randomBytes(8).toString('hex'),
          organization_id: orgId,
          type,
          config,
          created_at: new Date().toISOString()
        };
        store.integrations.push(newInt);
        return newInt;
      });
    },
    delete(id: string) {
      return db.transaction(store => {
        store.integrations = store.integrations.filter(i => i.id !== id);
      });
    }
  },

  // AUDIT LOGS
  auditLogs: {
    findMany(orgId: string) {
      return loadDatabase().audit_logs.filter(l => l.organization_id === orgId);
    },
    create(orgId: string, userId: string, userEmail: string, action: string, details: string, ipAddress: string) {
      return db.transaction(store => {
        const newLog: AuditLog = {
          id: 'audit_' + crypto.randomBytes(8).toString('hex'),
          organization_id: orgId,
          user_id: userId,
          user_email: userEmail,
          action,
          details,
          ip_address: ipAddress || '127.0.0.1',
          created_at: new Date().toISOString()
        };
        store.audit_logs.push(newLog);
        return newLog;
      });
    }
  },

  // INVITATIONS
  invitations: {
    findMany(orgId: string) {
      return loadDatabase().invitations.filter(i => i.organization_id === orgId);
    },
    create(orgId: string, email: string, role: string) {
      return db.transaction(store => {
        const cleanEmail = email.trim().toLowerCase();
        const token = crypto.randomBytes(24).toString('hex');
        const newInv: Invitation = {
          id: 'inv_' + crypto.randomBytes(8).toString('hex'),
          organization_id: orgId,
          email: cleanEmail,
          role,
          token,
          status: 'pending',
          created_at: new Date().toISOString()
        };
        store.invitations.push(newInv);
        return newInv;
      });
    },
    findByToken(token: string) {
      return loadDatabase().invitations.find(i => i.token === token);
    },
    updateStatus(id: string, status: 'accepted' | 'expired') {
      return db.transaction(store => {
        const inv = store.invitations.find(i => i.id === id);
        if (inv) inv.status = status;
        return inv;
      });
    }
  },

  // NOTIFICATIONS
  notifications: {
    findMany(userId: string) {
      return loadDatabase().user_notifications.filter(n => n.user_id === userId);
    },
    create(userId: string, title: string, message: string) {
      return db.transaction(store => {
        const newNot: UserNotification = {
          id: 'not_' + crypto.randomBytes(8).toString('hex'),
          user_id: userId,
          title,
          message,
          is_read: false,
          created_at: new Date().toISOString()
        };
        store.user_notifications.push(newNot);
        return newNot;
      });
    },
    markAsRead(id: string) {
      return db.transaction(store => {
        const not = store.user_notifications.find(n => n.id === id);
        if (not) not.is_read = true;
        return not;
      });
    },
    markAllAsRead(userId: string) {
      return db.transaction(store => {
        store.user_notifications.forEach(n => {
          if (n.user_id === userId) n.is_read = true;
        });
      });
    }
  },

  // API TOKENS
  apiTokens: {
    findMany(userId: string) {
      return loadDatabase().api_tokens.filter(t => t.user_id === userId);
    },
    create(userId: string, name: string) {
      return db.transaction(store => {
        const token = 'karrents_live_' + crypto.randomBytes(32).toString('hex');
        const hash = crypto.createHash('sha256').update(token).digest('hex');
        const newToken: ApiToken = {
          id: 'tok_' + crypto.randomBytes(8).toString('hex'),
          user_id: userId,
          token_name: name,
          token_hash: hash,
          last_used: null,
          created_at: new Date().toISOString()
        };
        store.api_tokens.push(newToken);
        return { token, record: newToken };
      });
    },
    verify(token: string) {
      const hash = crypto.createHash('sha256').update(token).digest('hex');
      const record = loadDatabase().api_tokens.find(t => t.token_hash === hash);
      if (!record) return undefined;

      // Update last used
      db.transaction(store => {
        const t = store.api_tokens.find(tok => tok.id === record.id);
        if (t) t.last_used = new Date().toISOString();
      });

      return record;
    },
    delete(id: string) {
      return db.transaction(store => {
        store.api_tokens = store.api_tokens.filter(t => t.id !== id);
      });
    }
  }
};
