import express from 'express';
import { applyPass, fetchUserPass, fetchDepotPasses, approvePass, payPass, renewPass, previewPrice, deletePassRecord, fetchApprovedDepotPasses, fetchPassRevenue } from '../controllers/passController.js';

const router = express.Router();

router.get('/price', previewPrice);
router.get('/revenue', fetchPassRevenue);
router.post('/apply', applyPass);
router.post('/approve', approvePass);
router.post('/pay', payPass);
router.post('/renew', renewPass);
router.get('/user/:userId', fetchUserPass);
router.get('/depot/:depotId', fetchDepotPasses);
router.get('/depot/:depotId/approved', fetchApprovedDepotPasses);
router.delete('/:pass_id', deletePassRecord);

export default router;
