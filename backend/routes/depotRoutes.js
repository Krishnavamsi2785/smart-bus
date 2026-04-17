import express from 'express';
import { listDepots, createDepot } from '../controllers/depotController.js';

const router = express.Router();

router.get('/', listDepots);
router.post('/create', createDepot);

export default router;
