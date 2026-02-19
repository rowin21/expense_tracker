import { ResponseObject } from '../utils/customTypes';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const exitPoint = (req: Request, res: Response, _next: NextFunction) => {
  const timeTaken = Date.now() - (req.startTime || Date.now());

  let responseObj: ResponseObject = {} as ResponseObject;
  if (req.apiStatus?.isSuccess) {
    responseObj = {
      status: req.apiStatus.statusCode || 200,
      message: req.apiStatus.message || 'Success',
      data: req.apiStatus.data || null,
      toastMessage: req.apiStatus.toastMessage || null,
    };
  } else {
    responseObj = {
      status: req.apiStatus?.statusCode || 500,
      message: req.apiStatus?.message || 'Internal Server Error',
      data: req.apiStatus?.data || null,
      toastMessage:
        req.apiStatus?.toastMessage || 'An unexpected error occurred',
    };
  }

  // Create log entry with request and response details
  const logData = {
    txnId: req.txnId,
    method: req.method,
    url: req.originalUrl || req.url,
    queryParams: req.query,
    body: req.body,
    token: req.headers.authorization
      ? req.headers.authorization.substring(0, 20) + '...'
      : null,
    response: responseObj,
    timeTaken: `${timeTaken}ms`,
    timestamp: new Date().toISOString(),
  };

  logger.info(logData, 'EXIT_POINT');

  res.setHeader('X-Transaction-Id', req.txnId || '');
  res.setHeader('X-Response-Time', `${timeTaken}ms`);
  res.setHeader('X-Environment', req.environment || '');
  res.status(responseObj.status).json(responseObj);
};
