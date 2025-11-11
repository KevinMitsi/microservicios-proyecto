import { Router } from 'express';
import { gatewayController } from '../controllers/gateway.controller.js';

const router = Router();

/**
 * @route GET /
 * @description Gateway info
 */
router.get('/', (req, res) => gatewayController.getInfo(req, res));

export default router;
