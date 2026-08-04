import { Router } from 'express';
import { clientController } from '../controllers/client.controller';

const router = Router();

router.get('/', (req, res) => clientController.listClients(req, res));
router.get('/:id', (req, res) => clientController.getClient(req, res));
router.post('/', (req, res) => clientController.createClient(req, res));
router.put('/:id', (req, res) => clientController.updateClient(req, res));
router.delete('/:id', (req, res) => clientController.deleteClient(req, res));

export default router;
