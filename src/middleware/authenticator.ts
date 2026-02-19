import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { config } from '../config';
import { AccessTokenModel } from '../db/models/accessToken.model';
import { UserModel } from '../db/models/user.model';
import { exitPoint } from './exitPoint';
import { logger } from '../utils/logger';

interface DecodedToken extends JwtPayload {
  userId: string;
  role: string;
}

export const authenticator = (requiredRole?: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        req.apiStatus = {
          isSuccess: false,
          statusCode: 401,
          message: 'Unauthorized - No token provided',
        };
        return exitPoint(req, res, next);
      }

      const token = authHeader.split(' ')[1];

      let decoded: DecodedToken;
      try {
        decoded = jwt.verify(token, config.jwtAccessSecret) as DecodedToken;
      } catch (error) {
        req.apiStatus = {
          isSuccess: false,
          statusCode: 401,
          message: 'Unauthorized - Invalid token',
        };
        return exitPoint(req, res, next);
      }

      if (requiredRole && decoded.role !== requiredRole) {
        req.apiStatus = {
          isSuccess: false,
          statusCode: 403,
          message: 'Forbidden - Insufficient permissions',
        };
        return exitPoint(req, res, next);
      }

      // Check if token exists in DB (whitelist)
      const tokenDoc = await AccessTokenModel.findOne({ token });
      if (!tokenDoc) {
        req.apiStatus = {
          isSuccess: false,
          statusCode: 401,
          message: 'Unauthorized - Token revoked or expired',
        };
        return exitPoint(req, res, next);
      }

      const user = await UserModel.findById(decoded.userId);
      if (!user || user.isDeleted) {
        req.apiStatus = {
          isSuccess: false,
          statusCode: 401,
          message: 'Unauthorized - User not found',
        };
        return exitPoint(req, res, next);
      }

      req.user = user;
      next();
    } catch (error) {
      logger.error({ error }, 'Authentication Middleware Error');
      req.apiStatus = {
        isSuccess: false,
        statusCode: 500,
        message: 'Internal Server Error',
      };
      return exitPoint(req, res, next);
    }
  };
};

export const userAuthenticator = authenticator('user');
