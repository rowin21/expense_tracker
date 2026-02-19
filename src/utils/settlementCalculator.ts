import { ExpenseModel } from '../db/models/expense.model';
import { SettlementModel } from '../db/models/settlement.model';
import { logger } from './logger';

interface UserBalance {
  _id: string;
  balance: number; // +ve gets money, -ve owes money
}

export const recalculateDailySettlements = async (
  groupId: string,
  date: Date,
): Promise<void> => {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Fetch Expenses for the day for the group
    const expenses = await ExpenseModel.find({
      groupId,
      isActive: true,
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    // 2. Calculate Net Balances
    const balances: Record<string, number> = {};

    expenses.forEach((expense) => {
      const payerId = expense.paidBy.toString();
      const amount = expense.amount;
      const splitAmong = expense.splitAmong;

      // Payer gets +amount (they paid, so they are owed this... wait)
      // Standard algorithm:
      // Balance[User] += AmountPaid
      // Balance[User] -= AmountConsumed

      // Init if needed
      if (!balances[payerId]) balances[payerId] = 0;
      balances[payerId] += amount;

      // Split
      if (splitAmong.length > 0) {
        // We use perPersonShare stored in expense to act as closest specific value
        // Or recalculate (amount / count) to be safe for aggregates
        // Let's use stored perPersonShare, but might have float issues?
        // Let's recalculate simply: amount / count.
        const share = amount / splitAmong.length;

        splitAmong.forEach((memberId) => {
          const mId = memberId.toString();
          if (!balances[mId]) balances[mId] = 0;
          balances[mId] -= share;
        });
      }
    });

    // 3. Match Debtors and Creditors
    // Filter out ~0 balances
    const debtors: UserBalance[] = [];
    const creditors: UserBalance[] = [];

    Object.keys(balances).forEach((id) => {
      const val = balances[id];
      if (val < -0.01) debtors.push({ _id: id, balance: val }); // owes
      if (val > 0.01) creditors.push({ _id: id, balance: val }); // receives
    });

    // Sort to optimize matching (largest debtor pays largest creditor? or arbitrary)
    debtors.sort((a, b) => a.balance - b.balance); // asc (most negative first)
    creditors.sort((a, b) => b.balance - a.balance); // desc (most positive first)

    const newSettlements = [];

    let i = 0; // debtor index
    let j = 0; // creditor index

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];

      // Amount to settle is min(abs(debtor), creditor)
      const amount = Math.min(Math.abs(debtor.balance), creditor.balance);

      // Round to 2 decimals
      const roundedAmount = Math.round((amount + Number.EPSILON) * 100) / 100;

      if (roundedAmount > 0) {
        newSettlements.push({
          fromUser: debtor._id,
          toUser: creditor._id,
          amount: roundedAmount,
        });
      }

      // Adjust balances
      debtor.balance += amount;
      creditor.balance -= amount;

      // Move indices if settled
      if (Math.abs(debtor.balance) < 0.01) i++;
      if (creditor.balance < 0.01) j++;
    }

    // 4. Update/Create Settlements
    // Strategy:
    // Existing pending settlements for this day: Update amount or delete if 0.
    // Preserve settlements that are 'awaiting_confirmation' or 'settled'.
    // If a settlement is already settled, we consider it "done" and subtract its amount from the *calculated* requirement?
    // User Requirement: "Automatically create".
    // Complexity: If A paid 50 (Settled). Now debt is 60. We need another 10 pending.
    // Or do we recalculate *remaining* debt?
    // "each person will get one settlemets in a day" -> suggests we aggregate.

    // Revised Strategy with Existing Settlements:
    // 1. Fetch valid existing settlements for (Group, Day).
    // 2. Subtract 'settled' and 'awaiting_confirmation' amounts from the *Calculated Balances* before matching?
    //    Yes. If A owes B 30, and there is a 'settled' record of 10, A still owes 20.
    //    Wait, balances are net.

    // Let's re-run balance calculation including *Settled* payments as credits.
    // If A paid B 10 (Settled), treat it like A paid an expense of 10 for B?
    // Effective Balance = (Expenses Paid - Consumed) + (Settlements Given - Received)
    // Then we generate *new* pending settlements for the remaining balance.

    // OR: We just update the single "Pending" record if it exists.
    // If there is a settled record, we leave it alone and create/update a separate pending record for the remainder.
    // Example: Day 1. Total Debt A->B is 50.
    // Scenario 1: No settlements. Create Pending(A->B, 50).
    // Scenario 2: A->B 20 is Settled. Remaining Need: 30. Create Pending(A->B, 30).

    // Implementation:
    // Fetch all existing settlements for the day.
    const existingSettlements = await SettlementModel.find({
      groupId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    // Adjust balances based on *non-pending* settlements (processed payments)
    existingSettlements.forEach((settlement) => {
      if (settlement.status !== 'pending') {
        const payerId = settlement.fromUser.toString(); // The one who paid the debt
        const receiverId = settlement.toUser.toString();

        // If A paid B, A's debt decreases (balance inc), B's credit decreases (balance dec)
        // Balance is (+ve = surplus). A paying B reduces A's debt (makes A more positive)
        // Wait: Original Balance for A was -50. A pays 20. New Balance -30. Correct.
        if (balances[payerId] !== undefined)
          balances[payerId] += settlement.amount;
        else balances[payerId] = settlement.amount; // Should exist if they had debt

        if (balances[receiverId] !== undefined)
          balances[receiverId] -= settlement.amount;
        else balances[receiverId] = -settlement.amount;
      }
    });

    // Re-match with *remaining* balances
    const remainingDebtors: UserBalance[] = [];
    const remainingCreditors: UserBalance[] = [];

    Object.keys(balances).forEach((id) => {
      const val = balances[id];
      if (val < -0.01) remainingDebtors.push({ _id: id, balance: val });
      if (val > 0.01) remainingCreditors.push({ _id: id, balance: val });
    });

    remainingDebtors.sort((a, b) => a.balance - b.balance);
    remainingCreditors.sort((a, b) => b.balance - a.balance);

    // Now create/update PENDING settlements for these remainders
    let x = 0;
    let y = 0;

    // We need to track which pending settlements we "touched" or created to delete obsolete ones?
    // Or just find existing pending and update, create new if needed.

    // Map existing pending settlements for easy lookup: Key "from_to"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pendingMap = new Map<string, any>();
    existingSettlements
      .filter((s) => s.status === 'pending')
      .forEach((s) => {
        pendingMap.set(`${s.fromUser.toString()}_${s.toUser.toString()}`, s);
      });

    const touchedIds = new Set<string>();

    while (x < remainingDebtors.length && y < remainingCreditors.length) {
      const debtor = remainingDebtors[x];
      const creditor = remainingCreditors[y];

      const amount = Math.min(Math.abs(debtor.balance), creditor.balance);
      const roundedAmount = Math.round((amount + Number.EPSILON) * 100) / 100;

      if (roundedAmount > 0) {
        const key = `${debtor._id}_${creditor._id}`;
        const existing = pendingMap.get(key);

        if (existing) {
          // Update amount
          existing.amount = roundedAmount;
          await existing.save();
          touchedIds.add(existing._id.toString());
        } else {
          // Create new
          await SettlementModel.create({
            groupId,
            fromUser: debtor._id,
            toUser: creditor._id,
            amount: roundedAmount,
            status: 'pending',
            date: startOfDay, // Normalize date to start of day or use original date passed? User said "daily basis"
          });
        }
      }

      debtor.balance += amount;
      creditor.balance -= amount;

      if (Math.abs(debtor.balance) < 0.01) x++;
      if (creditor.balance < 0.01) y++;
    }

    // Delete any pending settlements that are no longer needed (e.g. debt reduced to 0 or shifted)
    for (const [, sett] of pendingMap) {
      if (!touchedIds.has(sett._id.toString())) {
        await SettlementModel.findByIdAndDelete(sett._id);
      }
    }
  } catch (error) {
    logger.error(
      { error, groupId, date },
      'Error calculating daily settlements',
    );
    // Don't throw, just log. This is a background helper usually.
  }
};
