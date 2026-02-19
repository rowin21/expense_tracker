import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../db/models/user.model';
import { GroupModel } from '../db/models/group.model';
import { logger } from '../utils/logger';

// /**
//  * @swagger
//  * /users/profile:
//  *   get:
//  *     summary: Get user profile details
//  *     tags: [User]
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: User profile fetched successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: true
//  *                 message:
//  *                   type: string
//  *                   example: "User profile fetched successfully"
//  *                 data:
//  *                   type: object
//  *                   properties:
//  *                     name:
//  *                       type: string
//  *                     mobileNumber:
//  *                       type: string
//  *                     joinedAt:
//  *                       type: string
//  *                       format: date-time
//  *                     groupsJoined:
//  *                       type: array
//  *                       items:
//  *                         type: object
//  *                         properties:
//  *                           id:
//  *                             type: string
//  *                           name:
//  *                             type: string
//  *       404:
//  *         description: User not found
//  *       500:
//  *         description: Internal server error
//  */
export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // req.user is attached by userAuthenticator middleware
    // We can assume it exists if the middleware passed
    const userId = req.user?._id;

    if (!userId) {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 401,
        message: 'Unauthorized - User context missing',
      };
      return next();
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 404,
        message: 'User not found',
      };
      return next();
    }

    // Find groups where the user is a member
    const groups = await GroupModel.find({ members: userId });

    const groupList = groups.map((group) => ({
      id: group._id,
      name: group.groupName,
    }));

    req.apiStatus = {
      isSuccess: true,
      statusCode: 200,
      message: 'User profile fetched successfully',
      data: {
        name: user.name,
        mobileNumber: user.phone,
        joinedAt: user.createdAt,
        groupsJoined: groupList,
      },
    };
    return next();
  } catch (error) {
    logger.error({ error }, 'Error in getProfile controller');
    req.apiStatus = {
      isSuccess: false,
      statusCode: 500,
      message: 'Internal server error',
    };
    return next();
  }
};

/**
 * @swagger
 * /users/profile:
 *   post:
 *     summary: Update user profile details
 *     tags: [User]
 *     security:
 *       - userBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 example: "john@example.com"
 *     responses:
 *       200:
 *         description: User profile updated successfully
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
 *                   example: "User profile updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 401,
        message: 'Unauthorized - User context missing',
      };
      return next();
    }

    const { name, email } = req.body;

    const updateData: {
      name?: string;
      email?: string;
      profileCompleted?: boolean;
    } = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    // Check if at least one field is provided
    if (Object.keys(updateData).length === 0) {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 400,
        message: 'No fields to update',
      };
      return next();
    }

    // Mark profile as completed if name is provided (simplified logic)
    if (name) {
      updateData.profileCompleted = true;
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!updatedUser) {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 404,
        message: 'User not found',
      };
      return next();
    }

    req.apiStatus = {
      isSuccess: true,
      statusCode: 200,
      message: 'User profile updated successfully',
      data: {
        name: updatedUser.name,
        email: updatedUser.email,
        profileCompleted: updatedUser.profileCompleted,
      },
    };
    return next();
  } catch (error) {
    logger.error({ error }, 'Error in updateProfile controller');
    req.apiStatus = {
      isSuccess: false,
      statusCode: 500,
      message: 'Internal server error',
    };
    return next();
  }
};
