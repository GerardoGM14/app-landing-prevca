/**
 * Seed ADITIVO del catálogo de Corporación Maderera COPESA.
 *
 * Estructura de 3 niveles:
 *   División (subcategory) → Producto → Opciones con precio
 *
 * A diferencia de Aserradero (5 maderas fijas), aquí cada producto define sus
 * propias opciones (medidas, presentaciones). Solo "Madera Materia Prima"
 * tiene imagen por opción; el resto usa la imagen principal del producto.
 *
 * Precios CON IGV (lo que paga el cliente).
 *
 *   Emulador:   npx tsx src/seed/seed-copesa.ts
 *   Producción: npx tsx src/seed/seed-copesa.ts --prod
 *
 * Hace upsert por slug: se puede correr varias veces sin duplicar.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const PROJECT_ID = 'app-prevca';
const STORAGE_BUCKET = 'app-prevca.firebasestorage.app';
const CATEGORY_SLUG = 'corporacion-maderera-copesa';
const IS_PROD = process.argv.includes('--prod');

if (IS_PROD) {
  const keyPath = join(process.cwd(), 'serviceAccountKey.json');
  if (!existsSync(keyPath)) {
    console.error(`❌ No se encontró ${keyPath}`);
    process.exit(1);
  }
  const sa = JSON.parse(readFileSync(keyPath, 'utf8'));
  initializeApp({ credential: cert(sa), projectId: sa.project_id, storageBucket: STORAGE_BUCKET });
  console.log('🚀 Modo PRODUCCIÓN');
} else {
  process.env.FIRESTORE_EMULATOR_HOST ||= 'localhost:8080';
  process.env.STORAGE_EMULATOR_HOST ||= 'http://localhost:9199';
  initializeApp({ projectId: PROJECT_ID, storageBucket: STORAGE_BUCKET });
  console.log('🧪 Modo EMULADOR local');
}

const db = getFirestore();
const bucket = getStorage().bucket();
const ASSETS = join(process.cwd(), 'seed-assets', 'madera', 'copesa');

/** Las 3 divisiones que se muestran como filtro en la landing */
const SUB = {
  PRIMARIOS: 'Productos primarios de Madera',
  PROCESADOS: 'Productos Procesados de Madera',
  MELAMINE: 'Productos secundarios de Melamine',
} as const;

interface SeedOption {
  value: string;
  label: string;
  price: number;
  /** Archivo en seed-assets/madera/copesa/ — solo Materia Prima lo usa */
  imageFile?: string;
}

interface SeedItem {
  slug: string;
  ref: string;
  title: string;
  subcategory: string;
  shortDesc: string;
  description: string;
  /** Imagen principal del producto */
  imageFile: string | null;
  optionLabel?: string;
  options?: SeedOption[];
  price?: number;
  /** false = solo cotización (Materia Prima) */
  allowsDirectPurchase: boolean;
}

const P: SeedItem[] = [
  // ===== DIVISIÓN 1: PRIMARIOS (solo cotización, imagen por opción) =====
  {
    slug: 'madera-materia-prima',
    ref: 'CPS-MP-01',
    title: 'Madera Materia Prima',
    subcategory: SUB.PRIMARIOS,
    shortDesc: 'Madera en bruto por tipo: tornillo, copaiba, pino, cedro y lupuna.',
    description:
      'Madera materia prima seleccionada, disponible en distintas especies según la exigencia del proyecto. Cada tipo ofrece un balance particular de resistencia mecánica, flexión, compresión y dureza. Precio por pie tablar; solicite cotización según volumen.',
    imageFile: 'materia-tornillo.png',
    optionLabel: 'Tipo de madera',
    allowsDirectPurchase: false, // "cotizar aquí"
    options: [
      { value: 'tornillo', label: 'Tornillo', price: 11.56, imageFile: 'materia-tornillo.png' },
      { value: 'copaiba', label: 'Copaiba', price: 7.67, imageFile: 'materia-copaiba.png' },
      { value: 'pino', label: 'Pino', price: 5.07, imageFile: 'materia-pino.png' },
      { value: 'cedro', label: 'Cedro', price: 5.43, imageFile: 'materia-cedro.png' },
      { value: 'lupuna', label: 'Lupuna', price: 12.74, imageFile: 'materia-lupuna.png' },
    ],
  },

  // ===== DIVISIÓN 2: PROCESADOS =====
  {
    slug: 'listones-madera-pino',
    ref: 'CPS-LIS-01',
    title: 'Listones de Madera',
    subcategory: SUB.PROCESADOS,
    shortDesc: 'Listones de pino dimensionados, en varias medidas.',
    description:
      'Los listones de madera de pino son piezas dimensionadas obtenidas de madera de pino, ampliamente utilizadas en carpintería, construcción, fabricación de muebles y proyectos decorativos. Destacan por su ligereza, facilidad de trabajo y excelente relación calidad-precio.',
    imageFile: 'listones-madera.png',
    optionLabel: 'Medida',
    allowsDirectPurchase: true,
    options: [
      { value: 'pino-2x2-3m', label: 'Pino 2" x 2" — 3 m', price: 16.52 },
      { value: 'pino-2x3-3m', label: 'Pino 2" x 3" — 3 m', price: 24.78 },
      { value: 'pino-2x4-3m', label: 'Pino 2" x 4" — 3 m', price: 32.8 },
      { value: 'pino-2x2-4m', label: 'Pino 2" x 2" — 4 m', price: 24.31 },
      { value: 'pino-2x3-4m', label: 'Pino 2" x 3" — 4 m', price: 36.34 },
      { value: 'pino-2x4-4m', label: 'Pino 2" x 4" — 4 m', price: 48.62 },
    ],
  },
  {
    slug: 'tablas-madera-pino',
    ref: 'CPS-TAB-01',
    title: 'Tablas de Madera Pino',
    subcategory: SUB.PROCESADOS,
    shortDesc: 'Tablas aserradas de pino en 20, 25 y 30 cm.',
    description:
      'Son piezas aserradas de gran versatilidad, utilizadas en la fabricación de muebles, carpintería, construcción ligera y proyectos decorativos. Se caracterizan por su ligereza, facilidad de mecanizado y excelente relación costo-beneficio.',
    imageFile: 'tablas-pino.png',
    optionLabel: 'Ancho',
    allowsDirectPurchase: true,
    options: [
      { value: 'tabla-20cm', label: 'Tabla de Pino 20 cm', price: 33.04 },
      { value: 'tabla-25cm', label: 'Tabla de Pino 25 cm', price: 35.4 },
      { value: 'tabla-30cm', label: 'Tabla de Pino 30 cm', price: 37.76 },
    ],
  },
  {
    slug: 'rollizos',
    ref: 'CPS-ROL-01',
    title: 'Rollizos',
    subcategory: SUB.PROCESADOS,
    shortDesc: 'Rollizos de madera para uso estructural y agrícola.',
    description:
      'Son una alternativa resistente, económica y duradera para aplicaciones estructurales, agrícolas e industriales. Su elevada resistencia mecánica y versatilidad los convierten en uno de los productos forestales más utilizados en construcción y cercado.',
    imageFile: 'rollizos.png',
    optionLabel: 'Medida',
    allowsDirectPurchase: true,
    options: [
      { value: 'rollizo-2h3-3m', label: 'Rollizo 2½" - 3" — Base 3 m', price: 8.26 },
      { value: 'rollizo-3h35-3m', label: 'Rollizo 3" - 3½" — Base 3 m', price: 9.44 },
      { value: 'rollizo-2h3-25m', label: 'Rollizo 2½" - 3" — Base 2.5 m', price: 5.9 },
      { value: 'rollizo-3h35-25m', label: 'Rollizo 3" - 3½" — Base 2.5 m', price: 7.08 },
    ],
  },
  {
    slug: 'fenolico-18mm',
    ref: 'CPS-FEN-01',
    title: 'Fenólico 18 mm',
    subcategory: SUB.PROCESADOS,
    shortDesc: 'Triplay fenólico film face marrón 1.22 x 2.44 m.',
    description:
      'Triplay fenólico film face marrón, formato 1.22 x 2.44 m y 17 mm (Ecobuild). Superficie recubierta que facilita el desmolde y soporta múltiples usos, ideal para encofrados y trabajos que exigen buen acabado.',
    imageFile: 'fenolico-18mm.png',
    price: 88.5,
    allowsDirectPurchase: true,
  },
  {
    slug: 'aserrin-copesa',
    ref: 'CPS-ASE-01',
    title: 'Aserrín',
    subcategory: SUB.PROCESADOS,
    shortDesc: 'Aserrín de madera, subproducto del aserrío.',
    description:
      'Aserrín de madera obtenido del proceso de aserrío. Se emplea como cama para animales, absorbente, compostaje y en distintos usos industriales y agrícolas.',
    imageFile: 'aserrin-copesa.png',
    price: 21.24,
    allowsDirectPurchase: true,
  },
  {
    slug: 'viruta-copesa',
    ref: 'CPS-VIR-01',
    title: 'Viruta',
    subcategory: SUB.PROCESADOS,
    shortDesc: 'Viruta de madera, subproducto del procesado.',
    description:
      'Viruta de madera obtenida del cepillado y procesado. Muy utilizada como cama para crianza de animales, material absorbente y en aplicaciones de embalaje.',
    imageFile: 'viruta-copesa.png',
    price: 17.7,
    allowsDirectPurchase: true,
  },

  // ===== DIVISIÓN 3: MELAMINE =====
  {
    slug: 'box-cama-tarimas',
    ref: 'CPS-BOX-01',
    title: 'Box Cama o Tarimas',
    subcategory: SUB.MELAMINE,
    shortDesc: 'Tarima de madera para cama, en 1.5 y 2 plazas.',
    description:
      'El Box Cama o Tarima de Madera es una solución práctica, resistente y estética para cualquier dormitorio, ofreciendo una base sólida para el descanso y aportando un acabado moderno y funcional al ambiente.',
    imageFile: 'box-cama-tarimas.png',
    optionLabel: 'Medida',
    allowsDirectPurchase: true,
    options: [
      { value: 'tarima-15', label: 'Tarima 1.5 Plazas', price: 380 },
      { value: 'tarima-2', label: 'Tarima 2 Plazas', price: 450 },
    ],
  },
  {
    slug: 'ropero-melamine',
    ref: 'CPS-ROP-01',
    title: 'Roperos de Melamine',
    subcategory: SUB.MELAMINE,
    shortDesc: 'Roperos de melamine en cuatro medidas.',
    description:
      'Combinan diseño, funcionalidad y durabilidad para ofrecer una solución práctica de organización. Fabricados con materiales de calidad y acabados cuidadosamente elaborados, brindan amplios espacios de almacenamiento para mantener la ropa y accesorios ordenados, aportando elegancia y calidez a cualquier ambiente. Ideal para hogares, departamentos, hoteles y proyectos inmobiliarios.',
    imageFile: 'ropero-melamine.png',
    optionLabel: 'Medida',
    allowsDirectPurchase: true,
    options: [
      { value: 'ropero-60', label: 'Ropero de 60 cm x 1.84 m', price: 300 },
      { value: 'ropero-100', label: 'Ropero de 1 m x 1.84 m', price: 500 },
      { value: 'ropero-120', label: 'Ropero de 1.20 m x 1.84 m', price: 620 },
      { value: 'ropero-150', label: 'Ropero de 1.50 m x 1.94 m', price: 1200 },
    ],
  },
  {
    slug: 'repostero-melamine',
    ref: 'CPS-REP-01',
    title: 'Reposteros de Melamine',
    subcategory: SUB.MELAMINE,
    shortDesc: 'Reposteros de melamine para cocina, en tres medidas.',
    description:
      'Nuestros reposteros de melamine están diseñados para combinar estética, funcionalidad y durabilidad en un solo producto. Ofrecen soluciones prácticas de almacenamiento, optimizando cada espacio de la cocina con diseños modernos y acabados de excelente calidad. Gracias a su resistencia y fácil mantenimiento, son la opción ideal para quienes buscan organización, comodidad y estilo en su hogar o negocio.',
    imageFile: 'repostero-melamine.png',
    optionLabel: 'Medida',
    allowsDirectPurchase: true,
    options: [
      { value: 'repostero-60', label: 'Repostero de 60 cm x 1.74 m', price: 260 },
      { value: 'repostero-90', label: 'Repostero de 90 cm x 1.74 m', price: 260 },
      { value: 'repostero-110', label: 'Repostero de 1.10 m x 1.84 m', price: 370 },
    ],
  },
];

const buildImageUrl = (storagePath: string): string => {
  const emulatorHost = process.env.STORAGE_EMULATOR_HOST;
  if (emulatorHost) {
    const host = emulatorHost.replace(/^https?:\/\//, '');
    return `http://${host}/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;
  }
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;
};

async function upload(productId: string, imageFile: string): Promise<string | null> {
  const localPath = join(ASSETS, imageFile);
  if (!existsSync(localPath)) return null;

  const ext = imageFile.split('.').pop()?.toLowerCase();
  const contentType =
    ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png';
  const storagePath = `products/${productId}/${imageFile}`;
  const file = bucket.file(storagePath);

  await file.save(readFileSync(localPath), {
    contentType,
    metadata: { cacheControl: 'public, max-age=31536000' },
  });
  if (!process.env.STORAGE_EMULATOR_HOST) await file.makePublic().catch(() => undefined);

  return buildImageUrl(storagePath);
}

async function main() {
  const catSnap = await db
    .collection('categories')
    .where('slug', '==', CATEGORY_SLUG)
    .limit(1)
    .get();
  if (catSnap.empty) {
    console.error(`❌ No existe la categoría "${CATEGORY_SLUG}".`);
    process.exit(1);
  }
  const categoryId = catSnap.docs[0].id;
  console.log(`📂 Categoría: ${CATEGORY_SLUG} (${categoryId})\n`);

  let created = 0;
  let updated = 0;
  const missing: string[] = [];

  for (const item of P) {
    const existing = await db.collection('products').where('slug', '==', item.slug).limit(1).get();
    const ref = existing.empty ? db.collection('products').doc() : existing.docs[0].ref;
    const isNew = existing.empty;

    // Imagen principal
    let mainImage = null;
    if (item.imageFile) {
      const url = await upload(ref.id, item.imageFile);
      if (url) mainImage = { storagePath: `products/${ref.id}/${item.imageFile}`, url, alt: null, isPrimary: true, order: 0 };
      else missing.push(item.imageFile);
    }

    // Opciones (con su imagen si la tienen)
    const options = [];
    for (const opt of item.options ?? []) {
      let imageUrl: string | null = null;
      if (opt.imageFile) {
        imageUrl = await upload(ref.id, opt.imageFile);
        if (!imageUrl) missing.push(opt.imageFile);
      }
      options.push({ value: opt.value, label: opt.label, price: opt.price, imageUrl });
    }

    const data: Record<string, unknown> = {
      slug: item.slug,
      ref: item.ref,
      title: item.title,
      division: 'MADERA',
      categoryId,
      subcategory: item.subcategory,
      shortDesc: item.shortDesc,
      description: item.description,
      specs: null,
      features: [],
      scientificName: null,
      origin: null,
      applications: null,
      datasheetUrl: null,
      price: item.price ?? null,
      woodVariants: [],
      options,
      optionLabel: item.optionLabel ?? null,
      showPrice: true,
      allowsDirectPurchase: item.allowsDirectPurchase,
      stock: 0,
      showStock: false,
      trackStock: false,
      isActive: true,
      isFeatured: false,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (isNew) {
      data.order = 200 + P.indexOf(item);
      data.createdAt = FieldValue.serverTimestamp();
    }
    if (mainImage) data.images = [mainImage];

    await ref.set(data, { merge: true });

    const tag = isNew ? '+ nuevo  ' : '~ actualiza';
    const info = options.length ? `${options.length} opciones` : `S/ ${item.price}`;
    const pay = item.allowsDirectPurchase ? '' : ' [cotización]';
    console.log(`   ${tag} ${mainImage ? '🖼' : '  '} ${item.slug.padEnd(24)} ${info}${pay}`);
    if (isNew) created++;
    else updated++;
  }

  console.log(`\n✨ Listo: ${created} creado(s), ${updated} actualizado(s).`);
  if (missing.length) {
    const uniq = [...new Set(missing)];
    console.log(`\n⚠  ${uniq.length} imagen(es) faltantes en seed-assets/madera/copesa/:`);
    uniq.forEach((m) => console.log(`   - ${m}`));
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error en el seed:', err);
    process.exit(1);
  });
