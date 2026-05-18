import { useState, type FormEvent } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Toggle } from '@/components/ui/Toggle';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { DIVISION_LABELS, type Division, type Product } from '@/types/api';
import type { ProductInput } from '../api/products.api';

interface ProductFormProps {
  initial?: Product;
  submitLabel: string;
  loading?: boolean;
  onSubmit: (input: ProductInput) => Promise<void>;
}

const buildInitial = (initial?: Product): ProductInput => ({
  slug: initial?.slug ?? '',
  ref: initial?.ref ?? '',
  title: initial?.title ?? '',
  division: initial?.division ?? 'MADERA',
  categoryId: initial?.categoryId ?? null,
  shortDesc: initial?.shortDesc ?? '',
  description: initial?.description ?? '',
  specs: initial?.specs ?? '',
  features: initial?.features ?? [],
  price: initial?.price ?? null,
  showPrice: initial?.showPrice ?? false,
  stock: initial?.stock ?? 0,
  showStock: initial?.showStock ?? false,
  trackStock: initial?.trackStock ?? true,
  isActive: initial?.isActive ?? true,
  isFeatured: initial?.isFeatured ?? false,
  order: initial?.order ?? 0,
});

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="font-display font-extrabold uppercase tracking-widest text-prevca-dark text-sm">
    {children}
  </h3>
);

export const ProductForm = ({ initial, submitLabel, loading, onSubmit }: ProductFormProps) => {
  const [form, setForm] = useState<ProductInput>(buildInitial(initial));
  const [featureDraft, setFeatureDraft] = useState('');

  const update = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const addFeature = () => {
    const value = featureDraft.trim();
    if (!value) return;
    update('features', [...form.features, value]);
    setFeatureDraft('');
  };

  const removeFeature = (idx: number) =>
    update(
      'features',
      form.features.filter((_, i) => i !== idx),
    );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit({
      ...form,
      categoryId: form.categoryId || null,
      specs: form.specs?.trim() ? form.specs : null,
      price: form.price === null || Number.isNaN(form.price) ? null : Number(form.price),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* === Columna principal === */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <SectionTitle>Información general</SectionTitle>
          </CardHeader>
          <CardBody className="space-y-5">
            <Input
              label="Título"
              required
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="Slug (URL)"
                required
                hint="Lowercase con guiones, ej. pino-radiata"
                value={form.slug}
                onChange={(e) => update('slug', e.target.value)}
              />
              <Input
                label="Ref / SKU"
                required
                value={form.ref}
                onChange={(e) => update('ref', e.target.value)}
              />
            </div>
            <Input
              label="Especificaciones (opcional)"
              placeholder="Ej. Dimensiones: 2x4 a 8x12"
              value={form.specs ?? ''}
              onChange={(e) => update('specs', e.target.value)}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <SectionTitle>Descripciones</SectionTitle>
          </CardHeader>
          <CardBody className="space-y-5">
            <Textarea
              label="Descripción corta"
              rows={2}
              required
              hint="Aparece en el listado y tarjetas. Máx. 300 caracteres."
              value={form.shortDesc}
              onChange={(e) => update('shortDesc', e.target.value)}
            />
            <Textarea
              label="Descripción detallada"
              rows={8}
              required
              hint="Texto completo de la página de detalle del producto."
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <SectionTitle>Características destacadas</SectionTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Ej. Secado al horno garantizado"
                value={featureDraft}
                onChange={(e) => setFeatureDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addFeature();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addFeature}>
                <FaPlus />
                Agregar
              </Button>
            </div>
            {form.features.length > 0 ? (
              <ul className="space-y-2">
                {form.features.map((feat, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between gap-3 border border-gray-200 px-4 py-3 bg-gray-50"
                  >
                    <span className="text-sm font-body text-prevca-dark">{feat}</span>
                    <button
                      type="button"
                      onClick={() => removeFeature(idx)}
                      className="text-red-500 hover:bg-red-50 p-2 cursor-pointer transition-colors"
                      aria-label="Eliminar"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-400 font-body italic">
                Aún no hay características. Use el campo de arriba para agregar.
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* === Sidebar derecha (sticky en desktop) === */}
      <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-6 lg:self-start">
        <Card>
          <CardHeader>
            <SectionTitle>Clasificación</SectionTitle>
          </CardHeader>
          <CardBody className="space-y-5">
            <Select
              label="División"
              required
              value={form.division}
              onChange={(e) => update('division', e.target.value as Division)}
            >
              {Object.entries(DIVISION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Input
              label="Orden"
              type="number"
              hint="Menor número aparece primero"
              value={form.order}
              onChange={(e) => update('order', Number(e.target.value) || 0)}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <SectionTitle>Precio y stock</SectionTitle>
          </CardHeader>
          <CardBody className="space-y-5">
            <Input
              label="Precio (opcional)"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={form.price ?? ''}
              onChange={(e) =>
                update('price', e.target.value === '' ? null : Number(e.target.value))
              }
            />
            <Input
              label="Stock"
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => update('stock', Number(e.target.value) || 0)}
            />
            <div className="divide-y divide-gray-200 border-t border-gray-200 -mx-6 px-6">
              <Toggle
                label="Mostrar precio"
                description="Si está apagado, aparece 'Consultar precio'."
                checked={form.showPrice}
                onChange={(v) => update('showPrice', v)}
              />
              <Toggle
                label="Mostrar stock"
                description="Exhibir cantidades disponibles."
                checked={form.showStock}
                onChange={(v) => update('showStock', v)}
              />
              <Toggle
                label="Controlar stock"
                description="Validar disponibilidad al cotizar."
                checked={form.trackStock}
                onChange={(v) => update('trackStock', v)}
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <SectionTitle>Visibilidad</SectionTitle>
          </CardHeader>
          <CardBody>
            <div className="divide-y divide-gray-200 -mt-2">
              <Toggle
                label="Producto activo"
                description="Visible en la landing pública."
                checked={form.isActive}
                onChange={(v) => update('isActive', v)}
              />
              <Toggle
                label="Destacado"
                description="Aparece en sección de destacados."
                checked={form.isFeatured}
                onChange={(v) => update('isFeatured', v)}
              />
            </div>
          </CardBody>
        </Card>

        <Button type="submit" loading={loading} className="w-full" size="lg">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};
