import { Timestamp } from 'firebase-admin/firestore';
import {
  PaymentMethod,
  PaymentStatus,
  WOOD_TYPE_LABELS,
  WoodType,
} from '../../config/constants';
import { ConflictError, NotFoundError, ValidationError } from '../../shared/errors/app-error';
import { productsRepository, Product } from '../products/products.repository';
import { settingsService } from '../settings/settings.service';
import {
  generateOrderCode,
  ordersRepository,
  OrderDoc,
  OrderItem,
} from './orders.repository';
import {
  CheckoutInput,
  CreateOrderInput,
  OrderQuery,
  UpdateOrderInput,
} from './orders.schema';

/**
 * Determina el paymentStatus inicial según el método de pago.
 * Yape/Transferencia → esperan que cliente suba captura.
 * PayPal/Culqi → esperan callback del webhook.
 */
const initialPaymentStatus = (method: PaymentMethod): PaymentStatus => {
  if (method === 'QUOTE') return 'NONE';
  // MercadoPago no sube captura: el webhook de la pasarela confirma el pago.
  if (method === 'MERCADOPAGO') return 'PENDING_VERIFICATION';
  return 'PENDING_PROOF';
};

/**
 * Resuelve el precio unitario de un item en SERVIDOR. Si el producto tiene
 * variantes por tipo de madera, exige que el cliente haya elegido una válida
 * y usa ese precio; nunca el que venga del cliente.
 */
const resolveUnitPrice = (
  product: Product,
  woodType: WoodType | undefined,
  idx: number,
): number | null => {
  const variants = product.woodVariants ?? [];
  if (variants.length === 0) return product.price;

  if (!woodType) {
    throw new ValidationError([
      {
        path: `items[${idx}].woodType`,
        message: `Elija el tipo de madera para "${product.title}"`,
      },
    ]);
  }
  const variant = variants.find((v) => v.woodType === woodType);
  if (!variant) {
    throw new ValidationError([
      {
        path: `items[${idx}].woodType`,
        message: `"${product.title}" no está disponible en ${WOOD_TYPE_LABELS[woodType]}`,
      },
    ]);
  }
  return variant.price;
};

const buildItemsSnapshot = (
  inputItems: { productId: string; quantity: number; woodType?: WoodType }[],
  products: (Product | null)[],
  requireDirectPurchase: boolean,
): { snapshots: OrderItem[]; subtotal: number } => {
  const snapshots: OrderItem[] = [];
  let subtotal = 0;

  inputItems.forEach((item, idx) => {
    const product = products[idx];
    if (!product) {
      throw new ValidationError([
        { path: `items[${idx}].productId`, message: `Producto ${item.productId} no encontrado` },
      ]);
    }
    if (!product.isActive) {
      throw new ValidationError([
        {
          path: `items[${idx}].productId`,
          message: `Producto "${product.title}" no está disponible`,
        },
      ]);
    }

    // Precio unitario resuelto en servidor (variante de madera si aplica)
    const unitPrice = resolveUnitPrice(product, item.woodType, idx);

    if (requireDirectPurchase) {
      if (!product.allowsDirectPurchase) {
        throw new ValidationError([
          {
            path: `items[${idx}].productId`,
            message: `"${product.title}" solo está disponible por cotización, no acepta pago directo`,
          },
        ]);
      }
      if (unitPrice === null) {
        throw new ValidationError([
          {
            path: `items[${idx}].productId`,
            message: `"${product.title}" no tiene precio definido`,
          },
        ]);
      }
      if (product.trackStock && product.stock < item.quantity) {
        throw new ValidationError([
          {
            path: `items[${idx}].quantity`,
            message: `Stock insuficiente para "${product.title}" (disponible: ${product.stock})`,
          },
        ]);
      }
    }

    const lineTotal = requireDirectPurchase && unitPrice !== null
      ? +(unitPrice * item.quantity).toFixed(2)
      : null;

    if (lineTotal !== null) subtotal = +(subtotal + lineTotal).toFixed(2);

    snapshots.push({
      productId: product.id,
      titleSnapshot: product.title,
      priceSnapshot: unitPrice,
      quantity: item.quantity,
      lineTotal,
      woodType: item.woodType ?? null,
    });
  });

  return { snapshots, subtotal };
};

export const ordersService = {
  async list(query: OrderQuery) {
    return ordersRepository.list(query);
  },

  async findById(id: string) {
    const order = await ordersRepository.findById(id);
    if (!order) throw new NotFoundError('Cotización');
    return order;
  },

  async findByCode(code: string) {
    const order = await ordersRepository.findByCode(code);
    if (!order) throw new NotFoundError('Pedido');
    return order;
  },

  /**
   * Cotización tradicional (sin pago). Mantiene compatibilidad con el flujo existente.
   */
  async create(input: CreateOrderInput) {
    const products = await Promise.all(
      input.items.map((item) => productsRepository.findById(item.productId)),
    );

    const { snapshots } = buildItemsSnapshot(input.items, products, false);
    const code = await generateOrderCode('COT');

    const id = await ordersRepository.create({
      code,
      customer: {
        name: input.customer.name,
        email: input.customer.email,
        phone: input.customer.phone ?? null,
        company: input.customer.company ?? null,
      },
      shipping: null,
      billing: null,
      message: input.message ?? null,
      status: 'PENDIENTE',
      paymentMethod: 'QUOTE',
      paymentStatus: 'NONE',
      payment: {
        proofPath: null,
        proofUrl: null,
        transactionId: null,
        rawPayload: null,
        reportedAt: null,
        paidAt: null,
      },
      subtotal: null,
      shippingCost: null,
      total: null,
      items: snapshots,
      internalNotes: null,
    });

    return ordersService.findById(id);
  },

  /**
   * Checkout con pago: valida que TODOS los productos permitan pago directo,
   * calcula totales en servidor (NUNCA confía en el cliente) y crea la orden.
   */
  async checkout(input: CheckoutInput) {
    const products = await Promise.all(
      input.items.map((item) => productsRepository.findById(item.productId)),
    );

    const { snapshots, subtotal } = buildItemsSnapshot(input.items, products, true);

    // Calcular envío server-side a partir de la tarifa configurada por departamento
    const shippingCost = await settingsService.getShippingRate(input.shipping.department);
    const total = +(subtotal + shippingCost).toFixed(2);

    if (total <= 0) {
      throw new ConflictError('El total de la orden debe ser mayor a cero');
    }

    const code = await generateOrderCode('ORD');

    const id = await ordersRepository.create({
      code,
      customer: {
        name: input.customer.name,
        email: input.customer.email,
        phone: input.customer.phone ?? null,
        company: input.customer.company ?? null,
      },
      shipping: {
        department: input.shipping.department,
        province: input.shipping.province,
        district: input.shipping.district,
        address: input.shipping.address,
        reference: input.shipping.reference ?? null,
        cost: shippingCost,
      },
      billing: {
        receiptType: input.billing.receiptType,
        documentType: input.billing.documentType,
        documentNumber: input.billing.documentNumber,
        businessName: input.billing.businessName ?? null,
      },
      message: input.message ?? null,
      status: 'PENDIENTE',
      paymentMethod: input.paymentMethod,
      paymentStatus: initialPaymentStatus(input.paymentMethod),
      payment: {
        proofPath: null,
        proofUrl: null,
        transactionId: null,
        rawPayload: null,
        reportedAt: null,
        paidAt: null,
      },
      subtotal,
      shippingCost,
      total,
      items: snapshots,
      internalNotes: null,
    });

    return ordersService.findById(id);
  },

  /**
   * Cliente sube captura de pago (Yape/Transferencia). Cambia status a
   * PENDING_VERIFICATION para que el admin la apruebe manualmente.
   */
  async attachProof(code: string, proofPath: string, proofUrl: string) {
    const order = await ordersService.findByCode(code);

    if (order.paymentMethod !== 'YAPE' && order.paymentMethod !== 'TRANSFERENCIA') {
      throw new ConflictError(
        'Solo las órdenes con Yape o Transferencia aceptan captura de pago',
      );
    }
    if (order.paymentStatus !== 'PENDING_PROOF') {
      throw new ConflictError('Esta orden no está esperando captura de pago');
    }

    await ordersRepository.updatePayment(
      order.id,
      {
        proofPath,
        proofUrl,
        reportedAt: Timestamp.now(),
      },
      'PENDING_VERIFICATION',
    );

    return ordersService.findById(order.id);
  },

  /**
   * Confirma (o rechaza) el pago de una orden de pasarela (MercadoPago) a partir
   * del webhook. Idempotente: si ya está PAID no la vuelve a tocar.
   */
  async confirmGatewayPayment(
    code: string,
    result: {
      approved: boolean;
      transactionId: string | null;
      rawPayload: Record<string, unknown> | null;
    },
  ) {
    const order = await ordersService.findByCode(code);

    if (order.paymentMethod !== 'MERCADOPAGO') {
      throw new ConflictError('Esta orden no se paga con MercadoPago');
    }
    // Idempotencia: no reprocesar un pago ya confirmado.
    if (order.paymentStatus === 'PAID') return order;

    if (result.approved) {
      await ordersRepository.updatePayment(
        order.id,
        {
          transactionId: result.transactionId,
          rawPayload: result.rawPayload,
          paidAt: Timestamp.now(),
        },
        'PAID',
      );
    } else {
      await ordersRepository.updatePayment(
        order.id,
        {
          transactionId: result.transactionId,
          rawPayload: result.rawPayload,
        },
        'REJECTED',
      );
    }

    return ordersService.findById(order.id);
  },

  async update(id: string, input: UpdateOrderInput) {
    const existing = await ordersRepository.findById(id);
    if (!existing) throw new NotFoundError('Cotización');

    // Si el admin marca como PAID, registrar paidAt
    if (input.paymentStatus === 'PAID' && existing.paymentStatus !== 'PAID') {
      await ordersRepository.updatePayment(id, { paidAt: Timestamp.now() }, 'PAID');
    }

    const updateData: Partial<OrderDoc> = {};
    if (input.status !== undefined) updateData.status = input.status;
    if (input.paymentStatus !== undefined && input.paymentStatus !== 'PAID') {
      updateData.paymentStatus = input.paymentStatus;
    }
    if (input.internalNotes !== undefined) updateData.internalNotes = input.internalNotes;

    if (Object.keys(updateData).length > 0) {
      await ordersRepository.update(id, updateData);
    }

    return ordersService.findById(id);
  },

  async delete(id: string) {
    const existing = await ordersRepository.findById(id);
    if (!existing) throw new NotFoundError('Cotización');
    await ordersRepository.delete(id);
  },
};
