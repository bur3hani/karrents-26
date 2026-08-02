-- ============================================================================
-- KARRENTS CYBER SECURITY WORKBENCH - NORMALIZED PostgreSQL DATABASE SCHEMA
-- ============================================================================

-- Enable UUID extension for cryptographically secure, un-enumerable keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Automated Updated At Audit Trigger Function
CREATE OR REPLACE FUNCTION trigger_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. ORGANIZATIONS
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TRIGGER update_organizations_timestamp
BEFORE UPDATE ON organizations
FOR EACH ROW EXECUTE FUNCTION trigger_update_timestamp();

-- 2. USERS
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  salt VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) CHECK (role IN ('Super Admin', 'Organization Admin', 'Security Analyst', 'Researcher', 'Viewer')) DEFAULT 'Viewer' NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status VARCHAR(20) CHECK (status IN ('active', 'suspended', 'pending')) DEFAULT 'active' NOT NULL,
  mfa_enabled BOOLEAN DEFAULT FALSE NOT NULL,
  mfa_secret VARCHAR(128) NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_org ON users(organization_id);

CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION trigger_update_timestamp();

-- 3. SESSIONS
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user ON sessions(user_id);

-- 4. PROJECTS
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) CHECK (status IN ('planning', 'active', 'completed', 'archived')) DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE INDEX idx_projects_org ON projects(organization_id);
CREATE INDEX idx_projects_deleted ON projects(deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER update_projects_timestamp
BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION trigger_update_timestamp();

-- 5. ASSETS
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type VARCHAR(50) CHECK (type IN ('Domain', 'Subdomain', 'Website', 'Public IP', 'Internal IP', 'Host', 'Server', 'Application', 'Repository', 'Cloud Resource', 'Email Domain')) NOT NULL,
  name VARCHAR(255) NOT NULL,
  tags VARCHAR(50)[] DEFAULT '{}'::VARCHAR(50)[] NOT NULL,
  notes TEXT NOT NULL,
  risk_score INT CHECK (risk_score >= 0 AND risk_score <= 100) DEFAULT 0 NOT NULL,
  status VARCHAR(20) CHECK (status IN ('active', 'under-review', 'decommissioned')) DEFAULT 'active' NOT NULL,
  owner VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE INDEX idx_assets_project ON assets(project_id);
CREATE INDEX idx_assets_deleted ON assets(deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER update_assets_timestamp
BEFORE UPDATE ON assets
FOR EACH ROW EXECUTE FUNCTION trigger_update_timestamp();

-- 6. FINDINGS
CREATE TABLE findings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  severity VARCHAR(15) CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')) NOT NULL,
  cvss_score NUMERIC(3,1) CHECK (cvss_score >= 0.0 AND cvss_score <= 10.0) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('draft', 'open', 'remediated', 'risk-accepted', 'false-positive')) DEFAULT 'draft' NOT NULL,
  recommendations TEXT NOT NULL,
  references TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  owner VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE INDEX idx_findings_project ON findings(project_id);
CREATE INDEX idx_findings_deleted ON findings(deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER update_findings_timestamp
BEFORE UPDATE ON findings
FOR EACH ROW EXECUTE FUNCTION trigger_update_timestamp();

-- 7. FINDING-ASSET MANY-TO-MANY RELATIONSHIP
CREATE TABLE finding_assets (
  finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  PRIMARY KEY (finding_id, asset_id)
);

CREATE INDEX idx_finding_assets_asset ON finding_assets(asset_id);

-- 8. EVIDENCE
CREATE TABLE evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
  type VARCHAR(30) CHECK (type IN ('Screenshot', 'File', 'URL', 'Note', 'Command Output', 'Log', 'Hash', 'Metadata')) NOT NULL,
  value TEXT NOT NULL,
  notes TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_evidence_finding ON evidence(finding_id);

-- 9. AUDIT LOGS
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
