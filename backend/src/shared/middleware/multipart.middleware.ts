import Busboy from 'busboy';
import { NextFunction, Request, Response } from 'express';
import { ValidationError } from '../errors/app-error';

/**
 * Parser multipart para Firebase Functions v2.
 *
 * Multer NO funciona en Cloud Run porque Functions consume el body antes de
 * que el stream llegue a Express. La forma soportada es usar Busboy contra
 * `req.rawBody` (un Buffer con el body bruto) que Functions v2 sí expone.
 *
 * Después del middleware, los archivos quedan en `req.files` con la misma
 * forma que multer (compatible con el resto del código).
 */
export const parseMultipart =
  (options: { maxFiles?: number; maxFileSizeMb?: number; fieldName?: string } = {}) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const { maxFiles = 10, maxFileSizeMb = 10, fieldName = 'images' } = options;

    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!rawBody || rawBody.length === 0) {
      next(new ValidationError([{ path: 'body', message: 'Body multipart vacío' }]));
      return;
    }

    const busboy = Busboy({
      headers: req.headers,
      limits: {
        files: maxFiles,
        fileSize: maxFileSizeMb * 1024 * 1024,
      },
    });

    const files: Express.Multer.File[] = [];
    let limitExceeded = false;

    busboy.on('file', (name, fileStream, info) => {
      if (name !== fieldName) {
        fileStream.resume();
        return;
      }
      const chunks: Buffer[] = [];
      fileStream.on('data', (chunk: Buffer) => chunks.push(chunk));
      fileStream.on('limit', () => {
        limitExceeded = true;
        fileStream.resume();
      });
      fileStream.on('end', () => {
        if (limitExceeded) return;
        const buffer = Buffer.concat(chunks);
        files.push({
          fieldname: name,
          originalname: info.filename,
          encoding: info.encoding,
          mimetype: info.mimeType,
          buffer,
          size: buffer.length,
        } as Express.Multer.File);
      });
    });

    busboy.on('error', (err) => next(err));
    busboy.on('finish', () => {
      if (limitExceeded) {
        next(
          new ValidationError([
            { path: 'images', message: `Archivo excede el límite de ${maxFileSizeMb} MB` },
          ]),
        );
        return;
      }
      (req as Request & { files: Express.Multer.File[] }).files = files;
      next();
    });

    busboy.end(rawBody);
  };
