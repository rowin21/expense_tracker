import { Router } from 'express';
import healthRoutes from './health';
import authRoutes from './auth.routes';

import groupRoutes from './group.routes';
import userRoutes from './user.routes';
import expenseRoutes from './expense.routes';
import settlementRoutes from './settlement.routes';
import activityRoutes from './activity.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/groups', groupRoutes);
router.use('/expenses', expenseRoutes);
router.use('/settlements', settlementRoutes);
router.use('/activity', activityRoutes);

export default router;
