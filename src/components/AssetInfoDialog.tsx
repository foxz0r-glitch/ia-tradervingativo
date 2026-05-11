import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Zap,
  Star,
  CircleDot,
  Plus,
  Droplet,
  Clock,
  CalendarDays,
  Activity,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const CURRENCY_FLAG: Record<string, string> = {
  EUR: "eu", USD: "us", GBP: "gb", JPY: "jp",
  AUD: "au", CAD: "ca", NZD: "nz", CHF: "ch",
};

const CURRENCY_NAME: Record<string, string> = {
  EUR: "Euro",
  USD: "Dólar dos Estados Unidos",
  GBP: "Libra Esterlina",
  JPY: "Iene Japonês",
  AUD: "Dólar Australiano",
  CAD: "Dólar Canadense",
  NZD: "Dólar Neozelandês",
  CHF: "Franco Suíço",
};

const CURRENCY_SHORT: Record<string, string> = {
  EUR: "Euro",
  USD: "Dólar EUA",
  GBP: "Libra",
  JPY: "Iene",
  AUD: "Dólar AUS",
  CAD: "Dólar CAN",
  NZD: "Dólar NZ",
  CHF: "Franco",
};

interface AssetInfo {
  pair: string;
  id: string;
  category: string;
  description: string;
  type: "Blitz" | "Binary" | "Digital";
  group: "Majors" | "Minors" | "Crosses" | "Commodities";
}

const ASSET_INFO: Record<string, AssetInfo> = {
  "76": { id: "76", pair: "EUR/USD", category: "OTC", type: "Blitz", group: "Majors",
    description:
`EUR/USD é uma taxa de câmbio que especifica quantos USD (Dólar dos Estados Unidos) podem ser convertidos em um EUR (Euro), portanto a moeda base é o EUR e a moeda de cotação é o USD.

Se essa taxa cair, significa que o USD se valoriza em relação ao EUR e, se essa taxa subir, significa que o USD se desvaloriza frente ao EUR.

Existem muitos fatores/eventos macroeconômicos (fundamentos) que afetam a taxa de câmbio EUR/USD, que geralmente são comuns em ambos os países. Alguns dos fatores/eventos mais notáveis são o PIB, a Inflação ou Índice de Preços ao Consumidor (CPI), Taxas de Juros e outras políticas monetárias aplicadas pelos bancos centrais.

Em relação à relação comercial entre a Zona do Euro e os Estados Unidos, este último importa 10% das exportações totais da Zona do Euro, enquanto a Zona do Euro importa 19,2% das exportações totais dos Estados Unidos.

Os maiores componentes das exportações da Zona do Euro são máquinas, reatores nucleares, produtos de caldeiras e veículos, enquanto os maiores componentes das exportações dos Estados Unidos são máquinas, reatores nucleares, produtos de caldeiras e equipamentos elétricos/eletrônicos.

Quaisquer mudanças significativas na relação comercial entre as duas regiões e alterações nos valores dos componentes mencionados são alguns dos fatores que provavelmente terão um impacto relevante no par.`,
  },
  "77": { id: "77", pair: "EUR/GBP", category: "OTC", type: "Blitz", group: "Majors",
    description:
`EUR/GBP é uma taxa de câmbio que especifica quantos GBP (Libra da Grã-Bretanha) podem ser convertidos em um EUR (Euro), portanto a moeda base é o EUR e a moeda de cotação é o GBP.

Se essa taxa cair, significa que o GBP se valoriza em relação ao EUR e, se essa taxa subir, significa que o GBP se desvaloriza frente ao EUR.

Existem muitos fatores/eventos macroeconômicos (fundamentos) que afetam a taxa de câmbio EUR/GBP, que geralmente são comuns em ambos os países. Alguns dos fatores/eventos mais notáveis são o PIB, a Inflação ou Índice de Preços ao Consumidor (CPI), Taxas de Juros e outras políticas monetárias aplicadas pelos bancos centrais.

Em relação à relação comercial entre a Zona do Euro e o Reino Unido, este último importa 20% das exportações totais da Zona do Euro, enquanto a Zona do Euro importa 55% das exportações totais do Reino Unido.

Os maiores componentes das exportações da Zona do Euro são máquinas, reatores nucleares, produtos de caldeiras e veículos, enquanto os maiores componentes das exportações do Reino Unido são ouro e veículos.

Quaisquer mudanças significativas na relação comercial entre as duas regiões e alterações nos valores dos componentes mencionados são alguns dos fatores que podem ter um impacto relevante no par.`,
  },
  "79": { id: "79", pair: "EUR/JPY", category: "OTC", type: "Blitz", group: "Majors",
    description:
`EUR/JPY é uma taxa de câmbio que especifica quantos JPY (Iene Japonês) podem ser convertidos em um EUR (Euro), portanto a moeda base é o EUR e a moeda de cotação é o JPY.

Se essa taxa cair, significa que o JPY se valoriza em relação ao EUR e, se essa taxa subir, significa que o JPY se desvaloriza frente ao EUR.

Existem muitos fatores/eventos macroeconômicos (fundamentos) que afetam a taxa de câmbio EUR/JPY, que geralmente são comuns em ambos os países. Alguns dos fatores/eventos mais notáveis são o PIB, a Inflação ou Índice de Preços ao Consumidor (CPI), Taxas de Juros e outras políticas monetárias aplicadas pelos bancos centrais.

Em relação à relação comercial entre a Zona do Euro e o Japão, este último importa 1,6% das exportações totais da Zona do Euro, enquanto a Zona do Euro importa 11,5% das exportações totais do Japão.

Os maiores componentes das exportações da Zona do Euro são máquinas, reatores nucleares, produtos de caldeiras e veículos, enquanto os maiores componentes das exportações do Japão são veículos, máquinas, reatores nucleares e produtos de caldeiras.

Quaisquer mudanças significativas na relação comercial entre as duas regiões e alterações nos valores dos componentes mencionados são alguns dos fatores que podem ter um impacto relevante no par.`,
  },
  "80": { id: "80", pair: "NZD/USD", category: "OTC", type: "Blitz", group: "Majors",
    description:
`NZD/USD é uma taxa de câmbio que especifica quantos USD (Dólar dos EUA) podem ser convertidos em um NZD (Dólar da Nova Zelândia), portanto a moeda base é o NZD e a moeda de cotação é o USD.

Se essa taxa cair, significa que o USD se valoriza em relação ao NZD e, se essa taxa subir, significa que o USD se desvaloriza frente ao NZD.

Existem muitos fatores/eventos macroeconômicos (fundamentos) que afetam a taxa de câmbio NZD/USD, que geralmente são comuns em ambos os países. Alguns dos fatores/eventos mais notáveis são o PIB, a Inflação ou Índice de Preços ao Consumidor (CPI), Taxas de Juros e outras políticas monetárias aplicadas pelos bancos centrais.

Em relação à relação comercial entre a Nova Zelândia e os Estados Unidos, este último importa 11% das exportações totais da Nova Zelândia, enquanto a Nova Zelândia importa 0,25% das exportações totais dos Estados Unidos.

O maior componente das exportações da Nova Zelândia são produtos lácteos, enquanto o maior componente das exportações dos Estados Unidos é maquinário.

Quaisquer mudanças significativas na relação comercial entre as duas regiões e alterações nos valores dos componentes mencionados são alguns dos fatores que podem ter um impacto relevante no par.`,
  },
  "81": { id: "81", pair: "GBP/USD", category: "OTC", type: "Blitz", group: "Majors",
    description:
`GBP/USD é uma taxa de câmbio que especifica quantos USD (Dólar dos EUA) podem ser convertidos em um GBP (Libra da Grã-Bretanha), portanto a moeda base é o GBP e a moeda de cotação é o USD.

Se essa taxa cair, significa que o USD se valoriza em relação ao GBP e, se essa taxa subir, significa que o USD se desvaloriza frente ao GBP.

Existem muitos fatores/eventos macroeconômicos (fundamentos) que afetam a taxa de câmbio GBP/USD, que geralmente são comuns em ambos os países. Alguns dos fatores/eventos mais notáveis são o PIB, a Inflação ou Índice de Preços ao Consumidor (CPI), Taxas de Juros e outras políticas monetárias aplicadas pelos bancos centrais.

Em relação à relação comercial entre a Grã-Bretanha e os EUA, este último importa 15% das exportações totais da Grã-Bretanha, enquanto a Grã-Bretanha importa 3,9% das exportações totais dos EUA.

O maior componente das exportações da Grã-Bretanha é maquinário, enquanto o maior componente das exportações dos EUA também é maquinário.

Quaisquer mudanças significativas na relação comercial entre as duas regiões e alterações nos valores dos componentes mencionados são alguns dos fatores que podem ter um impacto relevante no par.`,
  },
  "84": { id: "84", pair: "GBP/JPY", category: "OTC", type: "Blitz", group: "Minors",
    description:
`GBP/JPY é uma taxa de câmbio que especifica quantos JPY (Iene Japonês) podem ser convertidos em um GBP (Libra Britânica), portanto a moeda base é o GBP e a moeda de cotação é o JPY.

Se essa taxa cair, significa que o JPY se valoriza em relação ao GBP e, se essa taxa subir, significa que o JPY se desvaloriza frente ao GBP.

Existem muitos fatores/eventos macroeconômicos (fundamentos) que afetam a taxa de câmbio GBP/JPY, que geralmente são comuns em ambos os países. Alguns dos fatores/eventos mais notáveis são o PIB, a Inflação ou Índice de Preços ao Consumidor (CPI), Taxas de Juros e outras políticas monetárias aplicadas pelos bancos centrais.

Em relação à relação comercial entre a Grã-Bretanha e o Japão, este último importa 1,1% das exportações totais da Grã-Bretanha, enquanto a Grã-Bretanha importa 2,1% das exportações totais do Japão.

Os maiores componentes das exportações da Grã-Bretanha são máquinas, reatores nucleares e produtos de caldeiras, enquanto os maiores componentes das exportações do Japão são veículos que não sejam ferroviários ou de bonde.

Quaisquer mudanças significativas na relação comercial entre as duas regiões e alterações nos valores dos componentes mencionados são alguns dos fatores que podem ter um impacto relevante no par.`,
  },
  "85": { id: "85", pair: "USD/JPY", category: "OTC", type: "Blitz", group: "Majors",
    description:
`USD/JPY é uma taxa de câmbio que especifica quantos JPY (Iene Japonês) podem ser convertidos em um USD (Dólar dos Estados Unidos), portanto a moeda base é o USD e a moeda de cotação é o JPY.

Se essa taxa cair, significa que o JPY se valoriza em relação ao USD e, se essa taxa subir, significa que o JPY se desvaloriza frente ao USD.

Existem muitos fatores/eventos macroeconômicos (fundamentos) que afetam a taxa de câmbio USD/JPY, que geralmente são comuns em ambos os países. Alguns dos fatores/eventos mais notáveis são o PIB, a Inflação ou Índice de Preços ao Consumidor (CPI), Taxas de Juros e outras políticas monetárias aplicadas pelos bancos centrais.

Em relação à relação comercial entre os EUA e o Japão, este último importa 0,044 das exportações totais dos EUA, enquanto os EUA importam 0,22 das exportações totais do Japão.

Os maiores componentes das exportações dos EUA são máquinas, reatores nucleares e produtos de caldeiras, enquanto os maiores componentes das exportações do Japão são veículos que não sejam ferroviários ou de bonde.

Quaisquer mudanças significativas na relação comercial entre as duas regiões e alterações nos valores dos componentes mencionados são alguns dos fatores que podem ter um impacto relevante no par.`,
  },
  "86": { id: "86", pair: "AUD/CAD", category: "OTC", type: "Blitz", group: "Minors",
    description:
`AUD/CAD é uma taxa de câmbio que especifica quantos CAD (Dólar Canadense) podem ser convertidos em um AUD (Dólar Australiano), portanto a moeda base é o AUD e a moeda de cotação é o CAD.

Se essa taxa cair, significa que o CAD se valoriza em relação ao AUD e, se essa taxa subir, significa que o CAD se desvaloriza frente ao AUD.

Existem muitos fatores macroeconômicos (fundamentos) que afetam a taxa de câmbio AUD/CAD, que geralmente são comuns em ambos os países. Alguns dos fatores/eventos mais notáveis são o PIB, a Inflação ou Índice de Preços ao Consumidor (CPI), Taxas de Juros e outras políticas monetárias aplicadas pelos bancos centrais.

Em relação à relação comercial entre a Austrália e o Canadá, este último importa cerca de 0,74% das exportações totais da Austrália, enquanto a Austrália importa 0,38% das exportações totais do Canadá.

Os maiores componentes das exportações da Austrália são minérios, escória e cinzas, enquanto os maiores componentes das exportações do Canadá são veículos que não sejam ferroviários ou de bonde.

Quaisquer mudanças significativas na relação comercial entre as duas regiões e alterações nos valores dos componentes mencionados são alguns dos fatores que podem ter um impacto relevante no par.`,
  },
};

// ===== Categoria → ícone =====
const GROUP_LABEL_PT: Record<AssetInfo["group"], string> = {
  Majors: "Principais",
  Minors: "Secundários",
  Crosses: "Cruzados",
  Commodities: "Commodities",
};

function GroupIcon({ group, className }: { group: AssetInfo["group"]; className?: string }) {
  const cls = cn("h-3.5 w-3.5", className);
  switch (group) {
    case "Majors": return <Star className={cls} />;
    case "Minors": return <CircleDot className={cls} />;
    case "Crosses": return <Plus className={cls} />;
    case "Commodities": return <Droplet className={cls} />;
  }
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: string;
  stats?: any;
}

function CurrencyCoin({ code, size = 42 }: { code: string; size?: number }) {
  const flag = CURRENCY_FLAG[code] ?? "us";
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full ring-[3px] ring-card shadow-lg"
      style={{ width: size, height: size }}
    >
      <img
        src={`https://flagcdn.com/w160/${flag}.png`}
        srcSet={`https://flagcdn.com/w320/${flag}.png 2x`}
        alt={code}
        className="h-full w-full object-cover"
      />
    </div>
  );
}

function PairCoins({ base, quote }: { base: string; quote: string }) {
  return (
    <div className="relative flex items-center justify-center">
      <span className="absolute inset-0 -m-2 rounded-full bg-primary/20 blur-xl" />
      <div className="relative flex -space-x-4">
        <CurrencyCoin code={base} />
        <CurrencyCoin code={quote} />
      </div>
    </div>
  );
}

// ===== Horários (UTC-3, fixos para todos os ativos) =====
// Cada dia: dois intervalos 00:00–05:00 e 05:30–23:59
const TRADING_INTERVALS: Array<[string, string]> = [
  ["00:00", "05:00"],
  ["05:30", "23:59"],
];
const WEEKDAYS_PT = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const WEEKDAYS_PT_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS_PT = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];

// Retorna o "agora" em UTC-3 como objeto Date (em UTC com offset aplicado)
function nowUtcMinus3(): Date {
  const now = new Date();
  return new Date(now.getTime() + (now.getTimezoneOffset() - 180) * 60_000);
}

function parseHM(hm: string): { h: number; m: number } {
  const [h, m] = hm.split(":").map(Number);
  return { h, m };
}

function minutesOfDay(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

interface Status {
  open: boolean;
  closesIn?: number;
  closesAt?: string;
  opensIn?: number;
  opensAt?: string;
  opensTomorrow?: boolean;
}

function computeStatus(): Status {
  const d = nowUtcMinus3();
  const cur = minutesOfDay(d);
  for (const [start, end] of TRADING_INTERVALS) {
    const s = parseHM(start);
    const e = parseHM(end);
    const sMin = s.h * 60 + s.m;
    const eMin = e.h * 60 + e.m;
    if (cur >= sMin && cur <= eMin) {
      return { open: true, closesIn: eMin - cur, closesAt: end };
    }
  }
  // Fechado — achar próximo intervalo de hoje
  for (const [start] of TRADING_INTERVALS) {
    const s = parseHM(start);
    const sMin = s.h * 60 + s.m;
    if (cur < sMin) {
      return { open: false, opensIn: sMin - cur, opensAt: start, opensTomorrow: false };
    }
  }
  // Próximo é amanhã 00:00
  return { open: false, opensIn: 24 * 60 - cur, opensAt: "00:00", opensTomorrow: true };
}

function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h <= 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export function AssetInfoDialog({ open, onOpenChange, assetId, stats }: Props) {
  const info = ASSET_INFO[assetId];

  // Atualiza status a cada 30s enquanto aberto
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, [open]);

  const status = useMemo(() => computeStatus(), [tick, open]);

  // Próximos 7 dias (a partir de hoje em UTC-3)
  const days = useMemo(() => {
    const base = nowUtcMinus3();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d;
    });
  }, [tick, open]);

  if (!info) return null;

  const [base, quote] = info.pair.split("/");
  const baseName = CURRENCY_NAME[base] ?? base;
  const quoteName = CURRENCY_NAME[quote] ?? quote;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden border border-border/60 bg-card/95 p-0 shadow-2xl backdrop-blur-xl sm:max-w-2xl">
        {/* Hero header */}
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -right-20 top-10 h-72 w-72 rounded-full bg-[hsl(217_91%_60%/0.15)] blur-3xl" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          </div>

          <div className="relative flex flex-col items-center gap-4 px-6 pb-6 pt-8 text-center sm:flex-row sm:items-center sm:gap-5 sm:text-left">
            <PairCoins base={base} quote={quote} />
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-3xl font-extrabold tracking-tight text-foreground">
                {info.pair}{" "}
                <span className="text-lg font-semibold text-muted-foreground">
                  ({info.category})
                </span>
              </DialogTitle>
              <DialogDescription asChild>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  {/* Status aberto/fechado */}
                  {status.open ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      </span>
                      Aberto agora
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                      Fechado
                    </span>
                  )}
                  <span className="inline-flex items-center rounded-full border border-border/60 bg-card/70 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <GroupIcon group={info.group} className="mr-1 h-3 w-3" />
                    {GROUP_LABEL_PT[info.group]}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-border/60 bg-card/70 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <Zap className="mr-1 h-3 w-3" />
                    {info.type}
                  </span>
                </div>
              </DialogDescription>

              {/* Aberto/fecha em ... */}
              <div className="mt-2 text-xs font-medium text-muted-foreground">
                {(() => {
                  if (status.open) {
                    return <>Fecha hoje às <span className="text-foreground">{status.closesAt}</span> · em <span className="text-foreground">{formatDuration(status.closesIn)}</span></>;
                  }
                  return <>Abre {status.opensTomorrow ? "amanhã" : "hoje"} às <span className="text-foreground">{status.opensAt}</span> · em <span className="text-foreground">{formatDuration(status.opensIn)}</span></>;
                })()}
              </div>

              {/* Base → Cotação visual flow */}
              <div className="mt-3 flex items-center justify-center gap-2 text-[13px] font-semibold text-muted-foreground sm:justify-start">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/40 px-2 py-1 text-foreground">
                  {CURRENCY_SHORT[base] ?? base}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-primary" />
                <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/40 px-2 py-1 text-foreground">
                  {CURRENCY_SHORT[quote] ?? quote}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2.5 border-y border-border/50 bg-gradient-to-b from-muted/30 to-muted/5 px-5 py-4">
          <StatIcon
            label="Tipo"
            value={info.type}
            icon={<Zap className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />}
            accent
          />
          <StatIcon
            label="Categoria"
            value={GROUP_LABEL_PT[info.group]}
            icon={<GroupIcon group={info.group} className="text-primary" />}
          />
          <StatWithFlag label="Base" value={baseName} code={base} />
          <StatWithFlag label="Cotação" value={quoteName} code={quote} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="stats" className="px-6 pb-5 pt-4">
          <TabsList className="grid w-full grid-cols-3 bg-muted/40">
            <TabsTrigger value="stats" className="gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              Estatísticas
            </TabsTrigger>
            <TabsTrigger value="about" className="gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Sobre
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Horários
            </TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-3">
            <div>
              <div className="rounded-xl border border-border/60 bg-background/40 p-5">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-foreground">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Sobre o par {info.pair}
                </h3>
                <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-muted-foreground">
                  {info.description}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="mt-3">
            <StatsTab stats={stats} />
          </TabsContent>

          <TabsContent value="schedule" className="mt-3">
            <div className="rounded-xl border border-border/60 bg-background/40 p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-foreground">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Horários de Negociação
                </h3>
                <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  UTC-3
                </span>
              </div>

              <div>
                <div className="overflow-hidden rounded-lg border border-border/40">
                  {/* Header */}
                  <div className="grid grid-cols-[110px_1fr_1.4fr] gap-2 border-b border-border/40 bg-muted/30 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <span>Data</span>
                    <span>Dia</span>
                    <span>Horário</span>
                  </div>
                  {days.map((d, i) => {
                    const isToday = i === 0;
                    return (
                      <div
                        key={i}
                        className={cn(
                          "grid grid-cols-[110px_1fr_1.4fr] gap-2 border-b border-border/30 px-3 py-2.5 text-[13px] last:border-b-0 transition-colors",
                          isToday ? "bg-primary/[0.07] text-foreground" : "text-muted-foreground hover:bg-muted/20"
                        )}
                      >
                        <span className={cn("font-semibold", isToday && "text-primary")}>
                          {d.getDate()} {MONTHS_PT[d.getMonth()]}
                        </span>
                        <span className="font-medium">
                          <span className="hidden sm:inline">{WEEKDAYS_PT[d.getDay()]}</span>
                          <span className="sm:hidden">{WEEKDAYS_PT_SHORT[d.getDay()]}</span>
                          {isToday && (
                            <span className="ml-1.5 rounded bg-primary/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary">
                              Hoje
                            </span>
                          )}
                        </span>
                        <span className="ct-mono tabular-nums">
                          {TRADING_INTERVALS.map(([s, e], k) => (
                            <span key={k} className="mr-3 inline-block">
                              {s} – {e}{k < TRADING_INTERVALS.length - 1 ? ";" : ""}
                            </span>
                          ))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="mt-3 text-[11px] text-muted-foreground">
                Fuso horário: UTC-3 (Brasília).
              </p>
            </div>
          </TabsContent>
        </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatIcon({
  label, value, icon, accent,
}: { label: string; value: string; icon: React.ReactNode; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border/40 bg-card/50 px-3 py-2.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className={cn("text-sm font-bold leading-tight", accent ? "text-foreground" : "text-foreground")}>
          {value}
        </span>
      </div>
    </div>
  );
}

function StatWithFlag({ label, value, code }: { label: string; value: string; code: string }) {
  const flag = CURRENCY_FLAG[code] ?? "us";
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border/40 bg-card/50 px-3 py-2.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <img
          src={`https://flagcdn.com/w40/${flag}.png`}
          srcSet={`https://flagcdn.com/w80/${flag}.png 2x`}
          alt={code}
          className="h-5 w-5 shrink-0 rounded-full object-cover ring-1 ring-border/60"
        />
        <span className="text-sm font-bold leading-tight text-foreground">
          {value}
        </span>
      </div>
    </div>
  );
}

// ===== Aba Estatísticas =====
function fmtPct(n: number | undefined | null): string {
  if (n == null || isNaN(n as number)) return "—";
  const v = Number(n);
  return `${v > 0 ? "+" : ""}${v.toFixed(2)}%`;
}
function fmtPrice(n: number | undefined | null): string {
  if (n == null || isNaN(n as number)) return "—";
  return Number(n).toFixed(5);
}
function pctColor(n: number | undefined | null): string {
  if (n == null) return "text-muted-foreground";
  if (n > 0) return "text-[hsl(160_84%_45%)]";
  if (n < 0) return "text-[hsl(0_84%_60%)]";
  return "text-muted-foreground";
}

function StatsTab({ stats }: { stats: any }) {
  const loading = !stats;
  const bullish: boolean = stats?.bullish ?? true;
  const buy = Number(stats?.percentBuy ?? 50);
  const sell = Number(stats?.percentSell ?? 50);

  const rows = [
    { label: "5 min", change: stats?.change5min, low: stats?.low5, high: stats?.high5 },
    { label: "60 min", change: stats?.change60min, low: stats?.low60, high: stats?.high60 },
    { label: "1 dia", change: stats?.change1day, low: stats?.lowDia, high: stats?.highDia },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Trader Sentiment */}
      <div className="rounded-xl border border-border/60 bg-background/40 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-foreground">
            <Activity className="h-4 w-4 text-primary" />
            Trader Sentiment
          </h3>
          {loading ? (
            <Skeleton className="h-5 w-16" />
          ) : (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider",
                bullish
                  ? "bg-[hsl(160_84%_45%/0.15)] text-[hsl(160_84%_45%)] border border-[hsl(160_84%_45%/0.4)]"
                  : "bg-[hsl(0_84%_60%/0.15)] text-[hsl(0_84%_60%)] border border-[hsl(0_84%_60%/0.4)]",
              )}
            >
              {bullish ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {bullish ? "Bullish" : "Bearish"}
            </span>
          )}
        </div>

        {loading ? (
          <Skeleton className="h-3 w-full rounded-full" />
        ) : (
          <>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted/40">
              <div
                className="absolute inset-y-0 left-0 bg-[hsl(160_84%_45%)]"
                style={{ width: `${Math.max(0, Math.min(100, buy))}%` }}
              />
              <div
                className="absolute inset-y-0 right-0 bg-[hsl(0_84%_60%)]"
                style={{ width: `${Math.max(0, Math.min(100, sell))}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] font-semibold ct-mono tabular-nums">
              <span className="text-[hsl(160_84%_45%)]">Buy {buy.toFixed(0)}%</span>
              <span className="text-[hsl(0_84%_60%)]">{sell.toFixed(0)}% Sell</span>
            </div>
          </>
        )}
      </div>

      {/* Tabela de variações */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-background/40">
        <div className="grid grid-cols-[80px_1fr_1.4fr] gap-2 border-b border-border/40 bg-muted/30 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <span>Período</span>
          <span>Variação</span>
          <span className="text-right">Low – High</span>
        </div>
        {rows.map((r, i) => (
          <div
            key={i}
            className="grid grid-cols-[80px_1fr_1.4fr] gap-2 border-b border-border/30 px-4 py-3 text-[13px] last:border-b-0 ct-mono tabular-nums"
          >
            <span className="font-semibold text-foreground">{r.label}</span>
            {loading ? (
              <Skeleton className="h-4 w-16" />
            ) : (
              <span className={cn("font-bold", pctColor(r.change))}>
                {fmtPct(r.change)}
              </span>
            )}
            {loading ? (
              <Skeleton className="h-4 w-32 justify-self-end" />
            ) : (
              <span className="text-right text-muted-foreground">
                <span className="text-[hsl(0_84%_60%)]">{fmtPrice(r.low)}</span>
                <span className="mx-1.5 text-border">–</span>
                <span className="text-[hsl(160_84%_45%)]">{fmtPrice(r.high)}</span>
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Session Change destaque */}
      <div className="rounded-xl border border-border/60 bg-gradient-to-br from-card/70 to-background/40 p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Session Change
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              Variação desde a abertura da sessão
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-10 w-28" />
          ) : (
            <div
              className={cn(
                "ct-mono text-3xl font-extrabold tabular-nums sm:text-4xl",
                pctColor(stats.sessionChange),
              )}
            >
              {fmtPct(stats.sessionChange)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
