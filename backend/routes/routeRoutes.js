import express from 'express';
import { listRoutes, createRoute, updateRouteData, removeRoute } from '../controllers/routeController.js';

const router = express.Router();

router.get('/', listRoutes);
router.post('/create', createRoute);
router.put('/edit/:id', updateRouteData);
router.delete('/delete/:id', removeRoute);

export default router;
