import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/utils/async-handler';
import { ValidationError } from '../../shared/errors/app-error';
import { lodgingService } from './lodging.service';
import {
  BlockNightsInput,
  BookingQuery,
  CalendarQuery,
  CancelBookingInput,
  CreateBookingInput,
  CreateManualBookingInput,
  SetPricesInput,
  UnblockNightsInput,
  UpdateBookingInput,
  UpdateLodgingConfigInput,
} from './lodging.schema';

type IdParams = { id: string };
type SlugParams = { slug: string };
type CodeParams = { code: string };

export const lodgingController = {
  /* ------------------------------ Público ------------------------------ */

  getPublicUnit: asyncHandler(async (req: Request<SlugParams>, res: Response) => {
    res.json(await lodgingService.getPublicUnit(req.params.slug));
  }),

  createBooking: asyncHandler(async (req: Request, res: Response) => {
    const result = await lodgingService.createWebBooking(req.body as CreateBookingInput);
    res.status(201).json(result);
  }),

  culqiCharge: asyncHandler(async (req: Request<CodeParams>, res: Response) => {
    const token = String((req.body as { token?: string })?.token ?? '').trim();
    if (!token) throw new ValidationError([{ path: 'token', message: 'Falta el token de Culqi' }]);

    const { booking, approved, declineMessage } = await lodgingService.processCulqiCharge(
      req.params.code,
      token,
    );
    // Igual que en pedidos: 402 = rechazado, con cuerpo válido para mostrar el motivo.
    res.status(approved ? 200 : 402).json({
      ...booking,
      approved,
      message: approved
        ? booking.status === 'REVISAR'
          ? 'Recibimos su pago, pero una de las noches acaba de ocuparse. Lo contactaremos para resolverlo.'
          : '¡Reserva confirmada!'
        : declineMessage ?? 'El pago fue rechazado.',
    });
  }),

  /* ------------------------------- Admin ------------------------------- */

  listUnits: asyncHandler(async (_req: Request, res: Response) => {
    res.json({ items: await lodgingService.listUnits() });
  }),

  updateConfig: asyncHandler(async (req: Request<IdParams>, res: Response) => {
    res.json(await lodgingService.updateConfig(req.params.id, req.body as UpdateLodgingConfigInput));
  }),

  setPrices: asyncHandler(async (req: Request<IdParams>, res: Response) => {
    res.json(await lodgingService.setPrices(req.params.id, req.body as SetPricesInput));
  }),

  getCalendar: asyncHandler(async (req: Request<IdParams>, res: Response) => {
    res.json(await lodgingService.getCalendar(req.params.id, req.query as unknown as CalendarQuery));
  }),

  blockNights: asyncHandler(async (req: Request<IdParams>, res: Response) => {
    await lodgingService.blockNights(req.params.id, req.body as BlockNightsInput);
    res.status(204).end();
  }),

  unblockNights: asyncHandler(async (req: Request<IdParams>, res: Response) => {
    res.json(await lodgingService.unblockNights(req.params.id, req.body as UnblockNightsInput));
  }),

  listBookings: asyncHandler(async (req: Request, res: Response) => {
    res.json(await lodgingService.listBookings(req.query as unknown as BookingQuery));
  }),

  getBooking: asyncHandler(async (req: Request<IdParams>, res: Response) => {
    res.json(await lodgingService.getBooking(req.params.id));
  }),

  createManualBooking: asyncHandler(async (req: Request, res: Response) => {
    res.status(201).json(await lodgingService.createManualBooking(req.body as CreateManualBookingInput));
  }),

  cancelBooking: asyncHandler(async (req: Request<IdParams>, res: Response) => {
    const { reason } = req.body as CancelBookingInput;
    res.json(await lodgingService.cancelBooking(req.params.id, reason ?? null));
  }),

  updateBooking: asyncHandler(async (req: Request<IdParams>, res: Response) => {
    res.json(await lodgingService.updateBooking(req.params.id, req.body as UpdateBookingInput));
  }),
};
