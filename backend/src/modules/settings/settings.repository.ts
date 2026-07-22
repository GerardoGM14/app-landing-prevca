import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../config/firebase';
import {
  COLLECTIONS,
  DEFAULT_SHIPPING_RATES,
  PeruDepartment,
  SETTINGS_DOCS,
} from '../../config/constants';

const col = () => db.collection(COLLECTIONS.SETTINGS);

export interface ShippingRatesDoc {
  rates: Record<PeruDepartment, number>;
  updatedAt: FirebaseFirestore.Timestamp | null;
}

export interface PaymentConfigDoc {
  yapeEnabled: boolean;
  yapeQrUrl: string | null;
  yapeNumber: string | null;
  yapeOwnerName: string | null;
  transferEnabled: boolean;
  transferBankName: string | null;
  transferAccountNumber: string | null;
  transferAccountHolder: string | null;
  transferCci: string | null;
  paypalEnabled: boolean;
  paypalClientId: string | null;
  culqiEnabled: boolean;
  culqiPublicKey: string | null;
  mercadopagoEnabled: boolean;
  mercadopagoPublicKey: string | null;
  updatedAt: FirebaseFirestore.Timestamp | null;
}

const DEFAULT_PAYMENT_CONFIG: Omit<PaymentConfigDoc, 'updatedAt'> = {
  yapeEnabled: false,
  yapeQrUrl: null,
  yapeNumber: null,
  yapeOwnerName: null,
  transferEnabled: false,
  transferBankName: null,
  transferAccountNumber: null,
  transferAccountHolder: null,
  transferCci: null,
  paypalEnabled: false,
  paypalClientId: null,
  culqiEnabled: false,
  culqiPublicKey: null,
  mercadopagoEnabled: false,
  mercadopagoPublicKey: null,
};

export const settingsRepository = {
  async getShippingRates(): Promise<ShippingRatesDoc> {
    const doc = await col().doc(SETTINGS_DOCS.SHIPPING_RATES).get();
    if (!doc.exists) {
      return { rates: { ...DEFAULT_SHIPPING_RATES }, updatedAt: null };
    }
    const data = doc.data() as Partial<ShippingRatesDoc>;
    return {
      rates: { ...DEFAULT_SHIPPING_RATES, ...(data.rates ?? {}) },
      updatedAt: data.updatedAt ?? null,
    };
  },

  async setShippingRates(rates: Partial<Record<PeruDepartment, number>>): Promise<void> {
    const current = await settingsRepository.getShippingRates();
    const merged: Record<PeruDepartment, number> = { ...current.rates, ...rates };
    await col()
      .doc(SETTINGS_DOCS.SHIPPING_RATES)
      .set({ rates: merged, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  },

  async getPaymentConfig(): Promise<PaymentConfigDoc> {
    const doc = await col().doc(SETTINGS_DOCS.PAYMENT_CONFIG).get();
    if (!doc.exists) {
      return { ...DEFAULT_PAYMENT_CONFIG, updatedAt: null };
    }
    return {
      ...DEFAULT_PAYMENT_CONFIG,
      updatedAt: null,
      ...(doc.data() as Partial<PaymentConfigDoc>),
    };
  },

  async setPaymentConfig(input: Partial<Omit<PaymentConfigDoc, 'updatedAt'>>): Promise<void> {
    await col()
      .doc(SETTINGS_DOCS.PAYMENT_CONFIG)
      .set({ ...input, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  },
};
