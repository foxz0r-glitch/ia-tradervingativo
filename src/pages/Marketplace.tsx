import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Store, BarChart2, TrendingUp, Loader2 } from "lucide-react";

type MktItem = {
  id: string;
  nome: string;
  descricao: string | null;
  preco_sugerido: number | null;
  preview_winrate: number | null;
  preview_trades: number | null;
  checkout_url: string | null;
  user_id: string;
  created_at: string;
};

export default function Marketplace() {
  const [items, setItems] = useState<MktItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await (supabase as any)
        .from("marketplace_submissions")
        .select("id, nome, descricao, preco_sugerido, preview_winrate, preview_trades, checkout_url, user_id, created_at")
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (cancelled) return;
      setItems((data ?? []) as MktItem[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0d14]">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="bg-gradient-to-r from-foreground to-primary bg-clip-text text-3xl font-extrabold text-transparent">
              Marketplace de Estratégias
            </h1>
            <span className="rounded-full bg-amber-500/15 border border-amber-500/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Premium
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Estratégias criadas e aprovadas pela comunidade Virtus Pro
          </p>
        </header>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="mt-20 flex flex-col items-center justify-center gap-3 text-center">
            <Store className="h-16 w-16 text-muted-foreground/40" strokeWidth={1.4} />
            <p className="text-base font-semibold text-foreground">Nenhuma estratégia disponível ainda.</p>
            <p className="text-sm text-muted-foreground">Em breve haverá estratégias premium disponíveis aqui.</p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((m) => (
              <div key={m.id} className="flex flex-col rounded-2xl border border-border/50 bg-[#14141f] p-6">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-500/15 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Premium
                  </span>
                  {m.preview_winrate != null && (
                    <span className="rounded-full bg-emerald-500/15 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      {Number(m.preview_winrate).toFixed(1)}% winrate
                    </span>
                  )}
                </div>
                <h3 className="mt-3 text-lg font-bold text-foreground">{m.nome}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {m.preview_trades != null && (
                    <span className="inline-flex items-center gap-1">
                      <BarChart2 className="h-3.5 w-3.5" /> {m.preview_trades} operações
                    </span>
                  )}
                  {m.preview_winrate != null && (
                    <span className="inline-flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5" /> {Number(m.preview_winrate).toFixed(1)}% winrate
                    </span>
                  )}
                </div>
                {m.descricao && (
                  <p className="mt-2 line-clamp-4 text-sm text-muted-foreground">
                    {m.descricao}
                  </p>
                )}
                <hr className="border-border/40 my-4" />
                <div className="text-2xl font-extrabold text-amber-400">
                  {m.preco_sugerido != null ? `R$ ${Number(m.preco_sugerido).toFixed(2)}` : "Consulte"}
                </div>
                <button
                  type="button"
                  onClick={() => m.checkout_url && window.open(m.checkout_url, "_blank")}
                  disabled={!m.checkout_url}
                  className="mt-4 w-full rounded-lg bg-amber-500 py-2.5 text-sm font-bold text-black transition hover:bg-amber-400 disabled:opacity-50"
                >
                  Comprar Estratégia
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
