/**
 * Seed inicial: crea categorías y productos de la división MADERA.
 *
 * Categorías:
 *   - Aserradero PREVCA (catálogo ecommerce clásico)
 *   - Corporación Maderera COPESA (catálogo enciclopédico tipo librería)
 *
 * Imágenes: se leen desde `backend/seed-assets/madera/{prevca|copesa}/{filename}`.
 * Si la imagen no existe en disco, el producto se crea sin imagen y se puede
 * subir después desde el panel admin.
 *
 * Uso (emulador local — por defecto):
 *   npm run serve            # en otra terminal: levanta emuladores
 *   npm run seed             # carga datos
 *
 * Uso (producción real):
 *   npm run seed:prod        # requiere backend/serviceAccountKey.json
 *
 * El script borra TODOS los productos y categorías existentes antes de insertar,
 * por lo que se puede ejecutar varias veces sin duplicar.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { Division } from '../config/constants';

const PROJECT_ID = 'app-prevca';
const STORAGE_BUCKET = `${PROJECT_ID}.firebasestorage.app`;

const isProd = process.argv.includes('--prod');

if (isProd) {
  const keyPath = join(process.cwd(), 'serviceAccountKey.json');
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(readFileSync(keyPath, 'utf-8'));
  } catch {
    console.error(`❌ No se encontró ${keyPath}`);
    console.error('   Descárguelo desde Firebase Console > Service accounts.');
    process.exit(1);
  }
  initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id,
    storageBucket: STORAGE_BUCKET,
  });
  console.log(`🚀 Modo PRODUCCIÓN — proyecto: ${serviceAccount.project_id}`);
} else {
  process.env.FIRESTORE_EMULATOR_HOST ||= 'localhost:8080';
  process.env.STORAGE_EMULATOR_HOST ||= 'http://localhost:9199';
  initializeApp({ projectId: PROJECT_ID, storageBucket: STORAGE_BUCKET });
  console.log('🧪 Modo EMULADOR local');
}

const db = getFirestore();
const bucket = getStorage().bucket();

const SEED_ASSETS_PATH = join(process.cwd(), 'seed-assets');

interface SeedCategory {
  slug: string;
  name: string;
  division: Division;
  order: number;
}

interface SeedProduct {
  slug: string;
  ref: string;
  title: string;
  division: Division;
  categorySlug: string; // se resuelve a categoryId tras crear categorías
  shortDesc: string;
  description: string;
  specs: string | null;
  features: string[];
  scientificName: string | null;
  origin: string | null;
  applications: string | null;
  datasheetUrl: string | null;
  imageFile: string | null; // relativo a SEED_ASSETS_PATH/{division-lower}/
}

interface ProductImageDoc {
  storagePath: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
  order: number;
}

const CATEGORIES: SeedCategory[] = [
  {
    slug: 'aserradero-prevca',
    name: 'Aserradero PREVCA',
    division: 'MADERA',
    order: 0,
  },
  {
    slug: 'corporacion-maderera-copesa',
    name: 'Corporación Maderera COPESA',
    division: 'MADERA',
    order: 1,
  },
];

const PRODUCTS: SeedProduct[] = [
  // ===== ASERRADERO PREVCA =====
  {
    slug: 'madera-aserrada',
    ref: 'PRV-MAD-01',
    title: 'Madera Aserrada',
    division: 'MADERA',
    categorySlug: 'aserradero-prevca',
    shortDesc:
      'Madera aserrada de alta calidad para construcción, encofrados y carpintería. Disponible en múltiples escuadrías.',
    description:
      'Producimos madera aserrada de pino y eucalipto, procesada en nuestro aserradero con sierras de alta precisión. Cada lote pasa por un riguroso control de calidad para garantizar dimensiones exactas, secado adecuado y ausencia de defectos estructurales. Trabajamos bajo pedido y stock permanente para entregas rápidas a obras, carpinterías y distribuidores.',
    specs: 'Escuadrías estándar y a medida',
    features: [
      'Sierras de precisión calibradas',
      'Secado controlado al horno',
      'Trazabilidad por lote',
      'Atención a pedidos a medida',
    ],
    scientificName: null,
    origin: null,
    applications: null,
    datasheetUrl: null,
    imageFile: 'prevca/madera-aserrada.png',
  },
  {
    slug: 'aserrin-5kg',
    ref: 'PRV-ASR-05',
    title: 'Aserrín — Presentación 5 KG',
    division: 'MADERA',
    categorySlug: 'aserradero-prevca',
    shortDesc:
      'Subproducto industrial limpio y seco, ideal para uso doméstico, granjas pequeñas y embalaje.',
    description:
      'Aserrín 100% natural obtenido del procesamiento de pino y eucalipto en nuestro aserradero. Bolsa de 5 kg ideal para uso doméstico, mascotas, jardinería y embalaje. Producto limpio, libre de químicos y con bajo contenido de humedad para garantizar conservación.',
    specs: 'Bolsa de 5 kg',
    features: [
      'Aserrín limpio y seco',
      '100% natural sin químicos',
      'Bolsa resistente sellada',
      'Ideal uso doméstico y mascotas',
    ],
    scientificName: null,
    origin: null,
    applications: null,
    datasheetUrl: null,
    imageFile: 'prevca/aserrin-5kg.png',
  },
  {
    slug: 'aserrin-10kg',
    ref: 'PRV-ASR-10',
    title: 'Aserrín — Presentación 10 KG',
    division: 'MADERA',
    categorySlug: 'aserradero-prevca',
    shortDesc:
      'Presentación intermedia para granjas, criaderos y talleres que requieren mayor volumen.',
    description:
      'Aserrín en presentación de 10 kg, formato práctico para granjas medianas, criaderos avícolas, establos y talleres. Producto seco y tamizado, listo para uso como cama animal, absorbente o relleno industrial.',
    specs: 'Bolsa de 10 kg',
    features: [
      'Volumen óptimo para granjas medianas',
      'Tamizado uniforme',
      'Alta capacidad de absorción',
      'Empaque resistente para apilado',
    ],
    scientificName: null,
    origin: null,
    applications: null,
    datasheetUrl: null,
    imageFile: 'prevca/aserrin-10kg.png',
  },
  {
    slug: 'aserrin-50kg',
    ref: 'PRV-ASR-50',
    title: 'Aserrín — Presentación 50 KG',
    division: 'MADERA',
    categorySlug: 'aserradero-prevca',
    shortDesc:
      'Presentación industrial para grandes consumidores: avícolas, ganaderos e industria del compost.',
    description:
      'Aserrín en saco industrial de 50 kg, dirigido a grandes consumidores como granjas avícolas, ganaderos, fábricas de pellets y productores de compost. Suministro permanente y posibilidad de despachos a granel bajo pedido.',
    specs: 'Saco industrial de 50 kg',
    features: [
      'Volumen industrial',
      'Suministro permanente garantizado',
      'Disponible también a granel',
      'Despacho a obra/planta del cliente',
    ],
    scientificName: null,
    origin: null,
    applications: null,
    datasheetUrl: null,
    imageFile: 'prevca/aserrin-50kg.png',
  },
  {
    slug: 'viruta-5kg',
    ref: 'PRV-VIR-05',
    title: 'Viruta — Presentación 5 KG',
    division: 'MADERA',
    categorySlug: 'aserradero-prevca',
    shortDesc:
      'Viruta de madera limpia, ideal para camas de mascotas pequeñas, embalaje fino y manualidades.',
    description:
      'Viruta de madera de pino obtenida del cepillado y procesamiento, libre de polvo fino. Bolsa de 5 kg ideal para hámsters, conejos, roedores, embalaje delicado y proyectos creativos. Producto suave, esponjoso y de alta absorción.',
    specs: 'Bolsa de 5 kg',
    features: [
      'Libre de polvo fino',
      'Textura suave y esponjosa',
      'Ideal para mascotas pequeñas',
      'Apto embalaje delicado',
    ],
    scientificName: null,
    origin: null,
    applications: null,
    datasheetUrl: null,
    imageFile: 'prevca/viruta-5kg.png',
  },
  {
    slug: 'viruta-10kg',
    ref: 'PRV-VIR-10',
    title: 'Viruta — Presentación 10 KG',
    division: 'MADERA',
    categorySlug: 'aserradero-prevca',
    shortDesc:
      'Formato medio para criaderos, talleres de embalaje y proyectos artesanales de mayor escala.',
    description:
      'Viruta en presentación de 10 kg, ideal para criaderos pequeños, talleres de embalaje protector y proyectos artesanales que requieren un volumen intermedio. Producto tamizado, libre de astillas grandes.',
    specs: 'Bolsa de 10 kg',
    features: [
      'Tamizado libre de astillas',
      'Volumen intermedio práctico',
      'Empaque sellado',
      'Trazabilidad por lote',
    ],
    scientificName: null,
    origin: null,
    applications: null,
    datasheetUrl: null,
    imageFile: 'prevca/viruta-10kg.png',
  },
  {
    slug: 'viruta-30kg',
    ref: 'PRV-VIR-30',
    title: 'Viruta — Presentación 30 KG',
    division: 'MADERA',
    categorySlug: 'aserradero-prevca',
    shortDesc:
      'Saco grande para criaderos avícolas, equinos y fábricas de embalaje industrial.',
    description:
      'Viruta en saco industrial de 30 kg, formato dirigido a criaderos avícolas grandes, caballerizas, establos y fábricas de embalaje. Producto consistente, de alta absorción y disponibilidad permanente.',
    specs: 'Saco industrial de 30 kg',
    features: [
      'Volumen industrial',
      'Apto caballerizas y avícolas',
      'Alta absorción y conservación',
      'Despacho directo a planta',
    ],
    scientificName: null,
    origin: null,
    applications: null,
    datasheetUrl: null,
    imageFile: 'prevca/viruta-30kg.png',
  },
  {
    slug: 'puertas-a-medida',
    ref: 'PRV-TRM-PRT',
    title: 'Puertas a Medida',
    division: 'MADERA',
    categorySlug: 'aserradero-prevca',
    shortDesc:
      'Fabricación de puertas de madera maciza a medida para vivienda, comercio y proyectos especiales.',
    description:
      'Producimos puertas de madera maciza diseñadas y fabricadas a medida: puertas principales, interiores, contraplacadas, talladas y de seguridad. Trabajamos con maderas seleccionadas de nuestro propio aserradero, garantizando dimensiones exactas, secado adecuado y acabados a elección. Solicite cotización con sus medidas y especificaciones.',
    specs: 'Dimensiones y acabados a medida',
    features: [
      'Madera maciza seleccionada',
      'Secado controlado para evitar deformaciones',
      'Acabados a elección del cliente',
      'Asesoría técnica incluida',
    ],
    scientificName: null,
    origin: null,
    applications: null,
    datasheetUrl: null,
    imageFile: 'prevca/puertas-medida.png',
  },
  {
    slug: 'camas-a-medida',
    ref: 'PRV-TRM-CMA',
    title: 'Camas a Medida',
    division: 'MADERA',
    categorySlug: 'aserradero-prevca',
    shortDesc:
      'Camas de madera maciza fabricadas a medida para dormitorios residenciales y hospedajes.',
    description:
      'Diseñamos y fabricamos camas de madera maciza en todas las dimensiones: 1 plaza, 1.5, 2 plazas, queen, king y formatos especiales para hoteles. Trabajamos diseños clásicos, modernos y a propuesta del cliente. Acabados en barniz, laca, tinte o crudo para pintar.',
    specs: '1 plaza · 1.5 · 2 plazas · Queen · King · Especial',
    features: [
      'Diseño personalizado',
      'Madera maciza de larga vida',
      'Acabados a elección',
      'Pensado para hospedaje y residencia',
    ],
    scientificName: null,
    origin: null,
    applications: null,
    datasheetUrl: null,
    imageFile: 'prevca/camas-medida.png',
  },
  {
    slug: 'roperos-a-medida',
    ref: 'PRV-TRM-RPM',
    title: 'Roperos a Medida (Madera Maciza)',
    division: 'MADERA',
    categorySlug: 'aserradero-prevca',
    shortDesc:
      'Roperos en madera maciza diseñados a medida para aprovechar al máximo cualquier espacio.',
    description:
      'Fabricamos roperos en madera maciza adaptados al espacio disponible y a las necesidades de almacenamiento del cliente: cajoneras, divisiones para colgar, zapateras integradas, espejos y herrajes de primera calidad. Asesoría de diseño incluida.',
    specs: 'Diseño y dimensiones personalizados',
    features: [
      'Aprovechamiento total del espacio',
      'Herrajes de primera calidad',
      'Asesoría de diseño incluida',
      'Acabados a elección',
    ],
    scientificName: null,
    origin: null,
    applications: null,
    datasheetUrl: null,
    imageFile: 'prevca/roperos-madera.png',
  },
  {
    slug: 'roperos-melamine',
    ref: 'PRV-MEL-RPM',
    title: 'Roperos en Melamine',
    division: 'MADERA',
    categorySlug: 'aserradero-prevca',
    shortDesc:
      'Roperos en melamine de 18mm, diseño moderno, gran variedad de colores y acabados.',
    description:
      'Roperos fabricados en melamine de 18mm, una opción económica, ligera y con gran variedad de colores y texturas (madera, mate, brillante). Diseño funcional moderno con divisiones, cajoneras y zapatera. Cantos termolaminados para máxima durabilidad.',
    specs: 'Melamine 18mm · Múltiples colores',
    features: [
      'Acabados modernos y variados',
      'Económico vs madera maciza',
      'Cantos termolaminados',
      'Instalación incluida',
    ],
    scientificName: null,
    origin: null,
    applications: null,
    datasheetUrl: null,
    imageFile: 'prevca/roperos-melamine.png',
  },
  {
    slug: 'reposteros-melamine',
    ref: 'PRV-MEL-RPS',
    title: 'Reposteros de Cocina en Melamine',
    division: 'MADERA',
    categorySlug: 'aserradero-prevca',
    shortDesc:
      'Reposteros altos, bajos y de pared en melamine de 18mm, con herrajes europeos.',
    description:
      'Reposteros de cocina diseñados a medida en melamine de 18mm: módulos altos, bajos, isla y muebles de pared. Herrajes europeos de primera marca (bisagras hidráulicas, correderas con freno). Diseño 3D previo a fabricación y asesoría de funcionalidad.',
    specs: 'Melamine 18mm · Herrajes europeos',
    features: [
      'Diseño 3D previo a fabricación',
      'Herrajes europeos de primera marca',
      'Bisagras hidráulicas',
      'Adaptable a cualquier espacio',
    ],
    scientificName: null,
    origin: null,
    applications: null,
    datasheetUrl: null,
    imageFile: 'prevca/reposteros-melamine.png',
  },

  // ===== CORPORACIÓN MADERERA COPESA =====
  // Catálogo enciclopédico tipo librería de maderas
  {
    slug: 'pino-silvestre',
    ref: 'CPS-PSL',
    title: 'Pino Silvestre',
    division: 'MADERA',
    categorySlug: 'corporacion-maderera-copesa',
    shortDesc:
      'Ligera, económica, fácil de manipular y disponible en múltiples formatos.',
    description:
      'El Pino Silvestre es una de las coníferas más utilizadas en Europa por su buena disponibilidad, ligereza y versatilidad. Su albura presenta un tono amarillo pálido, mientras que el duramen adquiere matices rojizos. La fibra es recta, con grano medio a fino y nudos visibles, normalmente sanos y de tamaño variable.',
    specs: null,
    features: [],
    scientificName: 'Pinus sylvestris L.',
    origin: 'España, centro y norte de Europa, Reino Unido, Rusia y norte de Asia.',
    applications:
      'Se utiliza tanto en mobiliario y ebanistería fina, como en carpintería de interior (puertas, molduras, rodapiés, revestimientos) y carpintería exterior (ventanas y puertas). También es común en chapas decorativas y tableros contrachapados, gracias a su buena relación entre peso y resistencia.',
    datasheetUrl: null,
    imageFile: 'copesa/pino-silvestre.png',
  },
  {
    slug: 'abeto-rojo',
    ref: 'CPS-ABR',
    title: 'Abeto Rojo',
    division: 'MADERA',
    categorySlug: 'corporacion-maderera-copesa',
    shortDesc: 'Ideal para construcción ligera y carpintería de interior.',
    description:
      'El Abeto Rojo, también conocido como Picea, es una conífera de gran porte muy apreciada por su madera ligera y de fácil trabajabilidad. Presenta un color blanco-amarillento uniforme, fibra recta y nudos pequeños y dispersos, lo que le otorga una estética limpia y elegante.',
    specs: null,
    features: [],
    scientificName: 'Picea abies (L.) H. Karst.',
    origin: 'Centro y norte de Europa, en especial Escandinavia, Alemania y los Alpes.',
    applications:
      'Muy utilizada en construcción ligera, vigas estructurales encoladas, carpintería de interior, revestimientos de paredes y techos, fabricación de molduras y como materia prima para tableros contrachapados y pasta de papel.',
    datasheetUrl: null,
    imageFile: 'copesa/abeto-rojo.png',
  },
  {
    slug: 'pino-amarillo-del-sur',
    ref: 'CPS-PAS',
    title: 'Pino Amarillo del Sur',
    division: 'MADERA',
    categorySlug: 'corporacion-maderera-copesa',
    shortDesc: 'Práctica y eficaz.',
    description:
      'El Pino Amarillo del Sur (Southern Yellow Pine) es una madera de coníferas originaria del sureste de Estados Unidos, reconocida por su elevada densidad y excelente resistencia mecánica. Presenta un color amarillo dorado con vetas marcadas y un duramen más rojizo. Es una de las maderas más demandadas para usos estructurales pesados.',
    specs: null,
    features: [],
    scientificName: 'Pinus palustris / Pinus elliottii (y especies relacionadas)',
    origin: 'Sureste de los Estados Unidos.',
    applications:
      'Ampliamente utilizada en construcción estructural, vigas, postes, encofrados, pisos industriales, palets y embalaje pesado. También se emplea tratada para usos exteriores como traviesas, terrazas y mobiliario de jardín.',
    datasheetUrl: null,
    imageFile: 'copesa/pino-amarillo-sur.png',
  },
  {
    slug: 'roble',
    ref: 'CPS-RBL',
    title: 'Roble',
    division: 'MADERA',
    categorySlug: 'corporacion-maderera-copesa',
    shortDesc: 'Dura, noble y de gran durabilidad — ideal para ebanistería fina.',
    description:
      'El Roble es una de las maderas frondosas más valoradas del mundo por su dureza, resistencia y belleza natural. De color marrón claro a oscuro con veta marcada, ofrece excelente durabilidad y resistencia a la humedad. Es la madera por excelencia para ebanistería de lujo, suelos nobles y mobiliario de larga vida.',
    specs: null,
    features: [],
    scientificName: 'Quercus robur / Quercus petraea',
    origin: 'Europa, principalmente Francia, Alemania, Polonia y la Península Ibérica.',
    applications:
      'Mobiliario de alta gama, ebanistería, suelos macizos, escaleras, revestimientos de interior, carpintería decorativa y construcción naval. También es la madera clásica para la fabricación de barricas de vino y whisky.',
    datasheetUrl: null,
    imageFile: 'copesa/roble.png',
  },
  {
    slug: 'cedro',
    ref: 'CPS-CDR',
    title: 'Cedro',
    division: 'MADERA',
    categorySlug: 'corporacion-maderera-copesa',
    shortDesc: 'Aromática, durable y muy estable — clásica para muebles finos.',
    description:
      'El Cedro es una madera semipesada de color rojizo-amarronado con un aroma característico que repele insectos de manera natural. Su grano es recto, su textura media y su trabajabilidad excelente. Es muy estable dimensionalmente y resistente a la pudrición, lo que la hace ideal tanto para interior como para exterior protegido.',
    specs: null,
    features: [],
    scientificName: 'Cedrela odorata',
    origin: 'América Central y del Sur, principalmente Perú, Bolivia, Brasil y Centroamérica.',
    applications:
      'Mobiliario fino y de lujo, puertas y ventanas, instrumentos musicales (cajas de guitarra), revestimientos, humidores de cigarros, embarcaciones y carpintería decorativa. Su aroma natural la hace muy apreciada para roperos y baúles.',
    datasheetUrl: null,
    imageFile: 'copesa/cedro.png',
  },
  {
    slug: 'pino-insigne',
    ref: 'CPS-PIN',
    title: 'Pino Insigne (Pino Radiata)',
    division: 'MADERA',
    categorySlug: 'corporacion-maderera-copesa',
    shortDesc: 'Versátil, sostenible y económica — la conífera más plantada del mundo.',
    description:
      'El Pino Insigne, también llamado Pino Radiata o Pino de Monterrey, es la conífera de plantación más extendida a nivel mundial. Presenta una madera ligera de color blanco-amarillento, fibra recta y nudos abundantes pero pequeños. Su rápido crecimiento y trabajabilidad la hacen una opción sostenible y económica para una gran variedad de usos.',
    specs: null,
    features: [],
    scientificName: 'Pinus radiata D. Don',
    origin:
      'Originaria de California (EE.UU.), hoy ampliamente plantada en Chile, Nueva Zelanda, Australia, España y Sudáfrica.',
    applications:
      'Construcción ligera, encofrados, palets, embalajes, tableros (OSB, MDF, contrachapado), molduras, carpintería de interior y muebles económicos. Tratada en autoclave es muy utilizada para usos exteriores como vallados y pérgolas.',
    datasheetUrl: null,
    imageFile: 'copesa/pino-insigne.png',
  },
];

const DIVISION_FOLDER: Record<Division, string> = {
  MADERA: 'madera',
  HOSPITALIDAD: 'hospitalidad',
  CAFE: 'cafe',
  TRANSPORTE: 'transporte',
};

const buildImageUrl = (storagePath: string): string => {
  const emulatorHost = process.env.STORAGE_EMULATOR_HOST;
  if (emulatorHost) {
    const host = emulatorHost.replace(/^https?:\/\//, '');
    return `http://${host}/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;
  }
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;
};

async function uploadImage(
  productId: string,
  division: Division,
  imageFile: string,
): Promise<ProductImageDoc | null> {
  const localPath = join(SEED_ASSETS_PATH, DIVISION_FOLDER[division], imageFile);

  if (!existsSync(localPath)) {
    return null;
  }

  const buffer = readFileSync(localPath);
  const filename = imageFile.split('/').pop()!;
  const ext = filename.split('.').pop()?.toLowerCase();
  const contentType =
    ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png';

  const storagePath = `products/${productId}/${filename}`;
  const file = bucket.file(storagePath);

  await file.save(buffer, {
    contentType,
    metadata: { cacheControl: 'public, max-age=3600' },
  });

  if (isProd) {
    await file.makePublic();
  }

  return {
    storagePath,
    url: buildImageUrl(storagePath),
    alt: null,
    isPrimary: true,
    order: 0,
  };
}

async function clearCollection(name: string) {
  const snap = await db.collection(name).get();
  if (snap.empty) return 0;
  const batch = db.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  return snap.size;
}

async function seedCategories(): Promise<Map<string, string>> {
  console.log(`🌱 Insertando ${CATEGORIES.length} categorías...`);
  const slugToId = new Map<string, string>();
  for (const cat of CATEGORIES) {
    const ref = db.collection('categories').doc();
    await ref.set({
      slug: cat.slug,
      name: cat.name,
      division: cat.division,
      order: cat.order,
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    slugToId.set(cat.slug, ref.id);
    console.log(`   ✓ ${cat.division.padEnd(13)} ${cat.name} (id: ${ref.id})`);
  }
  return slugToId;
}

async function seedProducts(categoryIds: Map<string, string>) {
  console.log(`\n🌱 Insertando ${PRODUCTS.length} productos...`);
  let order = 0;
  let missingImages = 0;
  for (const product of PRODUCTS) {
    const ref = db.collection('products').doc();
    const image = await uploadImage(ref.id, product.division, product.imageFile ?? '');
    if (!image && product.imageFile) missingImages++;

    const categoryId = categoryIds.get(product.categorySlug) ?? null;

    await ref.set({
      slug: product.slug,
      ref: product.ref,
      title: product.title,
      division: product.division,
      categoryId,
      shortDesc: product.shortDesc,
      description: product.description,
      specs: product.specs,
      features: product.features,
      scientificName: product.scientificName,
      origin: product.origin,
      applications: product.applications,
      datasheetUrl: product.datasheetUrl,
      price: null,
      showPrice: false,
      stock: 0,
      showStock: false,
      trackStock: false,
      isActive: true,
      isFeatured: false,
      order: order++,
      images: image ? [image] : [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const imgMark = image ? '🖼' : '  ';
    console.log(`   ✓ ${imgMark} ${product.categorySlug.padEnd(30)} ${product.slug}`);
  }
  if (missingImages > 0) {
    console.log(
      `\n⚠  ${missingImages} producto(s) sin imagen. Coloque los archivos en backend/seed-assets/{division}/ y vuelva a correr el seed, o suba las imágenes desde el panel admin.`,
    );
  }
}

(async () => {
  try {
    console.log('🗑  Limpiando datos previos...');
    const productsDeleted = await clearCollection('products');
    const categoriesDeleted = await clearCollection('categories');
    console.log(`   ${productsDeleted} productos y ${categoriesDeleted} categorías eliminadas`);

    const categoryIds = await seedCategories();
    await seedProducts(categoryIds);

    console.log('\n✨ Seed completado exitosamente');
    if (isProd) {
      console.log('   Datos cargados a Firebase de PRODUCCIÓN.');
      console.log('   Revise en https://prevca-admin.web.app');
    } else {
      console.log('   Datos cargados al emulador local.');
      console.log('   Revise en http://localhost:4000 (UI Firebase Emulator).');
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Error en seed:', err);
    process.exit(1);
  }
})();
