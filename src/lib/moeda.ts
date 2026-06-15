function norm(moeda?: string | null): string | undefined {
  return typeof moeda === "string" && moeda.trim() ? moeda.trim().toUpperCase() : undefined;
}

export function formatMoeda(valor: number, moeda?: string | null): string {
  const v = Number(valor);
  const safe = Number.isFinite(v) ? v : 0;
  const m = norm(moeda);
  if (m) {
    try { return safe.toLocaleString("pt-BR", { style: "currency", currency: m }); }
    catch { /* moeda nao-ISO (ex.: USDT) -> fallback */ }
  }
  return `$ ${safe.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function simboloMoeda(moeda?: string | null): string {
  const m = norm(moeda);
  if (!m) return "$";
  try {
    const parts = new Intl.NumberFormat("pt-BR", { style: "currency", currency: m }).formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value ?? "$";
  } catch { return "$"; }
}
