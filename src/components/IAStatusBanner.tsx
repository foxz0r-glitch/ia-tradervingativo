import { Activity, Pause, Play, Square } from "lucide-react";

interface Props {
  rodando: boolean;
  paused: boolean;
  sessionPnl: number;
  meta: number;
  stopLoss: number;
  onTogglePause: () => void;
  onFinish: () => void;
}

const fmtBRL = (v: number) =>
  `${v >= 0 ? "+" : "-"}${Math.abs(v).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })}`;

export function IAStatusBanner({
  rodando,
  paused,
  sessionPnl,
  meta,
  stopLoss,
  onTogglePause,
  onFinish,
}: Props) {
  if (!rodando) return null;

  const positive = sessionPnl >= 0;
  // Progress bar: center = 0; right = meta (green); left = stopLoss (red)
  const pct = positive
    ? Math.min(100, (sessionPnl / Math.max(1, meta)) * 100)
    : Math.min(100, (Math.abs(sessionPnl) / Math.max(1, stopLoss)) * 100);

  return (
    <div className="relative overflow-hidden rounded-xl border border-[hsl(265_85%_60%/0.35)] bg-gradient-to-br from-[hsl(265_45%_12%)] via-[hsl(220_25%_8%)] to-[hsl(139_45%_10%)] p-5 shadow-[0_0_32px_hsl(265_85%_50%/0.18)]">
      {/* Pulsing aura */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[hsl(265_85%_55%/0.18)] blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -bottom-20 -right-10 h-56 w-56 rounded-full bg-[hsl(139_80%_45%/0.15)] blur-3xl animate-pulse" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(139_80%_55%)] opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-[hsl(139_80%_50%)]" />
          </span>
          <Activity className="h-4 w-4 text-[hsl(139_80%_55%)]" />
          <h3 className="text-lg font-extrabold uppercase tracking-wider text-foreground sm:text-xl">
            IA Operando<span className="ml-1 inline-flex animate-pulse text-[hsl(139_80%_55%)]">...</span>
          </h3>
          {paused && (
            <span className="ml-auto rounded-full border border-[hsl(45_95%_55%/0.4)] bg-[hsl(45_95%_55%/0.15)] px-2 py-0.5 text-[10px] font-bold uppercase text-[hsl(45_95%_60%)]">
              Pausada
            </span>
          )}
        </div>

        {/* Lucro grande */}
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Lucro atual
            </div>
            <div
              className={`mt-1 ct-mono text-4xl font-extrabold tabular-nums sm:text-5xl ${
                positive ? "text-[hsl(139_80%_55%)]" : "text-[hsl(0_84%_65%)]"
              }`}
            >
              {fmtBRL(sessionPnl)}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 text-xs ct-mono">
            <div className="text-[hsl(139_80%_55%)]">
              Meta: {meta.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <div className="text-[hsl(0_84%_65%)]">
              Stop Loss: {stopLoss.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider">
            <span className="text-[hsl(0_84%_65%)]">Stop</span>
            <span className="text-muted-foreground">Progresso</span>
            <span className="text-[hsl(139_80%_55%)]">Meta</span>
          </div>
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-[hsl(220_25%_4%)] ring-1 ring-border/40">
            {/* center divider */}
            <div className="absolute left-1/2 top-0 h-full w-px bg-border/80" />
            {positive ? (
              <div
                className="absolute left-1/2 top-0 h-full rounded-r-full bg-gradient-to-r from-[hsl(139_80%_45%)] to-[hsl(139_80%_55%)] shadow-[0_0_10px_hsl(139_80%_45%/0.6)] transition-all duration-500"
                style={{ width: `${pct / 2}%` }}
              />
            ) : (
              <div
                className="absolute right-1/2 top-0 h-full rounded-l-full bg-gradient-to-l from-[hsl(0_84%_55%)] to-[hsl(0_84%_65%)] shadow-[0_0_10px_hsl(0_84%_55%/0.6)] transition-all duration-500"
                style={{ width: `${pct / 2}%` }}
              />
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onTogglePause}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border/70 bg-[hsl(220_25%_4%/0.6)] px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-border hover:bg-[hsl(220_25%_6%/0.8)]"
          >
            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {paused ? "Retomar" : "Pausar automação"}
          </button>
          <button
            type="button"
            onClick={onFinish}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[hsl(265_85%_60%)] to-[hsl(280_85%_55%)] px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_16px_hsl(265_85%_50%/0.35)] transition-transform hover:scale-[1.01]"
          >
            <Square className="h-4 w-4" />
            Finalizar operação
          </button>
        </div>
      </div>
    </div>
  );
}
