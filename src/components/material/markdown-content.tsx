import { Fragment, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type MarkdownTone = "default" | "prayer" | "anthem" | "grito";

interface MarkdownContentProps {
  content: string;
  className?: string;
  tone?: MarkdownTone;
  /** Si el primer encabezado coincide con este texto, no se repite. */
  omitHeading?: string;
}

type Block =
  | { kind: "heading"; level: number; text: string }
  | { kind: "paragraph"; lines: string[] }
  | { kind: "blockquote"; lines: string[] }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "code"; language: string; lines: string[] }
  | { kind: "hr" };

const BASE = {
  p: "my-3 text-[15px] leading-[1.9] text-ink first:mt-0 last:mb-0",
  h1: "mt-8 font-display text-2xl font-semibold leading-tight text-ink first:mt-0 sm:text-3xl",
  h2: "mt-7 font-display text-xl font-semibold leading-tight text-ink first:mt-0 sm:text-2xl",
  h3: "mt-6 font-display text-lg font-semibold leading-snug text-ink first:mt-0",
  h4: "mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-anil-700 first:mt-0",
  h5: "mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-anil-700 first:mt-0",
  h6: "mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft first:mt-0",
  strong: "font-semibold text-ink",
  em: "italic",
  del: "line-through opacity-70",
  link: "font-medium text-anil-700 underline decoration-anil-300 underline-offset-2 transition-colors hover:text-anil-900",
  code: "rounded-md bg-mist px-1.5 py-0.5 font-mono text-[0.88em] text-anil-900",
  pre: "scrollbar-thin my-4 overflow-x-auto rounded-xl bg-anil-950 p-4 text-xs leading-relaxed text-anil-50",
  blockquote:
    "my-5 rounded-2xl border border-anil-100 bg-anil-50/70 px-4 py-3.5 text-[15px] leading-relaxed text-anil-900",
  list: "my-3 space-y-1.5 pl-5 text-[15px] leading-relaxed",
  hr: "my-6 border-line",
} as const;

const TONE: Record<MarkdownTone, Partial<Record<keyof typeof BASE, string>>> = {
  default: {},
  prayer: {
    p: "my-4 text-center text-[17px] leading-[2] first:mt-0 last:mb-0 sm:text-lg",
    h1: "text-center",
    h2: "text-center",
    h3: "text-center",
    h4: "text-center",
    blockquote: "mx-auto max-w-xl text-center italic",
    list: "inline-block pl-5 text-left",
  },
  anthem: {
    p: "my-3 text-[16px] leading-[2] first:mt-0 last:mb-0",
    h2: "text-anil-800",
    h3: "text-[11px] font-semibold uppercase tracking-[0.22em] text-anil-600",
    strong: "font-semibold text-anil-900",
    blockquote: "border-gold/40 bg-gold-soft/35 text-ink",
  },
  grito: {
    p: "my-4 font-display text-2xl font-semibold leading-[1.4] text-white first:mt-0 sm:text-[2rem]",
    h1: "text-white",
    h2: "text-gold",
    h3: "text-anil-100",
    h4: "text-anil-200",
    h5: "text-anil-200",
    h6: "text-anil-200",
    strong: "font-semibold text-gold",
    em: "italic text-anil-100/85",
    link: "text-gold underline decoration-gold/40 underline-offset-2",
    code: "bg-white/10 text-white",
    pre: "bg-black/30 text-white",
    blockquote: "border-white/15 bg-white/10 text-anil-50",
    list: "text-white",
    hr: "border-white/15",
  },
};

function classes(key: keyof typeof BASE, tone: MarkdownTone) {
  return cn(BASE[key], TONE[tone][key]);
}

function headingClass(level: number) {
  if (level <= 1) return "h1" as const;
  if (level === 2) return "h2" as const;
  if (level === 3) return "h3" as const;
  if (level === 4) return "h4" as const;
  if (level === 5) return "h5" as const;
  return "h6" as const;
}

function isHorizontalRule(line: string) {
  return /^\s{0,3}(?:(?:\*\s*){3,}|(?:-\s*){3,}|(?:_\s*){3,})$/.test(line);
}

function isBlockStart(line: string) {
  return (
    /^\s{0,3}#{1,6}\s+/.test(line) ||
    /^\s{0,3}```/.test(line) ||
    /^\s{0,3}>\s?/.test(line) ||
    /^\s{0,3}(?:[-*+]|\d+[.)])\s+/.test(line) ||
    isHorizontalRule(line)
  );
}

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const fence = /^\s{0,3}```(.*)$/.exec(line);
    if (fence) {
      const language = fence[1]?.trim() ?? "";
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !/^\s{0,3}```/.test(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length) index += 1;
      blocks.push({ kind: "code", language, lines: codeLines });
      continue;
    }

    const heading = /^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (heading) {
      blocks.push({
        kind: "heading",
        level: heading[1].length,
        text: heading[2],
      });
      index += 1;
      continue;
    }

    if (isHorizontalRule(line)) {
      blocks.push({ kind: "hr" });
      index += 1;
      continue;
    }

    if (/^\s{0,3}>\s?/.test(line)) {
      const quoteLines: string[] = [];

      while (index < lines.length && /^\s{0,3}>\s?/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^\s{0,3}>\s?/, ""));
        index += 1;
      }

      blocks.push({ kind: "blockquote", lines: quoteLines });
      continue;
    }

    const unordered = /^\s{0,3}[-*+]\s+(.*)$/.exec(line);
    const ordered = /^\s{0,3}\d+[.)]\s+(.*)$/.exec(line);

    if (unordered || ordered) {
      const isOrdered = Boolean(ordered);
      const items: string[] = [];
      const matcher = isOrdered
        ? /^\s{0,3}\d+[.)]\s+(.*)$/
        : /^\s{0,3}[-*+]\s+(.*)$/;

      while (index < lines.length) {
        const item = matcher.exec(lines[index]);
        if (!item) break;
        items.push(item[1]);
        index += 1;
      }

      blocks.push({ kind: "list", ordered: isOrdered, items });
      continue;
    }

    const paragraphLines: string[] = [];

    while (
      index < lines.length &&
      lines[index].trim() &&
      !isBlockStart(lines[index])
    ) {
      paragraphLines.push(lines[index]);
      index += 1;
    }

    blocks.push({ kind: "paragraph", lines: paragraphLines });
  }

  return blocks;
}

const INLINE_PATTERN =
  /(!?\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|`[^`]+`|\*[^*\n]+\*|_[^_\n]+_)/g;

function safeHref(value: string): string | null {
  const trimmed = value.trim();

  // Solo anclas internas y rutas relativas propias; `//host` se rechaza para
  // no convertir el contenido en un enlace externo encubierto.
  if (trimmed.startsWith("#")) return trimmed;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;

  try {
    const parsed = new URL(trimmed);
    if (["http:", "https:", "mailto:"].includes(parsed.protocol)) {
      return trimmed;
    }
  } catch {
    return null;
  }

  return null;
}

function renderInline(
  text: string,
  tone: MarkdownTone,
  keyPrefix: string,
): ReactNode[] {
  const pieces = text.split(INLINE_PATTERN);

  return pieces.map((piece, index) => {
    const key = `${keyPrefix}-${index}`;

    if (!piece) return null;

    if (piece.startsWith("![") || piece.startsWith("[")) {
      const image = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(piece);
      if (image) return <Fragment key={key}>{image[1]}</Fragment>;

      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(piece);
      if (link) {
        const href = safeHref(link[2]);

        if (!href) return <Fragment key={key}>{link[1]}</Fragment>;

        const external = href.startsWith("http");

        return (
          <a
            key={key}
            href={href}
            className={classes("link", tone)}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer" : undefined}
          >
            {link[1]}
          </a>
        );
      }

      return <Fragment key={key}>{piece}</Fragment>;
    }

    if (piece.startsWith("**") && piece.endsWith("**")) {
      return (
        <strong key={key} className={classes("strong", tone)}>
          {piece.slice(2, -2)}
        </strong>
      );
    }

    if (piece.startsWith("__") && piece.endsWith("__")) {
      return (
        <strong key={key} className={classes("strong", tone)}>
          {piece.slice(2, -2)}
        </strong>
      );
    }

    if (piece.startsWith("~~") && piece.endsWith("~~")) {
      return (
        <del key={key} className={classes("del", tone)}>
          {piece.slice(2, -2)}
        </del>
      );
    }

    if (piece.startsWith("`") && piece.endsWith("`")) {
      return (
        <code key={key} className={classes("code", tone)}>
          {piece.slice(1, -1)}
        </code>
      );
    }

    if (
      (piece.startsWith("*") && piece.endsWith("*")) ||
      (piece.startsWith("_") && piece.endsWith("_"))
    ) {
      return (
        <em key={key} className={classes("em", tone)}>
          {piece.slice(1, -1)}
        </em>
      );
    }

    return <Fragment key={key}>{piece}</Fragment>;
  });
}

/**
 * Renderizador Markdown mínimo y seguro.
 *
 * No usa `dangerouslySetInnerHTML`: todo el texto entra como nodos de React,
 * así que el HTML pegado por un AA se muestra como texto y nunca se ejecuta.
 * Conserva los saltos de línea (clave para oraciones e himnos) y soporta
 * encabezados, listas, citas, código, negritas, cursivas, tachado y enlaces.
 */
export function MarkdownContent({
  content,
  className,
  tone = "default",
  omitHeading,
}: MarkdownContentProps) {
  const blocks = parseBlocks(content);
  const normalizedOmit = omitHeading?.trim().toLowerCase();
  const firstContentIndex = blocks.findIndex((block) => block.kind !== "hr");
  const omittedHeadingIndex =
    normalizedOmit &&
    firstContentIndex >= 0 &&
    blocks[firstContentIndex]?.kind === "heading" &&
    blocks[firstContentIndex].text.trim().toLowerCase() === normalizedOmit
      ? firstContentIndex
      : -1;

  return (
    <div className={cn("min-w-0", tone === "grito" ? "text-white" : "text-ink", className)}>
      {blocks.map((block, index) => {
        const key = `block-${index}`;

        if (block.kind === "heading") {
          if (index === omittedHeadingIndex) return null;

          const Tag = `h${Math.min(block.level, 6)}` as
            | "h1"
            | "h2"
            | "h3"
            | "h4"
            | "h5"
            | "h6";

          return (
            <Tag key={key} className={classes(headingClass(block.level), tone)}>
              {renderInline(block.text, tone, key)}
            </Tag>
          );
        }

        if (block.kind === "paragraph") {
          return (
            <p key={key} className={classes("p", tone)}>
              {block.lines.map((line, lineIndex) => (
                <Fragment key={`${key}-line-${lineIndex}`}>
                  {lineIndex > 0 ? <br /> : null}
                  {renderInline(line, tone, `${key}-${lineIndex}`)}
                </Fragment>
              ))}
            </p>
          );
        }

        if (block.kind === "blockquote") {
          return (
            <blockquote key={key} className={classes("blockquote", tone)}>
              {block.lines.map((line, lineIndex) =>
                line.trim() ? (
                  <p
                    key={`${key}-quote-${lineIndex}`}
                    className="my-1.5 leading-relaxed first:mt-0 last:mb-0"
                  >
                    {renderInline(line, tone, `${key}-q-${lineIndex}`)}
                  </p>
                ) : null,
              )}
            </blockquote>
          );
        }

        if (block.kind === "list") {
          const Tag = block.ordered ? "ol" : "ul";

          return (
            <Tag
              key={key}
              className={cn(
                classes("list", tone),
                block.ordered
                  ? "list-decimal marker:text-anil-400"
                  : "list-disc marker:text-anil-400",
              )}
            >
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-item-${itemIndex}`}>
                  {renderInline(item, tone, `${key}-i-${itemIndex}`)}
                </li>
              ))}
            </Tag>
          );
        }

        if (block.kind === "code") {
          return (
            <pre key={key} className={classes("pre", tone)}>
              <code>{block.lines.join("\n")}</code>
            </pre>
          );
        }

        return <hr key={key} className={classes("hr", tone)} />;
      })}
    </div>
  );
}
