/**
 * Seed inicial: migra los 16 productos hardcodeados de la landing a Firestore.
 *
 * Versión 2: también sube las imágenes locales del proyecto (landing/src/assets/<division>)
 * al Storage del emulador y las vincula a cada producto. De esa forma el catálogo arranca
 * con imágenes y Don Gerardo puede gestionarlas (agregar / borrar / cambiar primaria) desde
 * el panel admin como cualquier imagen subida normalmente.
 *
 * Uso:
 *   1. Tener emuladores corriendo: `npm run serve`
 *   2. En otra terminal: `npm run seed`
 *
 * El script borra cualquier producto existente antes de insertar, por lo que se puede
 * ejecutar varias veces sin duplicar.
 */
process.env.FIRESTORE_EMULATOR_HOST ||= 'localhost:8080';
process.env.STORAGE_EMULATOR_HOST ||= 'http://localhost:9199';

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { Division } from '../config/constants';

const PROJECT_ID = 'app-prevca';
const STORAGE_BUCKET = `${PROJECT_ID}.firebasestorage.app`;

initializeApp({ projectId: PROJECT_ID, storageBucket: STORAGE_BUCKET });

const db = getFirestore();
const bucket = getStorage().bucket();

// Path absoluto a landing/src/assets desde donde corre el script (backend/)
const ASSETS_PATH = join(process.cwd(), '..', 'landing', 'src', 'assets');

interface SeedProduct {
  slug: string;
  ref: string;
  title: string;
  division: Division;
  shortDesc: string;
  description: string;
  specs: string | null;
  features: string[];
  imageFile: string; // relative al directorio landing/src/assets
}

interface ProductImageDoc {
  storagePath: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
  order: number;
}

const PRODUCTS: SeedProduct[] = [
  // === MADERA ===
  {
    slug: 'pino-radiata',
    ref: 'RP-01',
    title: 'Madera Aserrada Pino Radiata',
    division: 'MADERA',
    shortDesc:
      'Madera de excelente trabajabilidad y resistencia, secada al horno y proveniente de bosques certificados.',
    description:
      'Nuestra madera aserrada de Pino Radiata es seleccionada cuidadosamente de bosques certificados. Su excelente trabajabilidad y resistencia la convierten en la opción ideal para estructuras, encofrados y carpintería general. Sometida a un estricto proceso de secado al horno para garantizar su estabilidad dimensional.',
    specs: 'Dimensiones: 2x4 a 8x12',
    features: [
      'Secado al horno garantizado',
      'Alta resistencia estructural',
      'Proveniente de bosques certificados',
      'Fácil trabajabilidad y acabado',
    ],
    imageFile: 'madera/madera-image-03.png',
  },
  {
    slug: 'eucalipto-globulus',
    ref: 'EG-04',
    title: 'Tablas de Eucalipto Globulus',
    division: 'MADERA',
    shortDesc:
      'Tablas de extrema dureza y durabilidad natural, secadas bajo estricto control, ideales para pisos y revestimientos.',
    description:
      'El Eucalipto Globulus se destaca por su increíble dureza y durabilidad natural. Estas tablas son procesadas con sierras de alta precisión y secadas bajo un control de humedad riguroso, evitando deformaciones. Perfectas para pisos, revestimientos y usos donde se requiera resistencia al desgaste.',
    specs: 'Espesor: 25mm - 50mm',
    features: [
      'Extrema dureza y durabilidad',
      'Resistencia natural al desgaste',
      'Veta distintiva y estética',
      'Secado controlado por computadora',
    ],
    imageFile: 'madera/madera-image-04.png',
  },
  {
    slug: 'vigas-pino',
    ref: 'RP-ST',
    title: 'Vigas Estructurales Pino',
    division: 'MADERA',
    shortDesc:
      'Vigas diseñadas para soportar cargas pesadas en longitudes de hasta 6m continuos sin uniones.',
    description:
      'Diseñadas para soportar cargas pesadas, nuestras vigas estructurales de pino son el pilar de construcciones sólidas. Clasificadas visual y mecánicamente para cumplir con los más altos estándares internacionales de resistencia. Disponibles en longitudes de hasta 6 metros continuos sin uniones.',
    specs: 'Longitud: Hasta 6m continuos',
    features: [
      'Clasificación estructural estricta',
      'Longitudes continuas de hasta 6m',
      'Tratamiento anti-plagas',
      'Alta capacidad de carga',
    ],
    imageFile: 'madera/madera-image-05.png',
  },
  {
    slug: 'eucalipto-mueble',
    ref: 'EG-FG',
    title: 'Eucalipto Grado Mueble',
    division: 'MADERA',
    shortDesc:
      'Línea premium seca al 10-12% de humedad, ideal para ebanistería fina y acabados de lujo.',
    description:
      'Nuestra línea premium de Eucalipto seleccionada especialmente para la industria mueblera de alto nivel. Con un secado meticuloso que alcanza el 10-12% de humedad, esta madera garantiza la máxima estabilidad para trabajos de ebanistería fina, permitiendo acabados lisos y pulidos de lujo.',
    specs: 'Secado Horno: 10-12% Humedad',
    features: [
      'Humedad óptima del 10-12%',
      'Selección libre de nudos',
      'Color uniforme y veta fina',
      'Ideal para ebanistería de lujo',
    ],
    imageFile: 'madera/madera-image-06.png',
  },

  // === HOSPITALIDAD ===
  {
    slug: 'deluxe-king',
    ref: 'DLX-01',
    title: 'Habitación Deluxe King',
    division: 'HOSPITALIDAD',
    shortDesc:
      'Santuario de tranquilidad con cama King size, sábanas de algodón egipcio y baño de mármol con ducha de lluvia.',
    description:
      'Espacio diseñado para la máxima comodidad con cama King, lencería de algodón egipcio de 600 hilos y baño completo en mármol con ducha de lluvia. Amenidades premium, escritorio ejecutivo y vista panorámica.',
    specs: '38 m² · Vista exterior',
    features: [
      'Cama King con lencería de algodón egipcio',
      'Baño completo en mármol con ducha de lluvia',
      'Smart TV 55" y servicio de habitaciones 24/7',
      'WiFi de alta velocidad sin costo',
    ],
    imageFile: 'hospitalidad/hosp-image-03.png',
  },
  {
    slug: 'suite-presidencial',
    ref: 'SUI-PR',
    title: 'Suite Presidencial Panorama',
    division: 'HOSPITALIDAD',
    shortDesc:
      'El pináculo del lujo con vistas de 180 grados, comedor privado, sala de estar y servicio de mayordomo personal dedicado.',
    description:
      'La experiencia máxima de hospitalidad. Vistas panorámicas de 180 grados, comedor privado para ocho personas, sala de estar independiente, dormitorio principal con vestidor y servicio de mayordomo dedicado las 24 horas.',
    specs: '180 m² · Piso ejecutivo',
    features: [
      'Vistas panorámicas de 180°',
      'Servicio de mayordomo personal 24/7',
      'Comedor privado para 8 personas',
      'Acceso exclusivo al lounge ejecutivo',
    ],
    imageFile: 'hospitalidad/hosp-image-04.png',
  },
  {
    slug: 'restaurante-azul',
    ref: 'RST-01',
    title: 'Restaurante Signature "Azul"',
    division: 'HOSPITALIDAD',
    shortDesc:
      'Experiencia gastronómica galardonada con menús de degustación estacionales que fusionan sabores locales y técnicas internacionales.',
    description:
      'Restaurante insignia de la cadena, reconocido con múltiples premios gastronómicos. Ofrece menús de degustación estacionales bajo la dirección de un chef ejecutivo de renombre, combinando producto local de primera calidad con técnicas internacionales contemporáneas.',
    specs: 'Capacidad: 80 comensales',
    features: [
      'Chef ejecutivo galardonado',
      'Menús de degustación estacionales',
      'Cava con más de 300 etiquetas',
      'Salones privados para eventos corporativos',
    ],
    imageFile: 'hospitalidad/hosp-image-05.png',
  },
  {
    slug: 'spa-wellness',
    ref: 'SPA-01',
    title: 'Spa & Wellness Center',
    division: 'HOSPITALIDAD',
    shortDesc:
      'Santuario holístico con circuito de hidroterapia completo y tratamientos exclusivos para una relajación profunda y duradera.',
    description:
      'Centro integral de bienestar con circuito de hidroterapia (sauna finlandés, baño turco, piscina vitalizante y duchas sensoriales), cabinas de tratamientos individuales y de pareja, gimnasio totalmente equipado y zona de relajación con vistas al jardín.',
    specs: '1,200 m² · 8 cabinas',
    features: [
      'Circuito completo de hidroterapia',
      'Tratamientos faciales y corporales premium',
      'Cabinas individuales y de pareja',
      'Gimnasio y zona de relajación',
    ],
    imageFile: 'hospitalidad/hosp-image-06.png',
  },

  // === CAFÉ ===
  {
    slug: 'especialidad-origen',
    ref: 'ESP-01',
    title: 'Café de Especialidad Origen',
    division: 'CAFE',
    shortDesc:
      'Perfil de taza complejo con notas a frutas de hueso y caramelo. Tostado artesanal en pequeños lotes para máxima frescura.',
    description:
      'Café de especialidad de origen único, calificado con más de 85 puntos SCA. Tostado artesanal en pequeños lotes para preservar la complejidad aromática. Notas predominantes a frutas de hueso, caramelo y un final dulce con acidez balanceada.',
    specs: 'Tueste: Medio · 250g / 1kg',
    features: [
      'Calificación SCA mayor a 85 puntos',
      'Origen único trazable',
      'Tueste artesanal por lotes',
      'Empaque con válvula desgasificadora',
    ],
    imageFile: 'cafe/cafe-image-03.png',
  },
  {
    slug: 'verde-exportacion',
    ref: 'GRN-EX',
    title: 'Café Verde Grado Exportación',
    division: 'CAFE',
    shortDesc:
      'Grano verde meticulosamente procesado y seleccionado (Preparación Europea) para asegurar lotes consistentes de exportación.',
    description:
      'Grano verde de calidad exportación con Preparación Europea: máxima limpieza, libre de defectos primarios y selección manual de gránulos. Trazabilidad completa desde el productor hasta el contenedor. Disponible en sacos de yute de 60kg o supersacos a granel.',
    specs: 'Sacos: 60 kg / Granel',
    features: [
      'Preparación Europea',
      'Trazabilidad completa de origen',
      'Análisis de humedad y densidad',
      'Empaque con barrera GrainPro',
    ],
    imageFile: 'cafe/cafe-image-04.png',
  },
  {
    slug: 'capsulas-premium',
    ref: 'CAP-PR',
    title: 'Cápsulas Premium Espresso',
    division: 'CAFE',
    shortDesc:
      'Cápsulas compatibles que sellan herméticamente café recién molido, preservando aromas para un espresso intenso con crema espesa.',
    description:
      'Cápsulas compatibles con sistema Nespresso fabricadas con café recién molido y sellado hermético. Garantizan extracción óptima, crema persistente y aromas preservados hasta el momento del consumo. Disponibles en intensidades 5, 7, 9 y 11.',
    specs: 'Pack de 10 unidades',
    features: [
      'Compatible con Nespresso',
      'Sellado hermético con barrera de oxígeno',
      'Cuatro niveles de intensidad',
      'Cápsulas reciclables',
    ],
    imageFile: 'cafe/cafe-image-05.png',
  },
  {
    slug: 'equipamiento-barista',
    ref: 'EQP-BR',
    title: 'Equipamiento Barista Profesional',
    division: 'CAFE',
    shortDesc:
      'Máquinas de espresso de múltiples grupos y molinos comerciales de las mejores marcas para garantizar una extracción perfecta.',
    description:
      'Línea completa de equipamiento para cafeterías de especialidad y hostelería profesional: máquinas de espresso de 2 y 3 grupos, molinos cónicos comerciales, accesorios y consumibles. Incluye instalación, capacitación de personal y mantenimiento preventivo.',
    specs: 'Garantía 2 años · Soporte 24/7',
    features: [
      'Máquinas espresso de 2 y 3 grupos',
      'Molinos cónicos profesionales',
      'Capacitación de personal incluida',
      'Mantenimiento preventivo anual',
    ],
    imageFile: 'cafe/cafe-image-06.png',
  },

  // === TRANSPORTE ===
  {
    slug: 'carga-pesada',
    ref: 'TRN-NAC',
    title: 'Transporte de Carga Pesada',
    division: 'TRANSPORTE',
    shortDesc:
      'Servicio integral de transporte terrestre a nivel nacional con moderna flota y monitoreo GPS 24/7.',
    description:
      'Servicio integral de transporte terrestre de carga pesada con cobertura nacional. Flota moderna con unidades T1, T2 y T3, monitoreo GPS en tiempo real y operadores certificados. Pólizas de seguro de mercadería incluidas.',
    specs: 'Capacidad: hasta 30 toneladas',
    features: [
      'Cobertura nacional',
      'Monitoreo GPS 24/7',
      'Seguro de mercadería incluido',
      'Operadores certificados',
    ],
    imageFile: 'transporte/transporte-image-03.png',
  },
  {
    slug: 'logistica-internacional',
    ref: 'TRN-INT',
    title: 'Logística Internacional',
    division: 'TRANSPORTE',
    shortDesc:
      'Soluciones integrales de transporte internacional de carga aéreo y marítimo, con gestión aduanera.',
    description:
      'Operador logístico internacional con redes aérea y marítima en los principales puertos del mundo. Gestión aduanera completa, consolidación de carga, almacenes en zona franca y seguimiento end-to-end del embarque.',
    specs: 'Aéreo · Marítimo · Multimodal',
    features: [
      'Gestión aduanera completa',
      'Consolidación de carga internacional',
      'Almacenes en zona franca',
      'Seguimiento de embarques en tiempo real',
    ],
    imageFile: 'transporte/transporte-image-04.png',
  },
  {
    slug: 'ultima-milla',
    ref: 'TRN-ULL',
    title: 'Distribución Última Milla',
    division: 'TRANSPORTE',
    shortDesc:
      'Servicio de distribución urbana diseñado para operaciones B2B y B2C con tecnología de ruteo dinámico.',
    description:
      'Solución de distribución urbana de última milla con flota de vehículos ligeros eléctricos e híbridos. Plataforma de ruteo dinámico, prueba de entrega digital, notificaciones al destinatario y métricas en tiempo real para el cliente.',
    specs: 'B2B · B2C · E-commerce',
    features: [
      'Flota eléctrica e híbrida',
      'Ruteo dinámico con IA',
      'Prueba de entrega digital',
      'Dashboard de métricas en tiempo real',
    ],
    imageFile: 'transporte/transporte-image-05.png',
  },
  {
    slug: 'especializado',
    ref: 'TRN-ESP',
    title: 'Transporte Especializado',
    division: 'TRANSPORTE',
    shortDesc:
      'Soluciones a la medida para cargas refrigeradas, materiales peligrosos o sobredimensionadas.',
    description:
      'Servicios especializados de transporte para cargas que requieren manejo particular: cadena de frío para perecibles y farmacéuticos, transporte de materiales peligrosos (IMDG) con certificación, y operaciones de carga sobredimensionada con escolta.',
    specs: 'Refrigerado · IMDG · Especial',
    features: [
      'Cadena de frío certificada',
      'Certificación IMDG para materiales peligrosos',
      'Operaciones con carga sobredimensionada',
      'Equipos y escolta especializada',
    ],
    imageFile: 'transporte/transporte-image-06.png',
  },
];

/**
 * Construye la URL pública de un archivo en el Storage emulator.
 * En producción (sin STORAGE_EMULATOR_HOST) usaría el formato de Cloud Storage.
 */
const buildImageUrl = (storagePath: string): string => {
  const emulatorHost = process.env.STORAGE_EMULATOR_HOST;
  if (emulatorHost) {
    const host = emulatorHost.replace(/^https?:\/\//, '');
    return `http://${host}/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;
  }
  return `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
};

async function uploadImage(productId: string, slug: string, imageFile: string): Promise<ProductImageDoc | null> {
  const localPath = join(ASSETS_PATH, imageFile);
  let buffer: Buffer;
  try {
    buffer = readFileSync(localPath);
  } catch (err) {
    console.warn(`   ⚠  No se pudo leer ${localPath}, producto queda sin imagen.`);
    return null;
  }

  const filename = imageFile.split('/').pop()!;
  const storagePath = `products/${productId}/${filename}`;
  const file = bucket.file(storagePath);

  await file.save(buffer, {
    contentType: 'image/png',
    metadata: { cacheControl: 'public, max-age=3600' },
  });

  return {
    storagePath,
    url: buildImageUrl(storagePath),
    alt: null,
    isPrimary: true,
    order: 0,
  };
}

async function clearProducts() {
  console.log('🗑  Limpiando colección products...');
  const snap = await db.collection('products').get();
  const batch = db.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  console.log(`   ${snap.size} productos previos eliminados`);
}

async function seedProducts() {
  console.log(`🌱 Insertando ${PRODUCTS.length} productos con imágenes...`);
  let order = 0;
  for (const product of PRODUCTS) {
    const ref = db.collection('products').doc();
    const image = await uploadImage(ref.id, product.slug, product.imageFile);

    await ref.set({
      slug: product.slug,
      ref: product.ref,
      title: product.title,
      division: product.division,
      categoryId: null,
      shortDesc: product.shortDesc,
      description: product.description,
      specs: product.specs,
      features: product.features,
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
    console.log(`   ✓ ${imgMark} ${product.division.padEnd(13)} ${product.slug}`);
  }
}

(async () => {
  try {
    await clearProducts();
    await seedProducts();
    console.log('\n✨ Seed completado exitosamente');
    console.log('   Los productos quedan listos para gestionar desde el admin');
    console.log('   en http://localhost:5173 (subir más imágenes, marcar primaria, etc.)');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error en seed:', err);
    process.exit(1);
  }
})();
