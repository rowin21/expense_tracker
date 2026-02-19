import { IUser } from '../../db/models/user.model';

declare global {
  namespace Express {
    interface Request {
      startTime: number;
      txnId: string;
      environment: string;
      apiStatus: {
        isSuccess?: boolean;
        statusCode?: number;
        message?: string;
        data?: unknown;
        toastMessage?: string;
      };
      user?: IUser;
    }
  }
}
