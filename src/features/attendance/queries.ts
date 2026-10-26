import "server-only";

import { prisma } from "@/server/db";

export interface AttendanceSummary {
  semesterName: string | null;
  total: number;
  present: number;
  justified: number;
  absent: number;
  rate: number | null;
}

const EMPTY_SUMMARY: AttendanceSummary = {
  semesterName: null,
  total: 0,
  present: 0,
  justified: 0,
  absent: 0,
  rate: null,
};

/**
 * Estadísticas de asistencia ratificada del semestre activo.
 * Solo cuenta actividades vigentes (sin soft delete).
 */
export async function getAttendanceSummary(
  userId: string,
): Promise<AttendanceSummary> {
  const semester = await prisma.semester.findFirst({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  if (!semester) return EMPTY_SUMMARY;

  const records = await prisma.attendanceRecord.findMany({
    where: {
      userId,
      activity: { semesterId: semester.id, deletedAt: null },
    },
    select: { status: true },
  });

  const present = records.filter((record) => record.status === "PRESENTE").length;
  const justified = records.filter(
    (record) => record.status === "JUSTIFICADO",
  ).length;
  const absent = records.filter((record) => record.status === "AUSENTE").length;
  const total = records.length;

  return {
    semesterName: semester.name,
    total,
    present,
    justified,
    absent,
    rate: total > 0 ? Math.round((present / total) * 100) : null,
  };
}
