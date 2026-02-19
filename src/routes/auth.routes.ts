import { Router } from 'express';
import {
  sendOTP,
  verifyOTP,
  refreshAccessToken,
  logout,
} from '../controller/auth.controller';
import { userAuthenticator } from '../middleware/authenticator';
import { validate } from '../middleware/validate';
import {
  sendOtpSchema,
  verifyOtpSchema,
  refreshTokenSchema,
} from '../schemas/auth.schema';
import { exitPoint } from '../middleware/exitPoint';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints for OTP-based login
 */

/**
 * @swagger
 * /auth/send-otp:
 *   post:
 *     summary: Send an OTP to the user's phone via WhatsApp
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - countryCode
 *               - phone
 *             properties:
 *               countryCode:
 *                 type: string
 *                 example: "91"
 *                 description: Country code without the + symbol
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *                 description: Phone number without country code
 *     responses:
 *       200:
 *         description: OTP sent successfully
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
 *                   example: "OTP sent successfully"
 *                 messageID:
 *                   type: string
 *                   example: "wamid.xxx"
 *       400:
 *         description: Bad request - validation error or rate limit
 *       500:
 *         description: Internal server error
 */

router.post('/send-otp', validate(sendOtpSchema), sendOTP, exitPoint);

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Verify OTP and login/register user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - countryCode
 *               - phone
 *               - otp
 *             properties:
 *               countryCode:
 *                 type: string
 *                 example: "91"
 *                 description: Country code without the + symbol
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *                 description: Phone number without country code
 *               otp:
 *                 type: string
 *                 example: "123456"
 *                 description: 6-digit OTP received via WhatsApp
 *     responses:
 *       200:
 *         description: OTP verified successfully, user logged in
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
 *                   example: "Login successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         countryCode:
 *                           type: string
 *                         profileCompleted:
 *                           type: boolean
 *                     isNewUser:
 *                       type: boolean
 *       400:
 *         description: Invalid OTP or OTP expired
 *       500:
 *         description: Internal server error
 */
router.post('/verify-otp', validate(verifyOtpSchema), verifyOTP, exitPoint);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token received during login
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Invalid or expired refresh token
 *       500:
 *         description: Server error
 */
router.post(
  '/refresh-token',
  validate(refreshTokenSchema),
  refreshAccessToken,
  exitPoint,
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user by invalidating the access token
 *     tags: [Auth]
 *     security:
 *       - userBearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       400:
 *         description: No token provided
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/logout', userAuthenticator, logout, exitPoint);

export default router;
