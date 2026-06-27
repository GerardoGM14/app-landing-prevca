import { useEffect, useState, type FormEvent } from 'react';
import { FaSave } from 'react-icons/fa';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/core/toast/ToastContext';
import {
  PERU_DEPARTMENTS,
  PERU_DEPARTMENT_LABELS,
  type PeruDepartment,
} from '@/types/api';
import { useShippingRates, useUpdateShippingRates } from '../hooks/useSettings';

export const ShippingRatesPage = () => {
  const { data, isLoading } = useShippingRates();
  const update = useUpdateShippingRates();
  const toast = useToast();

  const [rates, setRates] = useState<Record<PeruDepartment, number>>(
    () => ({}) as Record<PeruDepartment, number>,
  );

  useEffect(() => {
    if (data) setRates(data.rates);
  }, [data]);

  const handleChange = (dept: PeruDepartment, value: string) => {
    const n = Number(value);
    setRates((prev) => ({ ...prev, [dept]: isNaN(n) ? 0 : n }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await update.mutateAsync({ rates });
      toast.success('Tarifas de envío guardadas correctamente.', 'Configuración actualizada');
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
        title="Tarifas de envío"
        description="Costo de envío en soles por departamento (IGV incluido). Se aplica al cliente al hacer checkout según la dirección que elija."
      />

      <form onSubmit={handleSubmit} className="max-w-5xl">
        <Card>
          <CardHeader>
            <h3 className="font-display font-extrabold uppercase tracking-widest text-prevca-dark text-sm">
              25 departamentos del Perú
            </h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PERU_DEPARTMENTS.map((dept) => (
                <Input
                  key={dept}
                  label={PERU_DEPARTMENT_LABELS[dept]}
                  type="number"
                  min="0"
                  step="0.01"
                  value={rates[dept] ?? 0}
                  onChange={(e) => handleChange(dept, e.target.value)}
                  hint="Soles"
                />
              ))}
            </div>
          </CardBody>
        </Card>

        <div className="flex justify-end mt-6">
          <Button type="submit" loading={update.isPending} size="lg">
            <FaSave />
            Guardar tarifas
          </Button>
        </div>
      </form>
    </div>
  );
};
