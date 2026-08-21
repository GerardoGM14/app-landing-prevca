import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/async-handler';
import { claimsService } from './claims.service';
import { ClaimQuery, UpdateClaimInput } from './claims.schema';

type IdParams = { id: string };

export const claimsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await claimsService.list(req.query as unknown as ClaimQuery);
    res.json(result);
  }),

  getById: asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const claim = await claimsService.findById(req.params.id);
    res.json(claim);
  }),

  update: asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const claim = await claimsService.update(req.params.id, req.body as UpdateClaimInput);
    res.json(claim);
  }),
};
