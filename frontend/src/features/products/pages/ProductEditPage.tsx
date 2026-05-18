import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/core/toast/ToastContext';
import { useProduct, useUpdateProduct } from '../hooks/useProducts';
import { ProductForm } from '../components/ProductForm';
import { ImageUploader } from '../components/ImageUploader';

export const ProductEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading, error: loadError } = useProduct(id);
  const update = useUpdateProduct(id ?? '');
  const toast = useToast();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (loadError || !product) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-body p-4">
        No se pudo cargar el producto: {(loadError as Error | undefined)?.message ?? 'desconocido'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Catálogo · ${product.ref}`}
        title={product.title}
        description={`Slug: /${product.slug}`}
        actions={
          <Link to="/products">
            <Button variant="outline" size="sm">
              <FaArrowLeft />
              Volver al listado
            </Button>
          </Link>
        }
      />

      <ImageUploader productId={product.id} images={product.images} />

      <ProductForm
        initial={product}
        submitLabel="Guardar cambios"
        loading={update.isPending}
        onSubmit={async (input) => {
          try {
            await update.mutateAsync(input);
            toast.success('Cambios guardados correctamente.', 'Producto actualizado');
          } catch (err) {
            toast.error((err as Error).message, 'No se pudo guardar');
          }
        }}
      />
    </div>
  );
};
