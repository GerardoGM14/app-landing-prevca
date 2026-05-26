# seed-assets

Carpeta para las imágenes que el script de seed (`npm run seed` / `npm run seed:prod`)
sube a Firebase Storage y asigna a los productos iniciales.

## Estructura

```
seed-assets/
├── madera/         imágenes de productos de la división MADERA
├── hospitalidad/   imágenes de productos de la división HOSPITALIDAD
├── cafe/           imágenes de productos de la división CAFE
└── transporte/     imágenes de productos de la división TRANSPORTE
```

## Convenciones

- **Formato:** PNG o JPG.
- **Tamaño recomendado:** mínimo 1200x800 px, máximo 3 MB por archivo.
- **Nombre de archivo:** se referencia desde `seed.ts` por nombre exacto. Si renombra
  un archivo aquí, actualice el campo `imageFile` del producto correspondiente.

Las imágenes subidas por este seed pueden gestionarse después (agregar más, marcar
otra como primaria, eliminar) desde el panel admin sin tocar el código.
