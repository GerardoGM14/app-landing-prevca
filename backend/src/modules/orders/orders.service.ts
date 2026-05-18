import { NotFoundError, ValidationError } from '../../shared/errors/app-error';
import { productsRepository } from '../products/products.repository';
import { generateOrderCode, ordersRepository, OrderDoc, OrderItem } from './orders.repository';
import { CreateOrderInput, OrderQuery, UpdateOrderInput } from './orders.schema';

export const ordersService = {
  async list(query: OrderQuery) {
    return ordersRepository.list(query);
  },

  async findById(id: string) {
    const order = await ordersRepository.findById(id);
    if (!order) throw new NotFoundError('Cotización');
    return order;
  },

  async create(input: CreateOrderInput) {
    // Snapshot de los productos al momento del pedido
    const products = await Promise.all(
      input.items.map((item) => productsRepository.findById(item.productId)),
    );

    const snapshots: OrderItem[] = [];
    input.items.forEach((item, idx) => {
      const product = products[idx];
      if (!product) {
        throw new ValidationError([
          { path: `items[${idx}].productId`, message: `Producto ${item.productId} no encontrado` },
        ]);
      }
      if (!product.isActive) {
        throw new ValidationError([
          { path: `items[${idx}].productId`, message: `Producto "${product.title}" no está disponible` },
        ]);
      }
      snapshots.push({
        productId: product.id,
        titleSnapshot: product.title,
        priceSnapshot: product.price ?? null,
        quantity: item.quantity,
      });
    });

    const code = await generateOrderCode();

    const id = await ordersRepository.create({
      code,
      customer: {
        name: input.customer.name,
        email: input.customer.email,
        phone: input.customer.phone ?? null,
        company: input.customer.company ?? null,
      },
      message: input.message ?? null,
      status: 'PENDIENTE',
      internalNotes: null,
      items: snapshots,
    });

    return ordersService.findById(id);
  },

  async update(id: string, input: UpdateOrderInput) {
    const existing = await ordersRepository.findById(id);
    if (!existing) throw new NotFoundError('Cotización');
    await ordersRepository.update(id, input as Partial<OrderDoc>);
    return ordersService.findById(id);
  },

  async delete(id: string) {
    const existing = await ordersRepository.findById(id);
    if (!existing) throw new NotFoundError('Cotización');
    await ordersRepository.delete(id);
  },
};
