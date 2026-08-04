export type AssetType =
  | 'Website'
  | 'Domain'
  | 'Subdomain'
  | 'Application'
  | 'API'
  | 'Repository'
  | 'Server'
  | 'Host'
  | 'Container'
  | 'Virtual Machine'
  | 'Cloud Resource'
  | 'Email Domain'
  | 'Public IP'
  | 'Internal IP';

export interface Asset {
  id: string;
  project_id?: string;
  name: string;
  type: AssetType;
  riskScore?: number;
  risk_score?: number;
  severity?: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
  owner: string;
  tags: string[];
  notes?: string;
  status?: 'active' | 'under-review' | 'decommissioned' | 'archived';
  locked?: boolean;
  createdAt?: string;
  created_at?: string;
  updated_at?: string;
  lastModified?: string;
  last_modified?: string;
}
