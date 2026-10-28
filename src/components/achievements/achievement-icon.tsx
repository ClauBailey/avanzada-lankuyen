import {
  Award,
  Compass,
  Flame,
  Footprints,
  HeartHandshake,
  Leaf,
  Lock,
  Map,
  Mountain,
  Shield,
  Sparkles,
  Star,
  Tent,
  Trophy,
  Wind,
  type LucideIcon,
} from "lucide-react";

const ACHIEVEMENT_ICONS: Record<string, LucideIcon> = {
  Award,
  Compass,
  Flame,
  Footprints,
  HeartHandshake,
  Leaf,
  Lock,
  Map,
  Mountain,
  Shield,
  Sparkles,
  Star,
  Tent,
  Trophy,
  Wind,
};

interface AchievementIconProps {
  name: string;
  className?: string;
}

/** Resuelve el nombre guardado en la base al ícono Lucide correspondiente. */
export function AchievementIcon({ name, className }: AchievementIconProps) {
  const Icon = ACHIEVEMENT_ICONS[name] ?? Trophy;
  return <Icon className={className} aria-hidden="true" />;
}
