import express from 'express';
import { createTicket, validateTicket, getUserTickets, getAdminStats, getRecentTickets } from '../controllers/ticketController.js';

const router = express.Router();

router.post('/create', createTicket);
router.get('/recent', getRecentTickets);
router.get('/stats', getAdminStats);
router.get('/user/:userId', getUserTickets);
router.get('/:uuid', validateTicket);

export default router;
