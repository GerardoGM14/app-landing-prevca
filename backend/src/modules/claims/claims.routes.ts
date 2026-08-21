import { Router } from 'express';
import { validate } from '../../shared/middleware/validate.middleware';
import { claimsController } from './claims.controller';
import { claimQuerySchema, updateClaimSchema } from './claims.schema';

export const claimsRouter = Router();

claimsRouter.get('/', validate(claimQuerySchema, 'query'), claimsController.list);
claimsRouter.get('/:id', claimsController.getById);
claimsRouter.patch('/:id', validate(updateClaimSchema), claimsController.update);
