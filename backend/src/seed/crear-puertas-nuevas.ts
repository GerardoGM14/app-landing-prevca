/**
 * Crea 3 puertas nuevas en Aserradero PREVCA
 * (Muebles de Madera › Puertas), cada una con 5 tipos de madera (woodVariants)
 * a precio "cobro con comisión".
 *
 *   Emulador:   npx tsx src/seed/crear-puertas-nuevas.ts
 *   Producción: npx tsx src/seed/crear-puertas-nuevas.ts --prod
 *
 * Idempotente (upsert por slug). Las imágenes se suben aparte.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const ASERRADERO_SLUG = 'aserradero-prevca';
const SUBCATEGORY = 'Muebles de Madera|Puertas';
const IS_PROD = process.argv.includes('--prod');

if (IS_PROD) {
  const keyPath = join(process.cwd(), 'serviceAccountKey.json');
  if (!existsSync(keyPath)) {
    console.error(`❌ Falta ${keyPath}`);
    process.exit(1);
  }
  const sa = JSON.parse(readFileSync(keyPath, 'utf8'));
  initializeApp({ credential: cert(sa), projectId: sa.project_id });
  console.log('🚀 Modo PRODUCCIÓN');
} else {
  process.env.FIRESTORE_EMULATOR_HOST ||= 'localhost:8080';
  initializeApp({ projectId: 'app-prevca' });
  console.log('🧪 Modo EMULADOR local');
}

const db = getFirestore();

interface WoodVariant {
  woodType: string;
  price: number;
}

interface NewDoor {
  slug: string;
  ref: string;
  title: string;
  shortDesc: string;
  description: string;
  woodVariants: WoodVariant[];
}

const DOORS: NewDoor[] = [
  {
    slug: 'puerta-opera-ocaso-contraplacada',
    ref: 'PRV-PT-OCASO',
    title: 'Puerta Opera Ocaso - Contraplacado',
    shortDesc: 'Puerta contraplacada Opera Ocaso, disponible en 5 tipos de madera.',
    description:
      'Puerta contraplacada modelo Opera Ocaso, de líneas horizontales. Disponible en madera tornillo, pino, copaiba, cedro y roble.',
    woodVariants: [
      { woodType: 'TORNILLO', price: 838.508 },
      { woodType: 'PINO', price: 739.86 },
      { woodType: 'COPAIBA', price: 801.515 },
      { woodType: 'CEDRO', price: 986.48 },
      { woodType: 'ROBLE', price: 764.52 },
    ],
  },
  {
    slug: 'puerta-piramidalhera',
    ref: 'PRV-PT-PIRAMID',
    title: 'Puerta Piramidalhera',
    shortDesc: 'Puerta de diseño geométrico Piramidalhera, en 5 tipos de madera.',
    description:
      'Puerta modelo Piramidalhera, con diseño geométrico en relieve. Disponible en madera tornillo, pino, copaiba, cedro y roble.',
    woodVariants: [
      { woodType: 'TORNILLO', price: 3329.37 },
      { woodType: 'PINO', price: 2712.82 },
      { woodType: 'COPAIBA', price: 3082.75 },
      { woodType: 'CEDRO', price: 3575.99 },
      { woodType: 'ROBLE', price: 2836.13 },
    ],
  },
  {
    slug: 'puerta-clasica-briana',
    ref: 'PRV-PT-BRIANA',
    title: 'Puerta Clásica Briana',
    shortDesc: 'Puerta clásica Briana con paneles y montante, en 5 tipos de madera.',
    description:
      'Puerta clásica modelo Briana, con paneles tallados y montante superior. Disponible en madera tornillo, pino, copaiba, cedro y roble.',
    woodVariants: [
      { woodType: 'TORNILLO', price: 2342.89 },
      { woodType: 'PINO', price: 1972.98 },
      { woodType: 'COPAIBA', price: 2219.58 },
      { woodType: 'CEDRO', price: 2527.855 },
      { woodType: 'ROBLE', price: 2096.27 },
    ],
  },
];

async function main() {
  const cat = await db
    .collection('categories')
    .where('slug', '==', ASERRADERO_SLUG)
    .limit(1)
    .get();
  if (cat.empty) {
    console.error(`❌ No existe la categoría "${ASERRADERO_SLUG}".`);
    process.exit(1);
  }
  const categoryId = cat.docs[0].id;

  for (const [i, door] of DOORS.entries()) {
    const existing = await db.collection('products').where('slug', '==', door.slug).limit(1).get();
    const ref = existing.empty ? db.collection('products').doc() : existing.docs[0].ref;
    const isNew = existing.empty;

    const data: Record<string, unknown> = {
      slug: door.slug,
      ref: door.ref,
      title: door.title,
      division: 'MADERA',
      categoryId,
      subcategory: SUBCATEGORY,
      shortDesc: door.shortDesc,
      description: door.description,
      specs: null,
      features: [],
      scientificName: null,
      origin: null,
      applications: null,
      datasheetUrl: null,
      price: null,
      woodVariants: door.woodVariants,
      showPrice: true,
      allowsDirectPurchase: true,
      stock: 0,
      showStock: false,
      trackStock: false,
      isActive: true,
      isFeatured: false,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (isNew) {
      data.order = 120 + i;
      data.createdAt = FieldValue.serverTimestamp();
    }

    await ref.set(data, { merge: true });
    console.log(`   ${isNew ? '+ creada   ' : '~ actualiza'} ${door.slug.padEnd(34)} ${door.woodVariants.length} tipos`);
  }

  console.log('\n✨ Listo. (Faltan subir las imágenes de cada puerta)');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌', err);
    process.exit(1);
  });
