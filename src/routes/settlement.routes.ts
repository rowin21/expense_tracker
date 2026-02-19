import { Router } from 'express';
import {
  initiateSettlement,
  cancelSettlement,
  getGroupSettlements,
  updateSettlementStatus,
} from '../controller/settlement.controller';
import { userAuthenticator } from '../middleware/authenticator';
import { validate } from '../middleware/validate';
import {
  initiateSettlementSchema,
  updateSettlementStatusSchema,
} from '../schemas/settlement.schema';
import { exitPoint } from '../middleware/exitPoint';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Settlements
 *   description: Settlement management endpoints
 */

/**
 * @swagger
 * /settlements/{settlementId}/initiate:
 *   post:
 *     summary: Initiate a settlement (Payer adds payment details)
 *     tags: [Settlements]
 *     security:
 *       - userBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: settlementId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the settlement
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentMethod
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, upi, Net, other]
 *               referenceId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Settlement initiated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Settlement not found
 *       500:
 *         description: Server error
 */
router.post(
  '/:settlementId/initiate',
  userAuthenticator,
  validate(initiateSettlementSchema),
  initiateSettlement,
  exitPoint,
);

/**
 * @swagger
 * /settlements/{settlementId}/cancel:
 *   post:
 *     summary: Cancel an initiated settlement (only initiator can do this)
 *     tags: [Settlements]
 *     security:
 *       - userBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: settlementId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the settlement to cancel
 *     responses:
 *       200:
 *         description: Settlement cancelled successfully
 *       400:
 *         description: Cannot cancel (wrong status)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not the initiator)
 *       404:
 *         description: Settlement not found
 *       500:
 *         description: Server error
 */
router.post(
  '/:settlementId/cancel',
  userAuthenticator,
  cancelSettlement,
  exitPoint,
);

/**
 * @swagger
 * /settlements/groups/{groupId}:
 *   get:
 *     summary: Get all settlements for a group
 *     tags: [Settlements]
 *     security:
 *       - userBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the group
 *     responses:
 *       200:
 *         description: Settlements fetched successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Group not found
 *       500:
 *         description: Server error
 */
router.get(
  '/groups/:groupId',
  userAuthenticator,
  getGroupSettlements,
  exitPoint,
);

/**
 * @swagger
 * /settlements/{settlementId}:
 *   patch:
 *     summary: Update settlement status (Settled/Rejected) - Only receiver can do this
 *     tags: [Settlements]
 *     security:
 *       - userBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: settlementId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the settlement
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [settled, rejected]
 *     responses:
 *       200:
 *         description: Settlement status updated successfully
 *       403:
 *         description: Forbidden (Not the receiver)
 *       404:
 *         description: Settlement not found
 *       500:
 *         description: Server error
 */
router.patch(
  '/:settlementId',
  userAuthenticator,
  validate(updateSettlementStatusSchema),
  updateSettlementStatus,
  exitPoint,
);

export default router;
