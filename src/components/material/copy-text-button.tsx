"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopyTextButtonProps {
  text: string;
  label?: string;
  copiedLabel?: string;
  appearance?: "light" | "dark";
  className?: string;
}

export function CopyTextButton({
  text,
  label = "Copiar texto",
  copiedLabel = "Copiado",
  appearance = "light",
  className,
}: CopyTextButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  async function copy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        document.body.removeChild(area);
      }

      setCopied(true);
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={copy}
      aria-live="polite"
      className={cn(
        !copied && "transition-colors",
        appearance === "dark"
          ? "border-white/20 bg-white/10 text-white hover:border-white/35 hover:bg-white/15"
          : undefined,
        copied &&
          appearance === "dark" &&
          "border-emerald-300/40 bg-emerald-400/15 text-emerald-100",
        copied &&
          appearance !== "dark" &&
          "border-emerald-200 bg-emerald-50 text-emerald-800",
        className,
      )}
    >
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      {copied ? copiedLabel : label}
    </Button>
  );
}
