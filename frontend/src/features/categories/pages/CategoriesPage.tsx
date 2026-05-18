import { useState, type FormEvent } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import {
  useCategoriesList,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '../hooks/useCategories';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { Toggle } from '@/components/ui/Toggle';
import { useToast } from '@/core/toast/ToastContext';
import { DIVISION_LABELS, type Division } from '@/types/api';

export const CategoriesPage = () => {
  const { data, isLoading } = useCategoriesList();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const del = useDeleteCategory();
  const toast = useToast();

  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [division, setDivision] = useState<Division>('MADERA');
  const [order, setOrder] = useState(0);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const cat = await create.mutateAsync({ slug, name, division, order, isActive: true });
      toast.success(`"${cat.name}" se agregó al catálogo.`, 'Categoría creada');
      setSlug('');
      setName('');
      setOrder(0);
    } catch (err) {
      toast.error((err as Error).message, 'No se pudo crear');
    }
  };

  const handleDelete = async (id: string, categoryName: string) => {
    if (!confirm(`¿Eliminar la categoría "${categoryName}"?`)) return;
    try {
      await del.mutateAsync(id);
      toast.success(`"${categoryName}" eliminada.`, 'Categoría eliminada');
    } catch (err) {
      toast.error((err as Error).message, 'No se pudo eliminar');
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await update.mutateAsync({ id, input: { isActive: !current } });
    } catch (err) {
      toast.error((err as Error).message, 'No se pudo actualizar');
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Catálogo"
        title="Categorías"
        description="Organizan los productos dentro de cada división."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <h3 className="font-display font-extrabold uppercase tracking-widest text-prevca-dark text-sm">
              Nueva categoría
            </h3>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Nombre"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                label="Slug"
                required
                hint="ej. tablones"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
              <Select
                label="División"
                value={division}
                onChange={(e) => setDivision(e.target.value as Division)}
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
                value={order}
                onChange={(e) => setOrder(Number(e.target.value) || 0)}
              />
              <Button type="submit" loading={create.isPending} className="w-full">
                <FaPlus />
                Crear
              </Button>
            </form>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="font-display font-extrabold uppercase tracking-widest text-prevca-dark text-sm">
              Categorías existentes
            </h3>
          </CardHeader>
          <CardBody>
            {isLoading && (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            )}
            {data && data.length === 0 && (
              <p className="text-sm text-gray-400 font-body py-8 text-center">
                No hay categorías todavía.
              </p>
            )}
            {data && data.length > 0 && (
              <ul className="divide-y divide-gray-200">
                {data.map((cat) => (
                  <li
                    key={cat.id}
                    className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="font-display font-bold text-prevca-dark">{cat.name}</p>
                        <Badge variant="blue">{DIVISION_LABELS[cat.division]}</Badge>
                        <Badge variant={cat.isActive ? 'green' : 'red'}>
                          {cat.isActive ? 'Activa' : 'Oculta'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">/{cat.slug} · orden {cat.order}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Toggle
                        label=""
                        checked={cat.isActive}
                        onChange={() => void toggleActive(cat.id, cat.isActive)}
                      />
                      <button
                        type="button"
                        onClick={() => void handleDelete(cat.id, cat.name)}
                        className="p-2 text-red-500 hover:bg-red-50 cursor-pointer"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
