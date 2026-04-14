import express from 'express';
import { listRoutes, createRoute } from '../controllers/routeController.js';

const router = express.Router();

router.get('/', listRoutes);
router.post('/create', createRoute);

export default router;
