import { Request, Response, NextFunction } from 'express';
import { auth } from '../../config/firebase';
import { UnauthorizedError, ForbiddenError } from '../errors/app-error';

export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token requerido');
    }

    const token = header.substring(7);
    const decoded = await auth.verifyIdToken(token);

    if (decoded.admin !== true) {
      throw new ForbiddenError('Requiere rol de administrador');
    }

    req.user = {
      uid: decoded.uid,
      email: decoded.email ?? null,
    };

    next();
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
      next(err);
      return;
    }
    next(new UnauthorizedError('Token inválido o expirado'));
  }
};
