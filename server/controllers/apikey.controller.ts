import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import crypto from 'crypto';

export interface ApiKeyRecord {
  id: string;
  userId: string;
  userEmail: string;
  name: string;
  keyHash: string;
  prefix: string;
  tier: string;
  status: 'active' | 'revoked';
  createdAt: string;
  lastUsedAt: string | null;
}

// In-memory persistent API key store (complemented by Firestore/DB sync if available)
const apiKeyStore = new Map<string, ApiKeyRecord>();

// Seed a default demo Pro API key for easy testing
const defaultKeyHash = crypto.createHash('sha256').update('krt_live_pro_demo_key_2026').digest('hex');
apiKeyStore.set('key_demo_001', {
  id: 'key_demo_001',
  userId: 'user_pro_default',
  userEmail: 'engr.buru@gmail.com',
  name: 'Production SOC Pipeline Key',
  keyHash: defaultKeyHash,
  prefix: 'krt_live_pro_demo...',
  tier: 'SOC Professional',
  status: 'active',
  createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  lastUsedAt: new Date().toISOString()
});

export class ApiKeyController {
  /**
   * Helper method to validate raw API Key string against store
   */
  public static validateRawKey(rawKey: string): ApiKeyRecord | null {
    if (!rawKey || !rawKey.startsWith('krt_')) return null;
    const hash = crypto.createHash('sha256').update(rawKey).digest('hex');
    for (const record of apiKeyStore.values()) {
      if (record.status === 'active' && record.keyHash === hash) {
        record.lastUsedAt = new Date().toISOString();
        return record;
      }
    }
    return null;
  }

  /**
   * Generate a new Pro API Key
   */
  async createKey(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, tier } = req.body;
      const keyName = (name || 'Pro Security Key').trim();
      const userEmail = req.user?.email || 'engr.buru@gmail.com';
      const userId = req.user?.id || 'user_pro_default';
      const userTier = tier || (req.user as any)?.plan || 'SOC Professional';

      // Generate secret key token: krt_live_<32 random hex characters>
      const randomSecret = crypto.randomBytes(16).toString('hex');
      const rawKey = `krt_live_${randomSecret}`;
      const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
      const keyId = `key_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const prefix = `${rawKey.substring(0, 12)}...`;

      const record: ApiKeyRecord = {
        id: keyId,
        userId,
        userEmail,
        name: keyName,
        keyHash,
        prefix,
        tier: userTier,
        status: 'active',
        createdAt: new Date().toISOString(),
        lastUsedAt: null
      };

      apiKeyStore.set(keyId, record);

      return res.status(201).json({
        success: true,
        message: 'API Key generated successfully. Please copy it now as it will not be displayed again in plain text.',
        apiKey: {
          id: keyId,
          name: keyName,
          rawKey, // Returned plain text ONCE
          prefix,
          tier: userTier,
          createdAt: record.createdAt,
          rateLimit: '120 requests / minute'
        }
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to generate API Key.' });
    }
  }

  /**
   * List API Keys for authenticated user
   */
  async listKeys(req: AuthenticatedRequest, res: Response) {
    try {
      const userEmail = req.user?.email || 'engr.buru@gmail.com';
      const userKeys: Omit<ApiKeyRecord, 'keyHash'>[] = [];

      for (const record of apiKeyStore.values()) {
        if (record.userEmail === userEmail || record.userId === req.user?.id) {
          const { keyHash, ...safeRecord } = record;
          userKeys.push(safeRecord);
        }
      }

      return res.json({
        success: true,
        count: userKeys.length,
        keys: userKeys
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to retrieve API Keys.' });
    }
  }

  /**
   * Revoke an existing API Key
   */
  async revokeKey(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      if (!id || !apiKeyStore.has(id)) {
        return res.status(404).json({ error: 'API Key not found or already revoked.' });
      }

      const record = apiKeyStore.get(id)!;
      record.status = 'revoked';

      return res.json({
        success: true,
        message: `API Key '${record.name}' (${record.prefix}) has been revoked.`,
        revokedId: id
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to revoke API Key.' });
    }
  }
}

export const apiKeyController = new ApiKeyController();
