import { ConflictError, NotFoundError } from '../../shared/errors/app-error';
import { productsRepository, ProductDoc } from './products.repository';
import {
  CreateProductInput,
  ProductQuery,
  UpdateProductInput,
  UpdateStockInput,
} from './products.schema';

export const productsService = {
  async list(query: ProductQuery) {
    return productsRepository.list({
      search: query.search,
      division: query.division,
      categoryId: query.categoryId,
      isActive: query.isActive,
      pageSize: query.pageSize,
      cursor: query.cursor,
    });
  },

  async findById(id: string) {
    const product = await productsRepository.findById(id);
    if (!product) throw new NotFoundError('Producto');
    return product;
  },

  async create(input: CreateProductInput) {
    const [slugConflict, refConflict] = await Promise.all([
      productsRepository.findBySlug(input.slug),
      productsRepository.findByRef(input.ref),
    ]);

    if (slugConflict) throw new ConflictError(`Slug "${input.slug}" ya está en uso`);
    if (refConflict) throw new ConflictError(`Ref "${input.ref}" ya está en uso`);

    // Con pago directo debe haber precio: simple, por madera o por opción
    const hasVariants = (input.woodVariants ?? []).length > 0;
    const hasOptions = (input.options ?? []).length > 0;
    if (
      input.allowsDirectPurchase &&
      !hasVariants &&
      !hasOptions &&
      (input.price === null || input.price === undefined)
    ) {
      throw new ConflictError(
        'Un producto con pago directo debe tener un precio definido (o variantes/opciones con precio)',
      );
    }

    const id = await productsRepository.create({
      slug: input.slug,
      ref: input.ref,
      title: input.title,
      division: input.division,
      categoryId: input.categoryId ?? null,
      shortDesc: input.shortDesc,
      description: input.description,
      specs: input.specs ?? null,
      woodVariants: input.woodVariants ?? [],
      options: (input.options ?? []).map((o) => ({ ...o, imageUrl: o.imageUrl ?? null })),
      optionLabel: input.optionLabel ?? null,
      subcategory: input.subcategory ?? null,
      features: input.features,
      scientificName: input.scientificName ?? null,
      origin: input.origin ?? null,
      applications: input.applications ?? null,
      datasheetUrl: input.datasheetUrl ?? null,
      price: input.price ?? null,
      showPrice: input.showPrice,
      allowsDirectPurchase: input.allowsDirectPurchase,
      stock: input.stock,
      showStock: input.showStock,
      trackStock: input.trackStock,
      isActive: input.isActive,
      isFeatured: input.isFeatured,
      order: input.order,
      images: [],
    });

    return productsService.findById(id);
  },

  async update(id: string, input: UpdateProductInput) {
    const existing = await productsRepository.findById(id);
    if (!existing) throw new NotFoundError('Producto');

    if (input.slug && input.slug !== existing.slug) {
      const conflict = await productsRepository.findBySlug(input.slug);
      if (conflict && conflict.id !== id) {
        throw new ConflictError(`Slug "${input.slug}" ya está en uso`);
      }
    }
    if (input.ref && input.ref !== existing.ref) {
      const conflict = await productsRepository.findByRef(input.ref);
      if (conflict && conflict.id !== id) {
        throw new ConflictError(`Ref "${input.ref}" ya está en uso`);
      }
    }

    await productsRepository.update(id, input as Partial<ProductDoc>);
    return productsService.findById(id);
  },

  async delete(id: string) {
    const existing = await productsRepository.findById(id);
    if (!existing) throw new NotFoundError('Producto');
    await productsRepository.delete(id);
  },

  async updateStock(id: string, input: UpdateStockInput) {
    const existing = await productsRepository.findById(id);
    if (!existing) throw new NotFoundError('Producto');

    if (input.operation === 'set') {
      await productsRepository.setStock(id, input.quantity);
    } else {
      await productsRepository.incrementStock(id, input.quantity);
    }

    return productsService.findById(id);
  },
};
