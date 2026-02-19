import { Router } from 'express';
import {
  addMembersToGroup,
  createGroup,
  getAllGroups,
  getGroupMembers,
  deleteGroup,
  removeMembersFromGroup,
  updateGroup,
} from '../controller/group.controller';
import { userAuthenticator } from '../middleware/authenticator';
import { validate } from '../middleware/validate';
import {
  addMembersSchema,
  createGroupSchema,
  deleteGroupSchema,
  getAllGroupsSchema,
  removeMembersSchema,
  updateGroupSchema,
} from '../schemas/group.schema';
import { exitPoint } from '../middleware/exitPoint';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Groups
 *   description: Group management endpoints
 */

/**
 * @swagger
 * /groups:
 *   post:
 *     summary: Create a new expense group
 *     tags: [Groups]
 *     security:
 *       - userBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groupName
 *             properties:
 *               groupName:
 *                 type: string

 *               members:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - phone
 *                   properties:
 *                     name:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     countryCode:
 *                       type: string
 *                       default: "91"
 *     responses:
 *       200:
 *         description: Group created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  userAuthenticator,
  validate(createGroupSchema),
  createGroup,
  exitPoint,
);

/**
 * @swagger
 * /groups/{id}:
 *   put:
 *     summary: Update an existing expense group (rename)
 *     tags: [Groups]
 *     security:
 *       - userBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               groupName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Group updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a member
 *       404:
 *         description: Group not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:id',
  userAuthenticator,
  validate(updateGroupSchema),
  updateGroup,
  exitPoint,
);

/**
 * @swagger
 * /groups/{id}/members:
 *   post:
 *     summary: Add members to an existing group
 *     tags: [Groups]
 *     security:
 *       - userBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - members
 *             properties:
 *               members:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - phone
 *                   properties:
 *                     name:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     countryCode:
 *                       type: string
 *                       default: "91"
 *     responses:
 *       200:
 *         description: Members added successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a member
 *       404:
 *         description: Group not found
 *       500:
 *         description: Server error
 */
router.post(
  '/:id/members',
  userAuthenticator,
  validate(addMembersSchema),
  addMembersToGroup,
  exitPoint,
);

/**
 * @swagger
 * /groups/{id}/members/remove:
 *   post:
 *     summary: Remove members from an existing group
 *     tags: [Groups]
 *     security:
 *       - userBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - memberIds
 *             properties:
 *               memberIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of User IDs to remove
 *     responses:
 *       200:
 *         description: Members removed successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a member
 *       404:
 *         description: Group not found
 *       500:
 *         description: Server error
 */
router.post(
  '/:id/members/remove',
  userAuthenticator,
  validate(removeMembersSchema),
  removeMembersFromGroup,
  exitPoint,
);

/**
 * @swagger
 * /groups/{id}/members:
 *   get:
 *     summary: Get all members of a group
 *     tags: [Groups]
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
 *         description: Group members fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a member
 *       404:
 *         description: Group not found
 *       500:
 *         description: Server error
 */
router.get('/:id/members', userAuthenticator, getGroupMembers, exitPoint);

/**
 * @swagger
 * /groups/list:
 *   post:
 *     summary: Get all groups (User's groups) with search, pagination, and sorting
 *     tags: [Groups]
 *     security:
 *       - userBearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               options:
 *                 type: object
 *                 properties:
 *                   page:
 *                     type: number
 *                     default: 1
 *                   itemsPerPage:
 *                     type: number
 *                     default: 10
 *                   sortBy:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["createdAt"]
 *                   sortDesc:
 *                     type: array
 *                     items:
 *                       type: boolean
 *                     example: [true]
 *               search:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - term
 *                     - fields
 *                   properties:
 *                     term:
 *                       type: string
 *                     fields:
 *                       type: array
 *                       items:
 *                         type: string
 *                         example: "name"
 *                     startsWith:
 *                       type: boolean
 *                     endsWith:
 *                       type: boolean
 *               project:
 *                 type: object
 *                 description: 'Fields to include/exclude (e.g. { "name": 1, "_id": 1 })'
 *     responses:
 *       200:
 *         description: Groups fetched successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  '/list',
  userAuthenticator,
  validate(getAllGroupsSchema),
  getAllGroups,
  exitPoint,
);

/**
 * @swagger
 * /groups/{id}:
 *   delete:
 *     summary: Delete a group (by admin) or Leave a group (by member)
 *     tags: [Groups]
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
 *         description: Group deleted or left successfully
 *       400:
 *         description: Cannot leave due to unsettled expenses
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Group not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/:id',
  userAuthenticator,
  validate(deleteGroupSchema),
  deleteGroup,
  exitPoint,
);

export default router;
