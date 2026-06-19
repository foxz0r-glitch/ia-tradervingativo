import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export interface AssetOption {
  /** Numeric id used by the broker (string for <select> compatibility) */
  id: string;
  /** Pretty display name, e.g. "Euro → Dólar Americano" */
  name: string;
  /** Ticker, e.g. "EURUSD-OTC" */
  symbol: string;
  /** Two-letter ISO country code for the flag (uses flagcdn.com) */
  flag: string;
  /** Optional category tag */
  category?: "FOREX" | "OTC" | "STOCKS";
}

interface AssetComboboxProps {
  value: string;
  onChange: (id: string) => void;
  options: AssetOption[];
}

function FlagIcon({ code, className }: { code: string; className?: string }) {
  return (
    <img
      src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/w80/${code.toLowerCase()}.png 2x`}
      alt={code}
      width={28}
      height={20}
      className={cn("h-5 w-7 shrink-0 rounded-[3px] object-cover ring-1 ring-border/60", className)}
      loading="lazy"
    />
  );
}

/** Map a 3-letter currency code to an ISO country code (for flagcdn) */
const CURRENCY_FLAG: Record<string, string> = {
  EUR: "eu", USD: "us", GBP: "gb", JPY: "jp",
  AUD: "au", CAD: "ca", NZD: "nz", CHF: "ch",
  BRL: "br", CNY: "cn", MXN: "mx",
};

/** Extract the two currencies from a symbol like "EUR/USD-OTC" */
function pairFlags(symbol: string, fallback: string): [string, string] {
  const m = symbol.match(/^([A-Z]{3})[\/\-]([A-Z]{3})/);
  if (m) {
    return [CURRENCY_FLAG[m[1]] ?? fallback, CURRENCY_FLAG[m[2]] ?? fallback];
  }
  return [fallback, fallback];
}

interface InlineProps extends AssetComboboxProps {
  /** Render as the chart header trigger (inline, transparent, two flags) */
  variant?: "default" | "inline";
  /** Optional node rendered inside the trigger, next to the symbol (e.g. "AO VIVO" badge) */
  accessory?: ReactNode;
}

function PairFlags({ a, b, size = "sm" }: { a: string; b: string; size?: "sm" | "md" }) {
  const dim = size === "md" ? "h-10 w-10" : "h-6 w-6";
  return (
    <div className="relative flex items-center justify-center">
      {size === "md" && <span className="absolute inset-0 rounded-full bg-primary/15 blur-md" />}
      <div className="relative flex -space-x-2">
        <img
          src={`https://flagcdn.com/w40/${a}.png`}
          srcSet={`https://flagcdn.com/w80/${a}.png 2x`}
          alt={a}
          className={cn(dim, "rounded-full object-cover ring-2 ring-card")}
        />
        <img
          src={`https://flagcdn.com/w40/${b}.png`}
          srcSet={`https://flagcdn.com/w80/${b}.png 2x`}
          alt={b}
          className={cn(dim, "rounded-full object-cover ring-2 ring-card")}
        />
      </div>
    </div>
  );
}

export function AssetCombobox({
  value,
  onChange,
  options,
  variant = "default",
  accessory,
}: InlineProps) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => options.find((o) => o.id === value), [options, value]);
  const selectedKey = selected ? `${selected.name} ${selected.symbol}` : "";
  const [cmdValue, setCmdValue] = useState(selectedKey);

  // When the popover opens, force the highlight onto the currently selected asset
  // (cmdk would otherwise auto-highlight the first item).
  useEffect(() => {
    if (open) setCmdValue(selectedKey);
  }, [open, selectedKey]);
  const [flagA, flagB] = selected ? pairFlags(selected.symbol, selected.flag) : ["", ""];
  const isInline = variant === "inline";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-expanded={open}
          className={cn(
            isInline
              ? "group inline-flex w-auto max-w-fit items-center gap-3 self-start rounded-xl border border-transparent bg-transparent px-2 py-1.5 text-left transition-all hover:border-border/60 hover:bg-card/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              : cn(
                  "group flex w-full items-center gap-3 rounded-xl border border-border/70 bg-card/70 px-3 py-2.5 text-left text-sm font-semibold text-foreground transition-all",
                  "hover:border-primary/40 hover:bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                ),
          )}
        >
          {selected ? (
            isInline ? (
              <>
                <PairFlags a={flagA} b={flagB} size="md" />
                <div className="inline-flex w-fit flex-col leading-tight">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold tracking-tight sm:text-lg">
                      {selected.name.split("→")[0]?.trim()}{" "}
                      <span className="text-muted-foreground">→</span>{" "}
                      <span className="text-foreground">{selected.name.split("→")[1]?.trim()}</span>
                    </h2>
                    {open ? (
                      <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary sm:h-[22px] sm:w-[22px]" strokeWidth={2.25} />
                    ) : (
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary sm:h-[22px] sm:w-[22px]" strokeWidth={2.25} />
                    )}
                  </div>
                  <div className="mt-0.5 flex w-fit max-w-full flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {selected.symbol}
                    </span>
                    {accessory}
                  </div>
                </div>
              </>
            ) : (
              <>
                <FlagIcon code={selected.flag} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-bold leading-tight">{selected.name}</span>
                  <span className="truncate text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {selected.symbol}
                  </span>
                </div>
                {open ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                )}
              </>
            )
          ) : (
            <>
              <span className="flex-1 text-muted-foreground">Selecionar ativo</span>
              {open ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className={cn(
          "overflow-hidden rounded-xl border border-border/70 bg-popover/95 p-0 shadow-2xl backdrop-blur-xl",
          isInline ? "w-[min(340px,calc(100vw-1rem))]" : "w-[--radix-popover-trigger-width]",
        )}
      >
        <Command className="bg-transparent" value={cmdValue} onValueChange={setCmdValue}>
          {/* Busca oculta visualmente (sr-only) — preservada p/ navegação por teclado e filtro do cmdk */}
          <div className="sr-only">
            <CommandInput
              placeholder="Buscar ativo..."
              className="h-11 text-sm placeholder:text-muted-foreground/70"
            />
          </div>
          <CommandList className="max-h-[300px]">
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
              Nenhum ativo encontrado.
            </CommandEmpty>
            <CommandGroup className="p-1.5">
              {options.map((opt) => {
                const isActive = opt.id === value;
                const [fa, fb] = pairFlags(opt.symbol, opt.flag);
                return (
                  <CommandItem
                    key={opt.id}
                    value={`${opt.name} ${opt.symbol}`}
                    onSelect={() => {
                      onChange(opt.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm",
                      // foco/navegação do cmdk: realce discreto neutro (sem verde); o <Check> é o indicador do escolhido
                      "data-[selected=true]:bg-foreground/10 data-[selected=true]:text-foreground",
                    )}
                  >
                    <PairFlags a={fa} b={fb} size="sm" />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-semibold leading-tight">
                        {opt.name}
                      </span>
                      <span className="truncate text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        {opt.symbol}
                      </span>
                    </div>
                    {isActive && <Check className="h-4 w-4 text-primary" />}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** Default catalog of broker assets (ids match CasaTrade backend) */
export const DEFAULT_ASSETS: AssetOption[] = [
  { id: "76",  name: "Euro → Dólar Americano",       symbol: "EUR/USD-OTC", flag: "eu", category: "OTC" },
  { id: "77",  name: "Euro → Libra Esterlina",       symbol: "EUR/GBP-OTC", flag: "eu", category: "OTC" },
  { id: "79",  name: "Euro → Iene Japonês",          symbol: "EUR/JPY-OTC", flag: "eu", category: "OTC" },
  { id: "80",  name: "Dólar Neo-Zelandês → Dólar",   symbol: "NZD/USD-OTC", flag: "nz", category: "OTC" },
  { id: "81",  name: "Libra → Dólar Americano",      symbol: "GBP/USD-OTC", flag: "gb", category: "OTC" },
  { id: "84",  name: "Libra → Iene Japonês",         symbol: "GBP/JPY-OTC", flag: "gb", category: "OTC" },
  { id: "85",  name: "Dólar → Iene Japonês",         symbol: "USD/JPY-OTC", flag: "us", category: "OTC" },
  { id: "86",  name: "Dólar Australiano → Canadense",symbol: "AUD/CAD-OTC", flag: "au", category: "OTC" },
];
