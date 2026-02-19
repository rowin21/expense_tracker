import { Router } from 'express';
import { getProfile, updateProfile } from '../controller/user.controller';
import { userAuthenticator } from '../middleware/authenticator';
import { exitPoint } from '../middleware/exitPoint';
import { validate } from '../middleware/validate';
import { updateUserSchema } from '../schemas/user.schema';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User Management
 */

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get user profile details
 *     tags: [User]
 *     security:
 *       - userBearerAuth: []
 *     responses:
 *       200:
 *         description: User profile fetched successfully
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
 *                   example: "User profile fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     mobileNumber:
 *                       type: string
 *                     joinedAt:
 *                       type: string
 *                       format: date-time
 *                     groupsJoined:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

router.get('/profile', userAuthenticator, getProfile, exitPoint);
router.post(
  '/profile',
  userAuthenticator,
  validate(updateUserSchema),
  updateProfile,
  exitPoint,
);

export default router;
