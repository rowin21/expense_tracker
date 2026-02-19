import { RequestHandler, Request, Response, NextFunction } from 'express';
import { config } from '../config';
import * as Helper from '../utils/helper';

export const entryPoint: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  req.startTime = Date.now();
  req.txnId = Helper.generateTransactionId();
  req.environment = config.nodeEnv;
  req.apiStatus = {}; // Controllers will write to this
  next();
};
