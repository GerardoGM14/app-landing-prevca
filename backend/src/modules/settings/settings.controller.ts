import { randomUUID } from 'node:crypto';
import { Request, Response } from 'express';
import { storage } from '../../config/firebase';
import { STORAGE_PATHS } from '../../config/constants';
import { asyncHandler } from '../../shared/utils/async-handler';
import { ValidationError } from '../../shared/errors/app-error';
import { settingsService } from './settings.service';
import {
  UpdatePaymentConfigInput,
  UpdateShippingRatesInput,
} from './settings.schema';

const ALLOWED_QR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const MAX_QR_SIZE_MB = 5;

const isEmulator = (): boolean =>
  Boolean(process.env.STORAGE_EMULATOR_HOST || process.env.FIREBASE_STORAGE_EMULATOR_HOST);

const buildPublicUrl = (storagePath: string): string => {
  const bucket = storage.bucket();
  if (isEmulator()) {
    const host = (process.env.STORAGE_EMULATOR_HOST ?? 'http://localhost:9199').replace(/\/$/, '');
    const normalized = host.startsWith('http') ? host : `http://${host}`;
    return `${normalized}/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;
  }
  return `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
};

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

  /**
   * Upload del QR de Yape. Sube la imagen a /payment-config/yape-qr-{uuid}.{ext}
   * y actualiza payment-config con la URL nueva.
   */
  uploadYapeQr: asyncHandler(async (req: Request, res: Response) => {
    const files = (req.files as Express.Multer.File[]) ?? [];
    if (files.length === 0) {
      throw new ValidationError([{ path: 'qr', message: 'No se envió ningún archivo' }]);
    }
    const file = files[0];
    if (!ALLOWED_QR_MIME_TYPES.includes(file.mimetype as never)) {
      throw new ValidationError([
        { path: 'qr', message: `Tipo no permitido: ${file.mimetype}. Use JPG, PNG o WebP.` },
      ]);
    }
    if (file.size > MAX_QR_SIZE_MB * 1024 * 1024) {
      throw new ValidationError([
        { path: 'qr', message: `Archivo excede ${MAX_QR_SIZE_MB} MB` },
      ]);
    }

    const ext = file.mimetype.split('/').pop() ?? 'png';
    const filename = `yape-qr-${randomUUID()}.${ext === 'jpeg' ? 'jpg' : ext}`;
    const storagePath = `${STORAGE_PATHS.PAYMENT_CONFIG}/${filename}`;
    const fileRef = storage.bucket().file(storagePath);

    const saveOptions: Parameters<typeof fileRef.save>[1] = {
      contentType: file.mimetype,
      metadata: { cacheControl: 'public, max-age=3600' },
    };
    if (!isEmulator()) saveOptions.public = true;

    await fileRef.save(file.buffer, saveOptions);
    const url = buildPublicUrl(storagePath);

    // Borra el QR anterior si existía y era distinto
    const current = await settingsService.getPaymentConfig();
    if (current.yapeQrUrl && current.yapeQrUrl !== url) {
      // Solo intentamos borrar si la URL anterior es de nuestro Storage
      const match = current.yapeQrUrl.match(/payment-config\/[^?]+/);
      if (match) {
        await storage
          .bucket()
          .file(match[0])
          .delete()
          .catch(() => null);
      }
    }

    const updated = await settingsService.updatePaymentConfig({ yapeQrUrl: url });
    res.status(201).json({
      url,
      storagePath,
      config: updated,
    });
  }),
};
