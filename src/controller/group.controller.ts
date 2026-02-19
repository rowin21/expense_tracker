import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { GroupModel } from '../db/models/group.model';
import { UserModel } from '../db/models/user.model';
import { ExpenseModel } from '../db/models/expense.model';
import { SettlementModel } from '../db/models/settlement.model';
import { logger } from '../utils/logger';

export const createGroup = async (
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

    const { groupName, members: rawMembers } = req.body;

    const memberIds: mongoose.Types.ObjectId[] = [];
    // Add creator to members.
    memberIds.push(userId as mongoose.Types.ObjectId);

    if (rawMembers && Array.isArray(rawMembers)) {
      for (const member of rawMembers) {
        if (!member.phone) continue;

        const phone = member.phone;
        const countryCode = member.countryCode || '91';

        // Check if user exists
        const existingUser = await UserModel.findOne({ phone, countryCode });

        if (existingUser) {
          // Avoid adding creator twice if they list themselves
          if (existingUser._id.toString() !== userId.toString()) {
            memberIds.push(existingUser._id as mongoose.Types.ObjectId);
          }
        } else {
          // Create new unregistered user
          const newUser = new UserModel({
            name: member.name || '',
            phone,
            countryCode,
            isRegistered: false,
            // profileCompleted defaults false
          });
          await newUser.save();
          memberIds.push(newUser._id as mongoose.Types.ObjectId);
        }
      }
    }

    // Remove duplicates
    const uniqueMemberIds = Array.from(
      new Set(memberIds.map((id) => id.toString())),
    ).map((id) => new mongoose.Types.ObjectId(id));

    const newGroup = new GroupModel({
      groupName,
      members: uniqueMemberIds,
      createdBy: userId,
    });

    await newGroup.save();

    req.apiStatus = {
      isSuccess: true,
      statusCode: 200,
      message: 'Group created successfully',
      data: newGroup,
    };
    return next();
  } catch (error) {
    logger.error({ error }, 'Error creating group');
    req.apiStatus = {
      isSuccess: false,
      statusCode: 500,
      message: 'Internal server error',
    };
    return next();
  }
};

export const updateGroup = async (
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
    const { groupName } = req.body;

    const group = await GroupModel.findById(id);

    if (!group) {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 404,
        message: 'Group not found',
      };
      return next();
    }

    // Check if user is a member or the creator
    // Assuming members are ObjectId[]
    const isMember = group.members.some(
      (memberId) => memberId.toString() === userId.toString(),
    );
    if (!isMember && group.createdBy.toString() !== userId.toString()) {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 403,
        message: 'Forbidden - You are not a member of this group',
      };
      return next();
    }

    if (groupName) {
      group.groupName = groupName;
    }

    await group.save();

    req.apiStatus = {
      isSuccess: true,
      statusCode: 200,
      message: 'Group updated successfully',
      data: group,
    };
    return next();
  } catch (error) {
    logger.error({ error }, 'Error updating group');
    req.apiStatus = {
      isSuccess: false,
      statusCode: 500,
      message: 'Internal server error',
    };
    return next();
  }
};

export const addMembersToGroup = async (
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
    const { members } = req.body;

    const group = await GroupModel.findById(id);

    if (!group) {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 404,
        message: 'Group not found',
      };
      return next();
    }

    // Check if user is a member or the creator
    const isMember = group.members.some(
      (memberId) => memberId.toString() === userId.toString(),
    );
    if (!isMember && group.createdBy.toString() !== userId.toString()) {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 403,
        message: 'Forbidden - You are not a member of this group',
      };
      return next();
    }

    // Add new members
    if (members && members.length > 0) {
      for (const member of members) {
        if (!member.phone) continue;

        const phone = member.phone;
        const countryCode = member.countryCode || '91';

        // Check if user exists
        const existingUser = await UserModel.findOne({ phone, countryCode });

        if (existingUser) {
          // Check if already a member
          const alreadyMember = group.members.some(
            (mId) => mId.toString() === existingUser._id.toString(),
          );
          if (!alreadyMember) {
            group.members.push(existingUser._id as mongoose.Types.ObjectId);
          }
        } else {
          // Create new unregistered user
          const newUser = new UserModel({
            name: member.name || '',
            phone,
            countryCode,
            isRegistered: false,
          });
          await newUser.save();
          group.members.push(newUser._id as mongoose.Types.ObjectId);
        }
      }
    }

    await group.save();

    req.apiStatus = {
      isSuccess: true,
      statusCode: 200,
      message: 'Members added successfully',
      data: group,
    };
    return next();
  } catch (error) {
    logger.error({ error }, 'Error adding members to group');
    req.apiStatus = {
      isSuccess: false,
      statusCode: 500,
      message: 'Internal server error',
    };
    return next();
  }
};

export const removeMembersFromGroup = async (
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
    const { memberIds } = req.body;

    const group = await GroupModel.findById(id);

    if (!group) {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 404,
        message: 'Group not found',
      };
      return next();
    }

    // Check if user is a member or the creator
    const isMember = group.members.some(
      (memberId) => memberId.toString() === userId.toString(),
    );
    if (!isMember && group.createdBy.toString() !== userId.toString()) {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 403,
        message: 'Forbidden - You are not a member of this group',
      };
      return next();
    }

    // Remove members
    if (memberIds && memberIds.length > 0) {
      for (const memberId of memberIds) {
        // Calculate balance for this member in this group
        // 1. Total paid in expenses
        const expensesPaid = await ExpenseModel.find({
          groupId: id,
          paidBy: memberId,
          isActive: true,
        });
        const totalPaid = expensesPaid.reduce((sum, e) => sum + e.amount, 0);

        // 2. Total share owed across all expenses
        const expensesOwed = await ExpenseModel.find({
          groupId: id,
          splitAmong: memberId,
          isActive: true,
        });
        const totalOwed = expensesOwed.reduce(
          (sum, e) => sum + e.perPersonShare,
          0,
        );

        // 3. Total settlements sent (confirmed or awaiting)
        const settlementsSent = await SettlementModel.find({
          groupId: id,
          fromUser: memberId,
          status: { $in: ['settled', 'awaiting_confirmation'] },
        });
        const totalSent = settlementsSent.reduce((sum, s) => sum + s.amount, 0);

        // 4. Total settlements received (confirmed or awaiting)
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

        // Use a small epsilon for float comparison
        if (Math.abs(balance) > 0.01) {
          const mUser = await UserModel.findById(memberId);
          const msg = `Member ${mUser?.name || memberId} has an unsettled balance and cannot be removed.`;
          req.apiStatus = {
            isSuccess: false,
            statusCode: 400,
            message: msg,
            toastMessage: msg,
          };
          return next();
        }

        // Also check for any 'pending' settlements generated by the auto-calculator
        const pendingSettlements = await SettlementModel.findOne({
          groupId: id,
          $or: [{ fromUser: memberId }, { toUser: memberId }],
          status: 'pending',
        });

        if (pendingSettlements) {
          const mUser = await UserModel.findById(memberId);
          const msg = `Member ${mUser?.name || memberId} has pending settlements and cannot be removed.`;
          req.apiStatus = {
            isSuccess: false,
            statusCode: 400,
            message: msg,
            toastMessage: msg,
          };
          return next();
        }
      }

      // If all checks pass, filter out the members
      group.members = group.members.filter(
        (memberId) => !memberIds.includes(memberId.toString()),
      );
    }

    await group.save();

    req.apiStatus = {
      isSuccess: true,
      statusCode: 200,
      message: 'Members removed successfully',
      data: group,
    };
    return next();
  } catch (error) {
    logger.error({ error }, 'Error updating group');
    req.apiStatus = {
      isSuccess: false,
      statusCode: 500,
      message: 'Internal server error',
    };
    return next();
  }
};

export const getAllGroups = async (
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

    const { options, search, project } = req.body;

    // Base query: User is member or creator
    const baseQuery = {
      $or: [{ members: userId }, { createdBy: userId }],
    };

    const findQuery: Record<string, unknown> = { ...baseQuery };

    // Search Logic
    if (search && Array.isArray(search) && search.length > 0) {
      const searchConditions: unknown[] = [];
      for (const s of search) {
        const { term, fields, startsWith, endsWith } = s;
        if (!term || !fields || fields.length === 0) continue;

        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        let regexPattern = escapedTerm;
        if (startsWith && endsWith) {
          regexPattern = `^${escapedTerm}$`;
        } else if (startsWith) {
          regexPattern = `^${escapedTerm}`;
        } else if (endsWith) {
          regexPattern = `${escapedTerm}$`;
        }

        const regex = new RegExp(regexPattern, 'i');

        const fieldConditions = fields.map((field: string) => {
          // Map "name" to "groupName" for this project context
          const dbField = field === 'name' ? 'groupName' : field;
          return { [dbField]: regex };
        });

        // OR between fields for a single term
        searchConditions.push({ $or: fieldConditions });
      }

      // AND between different search terms
      if (searchConditions.length > 0) {
        findQuery.$and = searchConditions;
      }
    }

    // Pagination
    const page = options?.page || 1;
    const limit = options?.itemsPerPage || 10;
    const skip = (page - 1) * limit;

    // Sort
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sort: any = {};
    if (options?.sortBy && options?.sortDesc) {
      options.sortBy.forEach((field: string, index: number) => {
        const dbField = field === 'name' ? 'groupName' : field;
        sort[dbField] = options.sortDesc[index] ? -1 : 1;
      });
    }
    if (Object.keys(sort).length === 0) {
      sort.createdAt = -1; // Default sort
    }

    // Project
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let projection: any = '-__v';
    if (project && Object.keys(project).length > 0) {
      projection = project;
      // If projection doesn't explicitly exclude _id, it's included by default.
      // If user wants specific fields, we usually pass that object directly to select()
    }

    const totalItems = await GroupModel.countDocuments(findQuery);
    const groups = await GroupModel.find(findQuery)
      .select(projection)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('members', 'name phone countryCode profileCompleted')
      .populate('createdBy', 'name phone');

    req.apiStatus = {
      isSuccess: true,
      statusCode: 200,
      message: 'Groups fetched successfully',
      data: {
        items: groups,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
    return next();
  } catch (error) {
    logger.error({ error }, 'Error fetching groups');
    req.apiStatus = {
      isSuccess: false,
      statusCode: 500,
      message: 'Internal server error',
    };
    return next();
  }
};

export const getGroupMembers = async (
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
      'name phone countryCode profileCompleted isRegistered',
    );

    if (!group) {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 404,
        message: 'Group not found',
      };
      return next();
    }

    // Check if user is a member or the creator
    const isMember = group.members.some(
      (member) =>
        (
          member as unknown as { _id: mongoose.Types.ObjectId }
        )._id.toString() === userId.toString(),
    );
    if (!isMember && group.createdBy.toString() !== userId.toString()) {
      req.apiStatus = {
        isSuccess: false,
        statusCode: 403,
        message: 'Forbidden - You are not a member of this group',
      };
      return next();
    }

    req.apiStatus = {
      isSuccess: true,
      statusCode: 200,
      message: 'Group members fetched successfully',
      data: group.members,
    };
    return next();
  } catch (error) {
    logger.error({ error }, 'Error fetching group members');
    return next();
  }
};

export const deleteGroup = async (
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

    const isAdmin = group.createdBy.toString() === userId.toString();

    if (isAdmin) {
      // Admin deleting group: Check if there are any unsettled expenses or pending settlements for ANY member
      const unsettledSettlements = await SettlementModel.findOne({
        groupId: id,
        status: { $ne: 'settled' },
      });

      if (unsettledSettlements) {
        const msg = `Group cannot be deleted until all expenses and settlements are cleared.`;
        req.apiStatus = {
          isSuccess: false,
          statusCode: 400,
          message: msg,
          toastMessage: msg,
        };
        return next();
      }

      // Admin deleting group: Delete group and all related data
      await GroupModel.findByIdAndDelete(id);
      await ExpenseModel.deleteMany({ groupId: id });
      await SettlementModel.deleteMany({ groupId: id });

      req.apiStatus = {
        isSuccess: true,
        statusCode: 200,
        message: 'Group and all related data deleted successfully',
        toastMessage: 'Group deleted successfully',
      };
      return next();
    } else {
      // Member leaving group: Check if user is a member
      const memberIndex = group.members.findIndex(
        (mId) => mId.toString() === userId.toString(),
      );

      if (memberIndex === -1) {
        req.apiStatus = {
          isSuccess: false,
          statusCode: 403,
          message: 'Forbidden - You are not a member of this group',
        };
        return next();
      }

      // Check for unsettled expenses before leaving
      // 1. Total paid in expenses
      const expensesPaid = await ExpenseModel.find({
        groupId: id,
        paidBy: userId,
        isActive: true,
      });
      const totalPaid = expensesPaid.reduce((sum, e) => sum + e.amount, 0);

      // 2. Total share owed across all expenses
      const expensesOwed = await ExpenseModel.find({
        groupId: id,
        splitAmong: userId,
        isActive: true,
      });
      const totalOwed = expensesOwed.reduce(
        (sum, e) => sum + e.perPersonShare,
        0,
      );

      // 3. Total settlements sent
      const settlementsSent = await SettlementModel.find({
        groupId: id,
        fromUser: userId,
        status: { $in: ['settled', 'awaiting_confirmation'] },
      });
      const totalSent = settlementsSent.reduce((sum, s) => sum + s.amount, 0);

      // 4. Total settlements received
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

      if (Math.abs(balance) > 0.01) {
        const msg = `You have an unsettled balance and cannot leave the group.`;
        req.apiStatus = {
          isSuccess: false,
          statusCode: 400,
          message: msg,
          toastMessage: msg,
        };
        return next();
      }

      // 5. Check for any 'pending' settlements
      const pendingSettlements = await SettlementModel.findOne({
        groupId: id,
        $or: [{ fromUser: userId }, { toUser: userId }],
        status: 'pending',
      });

      if (pendingSettlements) {
        const msg = `You have pending settlements and cannot leave the group.`;
        req.apiStatus = {
          isSuccess: false,
          statusCode: 400,
          message: msg,
          toastMessage: msg,
        };
        return next();
      }

      // If clear, remove from members array
      group.members.splice(memberIndex, 1);
      await group.save();

      req.apiStatus = {
        isSuccess: true,
        statusCode: 200,
        message: 'Left the group successfully',
        toastMessage: 'Left the group successfully',
      };
      return next();
    }
  } catch (error) {
    logger.error({ error }, 'Error in delete/leave group');
    req.apiStatus = {
      isSuccess: false,
      statusCode: 500,
      message: 'Internal server error',
    };
    return next();
  }
};
