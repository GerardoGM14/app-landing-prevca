import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/async-handler';
import { NotFoundError } from '../../shared/errors/app-error';
import { productsRepository } from '../products/products.repository';
import { categoriesRepository } from '../categories/categories.repository';
import { ordersService } from '../orders/orders.service';
import { ProductQuery } from '../products/products.schema';
import { CategoryQuery } from '../categories/categories.schema';
import { CreateOrderInput } from '../orders/orders.schema';

type SlugParams = { slug: string };

const PUBLIC_FIELDS = (p: Awaited<ReturnType<typeof productsRepository.findById>>) =>
  p && {
    id: p.id,
    slug: p.slug,
    ref: p.ref,
    title: p.title,
    division: p.division,
    categoryId: p.categoryId,
    shortDesc: p.shortDesc,
    description: p.description,
    specs: p.specs,
    features: p.features,
    price: p.showPrice ? p.price : null,
    showPrice: p.showPrice,
    stock: p.showStock ? p.stock : null,
    showStock: p.showStock,
    isFeatured: p.isFeatured,
    images: p.images,
  };

export const publicController = {
  listProducts: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ProductQuery;
    const result = await productsRepository.list({
      ...query,
      isActive: true,
      pageSize: query.pageSize ?? 50,
    });
    res.json({
      items: result.items.map(PUBLIC_FIELDS),
      nextCursor: result.nextCursor,
    });
  }),

  getProductBySlug: asyncHandler(async (req: Request<SlugParams>, res: Response) => {
    const product = await productsRepository.findBySlug(req.params.slug);
    if (!product || !product.isActive) throw new NotFoundError('Producto');
    res.json(PUBLIC_FIELDS(product));
  }),

  listCategories: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as CategoryQuery;
    const items = await categoriesRepository.list({ ...query, isActive: true });
    res.json({ items });
  }),

  createOrder: asyncHandler(async (req: Request, res: Response) => {
    const order = await ordersService.create(req.body as CreateOrderInput);
    res.status(201).json({
      code: order.code,
      message: 'Cotización recibida. Un asesor se comunicará pronto.',
    });
  }),
};
