/**
 * Reglas puras del directorio social.
 *
 * Los Adultos Acompañantes no participan del apartado social: no tienen
 * insignias de progresión, competencias ni logros personales que mostrar.
 */

export const SOCIAL_MEMBER_ROLES = ["PP", "COORDINADOR"] as const;

export type SocialMemberRole = (typeof SOCIAL_MEMBER_ROLES)[number];

export interface MemberDirectoryFilters {
  query?: string;
  communityId?: string;
}

interface TextFilter {
  contains: string;
  mode: "insensitive";
}

export interface MemberDirectoryWhere {
  isActive: boolean;
  deletedAt: null;
  role: { in: SocialMemberRole[] };
  OR?: Array<{
    firstName?: TextFilter;
    lastName?: TextFilter;
    username?: TextFilter;
  }>;
  communityId?: string | null;
}

/** Indica si un rol puede tener perfil social visible. */
export function isSocialMemberRole(role: string): role is SocialMemberRole {
  return (SOCIAL_MEMBER_ROLES as readonly string[]).includes(role);
}

/**
 * Construye el `where` de Prisma para el directorio, excluyendo siempre a los
 * AA. Se exporta para poder probar el filtro sin levantar la base de datos.
 */
export function buildMemberDirectoryWhere(
  filters: MemberDirectoryFilters = {},
): MemberDirectoryWhere {
  const query = filters.query?.trim();

  const where: MemberDirectoryWhere = {
    isActive: true,
    deletedAt: null,
    role: { in: [...SOCIAL_MEMBER_ROLES] },
  };

  if (query) {
    where.OR = [
      { firstName: { contains: query, mode: "insensitive" } },
      { lastName: { contains: query, mode: "insensitive" } },
      { username: { contains: query, mode: "insensitive" } },
    ];
  }

  if (filters.communityId === "sin") {
    where.communityId = null;
  } else if (filters.communityId) {
    where.communityId = filters.communityId;
  }

  return where;
}
