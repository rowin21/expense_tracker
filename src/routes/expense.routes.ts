import { Router } from 'express';
import {
  addExpense,
  getGroupExpenseOverview,
  getExpenseInfo,
} from '../controller/expense.controller';
import { userAuthenticator } from '../middleware/authenticator';
import { validate } from '../middleware/validate';
import { addExpenseSchema } from '../schemas/expense.schema';
import { exitPoint } from '../middleware/exitPoint';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Expenses
 *   description: Expense management endpoints
 */

/**
 * @swagger
 * /expenses/groups/{groupId}/expenses:
 *   post:
 *     summary: Add an expense to a group
 *     tags: [Expenses]
 *     security:
 *       - userBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the group where the expense occurred
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - paidBy
 *               - description
 *               - date
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Total amount paid (must be > 0)
 *                 example: 150.50
 *               paidBy:
 *                 type: string
 *                 description: ID of the user who paid
 *                 example: "65a1b2c3d4e5f6g7h8i9j0k2"
 *               description:
 *                 type: string
 *                 description: Description of the expense
 *                 example: "Team lunch at Pizza Place"
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Date of the expense (YYYY-MM-DD)
 *                 example: "2024-02-14"
 *     responses:
 *       200:
 *         description: Expense added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Expense added successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     expenseId:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     paidBy:
 *                       type: string
 *                     description:
 *                       type: string
 *                     perPersonShare:
 *                       type: number
 *                     splitAmong:
 *                       type: array
 *                       items:
 *                         type: string
 *                     date:
 *                       type: string
 *       400:
 *         description: Bad Request (Missing fields or invalid data)
 *       403:
 *         description: Forbidden (User not in group)
 *       404:
 *         description: Group not found
 *       500:
 *         description: Internal Server Error
 */
router.post(
  '/groups/:groupId/expenses',
  userAuthenticator,
  validate(addExpenseSchema),
  addExpense,
  exitPoint,
);

import { updateExpense, deleteExpense } from '../controller/expense.controller';
import { updateExpenseSchema } from '../schemas/expense.schema';

/**
 * @swagger
 * /expenses/{expenseId}:
 *   put:
 *     summary: Update an expense (Admin or Payer only)
 *     tags: [Expenses]
 *     security:
 *       - userBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: expenseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the expense to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: New amount
 *               description:
 *                 type: string
 *                 description: New description
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Expense updated successfully
 *       403:
 *         description: Forbidden (Not authorized)
 *       404:
 *         description: Expense or Group not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:expenseId',
  userAuthenticator,
  validate(updateExpenseSchema),
  updateExpense,
  exitPoint,
);

/**
 * @swagger
 * /expenses/{expenseId}:
 *   delete:
 *     summary: Delete (soft delete) an expense (Admin or Payer only)
 *     tags: [Expenses]
 *     security:
 *       - userBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: expenseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the expense to delete
 *     responses:
 *       200:
 *         description: Expense deleted successfully
 *       403:
 *         description: Forbidden (Not authorized)
 *       404:
 *         description: Expense or Group not found
 *       500:
 *         description: Server error
 */
router.delete('/:expenseId', userAuthenticator, deleteExpense, exitPoint);

import { getGroupExpenses } from '../controller/expense.controller';

/**
 * @swagger
 * /expenses/groups/{groupId}/expenses:
 *   get:
 *     summary: Get all expenses for a group
 *     tags: [Expenses]
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
 *         description: Expenses fetched successfully
 *       403:
 *         description: Forbidden (Not a member)
 *       404:
 *         description: Group not found
 *       500:
 *         description: Server error
 */
router.get(
  '/groups/:groupId/expenses',
  userAuthenticator,
  getGroupExpenses,
  exitPoint,
);

import { getExpenseDetails } from '../controller/expense.controller';

/**
 * @swagger
 * /expenses/{expenseId}/details:
 *   get:
 *     summary: Get detailed expense information (shares, owed/owns)
 *     tags: [Expenses]
 *     security:
 *       - userBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: expenseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the expense
 *     responses:
 *       200:
 *         description: Expense details fetched successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.get(
  '/:expenseId/details',
  userAuthenticator,
  getExpenseDetails,
  exitPoint,
);

/**
 * @swagger
 * /expenses/groups/{id}/overview:
 *   get:
 *     summary: Get expense overview for a group (net balances of all members)
 *     tags: [Expenses]
 *     security:
 *       - userBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group expense overview fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   userId:
 *                     type: string
 *                   name:
 *                     type: string
 *                   totalPaid:
 *                     type: number
 *                   totalOwed:
 *                     type: number
 *                   netSettled:
 *                     type: number
 *                   balance:
 *                     type: number
 *                     description: "+ve means they are owed money, -ve means they owe money"
 *                   isYou:
 *                     type: boolean
 *                     description: "True if this member is the logged-in user"
 *                   isPay:
 *                     type: boolean
 *                     description: "True if the member needs to pay (negative balance)"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a member
 *       404:
 *         description: Group not found
 *       500:
 *         description: Server error
 */
router.get(
  '/groups/:id/overview',
  userAuthenticator,
  getGroupExpenseOverview,
  exitPoint,
);

/**
 * @swagger
 * /expenses/groups/{id}/info:
 *   get:
 *     summary: Get summary info and personal balance for the logged-in user in a group
 *     tags: [Expenses]
 *     security:
 *       - userBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Expense info fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 groupName:
 *                   type: string
 *                 memberCount:
 *                   type: number
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 balance:
 *                   type: number
 *                 isPay:
 *                   type: boolean
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.get('/groups/:id/info', userAuthenticator, getExpenseInfo, exitPoint);

export default router;
