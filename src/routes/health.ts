import { Router } from 'express';
import pino from 'pino';

const router = Router();
const logger = pino();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health Check
 *     description: Returns the status of the API
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 */
router.get('/', (req, res) => {
  logger.info('Health check requested');
  res.status(200).json({ status: 'OK' });
});

export default router;
