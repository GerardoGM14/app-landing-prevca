import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/async-handler';

export const authController = {
  me: asyncHandler(async (req: Request, res: Response) => {
    res.json({
      uid: req.user!.uid,
      email: req.user!.email,
    });
  }),
};
