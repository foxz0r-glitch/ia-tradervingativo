import { useEffect, useState } from "react";
import { Wallet, Eye, EyeOff, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface HeaderBalanceProps {
  /** Visual variant for use across different headers */
  variant?:
    | "default"
    | "glass"
    | "neon"
    | "mono"
    | "gradient"
    | "compact"
    | "teal-aurora"
    | "teal-pulse"
    | "teal-mono"
    | "teal-corp"
    | "teal-luxe";
}

/**
 * Compact "Saldo" pill that fits naturally between the BrokerAccess and
 * Deposit buttons in the top header. Reads the latest balance from
 * casatrade_balance_history for the current user and supports a hide-toggle.
 */
export const HeaderBalance = ({ variant = "default" }: HeaderBalanceProps) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [hidden, setHidden] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchBalance = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("casatrade_balance_history")
        .select("saldo_real")
        .eq("user_id", user.id)
        .order("registrado_em", { ascending: false })
        .limit(1)
        .maybeSingle();
      setBalance(Number(data?.saldo_real ?? 0));
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatted =
    balance != null
      ? balance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : "—";

  const display = hidden ? "R$ ••••••" : loading ? "—" : formatted;

  // Variant styles
  const styles: Record<string, string> = {
    default:
      "border-border/70 bg-secondary/40 hover:border-primary/50 hover:bg-secondary",
    glass:
      "border-white/10 bg-white/5 backdrop-blur-md hover:border-white/25 hover:bg-white/10",
    neon:
      "border-[hsl(160_84%_45%/0.5)] bg-[hsl(160_84%_15%/0.4)] shadow-[0_0_18px_-6px_hsl(160_84%_45%/0.6)] hover:shadow-[0_0_24px_-4px_hsl(160_84%_45%/0.85)]",
    mono:
      "border-foreground/15 bg-background hover:border-foreground/30",
    gradient:
      "border-transparent bg-gradient-to-r from-[hsl(160_84%_18%)] via-[hsl(217_91%_22%)] to-[hsl(265_85%_25%)] hover:brightness-110",
    compact:
      "border-border/60 bg-card/60 hover:border-primary/40",
    "teal-aurora":
      "border-[hsl(184_82%_55%/0.35)] bg-[hsl(184_82%_18%/0.55)] backdrop-blur-md hover:border-[hsl(184_82%_60%/0.6)] hover:bg-[hsl(184_82%_22%/0.7)]",
    "teal-pulse":
      "border-[hsl(184_82%_45%/0.55)] bg-[hsl(184_82%_12%/0.7)] shadow-[0_0_18px_-6px_hsl(184_82%_50%/0.65)] hover:shadow-[0_0_26px_-4px_hsl(184_82%_55%/0.85)]",
    "teal-mono":
      "border-[hsl(184_30%_85%/0.18)] bg-[hsl(184_30%_8%/0.5)] hover:border-[hsl(184_60%_60%/0.45)]",
    "teal-corp":
      "border-[hsl(184_70%_30%/0.5)] bg-gradient-to-b from-[hsl(184_60%_14%)] to-[hsl(184_70%_10%)] hover:from-[hsl(184_60%_18%)] hover:to-[hsl(184_70%_12%)]",
    "teal-luxe":
      "border-[hsl(43_70%_60%/0.35)] bg-gradient-to-r from-[hsl(184_70%_12%)] via-[hsl(184_60%_15%)] to-[hsl(184_70%_12%)] hover:border-[hsl(43_70%_65%/0.55)]",
  };

  const labelColor: Record<string, string> = {
    default: "text-[hsl(160_50%_70%)]",
    glass: "text-white/70",
    neon: "text-[hsl(160_84%_70%)]",
    mono: "text-muted-foreground",
    gradient: "text-white/85",
    compact: "text-muted-foreground",
    "teal-aurora": "text-[hsl(184_82%_78%)]",
    "teal-pulse": "text-[hsl(184_82%_72%)]",
    "teal-mono": "text-[hsl(184_30%_70%)]",
    "teal-corp": "text-[hsl(184_50%_75%)]",
    "teal-luxe": "text-[hsl(43_70%_72%)]",
  };

  const valueColor: Record<string, string> = {
    default: "text-foreground",
    glass: "text-white",
    neon: "text-[hsl(160_84%_85%)]",
    mono: "text-foreground",
    gradient: "text-white",
    compact: "text-foreground",
    "teal-aurora": "text-white",
    "teal-pulse": "text-[hsl(184_82%_92%)]",
    "teal-mono": "text-white",
    "teal-corp": "text-white",
    "teal-luxe": "text-[hsl(43_70%_92%)]",
  };

  return (
    <div
      className={cn(
        "group inline-flex h-10 items-center gap-2.5 rounded-lg border px-3 transition-all duration-300",
        styles[variant],
      )}
    >
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
          variant === "gradient"
            ? "bg-white/15 text-white"
            : variant === "neon"
              ? "bg-[hsl(160_84%_45%/0.2)] text-[hsl(160_84%_70%)]"
              : variant.startsWith("teal")
                ? "bg-[hsl(184_82%_45%/0.2)] text-[hsl(184_82%_75%)]"
                : "bg-primary/10 text-primary",
        )}
      >
        <Wallet className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>

      <div className="flex flex-col leading-none">
        <span
          className={cn(
            "text-[9px] font-bold uppercase tracking-[0.2em]",
            labelColor[variant],
          )}
        >
          Saldo
        </span>
        <span
          className={cn(
            "mt-0.5 text-sm font-bold tabular-nums",
            valueColor[variant],
          )}
        >
          {display}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setHidden((v) => !v)}
        className={cn(
          "ml-1 rounded-md p-1 text-muted-foreground transition-colors hover:bg-primary/15 hover:text-primary",
          variant === "gradient" && "text-white/70 hover:bg-white/10 hover:text-white",
          variant === "glass" && "text-white/60 hover:bg-white/10 hover:text-white",
        )}
        aria-label={hidden ? "Mostrar saldo" : "Ocultar saldo"}
      >
        {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>

      <button
        type="button"
        onClick={() => {
          setLoading(true);
          fetchBalance();
        }}
        className={cn(
          "rounded-md p-1 text-muted-foreground transition-colors hover:bg-primary/15 hover:text-primary",
          variant === "gradient" && "text-white/70 hover:bg-white/10 hover:text-white",
          variant === "glass" && "text-white/60 hover:bg-white/10 hover:text-white",
        )}
        aria-label="Atualizar saldo"
      >
        <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
      </button>
    </div>
  );
};
