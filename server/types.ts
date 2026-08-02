import { User, Organization } from './db.js';

export type UserRole = 'Super Admin' | 'Organization Admin' | 'Security Analyst' | 'Researcher' | 'Viewer';

export interface AuthContext {
  user: User | null;
  session_id: string | null;
}

export type Permission =
  | 'users.view'
  | 'users.create'
  | 'users.manage'
  | 'projects.manage'
  | 'assets.manage'
  | 'reports.generate'
  | 'settings.update'
  | 'audit.view';

export interface DecodedSession {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
}
