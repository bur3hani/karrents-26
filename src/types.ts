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
