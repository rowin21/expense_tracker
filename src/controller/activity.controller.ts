import { Request, Response, NextFunction } from 'express';
import { ExpenseModel } from '../db/models/expense.model';
import { GroupModel } from '../db/models/group.model';
import { SettlementModel } from '../db/models/settlement.model';
import { logger } from '../utils/logger';

export const getUserActivity = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 401,
        message: 'Unauthorized',
      };
      return next();
    }
    const userId = user._id;

    // Find all groups where user is a member or creator
    const userGroups = await GroupModel.find({
      $or: [{ members: userId }, { createdBy: userId }],
    }).select('_id groupName');

    const groupIds = userGroups.map((g) => g._id);
    const groupMap = new Map<string, string>();
    userGroups.forEach((g) => groupMap.set(g._id.toString(), g.groupName));

    // Find expenses in these groups
    // Filter expenses where user is involved (paidBy OR in splitAmong)
    const expenses = await ExpenseModel.find({
      groupId: { $in: groupIds },
      isActive: true,
      $or: [{ paidBy: userId }, { splitAmong: userId }],
    })
      .sort({ date: -1, createdAt: -1 })
      .populate('paidBy', 'name');

    const activities = expenses.map((expense) => {
      const groupName =
        groupMap.get(expense.groupId.toString()) || 'Unknown Group';

      let myShare = 0;
      const isSplitParticipant = expense.splitAmong.some(
        (id) => id.toString() === userId.toString(),
      );

      if (isSplitParticipant) {
        myShare = expense.perPersonShare;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payer = expense.paidBy as any;

      return {
        _id: expense._id,
        groupName,
        amount: myShare,
        description: expense.description,
        date: expense.date,
        paidBy: payer.name || 'Unknown',
        type: 'expense',
      };
    });

    req.apiStatus = {
      isSuccess: true,
      statusCode: 200,
      message: 'User activity fetched successfully',
      data: activities,
    };
    return next();
  } catch (error) {
    logger.error({ error }, 'Error fetching user activity');
    req.apiStatus = {
      isSuccess: false,
      statusCode: 500,
      message: 'Internal server error',
    };
    return next();
  }
};

export const getSettlementActivity = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 401,
        message: 'Unauthorized',
      };
      return next();
    }
    const userId = user._id;

    // Find all groups where user is a member or creator
    const userGroups = await GroupModel.find({
      $or: [{ members: userId }, { createdBy: userId }],
    }).select('_id groupName');

    const groupIds = userGroups.map((g) => g._id);
    const groupMap = new Map<string, string>();
    userGroups.forEach((g) => groupMap.set(g._id.toString(), g.groupName));

    // Fetch Settlements with Status 'awaiting_confirmation'
    // Where user is fromUser (payer) OR toUser (receiver)
    const settlements = await SettlementModel.find({
      groupId: { $in: groupIds },
      status: 'awaiting_confirmation',
      $or: [{ fromUser: userId }, { toUser: userId }],
    })
      .populate('fromUser', 'name')
      .populate('toUser', 'name')
      .sort({ updatedAt: -1 });

    const settlementActivities = settlements.map((settlement) => {
      const groupName =
        groupMap.get(settlement.groupId.toString()) || 'Unknown Group';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fromUser = settlement.fromUser as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const toUser = settlement.toUser as any;

      const isPayer = fromUser._id.toString() === userId.toString();

      let description = '';
      if (isPayer) {
        description = `You paid ${toUser.name}`;
      } else {
        description = `${fromUser.name} paid you`;
      }

      return {
        _id: settlement._id,
        groupName,
        amount: settlement.amount,
        description: description,
        date: settlement.updatedAt,
        paidBy: fromUser.name,
        type: 'settlement',
        status: settlement.status,
      };
    });

    req.apiStatus = {
      isSuccess: true,
      statusCode: 200,
      message: 'Settlement activity fetched successfully',
      data: settlementActivities,
    };
    return next();
  } catch (error) {
    logger.error({ error }, 'Error fetching settlement activity');
    req.apiStatus = {
      isSuccess: false,
      statusCode: 500,
      message: 'Internal server error',
    };
    return next();
  }
};
