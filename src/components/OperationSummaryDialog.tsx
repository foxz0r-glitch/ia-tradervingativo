import { Trophy, CheckCircle2, XCircle, Activity, Target } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type SummaryReason = "manual" | "meta" | "stop";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  totalPnl: number;
  ganhos: number;
  perdas: number;
  symbol: string;
  tempoSeg?: number;
  timeframe?: string;
  reason?: SummaryReason;
  onNewOperation?: () => void;
}

const fmtBRL = (v: number) =>
  `${v >= 0 ? "+" : "-"}${Math.abs(v).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })}`;

export function OperationSummaryDialog({
  open,
  onOpenChange,
  totalPnl,
  ganhos,
  perdas,
  symbol,
  tempoSeg = 5,
  timeframe = "1m",
  reason = "manual",
  onNewOperation,
}: Props) {
  const positive = totalPnl >= 0;
  const totalOps = ganhos + perdas;
  const winRate = totalOps > 0 ? (ganhos / totalOps) * 100 : 0;

  const badge =
    reason === "meta"
      ? {
          text: "🎯 Meta Atingida!",
          cls: "bg-[hsl(45_95%_50%/0.18)] text-[hsl(45_95%_60%)] border border-[hsl(45_95%_55%/0.4)]",
        }
      : reason === "stop"
      ? {
          text: "🛑 Stop Loss Atingido",
          cls: "bg-[hsl(0_84%_40%/0.2)] text-[hsl(0_84%_70%)] border border-[hsl(0_84%_60%/0.4)]",
        }
      : {
          text: "Operação Finalizada",
          cls: positive
            ? "bg-[hsl(139_80%_30%/0.25)] text-[hsl(139_80%_55%)]"
            : "bg-[hsl(0_84%_40%/0.25)] text-[hsl(0_84%_65%)]",
        };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[hsl(45_95%_60%)]" />
            Resumo da Operação
          </DialogTitle>
        </DialogHeader>

        <div className="mt-1 flex flex-col items-center gap-4">
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${badge.cls}`}
          >
            {badge.text}
          </span>

          <div
            className={`ct-mono text-4xl font-extrabold tabular-nums sm:text-5xl ${
              positive ? "text-[hsl(139_80%_55%)]" : "text-[hsl(0_84%_65%)]"
            }`}
          >
            {fmtBRL(totalPnl)}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Ativo: <span className="font-semibold text-foreground">{symbol}</span> · Tempo:{" "}
            <span className="font-semibold text-foreground">{tempoSeg} seg</span> · TF:{" "}
            <span className="font-semibold text-foreground">{timeframe}</span>
          </p>

          <div className="grid w-full grid-cols-2 gap-3">
            <div className="flex items-center justify-between rounded-lg border border-[hsl(139_80%_45%/0.3)] bg-[hsl(139_80%_45%/0.08)] px-3 py-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[hsl(139_80%_55%)]" />
                <span className="text-xs font-semibold text-muted-foreground">Acertos</span>
              </div>
              <span className="ct-mono text-lg font-bold text-[hsl(139_80%_55%)]">{ganhos}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-[hsl(0_84%_60%/0.3)] bg-[hsl(0_84%_60%/0.08)] px-3 py-2.5">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-[hsl(0_84%_65%)]" />
                <span className="text-xs font-semibold text-muted-foreground">Erros</span>
              </div>
              <span className="ct-mono text-lg font-bold text-[hsl(0_84%_65%)]">{perdas}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/10 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground">Operações</span>
              </div>
              <span className="ct-mono text-lg font-bold text-foreground">{totalOps}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/10 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground">Taxa de acerto</span>
              </div>
              <span className="ct-mono text-lg font-bold text-foreground">
                {winRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2 flex-col gap-2 sm:flex-col">
          <button
            type="button"
            onClick={() => {
              onNewOperation?.();
              onOpenChange(false);
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[hsl(139_80%_40%)] to-[hsl(139_80%_50%)] px-4 py-3 text-sm font-bold text-white shadow-[0_4px_16px_hsl(139_80%_40%/0.35)] transition-transform hover:scale-[1.01]"
          >
            Nova operação
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex w-full items-center justify-center rounded-lg border border-border/70 bg-muted/10 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/20"
          >
            Fechar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
