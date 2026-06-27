import { useEffect, useState, type FormEvent } from 'react';
import { FaSave } from 'react-icons/fa';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { Toggle } from '@/components/ui/Toggle';
import { useToast } from '@/core/toast/ToastContext';
import type { PaymentConfig } from '@/types/api';
import { usePaymentConfig, useUpdatePaymentConfig } from '../hooks/useSettings';

const buildInitial = (cfg?: PaymentConfig): Omit<PaymentConfig, 'updatedAt'> => ({
  yapeEnabled: cfg?.yapeEnabled ?? false,
  yapeQrUrl: cfg?.yapeQrUrl ?? null,
  yapeNumber: cfg?.yapeNumber ?? null,
  yapeOwnerName: cfg?.yapeOwnerName ?? null,
  transferEnabled: cfg?.transferEnabled ?? false,
  transferBankName: cfg?.transferBankName ?? null,
  transferAccountNumber: cfg?.transferAccountNumber ?? null,
  transferAccountHolder: cfg?.transferAccountHolder ?? null,
  transferCci: cfg?.transferCci ?? null,
  paypalEnabled: cfg?.paypalEnabled ?? false,
  paypalClientId: cfg?.paypalClientId ?? null,
  culqiEnabled: cfg?.culqiEnabled ?? false,
  culqiPublicKey: cfg?.culqiPublicKey ?? null,
});

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="font-display font-extrabold uppercase tracking-widest text-prevca-dark text-sm">
    {children}
  </h3>
);

export const PaymentConfigPage = () => {
  const { data, isLoading } = usePaymentConfig();
  const update = useUpdatePaymentConfig();
  const toast = useToast();

  const [form, setForm] = useState<Omit<PaymentConfig, 'updatedAt'>>(buildInitial());

  useEffect(() => {
    if (data) setForm(buildInitial(data));
  }, [data]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await update.mutateAsync(form);
      toast.success('Configuración de pagos guardada.', 'Métodos de pago actualizados');
    } catch (err) {
      toast.error((err as Error).message, 'No se pudo guardar');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Configuración"
        title="Métodos de pago"
        description="Habilite y configure las pasarelas que se mostrarán al cliente en el checkout. Solo aparecen los métodos habilitados."
      />

      <form onSubmit={handleSubmit} className="max-w-5xl space-y-6">
        {/* === YAPE === */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <SectionTitle>Yape</SectionTitle>
              <Toggle
                label=""
                checked={form.yapeEnabled}
                onChange={(v) => set('yapeEnabled', v)}
              />
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="URL del código QR (imagen pública)"
              hint="Sube tu QR a Firebase Storage o un CDN y pega el enlace aquí. Pronto reemplazaremos esto por uploader directo."
              placeholder="https://..."
              value={form.yapeQrUrl ?? ''}
              onChange={(e) => set('yapeQrUrl', e.target.value || null)}
              disabled={!form.yapeEnabled}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Número Yape"
                placeholder="+51 987 654 321"
                value={form.yapeNumber ?? ''}
                onChange={(e) => set('yapeNumber', e.target.value || null)}
                disabled={!form.yapeEnabled}
              />
              <Input
                label="Titular de la cuenta"
                placeholder="Nombre completo"
                value={form.yapeOwnerName ?? ''}
                onChange={(e) => set('yapeOwnerName', e.target.value || null)}
                disabled={!form.yapeEnabled}
              />
            </div>
          </CardBody>
        </Card>

        {/* === TRANSFERENCIA === */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <SectionTitle>Transferencia bancaria</SectionTitle>
              <Toggle
                label=""
                checked={form.transferEnabled}
                onChange={(v) => set('transferEnabled', v)}
              />
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Banco"
                placeholder="BCP / Interbank / BBVA..."
                value={form.transferBankName ?? ''}
                onChange={(e) => set('transferBankName', e.target.value || null)}
                disabled={!form.transferEnabled}
              />
              <Input
                label="Titular"
                value={form.transferAccountHolder ?? ''}
                onChange={(e) => set('transferAccountHolder', e.target.value || null)}
                disabled={!form.transferEnabled}
              />
              <Input
                label="N° de cuenta"
                placeholder="194-1234567-0-89"
                value={form.transferAccountNumber ?? ''}
                onChange={(e) => set('transferAccountNumber', e.target.value || null)}
                disabled={!form.transferEnabled}
              />
              <Input
                label="CCI (Código Interbancario)"
                placeholder="00219400123456701234"
                value={form.transferCci ?? ''}
                onChange={(e) => set('transferCci', e.target.value || null)}
                disabled={!form.transferEnabled}
              />
            </div>
          </CardBody>
        </Card>

        {/* === PAYPAL === */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <SectionTitle>PayPal</SectionTitle>
              <Toggle
                label=""
                checked={form.paypalEnabled}
                onChange={(v) => set('paypalEnabled', v)}
              />
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="Client ID (PayPal Developer)"
              hint="Obtenido en developer.paypal.com → My Apps & Credentials → REST API apps."
              placeholder="ASdfGHJklMnoPqrSTUvwXYZ..."
              value={form.paypalClientId ?? ''}
              onChange={(e) => set('paypalClientId', e.target.value || null)}
              disabled={!form.paypalEnabled}
            />
            <p className="text-xs text-gray-500 font-body">
              ⚠️ El Client Secret se configura por separado como variable de entorno en
              el backend (no se guarda en Firestore por seguridad).
            </p>
          </CardBody>
        </Card>

        {/* === CULQI === */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <SectionTitle>Culqi</SectionTitle>
              <Toggle
                label=""
                checked={form.culqiEnabled}
                onChange={(v) => set('culqiEnabled', v)}
              />
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="Public Key (pk_live_... o pk_test_...)"
              hint="Obtenido en panel.culqi.com → Desarrollo → Llaves API."
              placeholder="pk_live_..."
              value={form.culqiPublicKey ?? ''}
              onChange={(e) => set('culqiPublicKey', e.target.value || null)}
              disabled={!form.culqiEnabled}
            />
            <p className="text-xs text-gray-500 font-body">
              ⚠️ La Secret Key (sk_live_...) se configura por separado como variable de
              entorno en el backend.
            </p>
          </CardBody>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" loading={update.isPending} size="lg">
            <FaSave />
            Guardar configuración
          </Button>
        </div>
      </form>
    </div>
  );
};
