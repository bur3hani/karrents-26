import { Request, Response } from 'express';
import { clientService } from '../services/client.service';

export class ClientController {
  async listClients(req: Request, res: Response): Promise<void> {
    try {
      const orgId = (req as any).user?.organization_id || 'org-default-01';
      const clients = await clientService.getClientsByOrg(orgId);
      res.json(clients);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to list clients' });
    }
  }

  async getClient(req: Request, res: Response): Promise<void> {
    try {
      const client = await clientService.getClientById(req.params.id);
      if (!client) {
        res.status(404).json({ error: 'Client organization not found' });
        return;
      }
      res.json(client);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch client' });
    }
  }

  async createClient(req: Request, res: Response): Promise<void> {
    try {
      const orgId = (req as any).user?.organization_id || 'org-default-01';
      const { name, industry, contact_email, contact_phone, notes } = req.body;

      const created = await clientService.createClient({
        organization_id: orgId,
        name,
        industry,
        contact_email,
        contact_phone,
        notes
      });

      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to create client' });
    }
  }

  async updateClient(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, industry, contact_email, contact_phone, notes } = req.body;
      const updated = await clientService.updateClient(id, {
        name,
        industry,
        contact_email,
        contact_phone,
        notes
      });
      if (!updated) {
        res.status(404).json({ error: 'Client organization not found' });
        return;
      }
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to update client' });
    }
  }

  async deleteClient(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await clientService.deleteClient(id);
      res.json({ message: 'Client deleted successfully' });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to delete client' });
    }
  }
}

export const clientController = new ClientController();
