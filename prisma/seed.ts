/**
 * Seed inicial de Avanzada Lankuyen.
 *
 * Idempotente: puede ejecutarse varias veces sin duplicar datos.
 * No sobreescribe contraseñas existentes.
 *
 *   npm run db:seed
 */
import "dotenv/config";

import { hash } from "@node-rs/argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL no está definida. Revisa tu archivo .env");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Nombres provisionales de las 7 competencias: los AA podrán editarlos
// desde el panel de insignias (Módulo 2) sin tocar código.
const BADGES = [
  {
    code: "ETAPA_SENDERO",
    category: "ETAPA",
    stageCode: "SENDERO",
    name: "Sendero",
    description:
      "El Sendero es la oportunidad de las y los jóvenes para explorar y elegir sus caminos de manera individual, pero apoyados siempre por su grupo de amigas y amigos.",
    imagePath: "/badges/etapa-sendero.svg",
    sortOrder: 10,
  },
  {
    code: "ETAPA_CUMBRE",
    category: "ETAPA",
    stageCode: "CUMBRE",
    name: "Cumbre",
    description:
      "La Cumbre es el lugardesde donde las y los jóvenes pueden mirar haciaatrás para ver los diferentes caminos que han tomado para llegar hasta ahí y proyectarse hacia elfuturo con una visión más amplia.",
    imagePath: "/badges/etapa-cumbre.svg",
    sortOrder: 20,
  },
  {
    code: "COMP_APRENDER",
    category: "COMPETENCIA",
    stageCode: null,
    name: "Aprender a aprender",
    description:
      "Competencia provisional. La persona que aprende con curiosidad, se plantea preguntas y busca sus propias respuestas.",
    imagePath: "/badges/comp-aprender.svg",
    sortOrder: 30,
  },
  {
    code: "COMP_NATURALEZA",
    category: "COMPETENCIA",
    stageCode: null,
    name: "Vida en la naturaleza",
    description:
      "Competencia provisional. Cuidar el entorno, desenvolverse al aire libre y descubrir la vida al aire libre.",
    imagePath: "/badges/comp-naturaleza.svg",
    sortOrder: 40,
  },
  {
    code: "COMP_CREATIVIDAD",
    category: "COMPETENCIA",
    stageCode: null,
    name: "Creatividad y expresión",
    description:
      "Competencia provisional. Expresarse con libertad, imaginar soluciones y crear con las manos y la voz.",
    imagePath: "/badges/comp-creatividad.svg",
    sortOrder: 50,
  },
  {
    code: "COMP_EQUIPO",
    category: "COMPETENCIA",
    stageCode: null,
    name: "Trabajo en equipo",
    description:
      "Competencia provisional. Construir con otras personas, repartir tareas y sostener los acuerdos del grupo.",
    imagePath: "/badges/comp-equipo.svg",
    sortOrder: 60,
  },
  {
    code: "COMP_LIDERAZGO",
    category: "COMPETENCIA",
    stageCode: null,
    name: "Liderazgo y servicio",
    description:
      "Competencia provisional. Tomar la iniciativa, acompañar a otras personas y servir a la comunidad.",
    imagePath: "/badges/comp-liderazgo.svg",
    sortOrder: 70,
  },
  {
    code: "COMP_RELACIONES",
    category: "COMPETENCIA",
    stageCode: null,
    name: "Relaciones interpersonales",
    description:
      "Competencia provisional. Escuchar, dialogar y construir vínculos sanos con las demás personas.",
    imagePath: "/badges/comp-relaciones.svg",
    sortOrder: 80,
  },
  {
    code: "COMP_ESPIRITUALIDAD",
    category: "COMPETENCIA",
    stageCode: null,
    name: "Fe y espiritualidad",
    description:
      "Competencia provisional. Descubrir el sentido profundo de la vida y celebrar la fe en comunidad.",
    imagePath: "/badges/comp-espiritualidad.svg",
    sortOrder: 90,
  },
  {
    code: "PROMESA",
    category: "PROMESA",
    stageCode: null,
    name: "Promesa",
    description:
      "La Promesa de la Avanzada: el compromiso personal que marca un antes y un después en el camino.",
    imagePath: "/badges/promesa.svg",
    sortOrder: 100,
  },
] as const;

const UNIT_RESOURCES = [
  {
    slug: "grito-de-la-unidad",
    title: "El Grito de la Unidad",
    summary: "La voz que nos reúne como Avanzada.",
    bodyMd:
      "# El Grito de la Unidad\n\n> Contenido pendiente de completar por los Adultos Acompañantes.\n\nEdita este texto desde el panel de administración del material digital.",
    sortOrder: 10,
  },
  {
    slug: "oracion",
    title: "La Oración",
    summary: "La plegaria que nos acompaña en cada encuentro.",
    bodyMd:
      "# La Oración\n\n> Contenido pendiente de completar por los Adultos Acompañantes.\n\nEdita este texto desde el panel de administración del material digital.",
    sortOrder: 20,
  },
  {
    slug: "himno",
    title: "El Himno",
    summary: "La canción que identifica a Lankuyen.",
    bodyMd:
      "# El Himno\n\n> Contenido pendiente de completar por los Adultos Acompañantes.\n\nPuedes incluir la letra y, más adelante, un enlace al audio.",
    sortOrder: 30,
  },
  {
    slug: "bandera",
    title: "La Bandera",
    summary: "El símbolo que nos representa.",
    bodyMd:
      "# La Bandera\n\n> Contenido pendiente de completar por los Adultos Acompañantes.\n\nDescribe aquí el significado de sus colores y símbolos. La imagen de la bandera se podrá subir desde el panel de administración.",
    sortOrder: 40,
  },
  {
    slug: "otros-recursos",
    title: "Otros recursos de la Unidad",
    summary: "Textos, cantos y materiales complementarios.",
    bodyMd:
      "# Otros recursos\n\n> Espacio reservado para cantos, textos y materiales de la Avanzada Lankuyen.\n\nAgrega aquí los recursos que quieras compartir con toda la unidad.",
    sortOrder: 50,
  },
] as const;

const SETTINGS = [
  { key: "unit.name", value: "Avanzada Lankuyen" },
  { key: "unit.tagline", value: "Pioneros en camino a la cumbre" },
  { key: "timezone", value: "America/Santiago" },
  { key: "cron.hour", value: 11 },
  { key: "reminder.leadDays", value: 7 },
  { key: "cron.enabled", value: true },
  { key: "route_sheet.allowAnyPpUpload", value: false },
] as const;

/**
 * Semestre en curso según la fecha de ejecución (hora de Chile).
 * S1: marzo–julio · S2: agosto–diciembre. Enero y febrero cierran el S2 anterior.
 */
function getCurrentSemester() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const read = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");

  let year = read("year");
  const month = read("month");
  let half: 1 | 2;

  if (month >= 3 && month <= 7) {
    half = 1;
  } else if (month >= 8) {
    half = 2;
  } else {
    year -= 1;
    half = 2;
  }

  return half === 1
    ? {
        name: `${year}-S1`,
        startsOn: new Date(`${year}-03-01T00:00:00.000Z`),
        endsOn: new Date(`${year}-07-31T00:00:00.000Z`),
      }
    : {
        name: `${year}-S2`,
        startsOn: new Date(`${year}-08-01T00:00:00.000Z`),
        endsOn: new Date(`${year}-12-31T00:00:00.000Z`),
      };
}

async function main() {
  console.log("→ Sembrando insignias…");
  for (const badge of BADGES) {
    await prisma.badge.upsert({
      where: { code: badge.code },
      create: {
        code: badge.code,
        category: badge.category,
        stageCode: badge.stageCode,
        name: badge.name,
        description: badge.description,
        imagePath: badge.imagePath,
        sortOrder: badge.sortOrder,
      },
      update: {
        name: badge.name,
        description: badge.description,
        imagePath: badge.imagePath,
        sortOrder: badge.sortOrder,
        category: badge.category,
        stageCode: badge.stageCode,
      },
    });
  }

  console.log("→ Sembrando material digital…");
  for (const resource of UNIT_RESOURCES) {
    await prisma.unitResource.upsert({
      where: { slug: resource.slug },
      create: {
        slug: resource.slug,
        title: resource.title,
        summary: resource.summary,
        bodyMd: resource.bodyMd,
        sortOrder: resource.sortOrder,
      },
      update: {
        title: resource.title,
        summary: resource.summary,
        sortOrder: resource.sortOrder,
      },
    });
  }

  console.log("→ Configurando parámetros de la aplicación…");
  for (const setting of SETTINGS) {
    await prisma.appSetting.upsert({
      where: { key: setting.key },
      create: { key: setting.key, value: setting.value },
      update: {},
    });
  }

  console.log("→ Sembrando semestre en curso…");
  const currentSemester = getCurrentSemester();
  const existingSemester = await prisma.semester.findUnique({
    where: { name: currentSemester.name },
    select: { id: true },
  });

  if (existingSemester) {
    console.log(`   El semestre "${currentSemester.name}" ya existe.`);
  } else {
    const anyActive = await prisma.semester.count({ where: { isActive: true } });
    await prisma.semester.create({
      data: { ...currentSemester, isActive: anyActive === 0 },
    });
    console.log(`   Semestre "${currentSemester.name}" creado.`);
  }

  console.log("→ Asegurando comunidad base…");
  const baseCommunity =
    (await prisma.community.findFirst({
      where: { deletedAt: null },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    })) ??
    (await prisma.community.create({
      data: {
        name: "Comunidad Lankuyen",
        slug: "comunidad-lankuyen",
        color: "#4b50a8",
      },
      select: { id: true },
    }));

  console.log("→ Creando Adulto Acompañante inicial…");
  const username = (process.env.SEED_AA_USERNAME ?? "aa.lankuyen")
    .trim()
    .toLowerCase();
  const rawPassword = process.env.SEED_AA_PASSWORD ?? "Lankuyen2026!";
  const email = process.env.SEED_AA_EMAIL?.trim().toLowerCase() || null;

  const existing = await prisma.user.findUnique({
    where: { username },
    select: { id: true, communityId: true },
  });
  if (existing) {
    if (!existing.communityId) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { communityId: baseCommunity.id },
      });
      console.log("   Se asignó la comunidad base al AA existente.");
    }
    console.log(`   El usuario "${username}" ya existe; no se modificó.`);
  } else {
    const passwordHash = await hash(rawPassword, {
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

    await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        firstName: process.env.SEED_AA_FIRST_NAME?.trim() || "Adulto",
        lastName: process.env.SEED_AA_LAST_NAME?.trim() || "Acompañante",
        role: "AA",
        communityId: baseCommunity.id,
        mustChangePassword: true,
        isActive: true,
      },
    });
    console.log("   Usuario AA creado:");
    console.log(`     usuario:    ${username}`);
    console.log(`     contraseña: ${rawPassword}`);
    console.log("   Deberá cambiarla en el primer inicio de sesión.");
  }

  console.log("\n✔ Seed completado.");
}

main()
  .catch((error) => {
    console.error("✖ Error en el seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
