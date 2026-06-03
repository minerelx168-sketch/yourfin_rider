import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error';
import { rangeFromQuery } from '../utils/date';
import {
  getActivityFeed,
  getLeaderboard,
  getMapPoints,
  getOverview,
  getTimeseries,
} from '../services/dashboard.service';

export const rangeQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

function getRange(req: Request) {
  const { from, to } = req.query as z.infer<typeof rangeQuerySchema>;
  return rangeFromQuery(from, to);
}

export const overview = asyncHandler(async (req: Request, res: Response) => {
  res.json(await getOverview(getRange(req)));
});

export const leaderboard = asyncHandler(async (req: Request, res: Response) => {
  res.json({ leaderboard: await getLeaderboard(getRange(req)) });
});

export const timeseries = asyncHandler(async (req: Request, res: Response) => {
  res.json({ series: await getTimeseries(getRange(req)) });
});

export const mapPoints = asyncHandler(async (req: Request, res: Response) => {
  res.json({ points: await getMapPoints(getRange(req)) });
});

export const activityFeed = asyncHandler(async (req: Request, res: Response) => {
  const { limit } = req.query as z.infer<typeof rangeQuerySchema>;
  res.json({ feed: await getActivityFeed(getRange(req), limit ?? 50) });
});
