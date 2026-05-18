import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/core/toast/ToastContext';
import { useCreateProduct } from '../hooks/useProducts';
import { ProductForm } from '../components/ProductForm';

export const ProductCreatePage = () => {
  const navigate = useNavigate();
  const create = useCreateProduct();
  const toast = useToast();

  return (
    <div>
      <PageHeader
        eyebrow="Catálogo · Nuevo"
        title="Crear producto"
        description="Complete los campos para registrar un nuevo producto en el catálogo."
        actions={
          <Link to="/products">
            <Button variant="outline" size="sm">
              <FaArrowLeft />
              Volver
            </Button>
          </Link>
        }
      />
      <ProductForm
        submitLabel="Crear producto"
        loading={create.isPending}
        onSubmit={async (input) => {
          try {
            const product = await create.mutateAsync(input);
            toast.success(`"${product.title}" se creó correctamente.`, 'Producto creado');
            navigate(`/products/${product.id}`, { replace: true });
          } catch (err) {
            toast.error((err as Error).message, 'No se pudo crear el producto');
          }
        }}
      />
    </div>
  );
};
