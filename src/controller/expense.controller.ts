import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { GroupModel } from '../db/models/group.model';
import { ExpenseModel } from '../db/models/expense.model';
import { SettlementModel } from '../db/models/settlement.model';
import { logger } from '../utils/logger';
import { recalculateDailySettlements } from '../utils/settlementCalculator';

export const addExpense = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { groupId } = req.params;
    const { amount, paidBy, description, date } = req.body;

    // Validate if paidBy is valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(paidBy)) {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 400,
        message: 'Invalid payer ID',
      };
      return next();
    }

    // 1. Verify Group Exists
    const group = await GroupModel.findById(groupId);
    if (!group || !group.isActive) {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 404,
        message: 'Group not found or inactive',
      };
      return next();
    }

    // 2. Verify Payer is Group Member
    const isPayerMember = group.members.some(
      (memberId) => memberId.toString() === paidBy,
    );

    // Also check if creator (admin) is paying, as they might not be in members array explicitly depending on logic,
    // but in our createGroup logic creator is added to members. Safe check anyway.
    const isCreator = group.createdBy.toString() === paidBy;

    if (!isPayerMember && !isCreator) {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 403,
        message: 'User is not a member of this group',
      };
      return next();
    }

    // 3. Get All Group Members (splitAmong)
    // We use the members array from the group.
    const splitAmong = group.members;

    if (splitAmong.length === 0) {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 400,
        message: 'Group has no members to split expense',
      };
      return next();
    }

    // 4. Calculate Per Person Share
    // Round to 2 decimal places
    const rawShare = amount / splitAmong.length;
    const perPersonShare = Math.round((rawShare + Number.EPSILON) * 100) / 100;

    // 5. Create Expense Document
    const newExpense = new ExpenseModel({
      groupId,
      amount,
      paidBy,
      description,
      date: new Date(date),
      splitAmong,
      perPersonShare,
      isActive: true,
    });

    // 6. Save to Database
    await newExpense.save();

    // 7. Update Group (Last Activity)
    group.updatedAt = new Date();
    await group.save();

    // 8. Recalculate Settlements
    // Fire and forget (optional: await if consistency is critical, but might slow response)
    // We await to ensure tests pass and logic is sound, but in high scale maybe background queue.
    await recalculateDailySettlements(groupId.toString(), newExpense.date);

    req.apiStatus = {
      isSuccess: true,
      statusCode: 200,
      message: 'Expense added successfully',
      data: {
        expenseId: newExpense._id,
        amount: newExpense.amount,
        paidBy: newExpense.paidBy,
        description: newExpense.description,
        perPersonShare: newExpense.perPersonShare,
        splitAmong: newExpense.splitAmong,
        date: newExpense.date,
      },
    };
    return next();
  } catch (error) {
    logger.error({ error }, 'Error adding expense');
    req.apiStatus = {
      isSuccess: false,
      statusCode: 500,
      message: 'Internal server error',
    };
    return next();
  }
};

export const updateExpense = async (
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
    const { expenseId } = req.params;
    const { amount, description, date } = req.body;

    const expense = await ExpenseModel.findById(expenseId);
    if (!expense || !expense.isActive) {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 404,
        message: 'Expense not found',
      };
      return next();
    }

    const group = await GroupModel.findById(expense.groupId);
    if (!group) {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 404,
        message: 'Group not found',
      };
      return next();
    }

    // Check Authorization: Admin or Payer
    const isPayer = expense.paidBy.toString() === userId.toString();
    const isAdmin = group.createdBy.toString() === userId.toString();

    if (!isPayer && !isAdmin) {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 403,
        message: 'Forbidden - You are not authorized to edit this expense',
      };
      return next();
    }

    // Update fields
    if (amount) {
      expense.amount = amount;
      // Recalculate per person share
      const splitAmong = expense.splitAmong;
      if (splitAmong.length > 0) {
        const rawShare = amount / splitAmong.length;
        expense.perPersonShare =
          Math.round((rawShare + Number.EPSILON) * 100) / 100;
      }
    }
    if (description) expense.description = description;
    if (date) expense.date = new Date(date);

    await expense.save();

    // Update Group Activity
    group.updatedAt = new Date();
    await group.save();

    await recalculateDailySettlements(group._id.toString(), expense.date);

    req.apiStatus = {
      isSuccess: true,
      statusCode: 200,
      message: 'Expense updated successfully',
      data: expense,
    };
    return next();
  } catch (error) {
    logger.error({ error }, 'Error updating expense');
    req.apiStatus = {
      isSuccess: false,
      statusCode: 500,
      message: 'Internal server error',
    };
    return next();
  }
};

export const deleteExpense = async (
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
    const { expenseId } = req.params;

    const expense = await ExpenseModel.findById(expenseId);
    if (!expense || !expense.isActive) {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 404,
        message: 'Expense not found',
      };
      return next();
    }

    const group = await GroupModel.findById(expense.groupId);
    if (!group) {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 404,
        message: 'Group not found',
      };
      return next();
    }

    // Check Authorization: Admin or Payer
    const isPayer = expense.paidBy.toString() === userId.toString();
    const isAdmin = group.createdBy.toString() === userId.toString();

    if (!isPayer && !isAdmin) {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 403,
        message: 'Forbidden - You are not authorized to delete this expense',
      };
      return next();
    }

    // Soft delete
    expense.isActive = false;
    await expense.save();

    // Update Group Activity
    group.updatedAt = new Date();
    await group.save();

    await recalculateDailySettlements(group._id.toString(), expense.date);

    req.apiStatus = {
      isSuccess: true,
      statusCode: 200,
      message: 'Expense deleted successfully',
    };
    return next();
  } catch (error) {
    logger.error({ error }, 'Error deleting expense');
    req.apiStatus = {
      isSuccess: false,
      statusCode: 500,
      message: 'Internal server error',
    };
    return next();
  }
};

export const getGroupExpenses = async (
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

    const expenses = await ExpenseModel.find({ groupId, isActive: true })
      .populate('paidBy', 'name phone')
      .sort({ date: -1, createdAt: -1 });

    const formattedExpenses = expenses.map((expense) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payer = expense.paidBy as any; // Type assertion since it's populated
      const isYou = payer._id.toString() === userId.toString();

      return {
        _id: expense._id,
        groupId: expense.groupId,
        amount: expense.amount,
        description: expense.description,
        date: expense.date,
        paidBy: {
          _id: payer._id,
          name: payer.name,
          isYou: isYou,
        },
        splitParticipantsCount: expense.splitAmong.length,
        perPersonShare: expense.perPersonShare,
        createdAt: expense.createdAt,
      };
    });

    req.apiStatus = {
      isSuccess: true,
      statusCode: 200,
      message: 'Expenses fetched successfully',
      data: formattedExpenses,
    };
    return next();
  } catch (error) {
    logger.error({ error }, 'Error fetching group expenses');
    req.apiStatus = {
      isSuccess: false,
      statusCode: 500,
      message: 'Internal server error',
    };
    return next();
  }
};

export const getExpenseDetails = async (
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
    const { expenseId } = req.params;

    const expense = await ExpenseModel.findById(expenseId)
      .populate('paidBy', 'name phone')
      .populate('splitAmong', 'name phone');

    if (!expense || !expense.isActive) {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 404,
        message: 'Expense not found',
      };
      return next();
    }

    const groupId = expense.groupId;
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payer = expense.paidBy as any;
    const perPersonShare = expense.perPersonShare;

    // Calculate split details logic:
    // "if one paid then it show minis his share and display the amount he is owned(other have to pay him)"
    // "show in the key 'owned'"
    // "and for other use the key 'owns' to display the amount they need to pay for the one who paid"

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const participants = expense.splitAmong as any[];

    const splitDetails = participants.map((member) => {
      const isPayer = member._id.toString() === payer._id.toString();
      const isYou = member._id.toString() === userId.toString();

      if (isPayer) {
        // The one who paid.
        // Amount they effectively paid for *others* is (Total Amount - Their Own Share)
        // If they are NOT part of the split, then they are owed the full amount.
        // Assuming splitAmong includes everyone involved including payer if they consumed.

        return {
          _id: member._id,
          name: member.name,
          shareAmount: perPersonShare,
          owned: expense.amount - perPersonShare, // Others owe them this much
          isPayer: true,
          isYou,
        };
      } else {
        // Others
        return {
          _id: member._id,
          name: member.name,
          shareAmount: perPersonShare,
          owns: perPersonShare, // They owe this much to the payer
          isPayer: false,
          isYou,
        };
      }
    });

    const isYouPayer = payer._id.toString() === userId.toString();

    req.apiStatus = {
      isSuccess: true,
      statusCode: 200,
      message: 'Expense details fetched successfully',
      data: {
        _id: expense._id,
        description: expense.description,
        amount: expense.amount,
        date: expense.date,
        paidBy: {
          _id: payer._id,
          name: payer.name,
          isYou: isYouPayer,
        },
        splitDetails,
        createdAt: expense.createdAt,
      },
    };
    return next();
  } catch (error) {
    logger.error({ error }, 'Error fetching expense details');
    req.apiStatus = {
      isSuccess: false,
      statusCode: 500,
      message: 'Internal server error',
    };
    return next();
  }
};

export const getGroupExpenseOverview = async (
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
    const { id } = req.params;

    const group = await GroupModel.findById(id).populate(
      'members',
      'name phone countryCode',
    );

    if (!group) {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 404,
        message: 'Group not found',
      };
      return next();
    }

    // Check if user is a member
    const isMember = group.members.some(
      (member) =>
        (member._id as mongoose.Types.ObjectId).toString() ===
        userId.toString(),
    );
    if (!isMember && group.createdBy.toString() !== userId.toString()) {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 403,
        message: 'Forbidden - You are not a member of this group',
      };
      return next();
    }

    const overview = [];

    for (const member of group.members) {
      const memberObj = member as unknown as {
        _id: mongoose.Types.ObjectId;
        name?: string;
        phone: string;
      };
      const memberId = memberObj._id;

      // 1. Total paid in expenses
      const expensesPaid = await ExpenseModel.find({
        groupId: id,
        paidBy: memberId,
        isActive: true,
      });
      const totalPaid = expensesPaid.reduce((sum, e) => sum + e.amount, 0);

      // 2. Total share owed
      const expensesOwed = await ExpenseModel.find({
        groupId: id,
        splitAmong: memberId,
        isActive: true,
      });
      const totalOwed = expensesOwed.reduce(
        (sum, e) => sum + e.perPersonShare,
        0,
      );

      // 3. Total settlements sent (completed/awaiting)
      const settlementsSent = await SettlementModel.find({
        groupId: id,
        fromUser: memberId,
        status: { $in: ['settled', 'awaiting_confirmation'] },
      });
      const totalSent = settlementsSent.reduce((sum, s) => sum + s.amount, 0);

      // 4. Total settlements received (completed/awaiting)
      const settlementsReceived = await SettlementModel.find({
        groupId: id,
        toUser: memberId,
        status: { $in: ['settled', 'awaiting_confirmation'] },
      });
      const totalReceived = settlementsReceived.reduce(
        (sum, s) => sum + s.amount,
        0,
      );

      const balance = totalPaid - totalOwed + totalSent - totalReceived;

      overview.push({
        userId: memberId,
        name: memberObj.name || memberObj.phone,
        totalPaid: Number(totalPaid.toFixed(2)),
        totalOwed: Number(totalOwed.toFixed(2)),
        netSettled: Number((totalSent - totalReceived).toFixed(2)),
        balance: Number(balance.toFixed(2)),
        isYou: memberId.toString() === userId.toString(),
        isPay: balance < -0.01, // If balance is negative (they owe money)
      });
    }

    req.apiStatus = {
      isSuccess: true,
      statusCode: 200,
      message: 'Group expense overview fetched successfully',
      data: overview,
    };
    return next();
  } catch (error) {
    logger.error({ error }, 'Error fetching group expense overview');
    req.apiStatus = {
      isSuccess: false,
      statusCode: 500,
      message: 'Internal server error',
    };
    return next();
  }
};

export const getExpenseInfo = async (
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
    const { id } = req.params;

    const group = await GroupModel.findById(id);

    if (!group) {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 404,
        message: 'Group not found',
      };
      return next();
    }

    // Check if user is a member or creator
    const isMember = group.members.some(
      (mId) => mId.toString() === userId.toString(),
    );
    if (!isMember && group.createdBy.toString() !== userId.toString()) {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 403,
        message: 'Forbidden - You are not a member of this group',
      };
      return next();
    }

    // Calculate balance for the logged-in user
    // 1. Total paid in expenses
    const expensesPaid = await ExpenseModel.find({
      groupId: id,
      paidBy: userId,
      isActive: true,
    });
    const totalPaid = expensesPaid.reduce((sum, e) => sum + e.amount, 0);

    // 2. Total share owed
    const expensesOwed = await ExpenseModel.find({
      groupId: id,
      splitAmong: userId,
      isActive: true,
    });
    const totalOwed = expensesOwed.reduce(
      (sum, e) => sum + e.perPersonShare,
      0,
    );

    // 3. Total settlements sent (completed/awaiting)
    const settlementsSent = await SettlementModel.find({
      groupId: id,
      fromUser: userId,
      status: { $in: ['settled', 'awaiting_confirmation'] },
    });
    const totalSent = settlementsSent.reduce((sum, s) => sum + s.amount, 0);

    // 4. Total settlements received (completed/awaiting)
    const settlementsReceived = await SettlementModel.find({
      groupId: id,
      toUser: userId,
      status: { $in: ['settled', 'awaiting_confirmation'] },
    });
    const totalReceived = settlementsReceived.reduce(
      (sum, s) => sum + s.amount,
      0,
    );

    const balance = totalPaid - totalOwed + totalSent - totalReceived;

    req.apiStatus = {
      isSuccess: true,
      statusCode: 200,
      message: 'Expense info fetched successfully',
      data: {
        groupName: group.groupName,
        memberCount: group.members.length,
        createdAt: group.createdAt,
        balance: Number(balance.toFixed(2)),
        isPay: balance < -0.01,
      },
    };
    return next();
  } catch (error) {
    logger.error({ error }, 'Error fetching expense info');
    req.apiStatus = {
      isSuccess: false,
      statusCode: 500,
      message: 'Internal server error',
    };
    return next();
  }
};
