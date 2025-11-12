import { Router } from 'express';
import { healthController } from '../controllers/health.controller.js';

const router = Router();

/**
 * @route GET /health
 * @description Comprehensive health check
 */
router.get('/health', (req, res) => healthController.checkHealth(req, res));

/**
 * @route GET /health/live
 * @description Kubernetes liveness probe
 */
router.get('/health/live', (req, res) => healthController.liveness(req, res));

/**
 * @route GET /health/ready
 * @description Kubernetes readiness probe
 */
router.get('/health/ready', (req, res) => healthController.readiness(req, res));

export default router;
