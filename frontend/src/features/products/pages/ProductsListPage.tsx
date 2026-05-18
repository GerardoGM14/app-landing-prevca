import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEdit, FaPlus, FaTrash } from 'react-icons/fa';
import { useDeleteProduct, useProductsList } from '../hooks/useProducts';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { DIVISION_LABELS, type Division } from '@/types/api';

export const ProductsListPage = () => {
  const [search, setSearch] = useState('');
  const [division, setDivision] = useState<Division | ''>('');

  const { data, isLoading, error } = useProductsList({
    search: search || undefined,
    division: division || undefined,
    pageSize: 50,
  });

  const deleteProduct = useDeleteProduct();

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`¿Eliminar "${title}"? Esta acción no se puede deshacer.`)) return;
    await deleteProduct.mutateAsync(id);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Catálogo"
        title="Productos"
        description="Gestión de los productos que aparecen en la landing y la tienda virtual."
        actions={
          <Link to="/products/new">
            <Button>
              <FaPlus />
              Nuevo producto
            </Button>
          </Link>
        }
      />

      <Card className="mb-6">
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por título, slug o ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full md:w-64">
            <Select
              value={division}
              onChange={(e) => setDivision(e.target.value as Division | '')}
            >
              <option value="">Todas las divisiones</option>
              {Object.entries(DIVISION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-body p-4">
          Error al cargar productos: {(error as Error).message}
        </div>
      )}

      {data && (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead className="bg-prevca-dark text-white">
              <tr>
                <th className="text-left px-6 py-4 font-ui font-bold uppercase tracking-widest text-[10px]">
                  Producto
                </th>
                <th className="text-left px-6 py-4 font-ui font-bold uppercase tracking-widest text-[10px]">
                  División
                </th>
                <th className="text-left px-6 py-4 font-ui font-bold uppercase tracking-widest text-[10px]">
                  Ref
                </th>
                <th className="text-center px-6 py-4 font-ui font-bold uppercase tracking-widest text-[10px]">
                  Stock
                </th>
                <th className="text-center px-6 py-4 font-ui font-bold uppercase tracking-widest text-[10px]">
                  Estado
                </th>
                <th className="text-right px-6 py-4 font-ui font-bold uppercase tracking-widest text-[10px]">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link
                      to={`/products/${p.id}`}
                      className="font-display font-bold text-prevca-dark hover:text-prevca-blue"
                    >
                      {p.title}
                    </Link>
                    <p className="text-xs text-gray-400 mt-1">/{p.slug}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="blue">{DIVISION_LABELS[p.division]}</Badge>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-600">{p.ref}</td>
                  <td className="px-6 py-4 text-center">{p.trackStock ? p.stock : '—'}</td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant={p.isActive ? 'green' : 'red'}>
                      {p.isActive ? 'Activo' : 'Oculto'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-1 justify-end">
                      <Link
                        to={`/products/${p.id}`}
                        className="p-2 text-prevca-blue hover:bg-prevca-blue/10 transition-colors"
                        title="Editar"
                      >
                        <FaEdit />
                      </Link>
                      <button
                        type="button"
                        onClick={() => void handleDelete(p.id, p.title)}
                        className="p-2 text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Eliminar"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-gray-400 font-body">
                    No se encontraron productos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};
