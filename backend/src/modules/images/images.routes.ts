import { Router } from 'express';
import { validate } from '../../shared/middleware/validate.middleware';
import { parseMultipart } from '../../shared/middleware/multipart.middleware';
import { IMAGE_CONFIG } from '../../config/constants';
import { imagesController } from './images.controller';
import { reorderImagesSchema, updateImageSchema } from './images.schema';

const uploadMultipart = parseMultipart({
  maxFiles: 10,
  maxFileSizeMb: IMAGE_CONFIG.MAX_FILE_SIZE_MB,
  fieldName: 'images',
});

export const imagesRouter = Router();

imagesRouter.post('/:productId', uploadMultipart, imagesController.upload);
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
