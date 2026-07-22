import { DEFAULT_SHIPPING_RATES, PeruDepartment } from '../../config/constants';
import { settingsRepository } from './settings.repository';
import {
  UpdatePaymentConfigInput,
  UpdateShippingRatesInput,
} from './settings.schema';

export const settingsService = {
  async getShippingRates() {
    return settingsRepository.getShippingRates();
  },

  /**
   * Devuelve el costo de envío para un departamento. Si no está configurado
   * en Firestore, cae al default.
   */
  async getShippingRate(department: PeruDepartment): Promise<number> {
    const { rates } = await settingsRepository.getShippingRates();
    return rates[department] ?? DEFAULT_SHIPPING_RATES[department];
  },

  async updateShippingRates(input: UpdateShippingRatesInput) {
    await settingsRepository.setShippingRates(input.rates);
    return settingsRepository.getShippingRates();
  },

  async getPaymentConfig() {
    return settingsRepository.getPaymentConfig();
  },

  /**
   * Versión pública del payment config: oculta keys privadas si las hubiera
   * (por ahora solo las public keys, todas seguras de exponer).
   */
  async getPublicPaymentConfig() {
    const cfg = await settingsRepository.getPaymentConfig();
    return {
      yape: cfg.yapeEnabled
        ? {
            qrUrl: cfg.yapeQrUrl,
            number: cfg.yapeNumber,
            ownerName: cfg.yapeOwnerName,
          }
        : null,
      transfer: cfg.transferEnabled
        ? {
            bankName: cfg.transferBankName,
            accountNumber: cfg.transferAccountNumber,
            accountHolder: cfg.transferAccountHolder,
            cci: cfg.transferCci,
          }
        : null,
      paypal: cfg.paypalEnabled ? { clientId: cfg.paypalClientId } : null,
      culqi: cfg.culqiEnabled ? { publicKey: cfg.culqiPublicKey } : null,
      mercadopago: cfg.mercadopagoEnabled ? { publicKey: cfg.mercadopagoPublicKey } : null,
    };
  },

  async updatePaymentConfig(input: UpdatePaymentConfigInput) {
    await settingsRepository.setPaymentConfig(input);
    return settingsRepository.getPaymentConfig();
  },
};
