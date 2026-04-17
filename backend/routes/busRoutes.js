import express from 'express';
import { getBusDetails, searchBuses, createBus, listBuses, updateBusData, removeBus } from '../controllers/busController.js';

const router = express.Router();

router.get('/search/route', searchBuses);
router.get('/', listBuses);
router.get('/:code', getBusDetails);
router.post('/create', createBus);
router.put('/edit/:code', updateBusData);
router.delete('/delete/:code', removeBus);

export default router;
