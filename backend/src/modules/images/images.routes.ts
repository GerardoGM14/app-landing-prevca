import { Router } from 'express';
import multer from 'multer';
import { validate } from '../../shared/middleware/validate.middleware';
import { IMAGE_CONFIG } from '../../config/constants';
import { imagesController } from './images.controller';
import { reorderImagesSchema, updateImageSchema } from './images.schema';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: IMAGE_CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 10,
  },
});

export const imagesRouter = Router();

imagesRouter.post('/:productId', upload.array('images', 10), imagesController.upload);
imagesRouter.patch(
  '/:productId/reorder',
  validate(reorderImagesSchema),
  imagesController.reorder,
);
imagesRouter.patch(
  '/:productId/:storagePath',
  validate(updateImageSchema),
  imagesController.update,
);
imagesRouter.delete('/:productId/:storagePath', imagesController.delete);
