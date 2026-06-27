import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/async-handler';
import { settingsService } from './settings.service';
import {
  UpdatePaymentConfigInput,
  UpdateShippingRatesInput,
} from './settings.schema';

export const settingsController = {
  getShippingRates: asyncHandler(async (_req: Request, res: Response) => {
    res.json(await settingsService.getShippingRates());
  }),

  updateShippingRates: asyncHandler(async (req: Request, res: Response) => {
    const updated = await settingsService.updateShippingRates(req.body as UpdateShippingRatesInput);
    res.json(updated);
  }),

  getPaymentConfig: asyncHandler(async (_req: Request, res: Response) => {
    res.json(await settingsService.getPaymentConfig());
  }),

  updatePaymentConfig: asyncHandler(async (req: Request, res: Response) => {
    const updated = await settingsService.updatePaymentConfig(req.body as UpdatePaymentConfigInput);
    res.json(updated);
  }),
};
