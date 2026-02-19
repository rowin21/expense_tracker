import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

import { GroupModel } from '../db/models/group.model';
import { SettlementModel } from '../db/models/settlement.model';
import { logger } from '../utils/logger';

export const initiateSettlement = async (
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
    const { settlementId } = req.params;
    const { paymentMethod, referenceId } = req.body;

    const settlement = await SettlementModel.findById(settlementId);
    if (!settlement) {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 404,
        message: 'Settlement not found',
      };
      return next();
    }

    if (settlement.fromUser.toString() !== userId.toString()) {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 403,
        message: 'Forbidden - Only the payer can initiate this settlement',
      };
      return next();
    }

    if (
      settlement.status !== 'pending' &&
      settlement.status !== 'awaiting_confirmation'
    ) {
      // Allow re-updating if still awaiting conformation? Or strictly pending.
      // User might want to correct reference ID.
      // Let's allow updating if it is not settled.
    }

    if (settlement.status === 'settled') {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 400,
        message: 'Settlement is already settled',
      };
      return next();
    }

    settlement.paymentMethod = paymentMethod;
    settlement.referenceId = referenceId;
    settlement.status = 'awaiting_confirmation';

    await settlement.save();

    req.apiStatus = {
      isSuccess: true,
      statusCode: 200,
      message: 'Settlement initiated successfully',
      data: settlement,
    };
    return next();
  } catch (error) {
    logger.error({ error }, 'Error initiating settlement');
    req.apiStatus = {
      isSuccess: false,
      statusCode: 500,
      message: 'Internal server error',
    };
    return next();
  }
};

export const cancelSettlement = async (
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
    const { settlementId } = req.params;

    const settlement = await SettlementModel.findById(settlementId);
    if (!settlement) {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 404,
        message: 'Settlement not found',
      };
      return next();
    }

    // Only the initiator (fromUser) can cancel
    if (settlement.fromUser.toString() !== userId.toString()) {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 403,
        message: 'Forbidden - Only the initiator can cancel this settlement',
      };
      return next();
    }

    // Can only cancel if it is awaiting confirmation
    if (settlement.status !== 'awaiting_confirmation') {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 400,
        message: `Cannot cancel a settlement that is in status: ${settlement.status}`,
      };
      return next();
    }

    // Revert to pending and clear payment info
    settlement.status = 'pending';
    settlement.paymentMethod = undefined;
    settlement.referenceId = undefined;

    await settlement.save();

    req.apiStatus = {
      isSuccess: true,
      statusCode: 200,
      message: 'Settlement cancelled successfully',
      data: settlement,
    };
    return next();
  } catch (error) {
    logger.error({ error }, 'Error cancelling settlement');
    req.apiStatus = {
      isSuccess: false,
      statusCode: 500,
      message: 'Internal server error',
    };
    return next();
  }
};

export const updateSettlementStatus = async (
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
    const { settlementId } = req.params;
    const { status } = req.body; // 'accepted' or 'rejected'

    const settlement = await SettlementModel.findById(settlementId);
    if (!settlement) {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 404,
        message: 'Settlement not found',
      };
      return next();
    }

    // Only the receiver (toUser) can accept/reject
    if (settlement.toUser.toString() !== userId.toString()) {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 403,
        message: 'Forbidden - Only the receiver can update the status',
      };
      return next();
    }

    if (settlement.status !== 'awaiting_confirmation') {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 400,
        message: `Settlement is not awaiting confirmation (Current: ${settlement.status})`,
      };
      return next();
    }

    settlement.status = status;
    await settlement.save();

    req.apiStatus = {
      isSuccess: true,
      statusCode: 200,
      message: `Settlement ${status} successfully`,
      data: settlement,
    };
    return next();
  } catch (error) {
    logger.error({ error }, 'Error updating settlement status');
    req.apiStatus = {
      isSuccess: false,
      statusCode: 500,
      message: 'Internal server error',
    };
    return next();
  }
};

export const getGroupSettlements = async (
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
    const { groupId } = req.params;

    const group = await GroupModel.findById(groupId);
    if (!group) {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 404,
        message: 'Group not found',
      };
      return next();
    }

    // Verify User is Group Member
    const isMember = group.members.some(
      (memberId) => memberId.toString() === userId.toString(),
    );
    const isCreator = group.createdBy.toString() === userId.toString();

    if (!isMember && !isCreator) {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 403,
        message: 'Forbidden - You are not a member of this group',
      };
      return next();
    }

    const settlements = await SettlementModel.find({
      groupId,
      $or: [{ fromUser: userId }, { toUser: userId }],
    })
      .populate('fromUser', 'name phone')
      .populate('toUser', 'name phone')
      .sort({ createdAt: -1 });

    // Calculate Receivable and Payable for the logged-in user
    let recievable = 0; // Amount others owe to the user
    let payable = 0; // Amount user owes to others

    settlements.forEach((s) => {
      // Only consider pending or awaiting_confirmation for totals?
      // User requested "yet to receive" and "have to pay", usually means non-settled.
      if (s.status !== 'settled') {
        if (s.toUser._id.toString() === userId.toString()) {
          recievable += s.amount;
        }
        if (s.fromUser._id.toString() === userId.toString()) {
          payable += s.amount;
        }
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    interface SettlementResponse {
      _id: mongoose.Types.ObjectId | string;
      groupId: mongoose.Types.ObjectId | string;
      fromUser: {
        _id: mongoose.Types.ObjectId | string;
        name: string;
        phone: string;
        isYou: boolean;
      };
      toUser: {
        _id: mongoose.Types.ObjectId | string;
        name: string;
        phone: string;
        isYou: boolean;
      };
      amount: number;
      status: string;
      displayStatus: string;
      settlementInfo?: {
        amount: number;
        method: string | null;
        refno: string | null;
        date: Date;
      };
      createdAt: Date;
      updatedAt: Date;
    }

    const pay: SettlementResponse[] = [];
    const receive: SettlementResponse[] = [];
    const settledList: SettlementResponse[] = [];

    settlements.forEach((s) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const settlementObj = s.toObject() as any;
      const isPayerYou =
        settlementObj.fromUser._id.toString() === userId.toString();
      const isReceiverYou =
        settlementObj.toUser._id.toString() === userId.toString();

      // Add isYou flag
      if (settlementObj.fromUser) {
        settlementObj.fromUser.isYou = isPayerYou;
      }
      if (settlementObj.toUser) {
        settlementObj.toUser.isYou = isReceiverYou;
      }

      // Determine displayStatus
      let displayStatus = '';
      if (s.status === 'settled') {
        displayStatus = 'Settled';
      } else if (s.status === 'awaiting_confirmation') {
        if (isPayerYou) {
          displayStatus = 'Awaiting Confirmation';
        } else {
          displayStatus = 'Confirm Payment';
        }
      } else {
        // Status is pending
        displayStatus = 'Awaiting Payment';
      }
      settlementObj.displayStatus = displayStatus;

      // Add settlement info if not pending
      if (s.status !== 'pending') {
        settlementObj.settlementInfo = {
          amount: s.amount,
          method: s.paymentMethod || null,
          refno: s.referenceId || null,
          date: s.createdAt,
        };
      }

      // Grouping
      if (s.status === 'settled') {
        settledList.push(settlementObj);
      } else if (isPayerYou) {
        pay.push(settlementObj);
      } else if (isReceiverYou) {
        receive.push(settlementObj);
      }
    });

    req.apiStatus = {
      isSuccess: true,
      statusCode: 200,
      message: 'Settlements fetched successfully',
      data: {
        pay,
        receive,
        settled: settledList,
        recievable,
        payable,
      },
    };
    return next();
  } catch (error) {
    logger.error({ error }, 'Error fetching settlements');
    req.apiStatus = {
      isSuccess: false,
      statusCode: 500,
      message: 'Internal server error',
    };
    return next();
  }
};
