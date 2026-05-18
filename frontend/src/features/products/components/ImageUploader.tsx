import { useRef } from 'react';
import { FaStar, FaTrash, FaUpload } from 'react-icons/fa';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import type { ProductImage } from '@/types/api';
import { useDeleteImage, useUpdateImage, useUploadImages } from '../hooks/useProducts';

interface ImageUploaderProps {
  productId: string;
  images: ProductImage[];
}

export const ImageUploader = ({ productId, images }: ImageUploaderProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadImages(productId);
  const del = useDeleteImage(productId);
  const updateImage = useUpdateImage(productId);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    await upload.mutateAsync(Array.from(files));
    if (inputRef.current) inputRef.current.value = '';
  };

  const setPrimary = (storagePath: string) =>
    updateImage.mutate({ storagePath, input: { isPrimary: true } });

  const onDelete = (storagePath: string) => {
    if (!confirm('¿Eliminar esta imagen?')) return;
    del.mutate(storagePath);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-display font-extrabold uppercase tracking-widest text-prevca-dark text-sm">
            Imágenes ({images.length})
          </h3>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => void handleFiles(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={upload.isPending}
            onClick={() => inputRef.current?.click()}
          >
            <FaUpload />
            Subir
          </Button>
        </div>
      </CardHeader>
      <CardBody>
        {upload.isError && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-body p-3 mb-4">
            {(upload.error as Error).message}
          </div>
        )}

        {images.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-body text-sm mb-1">No hay imágenes cargadas todavía</p>
            <p className="text-xs text-gray-400 font-body">JPG, PNG o WebP · máximo 10 MB c/u</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((img) => (
              <div
                key={img.storagePath}
                className="relative group border border-gray-200 aspect-square bg-gray-100 overflow-hidden"
              >
                <img src={img.url} alt={img.alt ?? ''} className="w-full h-full object-cover" />
                {img.isPrimary && (
                  <span className="absolute top-2 left-2 bg-prevca-blue text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1">
                    Principal
                  </span>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!img.isPrimary && (
                    <button
                      type="button"
                      onClick={() => setPrimary(img.storagePath)}
                      title="Marcar como principal"
                      className="bg-white text-prevca-blue p-2 cursor-pointer hover:bg-prevca-blue hover:text-white transition-colors"
                    >
                      <FaStar />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDelete(img.storagePath)}
                    title="Eliminar"
                    className="bg-white text-red-500 p-2 cursor-pointer hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {(del.isPending || updateImage.isPending) && (
          <div className="flex justify-center py-4">
            <Spinner size={20} />
          </div>
        )}
      </CardBody>
    </Card>
  );
};
