import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/async-handler';
import { imagesService } from './images.service';
import { ReorderImagesInput, UpdateImageInput } from './images.schema';

type ProductIdParams = { productId: string };
type ImagePathParams = { productId: string; storagePath: string };

export const imagesController = {
  upload: asyncHandler(async (req: Request<ProductIdParams>, res: Response) => {
    const files = (req.files as Express.Multer.File[]) ?? [];
    const uploaded = await imagesService.upload(req.params.productId, files);
    res.status(201).json({ images: uploaded });
  }),

  update: asyncHandler(async (req: Request<ImagePathParams>, res: Response) => {
    const path = decodeURIComponent(req.params.storagePath);
    const image = await imagesService.update(
      req.params.productId,
      path,
      req.body as UpdateImageInput,
    );
    res.json(image);
  }),

  delete: asyncHandler(async (req: Request<ImagePathParams>, res: Response) => {
    const path = decodeURIComponent(req.params.storagePath);
    await imagesService.delete(req.params.productId, path);
    res.status(204).send();
  }),

  reorder: asyncHandler(async (req: Request<ProductIdParams>, res: Response) => {
    const images = await imagesService.reorder(
      req.params.productId,
      req.body as ReorderImagesInput,
    );
    res.json({ images });
  }),
};
