import express, { Request, Response } from 'express';
import cors from 'cors';
import { errorHandler } from './shared/middleware/error.handler';
import { authMiddleware } from './shared/middleware/auth.middleware';
import { authRouter } from './modules/auth/auth.routes';
import { productsRouter } from './modules/products/products.routes';
import { categoriesRouter } from './modules/categories/categories.routes';
import { ordersRouter } from './modules/orders/orders.routes';
import { imagesRouter } from './modules/images/images.routes';
import { settingsRouter } from './modules/settings/settings.routes';
import { publicRouter } from './modules/public/public.routes';

const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'prevca-api', timestamp: new Date().toISOString() });
});

// Endpoints públicos (sin auth) — consume la landing
app.use('/public', publicRouter);

// Endpoints admin — todos requieren ID token + custom claim admin=true
app.use('/admin', authMiddleware);
app.use('/admin/auth', authRouter);
app.use('/admin/products', productsRouter);
app.use('/admin/categories', categoriesRouter);
app.use('/admin/orders', ordersRouter);
app.use('/admin/images', imagesRouter);
app.use('/admin/settings', settingsRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint no encontrado' } });
});

app.use(errorHandler);

export { app };
