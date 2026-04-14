import express from 'express';
import { getBusDetails, searchBuses, createBus, listBuses } from '../controllers/busController.js';

const router = express.Router();

router.get('/search/route', searchBuses);
router.get('/', listBuses);
router.get('/:code', getBusDetails);
router.post('/create', createBus);

export default router;
