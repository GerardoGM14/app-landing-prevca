import { Router } from 'express';
import { authController } from './auth.controller';

export const authRouter = Router();

authRouter.get('/me', authController.me);
