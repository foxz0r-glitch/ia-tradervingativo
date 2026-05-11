/**
 * RankingUI — primitives visuais que reproduzem o estilo do Ranking15.
 * Cards rounded-2xl, gradiente from-card/85→via-card/55→to-card/25,
 * borda border/50, backdrop-blur-md, glow esmeralda, eyebrows tracking 0.3em.
 *
 * Usado pelas dashboards 01–06 para obter harmonia visual com /ranking,
 * mantendo a personalidade de layout de cada variante.
 */
import { Hexagon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Card padrão do ranking */
export function RCard({
  children,
  className,
  accent,
  inset = false,
  hover = true,
}: {
  children: React.ReactNode;
  className?: string;
  /** cor de destaque (ex.: cor do rank). HSL string. */
  accent?: string;
  /** linha lateral colorida à esquerda (igual à RankingRow) */
  inset?: boolean;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-gradient-to-r from-card/85 via-card/55 to-card/25 backdrop-blur-md transition-all duration-300",
        hover && "hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-12px_hsl(160_84%_45%/0.5)]",
        accent ? "" : "border-border/50",
        className,
      )}
      style={{
        ...(accent
          ? { borderColor: `${accent}55` }
          : {}),
        ...(inset && accent ? { boxShadow: `inset 4px 0 0 ${accent}` } : {}),
      }}
    >
      {children}
    </div>
  );
}

/** Eyebrow tag estilo ranking (pequeno chip uppercase com tracking grande) */
export function REyebrow({
  children,
  color = "hsl(160 84% 65%)",
  className,
  hex = true,
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
  hex?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border bg-[hsl(160_84%_45%/0.08)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.32em]",
        className,
      )}
      style={{ color, borderColor: `${color}66` }}
    >
      {hex && <Hexagon className="h-2 w-2" fill="currentColor" />}
      {children}
    </span>
  );
}

/** Header decorativo central com linhas em ambos os lados */
export function RDivider({
  children,
  color = "hsl(160 84% 65%)",
}: {
  children?: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="h-px flex-1"
        style={{ background: `linear-gradient(90deg, transparent, ${color}80)` }}
      />
      {children}
      <span
        className="h-px flex-1"
        style={{ background: `linear-gradient(270deg, transparent, ${color}80)` }}
      />
    </div>
  );
}

/** KPI card no padrão do ranking — número grande, label uppercase tracking */
export function RKpi({
  label,
  value,
  icon,
  accent = "hsl(160 84% 60%)",
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  accent?: string;
  className?: string;
}) {
  return (
    <RCard className={cn("px-4 py-3", className)}>
      <div
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.3em]"
        style={{ color: accent }}
      >
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div
        className="mt-1.5 text-2xl font-black tabular-nums sm:text-[26px]"
        style={{ color: accent, textShadow: `0 0 14px ${accent}40` }}
      >
        {value}
      </div>
    </RCard>
  );
}

/** Barra de XP com gradiente padrão do ranking (vermelho→verde) */
export function xpBarGradient(pct: number): string {
  if (pct < 25) return "linear-gradient(90deg, #ef4444, #f97316)";
  if (pct < 50) return "linear-gradient(90deg, #f97316, #eab308)";
  if (pct < 75) return "linear-gradient(90deg, #eab308, #84cc16, hsl(160 84% 50%))";
  return "linear-gradient(90deg, #f97316, #eab308, #84cc16, hsl(160 84% 55%))";
}

/** Barra fina de progresso XP (formato ranking) */
export function RXpBar({ pct }: { pct: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-[hsl(220_22%_12%)]">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${Math.min(100, Math.max(0, pct))}%`,
          background: xpBarGradient(pct),
          boxShadow: "0 0 10px hsl(160 84% 45% / 0.5)",
        }}
      />
    </div>
  );
}

/** Section header (título + linhas + eyebrow) inspirado no Ranking15 */
export function RSectionHeader({
  eyebrow,
  title,
  highlight,
  subtitle,
  color = "hsl(160 84% 65%)",
}: {
  eyebrow: string;
  title: string;
  highlight?: string;
  subtitle?: string;
  color?: string;
}) {
  return (
    <header className="mb-6">
      <div className="mx-auto mb-4 flex items-center gap-3">
        <RDivider color={color}>
          <REyebrow color={color}>{eyebrow}</REyebrow>
        </RDivider>
      </div>
      <h1 className="text-center text-4xl font-black tracking-tight md:text-5xl">
        {title}{" "}
        {highlight && (
          <span
            className="text-gradient-primary"
            style={{
              background: "linear-gradient(135deg, hsl(160 84% 60%), hsl(150 90% 55%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {highlight}
          </span>
        )}
      </h1>
      {subtitle && (
        <p className="mt-3 text-center text-[11px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
          [ {subtitle} ]
        </p>
      )}
    </header>
  );
}
