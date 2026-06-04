import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, X, Check, Layers, Sparkles, Target, Zap, Activity } from "lucide-react";
import { Dialog, DialogContent, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

export type IndicatorType =
  | "RSI"
  | "SMA"
  | "EMA"
  | "MACD"
  | "BOLLINGER"
  | "STOCH"
  | "ATR";

export interface Indicator {
  id: string;
  type: IndicatorType;
  params: Record<string, number | string>;
}

export type EntryRule = "CRUZAMENTO" | "CONFLUENCIA" | "REVERSAO" | "MOMENTUM";
export type Direction = "AMBAS" | "CALL" | "PUT";

export interface Strategy {
  id: string;
  name: string;
  indicators: Indicator[];
  entryRule: EntryRule;
  minConfluence: number;
  awaitConfirmation: boolean;
  direction: Direction;
}

const STORAGE_KEY = "virtuspro_estrategias";
const ACTIVE_KEY = "virtuspro_estrategia_ativa";

const DEFAULT_PARAMS: Record<IndicatorType, Record<string, number | string>> = {
  RSI: { periodo: 14, sobrecompra: 70, sobrevenda: 30 },
  SMA: { periodo: 9, papel: "rapida" },
  EMA: { periodo: 9, papel: "rapida" },
  MACD: { fast: 12, slow: 26, signal: 9 },
  BOLLINGER: { periodo: 20, desvio: 2 },
  STOCH: { k: 14, d: 3, sobrecompra: 80, sobrevenda: 20 },
  ATR: { periodo: 14 },
};

const INDICATOR_LABELS: Record<IndicatorType, string> = {
  RSI: "RSI",
  SMA: "Média Móvel (SMA)",
  EMA: "Média Móvel Exp. (EMA)",
  MACD: "MACD",
  BOLLINGER: "Bollinger Bands",
  STOCH: "Estocástico",
  ATR: "ATR",
};

export function loadStrategies(): Strategy[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function loadActiveStrategy(): Strategy | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const emptyStrategy = (): Strategy => ({
  id: uid(),
  name: "",
  indicators: [],
  entryRule: "CONFLUENCIA",
  minConfluence: 1,
  awaitConfirmation: true,
  direction: "AMBAS",
});

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function StrategyBuilder({ open, onOpenChange }: Props) {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tab, setTab] = useState<"list" | "edit">("list");
  const [draft, setDraft] = useState<Strategy>(emptyStrategy);

  useEffect(() => {
    if (!open) return;
    setStrategies(loadStrategies());
    const active = loadActiveStrategy();
    setActiveId(active?.id ?? null);
  }, [open]);

  const persist = (list: Strategy[]) => {
    setStrategies(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const setActive = (s: Strategy) => {
    setActiveId(s.id);
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(s));
    toast.success(`Estratégia "${s.name}" ativada`);
  };

  const handleNew = () => {
    setDraft(emptyStrategy());
    setTab("edit");
  };

  const handleEdit = (s: Strategy) => {
    setDraft(JSON.parse(JSON.stringify(s)));
    setTab("edit");
  };

  const handleDelete = (id: string) => {
    const next = strategies.filter((s) => s.id !== id);
    persist(next);
    if (activeId === id) {
      localStorage.removeItem(ACTIVE_KEY);
      setActiveId(null);
    }
  };

  const addIndicator = (type: IndicatorType) => {
    setDraft((d) => ({
      ...d,
      indicators: [
        ...d.indicators,
        { id: uid(), type, params: { ...DEFAULT_PARAMS[type] } },
      ],
    }));
  };

  const updateIndicatorParam = (id: string, key: string, value: number | string) => {
    setDraft((d) => ({
      ...d,
      indicators: d.indicators.map((i) =>
        i.id === id ? { ...i, params: { ...i.params, [key]: value } } : i,
      ),
    }));
  };

  const removeIndicator = (id: string) => {
    setDraft((d) => ({ ...d, indicators: d.indicators.filter((i) => i.id !== id) }));
  };

  const handleSave = () => {
    if (!draft.name.trim()) {
      toast.error("Informe um nome para a estratégia");
      return;
    }
    if (draft.indicators.length === 0) {
      toast.error("Adicione ao menos um indicador");
      return;
    }
    const exists = strategies.some((s) => s.id === draft.id);
    const next = exists
      ? strategies.map((s) => (s.id === draft.id ? draft : s))
      : [...strategies, draft];
    persist(next);
    if (activeId === draft.id) {
      localStorage.setItem(ACTIVE_KEY, JSON.stringify(draft));
    }
    toast.success("Estratégia salva");
    setTab("list");
  };

  const indicatorTypes = useMemo(
    () => Object.keys(INDICATOR_LABELS) as IndicatorType[],
    [],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/70 backdrop-blur-md" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-[94vw] max-w-[620px] max-h-[90vh] translate-x-[-50%] translate-y-[-50%]",
            "overflow-hidden rounded-2xl border border-[hsl(139_80%_45%/0.25)]",
            "bg-[radial-gradient(ellipse_at_top,hsl(139_60%_12%/0.55),hsl(220_25%_5%)_60%)]",
            "shadow-[0_30px_80px_-20px_hsl(139_80%_30%/0.55),0_0_0_1px_hsl(139_80%_45%/0.15)]",
            "duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          )}
        >
          {/* Decorative orb */}
          <div aria-hidden className="pointer-events-none absolute -top-32 -right-32 h-72 w-72 rounded-full bg-[hsl(139_80%_50%/0.18)] blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-32 h-80 w-80 rounded-full bg-[hsl(180_80%_40%/0.12)] blur-3xl" />

          {/* Header */}
          <div className="relative flex items-start justify-between gap-4 border-b border-border/40 px-6 py-5">
            <div className="flex items-center gap-3">
              <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(139_80%_50%/0.32)] via-[hsl(139_80%_40%/0.18)] to-[hsl(139_80%_30%/0.05)] text-[hsl(139_80%_75%)] ring-1 ring-[hsl(139_80%_55%/0.5)] shadow-[inset_0_1px_0_hsl(139_80%_85%/0.25),0_0_18px_-4px_hsl(139_80%_50%/0.85)]">
                <Layers className="h-[18px] w-[18px]" strokeWidth={2.2} />
                <span aria-hidden className="absolute -right-[2px] -top-[2px] h-1.5 w-1.5 rounded-full bg-[hsl(139_80%_60%)] shadow-[0_0_6px_hsl(139_80%_55%)]" />
              </span>
              <div className="flex flex-col leading-none">
                <span className="text-[9px] font-bold uppercase tracking-[0.32em] text-[hsl(139_80%_60%)]">Construtor · Pro</span>
                <span className="mt-1.5 text-[19px] font-black tracking-tight text-foreground">Estratégias de Trading</span>
                <span className="mt-1 text-[11px] text-muted-foreground">Combine indicadores, regras e direção para criar setups vencedores.</span>
              </div>
            </div>
            <DialogPrimitive.Close className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground">
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>

          <div className="relative max-h-[calc(92vh-100px)] overflow-y-auto">
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="px-6 py-5">
              <TabsList className="grid w-full grid-cols-2 bg-muted/20 p-1">
                <TabsTrigger value="list" className="data-[state=active]:bg-[hsl(139_80%_45%/0.15)] data-[state=active]:text-[hsl(139_80%_70%)]">
                  <Activity className="mr-1.5 h-3.5 w-3.5" /> Minhas Estratégias
                </TabsTrigger>
                <TabsTrigger value="edit" className="data-[state=active]:bg-[hsl(139_80%_45%/0.15)] data-[state=active]:text-[hsl(139_80%_70%)]">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Criar / Editar
                </TabsTrigger>
              </TabsList>

          {/* ===== ABA 1 ===== */}
          <TabsContent value="list" className="mt-4 space-y-3">
            <button
              type="button"
              onClick={handleNew}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[hsl(139_80%_40%)] to-[hsl(139_80%_50%)] px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_16px_hsl(139_80%_40%/0.35)] transition-transform hover:scale-[1.01]"
            >
              <Plus className="h-4 w-4" /> Nova Estratégia
            </button>

            {strategies.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border/60 bg-muted/10 px-4 py-6 text-center text-xs text-muted-foreground">
                Nenhuma estratégia salva ainda.
              </p>
            ) : (
              strategies.map((s) => {
                const isActive = s.id === activeId;
                return (
                  <div
                    key={s.id}
                    className={`rounded-lg border bg-muted/10 p-3 transition-all ${
                      isActive
                        ? "border-[hsl(139_80%_45%)] shadow-[0_0_0_1px_hsl(139_80%_45%/0.4)]"
                        : "border-border/60 hover:border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setActive(s)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-bold text-foreground">
                            {s.name}
                          </span>
                          {isActive && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(139_80%_45%/0.15)] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[hsl(139_80%_55%)]">
                              <Check className="h-2.5 w-2.5" /> Ativa
                            </span>
                          )}
                        </div>
                        <div className="mt-1 truncate text-[11px] text-muted-foreground">
                          {s.indicators.map((i) => INDICATOR_LABELS[i.type]).join(" · ") ||
                            "Sem indicadores"}
                        </div>
                      </button>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => handleEdit(s)}
                          className="rounded p-1 text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                          aria-label="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(s.id)}
                          className="rounded p-1 text-muted-foreground hover:bg-[hsl(0_84%_60%/0.15)] hover:text-[hsl(0_84%_65%)]"
                          aria-label="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>

          {/* ===== ABA 2 ===== */}
          <TabsContent value="edit" className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Nome da estratégia</Label>
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Ex.: Reversão RSI + Bollinger"
                className="h-9 text-sm"
              />
            </div>

            {/* Indicadores */}
            <div className="space-y-2">
              <Label className="text-[11px] text-muted-foreground">Indicadores</Label>
              {draft.indicators.map((ind) => (
                <div
                  key={ind.id}
                  className="space-y-2 rounded-lg border border-border/60 bg-muted/10 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <select
                      value={ind.type}
                      onChange={(e) => {
                        const type = e.target.value as IndicatorType;
                        setDraft((d) => ({
                          ...d,
                          indicators: d.indicators.map((i) =>
                            i.id === ind.id
                              ? { ...i, type, params: { ...DEFAULT_PARAMS[type] } }
                              : i,
                          ),
                        }));
                      }}
                      className="h-8 flex-1 rounded-md border border-border/60 bg-[hsl(220_25%_8%)] px-2 text-xs text-foreground outline-none focus:border-[hsl(139_80%_45%)]"
                    >
                      {indicatorTypes.map((t) => (
                        <option key={t} value={t} className="bg-[hsl(220_25%_8%)] text-foreground">
                          {INDICATOR_LABELS[t]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeIndicator(ind.id)}
                      className="rounded p-1 text-muted-foreground hover:bg-[hsl(0_84%_60%/0.15)] hover:text-[hsl(0_84%_65%)]"
                      aria-label="Remover"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(ind.params).map(([key, val]) =>
                      key === "papel" ? (
                        <div key={key} className="col-span-2">
                          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            Usar como
                          </Label>
                          <select
                            value={String(val)}
                            onChange={(e) =>
                              updateIndicatorParam(ind.id, key, e.target.value)
                            }
                            className="mt-1 h-8 w-full rounded-md border border-border/60 bg-[hsl(220_25%_8%)] px-2 text-xs text-foreground outline-none focus:border-[hsl(139_80%_45%)]"
                          >
                            <option value="rapida" className="bg-[hsl(220_25%_8%)]">Rápida</option>
                            <option value="lenta" className="bg-[hsl(220_25%_8%)]">Lenta</option>
                          </select>
                        </div>
                      ) : (
                        (() => {
                          const isPeriodField = ["periodo", "fast", "slow", "signal", "k", "d"].includes(key);
                          return (
                            <div key={key}>
                              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                {key}
                              </Label>
                              <Input
                                type="number"
                                min={isPeriodField ? 1 : undefined}
                                max={isPeriodField ? 199 : undefined}
                                value={Number(val)}
                                onChange={(e) =>
                                  updateIndicatorParam(ind.id, key, Number(e.target.value))
                                }
                                className="mt-1 h-8 text-xs"
                              />
                              {isPeriodField && (
                                <p className="mt-1 text-[10px] text-muted-foreground">
                                  Máx. 199 candles
                                </p>
                              )}
                            </div>
                          );
                        })()
                      ),
                    )}
                  </div>
                </div>
              ))}

              <div className="rounded-lg border border-dashed border-border/60 bg-muted/5 p-2.5">
                <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <Plus className="h-3 w-3" /> Adicionar indicador
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {indicatorTypes.map((t) => {
                    const used = draft.indicators.some((i) => i.type === t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => addIndicator(t)}
                        className={`rounded-md border px-2 py-1 text-[11px] font-semibold transition-all ${
                          used
                            ? "border-[hsl(139_80%_45%/0.4)] bg-[hsl(139_80%_45%/0.08)] text-[hsl(139_80%_65%)]"
                            : "border-border/60 bg-muted/10 text-muted-foreground hover:border-[hsl(139_80%_45%/0.5)] hover:bg-[hsl(139_80%_45%/0.08)] hover:text-[hsl(139_80%_70%)]"
                        }`}
                      >
                        {used && <Check className="mr-1 inline h-2.5 w-2.5" />}
                        {INDICATOR_LABELS[t]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Regra de entrada */}
            <div className="space-y-2">
              <Label className="text-[11px] text-muted-foreground">Regra de Entrada</Label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["CRUZAMENTO", "Cruzamento de Médias"],
                    ["CONFLUENCIA", "Confluência"],
                    ["REVERSAO", "Reversão à Média"],
                    ["MOMENTUM", "Momentum"],
                  ] as const
                ).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDraft({ ...draft, entryRule: val })}
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                      draft.entryRule === val
                        ? "border-[hsl(139_80%_45%)] bg-[hsl(139_80%_45%/0.1)] text-[hsl(139_80%_55%)]"
                        : "border-border/60 bg-muted/10 text-muted-foreground hover:border-border"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {draft.entryRule === "CONFLUENCIA" && draft.indicators.length > 0 && (
                <div className="rounded-lg border border-border/60 bg-muted/10 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <Label className="text-[11px] text-muted-foreground">
                      Mínimo de indicadores concordando
                    </Label>
                    <span className="ct-mono text-sm font-bold text-[hsl(139_80%_55%)]">
                      {draft.minConfluence} / {draft.indicators.length}
                    </span>
                  </div>
                  <Slider
                    min={1}
                    max={draft.indicators.length}
                    step={1}
                    value={[Math.min(draft.minConfluence, draft.indicators.length)]}
                    onValueChange={(v) => setDraft({ ...draft, minConfluence: v[0] })}
                  />
                </div>
              )}

              {draft.entryRule === "REVERSAO" && (
                <p className="rounded-md bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
                  💡 Adicione RSI + Bollinger Bands para esta regra.
                </p>
              )}
              {draft.entryRule === "MOMENTUM" && (
                <p className="rounded-md bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
                  💡 Adicione MACD + RSI para esta regra.
                </p>
              )}
            </div>

            {/* Condições */}
            <div className="space-y-3 rounded-lg border border-border/60 bg-muted/10 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-semibold">Aguardar confirmação</Label>
                  <p className="text-[10px] text-muted-foreground">
                    Espera a vela fechar antes de entrar
                  </p>
                </div>
                <Switch
                  checked={draft.awaitConfirmation}
                  onCheckedChange={(v) => setDraft({ ...draft, awaitConfirmation: v })}
                />
              </div>

              <div>
                <Label className="text-[11px] text-muted-foreground">Direção permitida</Label>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {(
                    [
                      ["AMBAS", "Ambas"],
                      ["CALL", "CALL"],
                      ["PUT", "PUT"],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setDraft({ ...draft, direction: val })}
                      className={`rounded-md border px-2 py-1.5 text-[11px] font-semibold transition-colors ${
                        draft.direction === val
                          ? "border-[hsl(139_80%_45%)] bg-[hsl(139_80%_45%/0.1)] text-[hsl(139_80%_55%)]"
                          : "border-border/60 bg-muted/10 text-muted-foreground hover:border-border"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTab("list")}
                className="flex-1 rounded-lg border border-border/70 bg-muted/10 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/20"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 rounded-lg bg-gradient-to-r from-[hsl(139_80%_40%)] to-[hsl(139_80%_50%)] px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_16px_hsl(139_80%_40%/0.35)] transition-transform hover:scale-[1.01]"
              >
                Salvar Estratégia
              </button>
            </div>
          </TabsContent>
            </Tabs>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
