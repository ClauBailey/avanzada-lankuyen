import Image from "next/image";

import { cn } from "@/lib/utils";

interface BrandMarkProps {
  size?: number;
  className?: string;
  priority?: boolean;
}

export function BrandMark({ size = 48, className, priority }: BrandMarkProps) {
  return (
    <Image
      src="/brand/logo-lankuyen.svg"
      alt="Insignia de la Avanzada Lankuyen"
      width={size}
      height={size}
      priority={priority}
      unoptimized
      className={cn("rounded-full", className)}
    />
  );
}
