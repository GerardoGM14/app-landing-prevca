import { randomUUID } from 'node:crypto';
import { Request, Response } from 'express';
import { storage } from '../../config/firebase';
import { PROOF_CONFIG, STORAGE_PATHS } from '../../config/constants';
import { asyncHandler } from '../../shared/utils/async-handler';
import { NotFoundError, ValidationError } from '../../shared/errors/app-error';
import { productsRepository } from '../products/products.repository';
import { categoriesRepository } from '../categories/categories.repository';
import { ordersService } from '../orders/orders.service';
import { settingsService } from '../settings/settings.service';
import { mercadopagoService } from '../payments/mercadopago.service';
import { ProductQuery } from '../products/products.schema';
import { CategoryQuery } from '../categories/categories.schema';
import { CheckoutInput, CreateOrderInput } from '../orders/orders.schema';

type SlugParams = { slug: string };
type CodeParams = { code: string };

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
    scientificName: p.scientificName,
    origin: p.origin,
    applications: p.applications,
    datasheetUrl: p.datasheetUrl,
    price: p.showPrice ? p.price : null,
    showPrice: p.showPrice,
    /** Indica si el carrito puede llevarlo a checkout con pago */
    allowsDirectPurchase: p.allowsDirectPurchase,
    stock: p.showStock ? p.stock : null,
    showStock: p.showStock,
    isFeatured: p.isFeatured,
    images: p.images,
  };

const isEmulator = (): boolean =>
  Boolean(process.env.STORAGE_EMULATOR_HOST || process.env.FIREBASE_STORAGE_EMULATOR_HOST);

const buildProofUrl = (storagePath: string): string => {
  const bucket = storage.bucket();
  if (isEmulator()) {
    const host = (process.env.STORAGE_EMULATOR_HOST ?? 'http://localhost:9199').replace(/\/$/, '');
    const normalized = host.startsWith('http') ? host : `http://${host}`;
    return `${normalized}/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;
  }
  return `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
};

export const publicController = {
  listProducts: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ProductQuery & { categorySlug?: string };

    let categoryId = query.categoryId;
    if (!categoryId && query.categorySlug && query.division) {
      const cat = await categoriesRepository.findBySlug(query.categorySlug, query.division);
      if (cat) categoryId = cat.id;
      else {
        res.json({ items: [], nextCursor: null });
        return;
      }
    }

    const result = await productsRepository.list({
      ...query,
      categoryId,
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

  /**
   * Checkout con pago. Calcula totales en server y crea la orden.
   * Devuelve el código + info necesaria para que el cliente complete el pago
   * (URL de QR Yape, transactionId placeholder para PayPal/Culqi, etc.)
   */
  checkout: asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as CheckoutInput;
    const order = await ordersService.checkout(input);
    const paymentConfig = await settingsService.getPublicPaymentConfig();

    let paymentInfo: Record<string, unknown> = {};
    switch (input.paymentMethod) {
      case 'YAPE':
        paymentInfo = { yape: paymentConfig.yape };
        break;
      case 'TRANSFERENCIA':
        paymentInfo = { transfer: paymentConfig.transfer };
        break;
      case 'PAYPAL':
        paymentInfo = { paypal: paymentConfig.paypal };
        break;
      case 'CULQI':
        paymentInfo = { culqi: paymentConfig.culqi };
        break;
      case 'MERCADOPAGO': {
        // Genera el link de pago de Checkout Pro; la landing redirige a él.
        const pref = await mercadopagoService.createPreference(order);
        paymentInfo = { mercadopago: { redirectUrl: pref.initPoint, preferenceId: pref.preferenceId } };
        break;
      }
    }

    res.status(201).json({
      code: order.code,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      total: order.total,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      paymentInfo,
    });
  }),

  /**
   * Cliente sube captura de pago (Yape/Transferencia).
   * Multipart espera campo `proof` con la imagen/PDF.
   */
  uploadProof: asyncHandler(async (req: Request<CodeParams>, res: Response) => {
    const files = (req.files as Express.Multer.File[]) ?? [];
    if (files.length === 0) {
      throw new ValidationError([{ path: 'proof', message: 'No se envió ningún archivo' }]);
    }
    const file = files[0];
    if (!PROOF_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype as never)) {
      throw new ValidationError([
        { path: 'proof', message: `Tipo no permitido: ${file.mimetype}` },
      ]);
    }

    const ext = file.mimetype.split('/').pop() ?? 'bin';
    const filename = `${randomUUID()}.${ext === 'jpeg' ? 'jpg' : ext}`;
    const storagePath = `${STORAGE_PATHS.PAYMENT_PROOFS}/${req.params.code}/${filename}`;
    const fileRef = storage.bucket().file(storagePath);

    const saveOptions: Parameters<typeof fileRef.save>[1] = {
      contentType: file.mimetype,
      metadata: { cacheControl: 'private, max-age=3600' },
    };
    // public: true falla en el Storage emulator; solo en prod
    if (!isEmulator()) saveOptions.public = true;

    await fileRef.save(file.buffer, saveOptions);

    const url = buildProofUrl(storagePath);
    const order = await ordersService.attachProof(req.params.code, storagePath, url);

    res.status(201).json({
      code: order.code,
      paymentStatus: order.paymentStatus,
      message: 'Captura recibida. Un asesor validará el pago en breve.',
    });
  }),

  getShippingRates: asyncHandler(async (_req: Request, res: Response) => {
    const { rates } = await settingsService.getShippingRates();
    res.json({ rates });
  }),

  getPaymentMethods: asyncHandler(async (_req: Request, res: Response) => {
    const config = await settingsService.getPublicPaymentConfig();
    res.json(config);
  }),

  /**
   * Webhook de MercadoPago (IPN v2). MP nos avisa cuando cambia un pago;
   * consultamos el pago real por su ID y confirmamos/rechazamos la orden.
   * Siempre respondemos 200 rápido para que MP no reintente en bucle.
   */
  mercadopagoWebhook: asyncHandler(async (req: Request, res: Response) => {
    // MP manda el id del pago en query (?id=&topic=payment) o en el body (data.id).
    const type = (req.query.type ?? req.query.topic ?? req.body?.type) as string | undefined;
    const paymentId =
      (req.query['data.id'] as string | undefined) ??
      (req.body?.data?.id as string | undefined) ??
      (req.query.id as string | undefined);

    // Solo nos interesan notificaciones de pago con id.
    if (type && type !== 'payment') {
      res.status(200).json({ received: true, ignored: type });
      return;
    }
    if (!paymentId) {
      res.status(200).json({ received: true, ignored: 'no-payment-id' });
      return;
    }

    try {
      const result = await mercadopagoService.fetchPaymentResult(String(paymentId));
      if (result.orderCode) {
        await ordersService.confirmGatewayPayment(result.orderCode, {
          approved: result.approved,
          transactionId: result.transactionId,
          rawPayload: result.rawPayload,
        });
      }
    } catch (err) {
      // No propagamos: responder 200 evita que MP reintente indefinidamente.
      // eslint-disable-next-line no-console
      console.error('[mercadopago-webhook] error procesando pago', paymentId, err);
    }

    res.status(200).json({ received: true });
  }),
};
