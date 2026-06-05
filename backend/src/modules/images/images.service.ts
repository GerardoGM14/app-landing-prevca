import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { storage } from '../../config/firebase';
import { IMAGE_CONFIG, STORAGE_PATHS } from '../../config/constants';
import { NotFoundError, ValidationError } from '../../shared/errors/app-error';
import { productsRepository, ProductImage } from '../products/products.repository';
import { ReorderImagesInput, UpdateImageInput } from './images.schema';

const bucket = () => storage.bucket();

const isEmulator = (): boolean =>
  Boolean(process.env.STORAGE_EMULATOR_HOST || process.env.FIREBASE_STORAGE_EMULATOR_HOST);

const publicUrl = (storagePath: string): string => {
  if (isEmulator()) {
    const host = (process.env.STORAGE_EMULATOR_HOST ?? 'http://localhost:9199').replace(/\/$/, '');
    const normalized = host.startsWith('http') ? host : `http://${host}`;
    return `${normalized}/v0/b/${bucket().name}/o/${encodeURIComponent(storagePath)}?alt=media`;
  }
  return `https://storage.googleapis.com/${bucket().name}/${storagePath}`;
};

export const imagesService = {
  async upload(productId: string, files: Express.Multer.File[]) {
    const product = await productsRepository.findById(productId);
    if (!product) throw new NotFoundError('Producto');

    if (files.length === 0) {
      throw new ValidationError([{ path: 'images', message: 'No se enviaron archivos' }]);
    }

    const uploaded: ProductImage[] = [];

    for (const file of files) {
      if (!IMAGE_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype as never)) {
        throw new ValidationError([
          { path: 'images', message: `Tipo de archivo no permitido: ${file.mimetype}` },
        ]);
      }

      const optimized = await sharp(file.buffer)
        .rotate()
        .resize({ width: IMAGE_CONFIG.MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: IMAGE_CONFIG.WEBP_QUALITY })
        .toBuffer();

      const filename = `${randomUUID()}.webp`;
      const storagePath = `${STORAGE_PATHS.PRODUCT_IMAGES}/${productId}/${filename}`;
      const fileRef = bucket().file(storagePath);

      // En el emulador, `public: true` falla porque no soporta ACL reales.
      // En producción sí lo necesitamos para que la URL pública funcione sin token.
      await fileRef.save(optimized, {
        contentType: 'image/webp',
        ...(isEmulator() ? {} : { public: true }),
        metadata: { cacheControl: 'public, max-age=31536000, immutable' },
      });

      uploaded.push({
        storagePath,
        url: publicUrl(storagePath),
        alt: null,
        isPrimary: product.images.length === 0 && uploaded.length === 0,
        order: product.images.length + uploaded.length,
      });
    }

    const newImages = [...product.images, ...uploaded];
    await productsRepository.update(productId, { images: newImages });
    return uploaded;
  },

  async delete(productId: string, storagePath: string) {
    const product = await productsRepository.findById(productId);
    if (!product) throw new NotFoundError('Producto');

    const target = product.images.find((img) => img.storagePath === storagePath);
    if (!target) throw new NotFoundError('Imagen');

    await bucket()
      .file(storagePath)
      .delete()
      .catch(() => null);

    let newImages = product.images.filter((img) => img.storagePath !== storagePath);

    // Si borramos la primaria, marcar la siguiente como primaria
    if (target.isPrimary && newImages.length > 0) {
      newImages = newImages.map((img, idx) => ({ ...img, isPrimary: idx === 0 }));
    }

    await productsRepository.update(productId, { images: newImages });
  },

  async update(productId: string, storagePath: string, input: UpdateImageInput) {
    const product = await productsRepository.findById(productId);
    if (!product) throw new NotFoundError('Producto');

    const target = product.images.find((img) => img.storagePath === storagePath);
    if (!target) throw new NotFoundError('Imagen');

    let newImages = product.images.map((img) => {
      if (img.storagePath !== storagePath) return img;
      return {
        ...img,
        ...(input.alt !== undefined && { alt: input.alt }),
        ...(input.isPrimary !== undefined && { isPrimary: input.isPrimary }),
        ...(input.order !== undefined && { order: input.order }),
      };
    });

    // Solo una imagen puede ser primaria
    if (input.isPrimary === true) {
      newImages = newImages.map((img) =>
        img.storagePath === storagePath ? img : { ...img, isPrimary: false },
      );
    }

    await productsRepository.update(productId, { images: newImages });
    return newImages.find((img) => img.storagePath === storagePath);
  },

  async reorder(productId: string, input: ReorderImagesInput) {
    const product = await productsRepository.findById(productId);
    if (!product) throw new NotFoundError('Producto');

    const byPath = new Map(product.images.map((img) => [img.storagePath, img]));
    const newImages: ProductImage[] = [];

    input.order.forEach((path, idx) => {
      const img = byPath.get(path);
      if (img) newImages.push({ ...img, order: idx });
    });

    if (newImages.length !== product.images.length) {
      throw new ValidationError([
        { path: 'order', message: 'La lista debe incluir todas las imágenes del producto' },
      ]);
    }

    await productsRepository.update(productId, { images: newImages });
    return newImages;
  },
};
