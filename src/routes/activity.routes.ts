import { Router } from 'express';
import {
  getUserActivity,
  getSettlementActivity,
} from '../controller/activity.controller';
import { userAuthenticator } from '../middleware/authenticator';
import { exitPoint } from '../middleware/exitPoint';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Activity
 *   description: User activity related endpoints
 */

/**
 * @swagger
 * /activity/user:
 *   get:
 *     summary: Get user expense activity across all groups
 *     tags: [Activity]
 *     security:
 *       - userBearerAuth: []
 *     responses:
 *       200:
 *         description: User activity fetched successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/user', userAuthenticator, getUserActivity, exitPoint);

/**
 * @swagger
 * /activity/settlements:
 *   get:
 *     summary: Get user settlement activity (awaiting confirmation)
 *     tags: [Activity]
 *     security:
 *       - userBearerAuth: []
 *     responses:
 *       200:
 *         description: Settlement activity fetched successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/settlements', userAuthenticator, getSettlementActivity, exitPoint);

export default router;
