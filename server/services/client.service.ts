import { clientRepository, ClientRecord } from '../repositories/client.repository';

export class ClientService {
  async getClientsByOrg(orgId: string): Promise<ClientRecord[]> {
    return clientRepository.findAllByOrg(orgId);
  }

  async getClientById(id: string): Promise<ClientRecord | null> {
    return clientRepository.findById(id);
  }

  async createClient(data: {
    organization_id: string;
    name: string;
    industry?: string;
    contact_email?: string;
    contact_phone?: string;
    notes?: string;
  }): Promise<ClientRecord> {
    if (!data.name || !data.name.trim()) {
      throw new Error('Client name is required.');
    }
    return clientRepository.create(data);
  }
}

export const clientService = new ClientService();
