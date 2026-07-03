import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { sendSuccess, sendError } from '../utils/response';

export async function getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stats = await dashboardService.getStats();
    sendSuccess(res, stats);
  } catch (error) {
    next(error);
  }
}
