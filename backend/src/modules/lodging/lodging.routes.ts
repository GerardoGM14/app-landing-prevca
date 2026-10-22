import { Router } from 'express';
import { validate } from '../../shared/middleware/validate.middleware';
import { lodgingController } from './lodging.controller';
import {
  blockNightsSchema,
  bookingQuerySchema,
  calendarQuerySchema,
  cancelBookingSchema,
  createManualBookingSchema,
  setPricesSchema,
  unblockNightsSchema,
  updateBookingSchema,
  updateLodgingConfigSchema,
} from './lodging.schema';

/** Rutas admin, montadas en /admin/lodging (requieren auth de admin). */
export const lodgingRouter = Router();

// Departamentos: configuración, precios y calendario
lodgingRouter.get('/units', lodgingController.listUnits);
lodgingRouter.patch('/units/:id', validate(updateLodgingConfigSchema), lodgingController.updateConfig);
lodgingRouter.post('/units/:id/prices', validate(setPricesSchema), lodgingController.setPrices);
lodgingRouter.get('/units/:id/calendar', validate(calendarQuerySchema, 'query'), lodgingController.getCalendar);
lodgingRouter.post('/units/:id/block', validate(blockNightsSchema), lodgingController.blockNights);
lodgingRouter.post('/units/:id/unblock', validate(unblockNightsSchema), lodgingController.unblockNights);

// Reservas
lodgingRouter.get('/bookings', validate(bookingQuerySchema, 'query'), lodgingController.listBookings);
lodgingRouter.post('/bookings', validate(createManualBookingSchema), lodgingController.createManualBooking);
lodgingRouter.get('/bookings/:id', lodgingController.getBooking);
lodgingRouter.patch('/bookings/:id', validate(updateBookingSchema), lodgingController.updateBooking);
lodgingRouter.post('/bookings/:id/cancel', validate(cancelBookingSchema), lodgingController.cancelBooking);
