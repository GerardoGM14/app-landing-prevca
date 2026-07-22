/**
 * Seed ADITIVO de los muebles y puertas de Aserradero PREVCA.
 *
 * A diferencia de seed.ts, este script NO borra nada: hace upsert por slug,
 * así se puede correr varias veces sin duplicar y sin tocar el resto del
 * catálogo. Pensado para poder ejecutarse también contra PRODUCCIÓN.
 *
 *   Emulador:   npx tsx src/seed/seed-muebles-prevca.ts
 *   Producción: npx tsx src/seed/seed-muebles-prevca.ts --prod
 *               (requiere serviceAccountKey.json en backend/)
 *
 * Las imágenes se leen de seed-assets/madera/prevca/<archivo> y se suben a
 * Storage. Si falta una imagen, el producto se crea igual (sin foto) y se
 * avisa al final.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { WoodType } from '../config/constants';

const PROJECT_ID = 'app-prevca';
const STORAGE_BUCKET = 'app-prevca.firebasestorage.app';
const CATEGORY_SLUG = 'aserradero-prevca';
const IS_PROD = process.argv.includes('--prod');

if (IS_PROD) {
  const keyPath = join(process.cwd(), 'serviceAccountKey.json');
  if (!existsSync(keyPath)) {
    console.error(`❌ No se encontró ${keyPath}`);
    console.error('   Descárguelo desde Firebase Console > Cuentas de servicio.');
    process.exit(1);
  }
  const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
  initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id, storageBucket: STORAGE_BUCKET });
  console.log('🚀 Modo PRODUCCIÓN');
} else {
  process.env.FIRESTORE_EMULATOR_HOST ||= 'localhost:8080';
  process.env.STORAGE_EMULATOR_HOST ||= 'http://localhost:9199';
  initializeApp({ projectId: PROJECT_ID, storageBucket: STORAGE_BUCKET });
  console.log('🧪 Modo EMULADOR local');
}

const db = getFirestore();
const bucket = getStorage().bucket();
const ASSETS = join(process.cwd(), 'seed-assets', 'madera', 'prevca');

interface SeedItem {
  slug: string;
  ref: string;
  title: string;
  shortDesc: string;
  description: string;
  imageFile: string;
  /** Precio único (productos sin variantes) */
  price?: number;
  /** Precio por tipo de madera (productos con variantes) */
  variants?: Partial<Record<WoodType, number>>;
}

const P: SeedItem[] = [
  {
    slug: 'puerta-horizon-contraplacada',
    ref: 'PRV-PUE-01',
    title: 'Puerta Horizon Contraplacada',
    shortDesc: 'Puerta contraplacada con acabado pintado en parafínico.',
    description:
      'Puerta Horizon contraplacada, fabricada con estructura de madera y acabado pintado en parafínico. Diseño de líneas horizontales que aporta un estilo moderno y sobrio a cualquier ambiente.',
    imageFile: 'puerta-horizon-contraplacada.png',
    price: 680,
  },
  {
    slug: 'puerta-britania',
    ref: 'PRV-PUE-02',
    title: 'Puerta Britania',
    shortDesc: 'Puerta pintada en parafínico con acabado en brillo.',
    description:
      'Puerta Britania con acabado pintado en parafínico y terminación en brillo. Su diseño clásico de paneles horizontales combina con interiores tradicionales y contemporáneos.',
    imageFile: 'puerta-britania.png',
    price: 2500,
  },
  {
    slug: 'escalera-decor-3-escalones',
    ref: 'PRV-ESC-01',
    title: 'Escalera Decor Tipo Tijera de 3 Escalones',
    shortDesc: 'Escalera decorativa tipo tijera de 3 escalones, plegable.',
    description:
      'Escalera Decor tipo tijera de 3 escalones. Además de su función práctica, sirve como pieza decorativa gracias a su acabado en madera. Plegable para facilitar el guardado.',
    imageFile: 'escalera-decor-3-escalones.png',
    variants: { TORNILLO: 369.93, PINO: 308.28, COPAIBA: 345.27, CEDRO: 406.92, ROBLE: 332.94 },
  },
  {
    slug: 'repostero-elegante-atena',
    ref: 'PRV-REP-01',
    title: 'Repostero Elegante Atena',
    shortDesc: 'Repostero de diseño elegante con acabado en parafínico.',
    description:
      'Repostero Elegante modelo Atena, con acabado en parafínico. Amplia capacidad de almacenamiento distribuida en puertas y compartimentos, con detalles de diseño que realzan la cocina.',
    imageFile: 'reportero-atena.png',
    variants: { TORNILLO: 2836.13, PINO: 2157.93, COPAIBA: 2589.51, CEDRO: 3082.75, ROBLE: 2342.89 },
  },
  {
    slug: 'cama-2-plazas-prevca',
    ref: 'PRV-CAM-01',
    title: 'Cama de 2 Plazas — Modelo PREVCA',
    shortDesc: 'Cama de 2 plazas en madera sólida, modelo PREVCA.',
    description:
      'Cama de 2 plazas modelo PREVCA, fabricada en madera sólida con cabecera de diseño geométrico. Incluye tablillas de soporte para colchón, sin necesidad de base adicional.',
    imageFile: 'cama-2-plazas-prevca.png',
    variants: { TORNILLO: 2959.44, PINO: 2219.58, COPAIBA: 2651.17, CEDRO: 3267.72, ROBLE: 2466.2 },
  },
  {
    slug: 'cama-15-plazas-prevca',
    ref: 'PRV-CAM-02',
    title: 'Cama de 1.5 Plazas — Modelo PREVCA',
    shortDesc: 'Cama de 1.5 plazas en madera sólida, modelo PREVCA.',
    description:
      'Cama de 1.5 plazas modelo PREVCA, en madera sólida con cabecera de diseño geométrico. Incluye tablillas de soporte para colchón. Ideal para habitaciones juveniles o de huéspedes.',
    imageFile: 'cama-15-plazas-prevca.png',
    variants: { TORNILLO: 2466.2, PINO: 1911.31, COPAIBA: 2281.24, CEDRO: 2774.48, ROBLE: 2096.27 },
  },
  {
    slug: 'ropero-personal-kala',
    ref: 'PRV-ROP-01',
    title: 'Ropero Personal Kala',
    shortDesc: 'Ropero personal con repisas y cajones.',
    description:
      'Ropero Personal modelo Kala, con repisas superiores abiertas y cajones inferiores. Diseño vertical compacto que aprovecha el espacio en dormitorios pequeños.',
    imageFile: 'ropero-personal-kala.png',
    variants: { TORNILLO: 2589.51, PINO: 1788.0, COPAIBA: 2281.24, CEDRO: 2959.44, ROBLE: 2034.62 },
  },
  {
    slug: 'ropero-moderno',
    ref: 'PRV-ROP-02',
    title: 'Ropero Moderno',
    shortDesc: 'Ropero moderno de madera sólida con acabado en parafínico.',
    description:
      'Ropero Moderno en madera sólida con acabado en parafínico. Cuatro puertas y cajones inferiores, con aplicaciones de diseño geométrico en contraste que le dan un aire contemporáneo.',
    imageFile: 'ropero-moderno.png',
    variants: { TORNILLO: 5055.71, PINO: 3699.3, COPAIBA: 4439.16, CEDRO: 5548.95, ROBLE: 4069.23 },
  },
  {
    slug: 'puerta-principal-solida',
    ref: 'PRV-PUE-03',
    title: 'Puerta Principal de Madera Sólida',
    shortDesc: 'Puerta principal de madera sólida con diseño tallado.',
    description:
      'Puerta principal fabricada en madera sólida, con diseño tallado de líneas geométricas y jaladera vertical. Pensada para dar una entrada imponente y segura a la vivienda.',
    imageFile: 'puerta-principal-solida.png',
    variants: { TORNILLO: 2959.44, PINO: 1849.65, COPAIBA: 2404.55, CEDRO: 3082.75, ROBLE: 2219.58 },
  },
  {
    slug: 'puerta-pequena',
    ref: 'PRV-PUE-04',
    title: 'Puerta Pequeña',
    shortDesc: 'Puerta pequeña de paneles, ideal para interiores.',
    description:
      'Puerta pequeña de diseño en paneles horizontales, ideal para baños, closets o ambientes de dimensiones reducidas. Acabado liso listo para pintar o barnizar.',
    imageFile: 'puerta-pequena.png',
    variants: { TORNILLO: 924.83, PINO: 801.52, COPAIBA: 863.17, CEDRO: 986.48, ROBLE: 838.51 },
  },
  {
    slug: 'puerta-empotrada-bahia',
    ref: 'PRV-PUE-05',
    title: 'Puerta Empotrada Bahía — Para Escalera',
    shortDesc: 'Mueble empotrado bajo escalera con acabado en parafínico.',
    description:
      'Puerta empotrada modelo Bahía, diseñada para aprovechar el espacio bajo la escalera. Acabado en parafínico y puertas de distintas alturas que siguen la inclinación del tramo.',
    imageFile: 'puerta-empotrada-bahia.png',
    variants: { TORNILLO: 1171.45, PINO: 986.48, COPAIBA: 1109.79, CEDRO: 1233.1, ROBLE: 1048.14 },
  },
  {
    slug: 'jaula-crianza-aves',
    ref: 'PRV-JAU-01',
    title: 'Jaula para la Crianza de Aves',
    shortDesc: 'Jaula de madera para crianza de aves, con cajón inferior.',
    description:
      'Jaula para la crianza de aves fabricada en madera, con barrotes metálicos, comedero integrado y cajón inferior para facilitar la limpieza. Acabado resistente para uso prolongado.',
    imageFile: 'jaula-crianza-aves.png',
    variants: { TORNILLO: 1972.96, PINO: 1603.03, COPAIBA: 1726.34, CEDRO: 2096.27, ROBLE: 1849.65 },
  },
  {
    slug: 'estante-multiusos-danna',
    ref: 'PRV-EST-01',
    title: 'Estante Multiusos Danna',
    shortDesc: 'Estante multiusos de 5 niveles en madera.',
    description:
      'Estante Multiusos modelo Danna, de cinco niveles abiertos. Versátil para sala, dormitorio, oficina o depósito. Estructura robusta en madera con acabado natural.',
    imageFile: 'estante-multiusos-danna.png',
    variants: { TORNILLO: 1171.45, PINO: 924.83, COPAIBA: 1109.79, CEDRO: 1294.76, ROBLE: 1048.14 },
  },
  {
    slug: 'escalera-tijera-pequena',
    ref: 'PRV-ESC-02',
    title: 'Escalera Tijera Pequeña',
    shortDesc: 'Escalera tijera pequeña de 2 escalones, plegable.',
    description:
      'Escalera tijera pequeña de dos escalones, con herrajes metálicos de seguridad. Plegable y liviana, práctica para tareas domésticas cotidianas.',
    imageFile: 'escalera-tijera-pequena.png',
    variants: { TORNILLO: 345.27, PINO: 295.94, COPAIBA: 320.61, CEDRO: 369.93, ROBLE: 308.28 },
  },

  // ===== Segunda tanda: sillas, mesas, sofás, estantes y más =====
  {
    slug: 'silla-luna',
    ref: 'PRV-SIL-01',
    title: 'Silla Modelo Luna',
    shortDesc: 'Silla tapizada con patas de madera torneada.',
    description:
      'Silla modelo Luna, con respaldo curvo tapizado y patas de madera torneada. Diseño envolvente y cómodo, ideal para comedor, recibidor o dormitorio.',
    imageFile: 'silla-luna.png',
    variants: { TORNILLO: 283.61, PINO: 221.96, COPAIBA: 246.62, CEDRO: 308.28, ROBLE: 234.29 },
  },
  {
    slug: 'silla-triangular',
    ref: 'PRV-SIL-02',
    title: 'Silla Triangular',
    shortDesc: 'Silla de estructura geométrica en madera con cojines.',
    description:
      'Silla triangular de estructura geométrica en madera sólida, con cojines de asiento y respaldo. Diseño contemporáneo que combina líneas rectas y confort.',
    imageFile: 'silla-triangular.png',
    variants: { TORNILLO: 554.9, PINO: 493.24, COPAIBA: 530.23, CEDRO: 591.89, ROBLE: 517.9 },
  },
  {
    slug: 'silla-modelo-2',
    ref: 'PRV-SIL-03',
    title: 'Silla Modelo 2',
    shortDesc: 'Silla de líneas rectas en madera con asiento tapizado.',
    description:
      'Silla Modelo 2, de estructura en madera sólida con líneas rectas y apoyabrazos integrados. Asiento y respaldo tapizados para mayor comodidad.',
    imageFile: 'silla-modelo-2.png',
    variants: { TORNILLO: 554.9, PINO: 493.24, COPAIBA: 530.23, CEDRO: 579.56, ROBLE: 505.57 },
  },
  {
    slug: 'mesa-caracol',
    ref: 'PRV-MES-01',
    title: 'Mesa de Caracol',
    shortDesc: 'Mesa con base escalonada en espiral y cubierta de vidrio.',
    description:
      'Mesa de Caracol, con base torneada en forma de espiral escalonada y cubierta circular de vidrio templado. Pieza de diseño que funciona como mesa central o auxiliar.',
    imageFile: 'mesa-caracol.png',
    variants: { TORNILLO: 1788.0, PINO: 1233.1, COPAIBA: 1541.38, CEDRO: 1972.96, ROBLE: 1418.07 },
  },
  {
    slug: 'mesa-x-vidrio',
    ref: 'PRV-MES-02',
    title: 'Mesa X — de Vidrio',
    shortDesc: 'Mesa con base cruzada en X y cubierta de vidrio.',
    description:
      'Mesa modelo X, con base de madera curvada en forma de aspa y cubierta rectangular de vidrio templado. Diseño ligero y moderno para sala o comedor.',
    imageFile: 'mesa-x-vidrio.png',
    variants: { TORNILLO: 1048.14, PINO: 986.48, COPAIBA: 1023.47, CEDRO: 1072.8, ROBLE: 1011.14 },
  },
  {
    slug: 'mesa-vidrio',
    ref: 'PRV-MES-03',
    title: 'Mesa de Vidrio',
    shortDesc: 'Mesa ovalada de madera torneada con cubierta de vidrio.',
    description:
      'Mesa ovalada con estructura de madera torneada y detalles clásicos, con cubierta de vidrio templado. Aporta un aire elegante y tradicional al ambiente.',
    imageFile: 'mesa-vidrio.png',
    variants: { TORNILLO: 752.19, PINO: 616.55, COPAIBA: 690.54, CEDRO: 764.52, ROBLE: 665.87 },
  },
  {
    slug: 'sofa-desing-matero',
    ref: 'PRV-SOF-01',
    title: 'Sofá Desing Matero — Modelo 2026',
    shortDesc: 'Sofá curvo tapizado con base de madera.',
    description:
      'Sofá Desing Matero, modelo 2026. Diseño curvo de gran formato, tapizado en tela suave con base y detalles laterales en madera. Pieza central para salas amplias.',
    imageFile: 'sofa-desing-matero.png',
    variants: { TORNILLO: 3267.72, PINO: 3021.1, COPAIBA: 3144.41, CEDRO: 3329.37, ROBLE: 3082.75 },
  },
  {
    slug: 'danna-gran-sofa',
    ref: 'PRV-SOF-02',
    title: 'Danna Gran Sofá — Modelo 2026',
    shortDesc: 'Sofá seccional en L tapizado con base de madera.',
    description:
      'Danna Gran Sofá, modelo 2026. Seccional en L con módulos mullidos tapizados y base envolvente en madera. Máximo confort para salas de estar familiares.',
    imageFile: 'danna-gran-sofa.png',
    variants: { TORNILLO: 4069.23, PINO: 3267.72, COPAIBA: 3699.3, CEDRO: 4315.85, ROBLE: 3514.34 },
  },
  {
    slug: 'porton',
    ref: 'PRV-PUE-06',
    title: 'Portón',
    shortDesc: 'Portón de madera sólida con vano superior.',
    description:
      'Portón de madera sólida con tablones verticales y vano superior abierto. Estructura reforzada, pensada para ingresos de cochera o patios.',
    imageFile: 'porton.png',
    variants: { TORNILLO: 3945.92, PINO: 3206.06, COPAIBA: 3575.99, CEDRO: 4192.54, ROBLE: 3391.03 },
  },
  {
    slug: 'ropero-contraplacado',
    ref: 'PRV-ROP-03',
    title: 'Ropero Contraplacado',
    shortDesc: 'Ropero contraplacado con puertas y cajonera lateral.',
    description:
      'Ropero contraplacado con tres puertas abatibles y torre de cinco cajones lateral. Amplio espacio de guardado con acabado en madera y tiradores metálicos.',
    imageFile: 'ropero-contraplacado.png',
    variants: { TORNILLO: 3514.34, PINO: 3021.1, COPAIBA: 3329.37, CEDRO: 3699.3, ROBLE: 3206.06 },
  },
  {
    slug: 'estante-cuadrangular',
    ref: 'PRV-EST-02',
    title: 'Estante Cuadrangular',
    shortDesc: 'Estante alto con compartimentos de distintos tamaños.',
    description:
      'Estante cuadrangular de gran altura, con compartimentos de distintos tamaños distribuidos de forma asimétrica. Ideal para libros, decoración y objetos varios.',
    imageFile: 'estante-cuadrangular.png',
    variants: { TORNILLO: 2034.62, PINO: 1664.69, COPAIBA: 1911.31, CEDRO: 2157.93, ROBLE: 1788.0 },
  },
  {
    slug: 'estante-rectangular',
    ref: 'PRV-EST-03',
    title: 'Estante Rectangular',
    shortDesc: 'Estante con repisas abiertas y gabinete inferior con puertas.',
    description:
      'Estante rectangular con tres repisas abiertas en la parte superior y gabinete inferior con puertas abatibles. Combina exhibición y almacenamiento cerrado.',
    imageFile: 'estante-rectangular.png',
    variants: { TORNILLO: 1664.69, PINO: 1541.38, COPAIBA: 1726.34, CEDRO: 1972.96, ROBLE: 1603.03 },
  },
  {
    slug: 'estante-triangular',
    ref: 'PRV-EST-04',
    title: 'Estante Triangular',
    shortDesc: 'Estante de diseño con divisiones en diagonal.',
    description:
      'Estante triangular de diseño, con divisiones en diagonal que forman espacios irregulares. Pieza decorativa y funcional para ambientes modernos.',
    imageFile: 'estante-triangular.png',
    variants: { TORNILLO: 1849.65, PINO: 1664.69, COPAIBA: 1911.31, CEDRO: 2157.93, ROBLE: 1788.0 },
  },
  {
    slug: 'mesedora',
    ref: 'PRV-MEC-01',
    title: 'Mecedora',
    shortDesc: 'Mecedora plegable de listones de madera.',
    description:
      'Mecedora de listones de madera con respaldo reclinable y apoyabrazos. Estructura plegable, cómoda para terrazas, jardines y espacios de descanso.',
    imageFile: 'mesedora.png',
    variants: { TORNILLO: 924.83, PINO: 739.86, COPAIBA: 826.18, CEDRO: 986.48, ROBLE: 789.18 },
  },
  {
    slug: 'base-refrigerador',
    ref: 'PRV-BAS-01',
    title: 'Base de Refrigerador',
    shortDesc: 'Base de madera para refrigerador, con diseño trapezoidal.',
    description:
      'Base de refrigerador en madera, con diseño trapezoidal y zócalo reforzado. Eleva el electrodoméstico del piso, facilitando la limpieza y protegiéndolo de la humedad.',
    imageFile: 'base-refrigerador.png',
    variants: { TORNILLO: 345.27, PINO: 271.28, COPAIBA: 308.28, CEDRO: 369.93, ROBLE: 283.61 },
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

async function uploadImage(productId: string, imageFile: string) {
  const localPath = join(ASSETS, imageFile);
  if (!existsSync(localPath)) return null;

  const ext = imageFile.split('.').pop()?.toLowerCase();
  const contentType =
    ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png';
  const storagePath = `products/${productId}/${imageFile}`;
  const file = bucket.file(storagePath);

  await file.save(readFileSync(localPath), { contentType, metadata: { cacheControl: 'public, max-age=31536000' } });
  if (!process.env.STORAGE_EMULATOR_HOST) await file.makePublic().catch(() => undefined);

  return { storagePath, url: buildImageUrl(storagePath), alt: null, isPrimary: true, order: 0 };
}

async function main() {
  // Resolver la categoría Aserradero PREVCA
  const catSnap = await db
    .collection('categories')
    .where('slug', '==', CATEGORY_SLUG)
    .limit(1)
    .get();
  if (catSnap.empty) {
    console.error(`❌ No existe la categoría "${CATEGORY_SLUG}". Corra el seed de categorías primero.`);
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

    const woodVariants = Object.entries(item.variants ?? {}).map(([woodType, price]) => ({
      woodType: woodType as WoodType,
      price,
    }));

    const image = await uploadImage(ref.id, item.imageFile);
    if (!image) missing.push(item.imageFile);

    const data: Record<string, unknown> = {
      slug: item.slug,
      ref: item.ref,
      title: item.title,
      division: 'MADERA',
      categoryId,
      shortDesc: item.shortDesc,
      description: item.description,
      specs: null,
      features: [],
      scientificName: null,
      origin: null,
      applications: null,
      datasheetUrl: null,
      price: item.price ?? null,
      woodVariants,
      showPrice: true,
      allowsDirectPurchase: true,
      stock: 0,
      showStock: false,
      trackStock: false, // se fabrican a pedido
      isActive: true,
      isFeatured: false,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (isNew) {
      data.order = 100 + P.indexOf(item);
      data.createdAt = FieldValue.serverTimestamp();
    }
    // Solo pisamos las imágenes si logramos subir una nueva
    if (image) data.images = [image];

    await ref.set(data, { merge: true });

    const tag = isNew ? '+ nuevo  ' : '~ actualiza';
    const priceInfo = woodVariants.length
      ? `${woodVariants.length} maderas`
      : `S/ ${item.price}`;
    console.log(`   ${tag} ${image ? '🖼' : '  '} ${item.slug.padEnd(30)} ${priceInfo}`);
    if (isNew) created++;
    else updated++;
  }

  console.log(`\n✨ Listo: ${created} creado(s), ${updated} actualizado(s).`);
  if (missing.length) {
    console.log(`\n⚠  ${missing.length} imagen(es) no encontradas en seed-assets/madera/prevca/:`);
    missing.forEach((m) => console.log(`   - ${m}`));
    console.log('   Los productos se crearon sin foto; agréguela y vuelva a correr el seed.');
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error en el seed:', err);
    process.exit(1);
  });
