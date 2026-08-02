import { db, User, Session, ApiToken } from '../db.js';

export class UserRepository {
  async findById(id: string): Promise<User | undefined> {
    return db.users.findById(id);
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return db.users.findByEmail(email);
  }

  async findMany(orgId?: string): Promise<User[]> {
    return db.users.findMany(orgId);
  }

  async create(data: Omit<User, 'id' | 'created_at' | 'updated_at' | 'password_hash' | 'salt'> & { passwordPlain: string }): Promise<User> {
    return db.users.create(data);
  }

  async update(id: string, fields: Partial<Pick<User, 'name' | 'role' | 'status' | 'mfa_enabled' | 'mfa_secret' | 'email'>>): Promise<User | undefined> {
    return db.users.update(id, fields);
  }

  async changePassword(id: string, passwordPlain: string): Promise<User | undefined> {
    return db.users.changePassword(id, passwordPlain);
  }

  async delete(id: string): Promise<boolean> {
    return db.users.delete(id);
  }

  // --- Sessions operations ---
  async createSession(userId: string, ipAddress: string, userAgent: string): Promise<Session> {
    return db.sessions.create(userId, ipAddress, userAgent);
  }

  async findSessionByToken(token: string): Promise<Session | undefined> {
    return db.sessions.findByToken(token);
  }

  async findActiveSessionsByUserId(userId: string): Promise<Session[]> {
    return db.sessions.findActiveByUserId(userId);
  }

  async deleteSessionByToken(token: string): Promise<void> {
    db.sessions.deleteByToken(token);
  }

  async deleteSessionById(id: string): Promise<void> {
    db.sessions.deleteById(id);
  }

  // --- API Tokens operations ---
  async findApiTokens(userId: string): Promise<ApiToken[]> {
    return db.apiTokens.findMany(userId);
  }

  async createApiToken(userId: string, name: string): Promise<{ token: string; record: ApiToken }> {
    return db.apiTokens.create(userId, name);
  }

  async deleteApiToken(id: string): Promise<void> {
    db.apiTokens.delete(id);
  }
}

export const userRepository = new UserRepository();
