export interface CVEData {
  id: string;
  title: string;
  description: string;
  publishedDate: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  cvssScore: number;
  cvssVector: string;
  exploitStatus: string;
  businessImpact: string;
  technicalImpact: string;
  remediation: {
    mitigation: string;
    patchInfo: string;
    configurations: { platform: string; config: string }[];
  };
  mitreAttackMappings: { tactic: string; technique: string; id: string }[];
  nistReferences: string[];
  owaspMapping: string;
  references: { title: string; url: string }[];
}

export interface IOCData {
  indicator: string;
  type: 'IP' | 'DOMAIN' | 'HASH' | 'EMAIL' | 'UNKNOWN';
  maliciousScore: number;
  verdict: 'MALICIOUS' | 'SUSPICIOUS' | 'CLEAN' | 'UNKNOWN';
  threatActor: string;
  campaignName: string;
  malwareFamilies: string[];
  detailedAnalysis: string;
  confidenceScore: number;
  remediation: string;
  intelReferences: { title: string; url: string }[];
}

export interface DNSData {
  domain: string;
  recordType: string;
  records: any[];
  analysis: string;
}

export interface EmailSecurityData {
  domain: string;
  spf: {
    record: string;
    status: 'VALID' | 'INVALID' | 'MISSING' | 'WARNING';
    explanation: string;
    risks: string[];
    bestPracticeFix: string;
  };
  dmarc: {
    record: string;
    status: 'VALID' | 'INVALID' | 'MISSING' | 'WARNING';
    policy: string;
    explanation: string;
    risks: string[];
    bestPracticeFix: string;
  };
  dkimGuide: {
    selector: string;
    explanation: string;
    examplePublicKeyRecord: string;
  };
  overallRisk: 'HIGH' | 'MEDIUM' | 'LOW';
  remediationSteps: string[];
  businessImpact: string;
}

export interface HeaderData {
  url: string;
  domain: string;
  grade: string;
  score: number;
  headers: {
    name: string;
    present: boolean;
    value: string | null;
    description: string;
    severity: string;
  }[];
  aiReport: {
    executiveSummary: string;
    riskAnalysis: string;
    remediationConfigs: {
      nginx: string;
      apache: string;
      caddy: string;
      cloudflare: string;
    };
  };
}

export interface SSLData {
  domain: string;
  cert: {
    subject: string;
    issuer: string;
    validFrom: string;
    validTo: string;
    daysRemaining: number;
    cipherSuite: string;
    protocol: string;
    serialNumber: string;
    fingerprint: string;
    isValid: boolean;
  };
  aiEvaluation: string;
}

export interface AdvisoryData {
  answer: string;
  suggestedTools: string[];
  mitreTechniques: string[];
  relatedConcepts: string[];
}

export interface Organization {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'Super Admin' | 'Organization Admin' | 'Security Analyst' | 'Researcher' | 'Viewer';
  organization_id: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Project {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  project_id: string;
  name: string;
  type: 'Domain' | 'IP Address' | 'Subnet' | 'Server' | 'Cloud Container' | 'Web Application' | 'API Endpoint' | 'Database';
  tags: string[];
  notes: string;
  risk_score: number;
  status: 'active' | 'archived' | 'decommissioned';
  owner: string;
  created_at: string;
  updated_at: string;
}

export interface Finding {
  id: string;
  project_id: string;
  title: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
  cvss_score: number;
  status: 'draft' | 'under_review' | 'confirmed' | 'remediated' | 'false_positive';
  recommendations: string;
  references: string[];
  owner: string;
  created_at: string;
  updated_at: string;
  affectedAssets?: { id: string; name: string; type: string }[];
}

export interface Evidence {
  id: string;
  finding_id: string;
  type: 'terminal_log' | 'dns_record' | 'http_header' | 'ssl_cert' | 'screenshot_url' | 'cve_intel' | 'raw_payload' | 'other';
  value: string;
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
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
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

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface ApiToken {
  id: string;
  token_name: string;
  last_used: string | null;
  created_at: string;
}

