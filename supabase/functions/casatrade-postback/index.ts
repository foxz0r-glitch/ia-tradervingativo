import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    // Validação por token no FINAL do path da URL, antes de qualquer escrita.
    // Só valida se a env POSTBACK_SECRET existir.
    const token = new URL(req.url).pathname.split("/").filter(Boolean).pop();
    const postbackSecret = Deno.env.get("POSTBACK_SECRET");
    if (postbackSecret && token !== postbackSecret) {
      return new Response("OK", { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Postback server-to-server (GET): dados vêm da query string.
    const params = new URL(req.url).searchParams;
    const postback_name = params.get("postback_name");
    const trader_id = params.get("trader_id");
    const amount = Number(params.get("amount") ?? 0);
    const instrument = params.get("instrument") ?? "";

    const recebido_em = new Date().toISOString();
    const traderStr = trader_id ? String(trader_id) : null;

    if (!traderStr) {
      return new Response("OK", { status: 200 });
    }

    // Tipo de evento derivado de postback_name de forma null-safe.
    const evento = (postback_name ?? "").toLowerCase().trim();

    await supabase.from("casatrade_data").upsert(
      {
        casatrade_user_id: traderStr,
        postback_evento: evento,
        postback_recebido_em: recebido_em,
        updated_at: recebido_em,
      },
      { onConflict: "casatrade_user_id", ignoreDuplicates: false }
    );

    const isDeposit = ["deposito", "primeiro_deposito", "redeposito"].includes(evento);

    if (isDeposit && amount > 0) {
      const { data: current } = await supabase
        .from("casatrade_data")
        .select("total_deposited")
        .eq("casatrade_user_id", traderStr)
        .maybeSingle();

      const newTotal = (current?.total_deposited ?? 0) + amount;

      const updatePayload: Record<string, unknown> = {
        total_deposited: newTotal,
        updated_at: recebido_em,
      };
      if (evento === "primeiro_deposito") {
        updatePayload.ftd_date = recebido_em.split("T")[0];
      }

      await supabase
        .from("casatrade_data")
        .update(updatePayload)
        .eq("casatrade_user_id", traderStr);

      const traderId = parseInt(traderStr, 10);
      if (!isNaN(traderId)) {
        const { data: cred } = await supabase
          .from("user_credentials")
          .select("user_id:id")
          .eq("casatrade_user_id", traderId)
          .maybeSingle();

        const userId = (cred as { user_id?: string } | null)?.user_id;
        if (userId) {
          await supabase.from("casatrade_balance_history").insert({
            user_id: userId,
            casatrade_user_id: traderStr,
            saldo_real: 0,
            valor_variacao: amount,
            tipo_variacao: "deposito",
            deposito_detectado: true,
          });

          if (evento === "primeiro_deposito") {
            await supabase.rpc("award_xp", {
              p_user_id: userId,
              p_amount: 100,
              p_source: "ftd",
              p_description: "Primeiro depósito na CasaTrade",
            });
          }
        }
      }
    }

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
