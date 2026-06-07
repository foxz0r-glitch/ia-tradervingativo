import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Normaliza amount aceitando formatos US e BR. Retorna número finito ou null.
// '1.234,56' (BR) -> 1234.56 | '1,234.56' (US) -> 1234.56 | '50,00' -> 50 | '50' -> 50.
// Caso ambíguo: '1.234' (sem vírgula) -> 1.234 (só dá pra resolver vendo o log real da CasaTrade).
function normalizeAmount(raw: string | null): number | null {
  if (raw == null) return null;
  const s = raw.trim();
  if (s === "") return null;

  const hasDot = s.includes(".");
  const hasComma = s.includes(",");
  let cleaned: string;
  if (hasDot && hasComma) {
    // separador decimal = o que aparece por ULTIMO
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      cleaned = s.replace(/\./g, "").replace(",", "."); // BR: vírgula decimal, ponto = milhar
    } else {
      cleaned = s.replace(/,/g, ""); // US: ponto decimal, vírgula = milhar
    }
  } else if (hasComma) {
    cleaned = s.replace(",", "."); // só vírgula -> decimal
  } else {
    cleaned = s; // só ponto ou sem separador -> como está
  }

  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

serve(async (req) => {
  try {
    // Auth fail-closed: token no FINAL do path tem que bater com POSTBACK_SECRET.
    // Sem secret OU token errado -> 401 (não processa nada).
    const token = new URL(req.url).pathname.split("/").filter(Boolean).pop();
    const postbackSecret = Deno.env.get("POSTBACK_SECRET");
    if (!postbackSecret || token !== postbackSecret) {
      return new Response("unauthorized", { status: 401 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Postback server-to-server (GET): dados vêm da query string.
    const params = new URL(req.url).searchParams;
    const postback_name = params.get("postback_name");
    const trader_id = params.get("trader_id");
    const event_id = params.get("event_id") || null; // vazio/ausente -> null (RPC: sem dedup)
    const instrument = params.get("instrument") ?? "";

    // amount: normalizador US+BR (ver normalizeAmount). Loga SEMPRE cru -> normalizado:
    // é assim que confirmamos no teste o formato real da CasaTrade (e unidade: inteiro vs centavos).
    const amountRaw = params.get("amount");
    const amount = normalizeAmount(amountRaw);
    console.log("[casatrade-postback] amount cru:", amountRaw, "-> normalizado:", amount);
    if (amount === null) {
      console.error("[casatrade-postback] amount invalido/ausente (cru):", amountRaw);
    }

    const recebido_em = new Date().toISOString();
    const traderStr = trader_id ? String(trader_id) : null;

    if (!traderStr) {
      return new Response("OK", { status: 200 });
    }

    // Tipo de evento derivado de postback_name de forma null-safe.
    const evento = (postback_name ?? "").toLowerCase().trim();

    // Depósito delegado à RPC atômica (gate + dedup + soma + FTD + XP + histórico).
    // Mesmo client service-role (a RPC só dá EXECUTE pro service_role).
    const { data: result, error } = await supabase.rpc("process_casatrade_deposit", {
      p_trader_id: traderStr,
      p_event_id: event_id,
      p_event: evento,
      p_amount: amount,
      p_received_at: recebido_em,
    });
    console.log("[casatrade-postback] process_casatrade_deposit:", result);
    if (error) {
      // RPC é atômica: erro = rollback total (nada gravado) -> 500 é seguro (retry processa 1x).
      // O dedup (event_id,event) cobre o caso de commit-ok-mas-resposta-perdida + reenvio.
      console.error("[casatrade-postback] erro RPC:", error);
      return new Response("erro", { status: 500 });
    }

    // Carimbo genérico do último evento (roda pra QUALQUER evento;
    // a RPC NÃO toca em postback_evento/postback_recebido_em).
    await supabase.from("casatrade_data").upsert(
      {
        casatrade_user_id: traderStr,
        postback_evento: evento,
        postback_recebido_em: recebido_em,
        updated_at: recebido_em,
      },
      { onConflict: "casatrade_user_id", ignoreDuplicates: false }
    );

    if (evento === "transacao" && instrument) {
      await supabase.from("trade_events").insert({
        casatrade_user_id: traderStr,
        asset: instrument,
        happened_at: recebido_em,
      });
    }

    return new Response("OK", { status: 200 });
  } catch (e) {
    console.error("[casatrade-postback] erro:", e);
    return new Response("OK", { status: 200 });
  }
});
