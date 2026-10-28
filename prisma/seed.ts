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

// Catálogo inicial de logros estilo RPG. Los códigos son estables: el seed
// actualiza título, descripción y pistas sin borrar los desbloqueos.
const ACHIEVEMENTS = [
  {
    code: "LANKUYEN_INITIATE",
    title: "Hijo del Eclipse",
    description: "Fuiste investido oficialmente en la Avanzada Lankuyen.",
    hint: null,
    icon: "Moon",
    category: "AVANZADA",
    visibility: "PUBLIC",
    points: 10,
  },
  {
    code: "FIRST_CAMP",
    title: "Estaca en Tierra",
    description: "Participaste en tu primer campamento oficial con la unidad.",
    hint: null,
    icon: "Tent",
    category: "AVANZADA",
    visibility: "PUBLIC",
    points: 10,
  },
  {
    code: "TRAIL_WALKER",
    title: "Abriendo Sendero",
    description: "Completaste y aprobaste tu primera Hoja de Ruta personal.",
    hint: null,
    icon: "Footprints",
    category: "AVANZADA",
    visibility: "PUBLIC",
    points: 15,
  },
  {
    code: "SUMMIT_REACHED",
    title: "Vista desde la Cumbre",
    description: "Alcanzaste la etapa Cumbre en tu progresión personal.",
    hint: null,
    icon: "Mountain",
    category: "AVANZADA",
    visibility: "PUBLIC",
    points: 30,
  },
  {
    code: "ALWAYS_READY",
    title: "Reloj Suizo",
    description: "Confirmaste asistencia y llegaste a tiempo a 5 sábados consecutivos.",
    hint: null,
    icon: "CalendarCheck",
    category: "AVANZADA",
    visibility: "PUBLIC",
    points: 15,
  },
  {
    code: "PIONEERING_PRO",
    title: "Ingeniero en Rústico",
    description: "Construiste una estructura de pionerismo firme usando solo amarres y coligües.",
    hint: null,
    icon: "Hammer",
    category: "AVANZADA",
    visibility: "PUBLIC",
    points: 20,
  },
  {
    code: "BACKPACK_TETRIS",
    title: "Maestro del Tetris",
    description: "Armaste tu mochila de campamento sin dejar absolutamente nada colgando por fuera.",
    hint: null,
    icon: "Backpack",
    category: "AVANZADA",
    visibility: "PUBLIC",
    points: 10,
  },

  // --- COMUNIDAD (PUBLIC) ---
  {
    code: "COMM_ENTERPRISE",
    title: "Arquitectos del Mañana",
    description: "Tu comunidad ideó, planificó, ejecutó y evaluó con éxito un Proyecto de comunidad.",
    hint: null,
    icon: "Briefcase",
    category: "COMUNIDAD",
    visibility: "PUBLIC",
    points: 25,
  },
  {
    code: "COMM_FULL_SQUAD",
    title: "Comunidad Blindada",
    description: "Tu comunidad logró un 100% de asistencia en un campamento.",
    hint: null,
    icon: "Users",
    category: "COMUNIDAD",
    visibility: "PUBLIC",
    points: 20,
  },
  {
    code: "COMM_CHEF",
    title: "Estrella Michelin de Campamento",
    description: "Tu comunidad preparó el mejor almuerzo de terreno según el jurado de la Avanzada.",
    hint: null,
    icon: "Utensils",
    category: "COMUNIDAD",
    visibility: "PUBLIC",
    points: 20,
  },
  {
    code: "COMM_GUARDIAN",
    title: "Espíritu de Cuerpo",
    description: "Ayudaste a otra comunidad a levantar su rincón o terminar su tarea antes del cierre.",
    hint: null,
    icon: "HeartHandshake",
    category: "COMUNIDAD",
    visibility: "PUBLIC",
    points: 15,
  },
  {
    code: "COMM_CLEAN",
    title: "Sin Dejar Rastro",
    description: "Tu zona de comunidad pasó la revisión final sin un solo microplástico ni papel en el suelo.",
    hint: null,
    icon: "Leaf",
    category: "COMUNIDAD",
    visibility: "PUBLIC",
    points: 15,
  },
  {
    code: "COMM_NAVIGATION",
    title: "Brújula Compartida",
    description: "Completaron un raid o caminata de comunidad/avanzada siguiendo su propia Hoja de Ruta.",
    hint: null,
    icon: "Compass",
    category: "COMUNIDAD",
    visibility: "PUBLIC",
    points: 20,
  },
  {
    code: "RAIN_CAMPER",
    title: "Bautizo del Biobío",
    description: "Sobreviviste a un campamento bajo lluvia intensa sin que se inundara tu carpa.",
    hint: null,
    icon: "CloudRain",
    category: "ESPECIAL",
    visibility: "PUBLIC",
    points: 25,
  },
  // --- ESPECIAL (PUBLIC + HINT) ---
  
  {
    code: "LOGBOOK_FIRST",
    title: "Cronista de Lankuyen",
    description: "Escribiste un relato que fue aprobado y publicado en La Bitácora de la Avanzada.",
    hint: null,
    icon: "BookOpen",
    category: "ESPECIAL",
    visibility: "PUBLIC",
    points: 15,
  },
  {
    code: "PODCAST_VOICE",
    title: "Frecuencia Estelar",
    description: "Participaste o colaboraste en un episodio de los medios de Alfa Cruz (Código Cruz).",
    hint: "Dicen que las estrellas también se escuchan a través de un micrófono...",
    icon: "Mic",
    category: "ESPECIAL",
    visibility: "HINT",
    points: 25,
  },
  {
    code: "SILENT_PLACES",
    title: "Explorador de lo Oculto",
    description: "Fuiste parte de una expedición o registro estilo Lugares que NO hablan.",
    hint: "Hay rincones que no tienen voz hasta que un pionero va a grabarlos.",
    icon: "Video",
    category: "ESPECIAL",
    visibility: "HINT",
    points: 25,
  },
  {
    code: "BARD_CAMPFIRE",
    title: "Bardo del Fogón",
    description: "Guiaste una canción con guitarra, ukelele, otro instrumento o voz principal durante una velada, peña o fogón.",
    hint: "Un par de acordes junto al fuego bastan para subir la moral del grupo.",
    icon: "Music",
    category: "ESPECIAL",
    visibility: "HINT",
    points: 20,
  },
  {
    code: "VOLLEY_ACE",
    title: "Saque Ganador",
    description: "Destacaste jugando en un partido deportivo o recreativo de la unidad.",
    hint: "Que el balón no toque el suelo de tu lado de la cancha.",
    icon: "Trophy",
    category: "ESPECIAL",
    visibility: "HINT",
    points: 15,
  },
  {
    code: "NIGHT_WATCH",
    title: "Centinela bajo la Cruz del Sur",
    description: "Completaste una caminata nocturna o guardia de campamento manteniendo la calma y el rumbo.",
    hint: "Cuando todos duermen, las constelaciones guían a quienes vigilan.",
    icon: "Star",
    category: "ESPECIAL",
    visibility: "HINT",
    points: 20,
  },
  {
    code: "TERRENO_INSPECTOR",
    title: "Pionero de Avanzada",
    description: "Asististe a una avanzada previa o preparación logística antes que el resto de la unidad.",
    hint: "Alguien tiene que llegar primero para abrir el camino.",
    icon: "MapPin",
    category: "ESPECIAL",
    visibility: "HINT",
    points: 25,
  },
  {
    code: "GOLDEN_HOUR",
    title: "Cazador de Horizontes",
    description: "Capturaste la foto icónica de un campamento o cumbre que quedó para la historia de la unidad.",
    hint: "El momento exacto, la luz perfecta y la cámara lista.",
    icon: "Camera",
    category: "ESPECIAL",
    visibility: "HINT",
    points: 15,
  },

  // --- SECRETO (SECRET) ---
  {
    code: "FIRE_ONE_MATCH",
    title: "Maestro de la Yesca",
    description: "Encendiste el fuego de fogata o de fogón utilizando exactamente un solo fósforo.",
    hint: "Uno basta cuando la leña está bien dispuesta.",
    icon: "Flame",
    category: "SECRETO",
    visibility: "SECRET",
    points: 30,
  },
  {
    code: "BACKWOODS_COOK",
    title: "Superviviente Primitivo",
    description: "Cocinaste una comida completa en terreno sin utilizar ollas ni sartenes (cocina sin utensilios).",
    hint: "¿Quién dijo que se necesita aluminio para cocinar en el bosque?",
    icon: "ChefHat",
    category: "SECRETO",
    visibility: "SECRET",
    points: 30,
  },
  {
    code: "DAWN_BREAKER",
    title: "Antes que el Sol",
    description: "Fuiste la primera persona de todo el campamento en levantarse y tener el agua caliente lista.",
    hint: "El canto de los primeros pájaros tiene recompensa.",
    icon: "Sunrise",
    category: "SECRETO",
    visibility: "SECRET",
    points: 20,
  },
  {
    code: "KNOT_SPEEDRUN",
    title: "Manos de Seda",
    description: "Ejecutaste 5 nudos o amarres distintos con los ojos vendados o en tiempo récord frente a un AA.",
    hint: "La cuerda conoce el camino aunque no la mires.",
    icon: "Lasso",
    category: "SECRETO",
    visibility: "SECRET",
    points: 25,
  },
  {
    code: "SWEET_BOOST",
    title: "Moral Alta en la Mochila",
    description: "Compartiste dulces, pastillas o una ración extra con tus compañeros en el tramo más duro de una caminata.",
    hint: "Un pequeño gesto dulce cuando las piernas ya no dan más.",
    icon: "Candy",
    category: "SECRETO",
    visibility: "SECRET",
    points: 15,
  },
  {
    code: "CRITICAL_ROLL",
    title: "¡20 Natural!",
    description: "Resolviste un imprevisto crítico de campamento con una idea brillante e improvisada.",
    hint: "A veces la suerte y el ingenio lanzan los dados a tu favor.",
    icon: "Sparkles",
    category: "SECRETO",
    visibility: "SECRET",
    points: 35,
  },
  {
    code: "HEAVY_LIFTER",
    title: "Fuerza de Titán",
    description: "Cargaste equipo comunitario extra o superaste un reto físico exigente sin rendirte.",
    hint: "El peso pesa menos cuando se lleva con orgullo.",
    icon: "Dumbbell",
    category: "SECRETO",
    visibility: "SECRET",
    points: 25,
  },
  {
    code: "LANKUYEN_LEGEND",
    title: "Leyenda de Lankuyen",
    description: "Dejaste una huella imborrable en la historia y mística de la Avanzada antes de partir al Clan.",
    hint: "Solo el tiempo dirá quiénes escriben el último capítulo.",
    icon: "Crown",
    category: "SECRETO",
    visibility: "SECRET",
    points: 50,
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

  console.log("Sembrando logros RPG...");
  for (const achievement of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { code: achievement.code },
      create: {
        code: achievement.code,
        title: achievement.title,
        description: achievement.description,
        hint: achievement.hint,
        icon: achievement.icon,
        category: achievement.category,
        visibility: achievement.visibility,
        points: achievement.points,
      },
      update: {
        title: achievement.title,
        description: achievement.description,
        hint: achievement.hint,
        icon: achievement.icon,
        category: achievement.category,
        visibility: achievement.visibility,
        points: achievement.points,
      },
    });
  }

  console.log("Sembrando material digital...");
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
