import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const WEBHOOK_SECRET = Deno.env.get("CAKTO_WEBHOOK_SECRET") ?? "";

const GRANT_EVENTS = new Set(["purchase_approved", "subscription_renewed"]);
const REVOKE_EVENTS = new Set(["refund", "chargeback", "subscription_canceled", "subscription_expired"]);

function generateCode(): string {
  // 4-digit number, first digit never 0 (1000–9999)
  const n = 1000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 9000);
  return String(n);
}

serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  let body: any;
  try { body = await req.json(); } catch { return new Response("Bad Request", { status: 400 }); }

  if (!WEBHOOK_SECRET || body.secret !== WEBHOOK_SECRET)
    return new Response("Unauthorized", { status: 401 });

  const event: string = body.event ?? "";
  const data: any = body.data ?? {};
  const customerEmail: string | null = data?.customer?.email ?? null;
  const orderId: string | null = data?.id ?? null;
  const productId: string | null = data?.product?.id ?? null;
  const subscriptionId: string | null = data?.subscription?.id ?? null;
  const paidAt: string | null = data?.paidAt ?? null;
  const recurrencePeriod: number | null = data?.subscription?.recurrence_period ?? null;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  const { data: logRow } = await supabase
    .from("cakto_events")
    .insert({ evento: event, cakto_email: customerEmail, cakto_order_id: orderId,
              payload: body, status: "received", processado_em: new Date().toISOString() })
    .select("id").single();

  const logId: string | null = logRow?.id ?? null;
  const updateLog = async (status: string, erro: string | null = null) => {
    if (logId) await supabase.from("cakto_events").update({ status, erro }).eq("id", logId);
  };

  if (!GRANT_EVENTS.has(event) && !REVOKE_EVENTS.has(event)) {
    await updateLog("ignored");
    return new Response(JSON.stringify({ ok: true, status: "ignored" }), { headers: { "Content-Type": "application/json" } });
  }

  if (!customerEmail || !productId) {
    await updateLog("error", "Missing customer.email or product.id");
    return new Response(JSON.stringify({ ok: true, status: "skipped" }), { headers: { "Content-Type": "application/json" } });
  }

  const { data: mapping } = await supabase
    .from("cakto_product_map")
    .select("ref_id, tipo")
    .eq("cakto_product_id", productId)
    .eq("ativo", true)
    .maybeSingle();

  if (!mapping) {
    await updateLog("error", `No active mapping for product: ${productId}`);
    return new Response(JSON.stringify({ ok: true, status: "no_mapping" }), { headers: { "Content-Type": "application/json" } });
  }

  try {
    const now = new Date().toISOString();

    if (GRANT_EVENTS.has(event)) {
      const { data: userId } = await supabase.rpc("get_user_id_by_email", { p_email: customerEmail });

      if (userId && event === "subscription_renewal_approved" && mapping.tipo === "plan") {
        const { data: plan } = await supabase.from("plans")
          .select("slug, is_vitalicio").eq("id", mapping.ref_id).single();
        const expiresAt = recurrencePeriod
          ? new Date(Date.now() + recurrencePeriod * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        await supabase.from("user_subscriptions").insert({
          user_id: userId, plan_id: mapping.ref_id, cakto_order_id: orderId,
          cakto_subscription_id: subscriptionId, status: "active",
          starts_at: paidAt ?? now, expires_at: expiresAt, is_lifetime: false,
          created_at: now, updated_at: now,
        });
        const { data: existingAccess } = await supabase.from("user_access")
          .select("user_id").eq("user_id", userId).maybeSingle();
        if (existingAccess) {
          await supabase.from("user_access")
            .update({ plan: plan?.slug, access_expires_at: expiresAt, granted_by: "cakto_renewal", updated_at: now })
            .eq("user_id", userId);
        } else {
          await supabase.from("user_access")
            .insert({ user_id: userId, plan: plan?.slug, access_expires_at: expiresAt, granted_by: "cakto_renewal" });
        }
        await updateLog("processed");
        return new Response(JSON.stringify({ ok: true, status: "renewal_processed" }), { headers: { "Content-Type": "application/json" } });
      }

      const { data: plan } = mapping.tipo === "plan"
        ? await supabase.from("plans").select("is_vitalicio").eq("id", mapping.ref_id).maybeSingle()
        : { data: null };
      const isLifetime = plan?.is_vitalicio ?? false;
      const expiresAt = isLifetime ? null
        : recurrencePeriod ? new Date(Date.now() + recurrencePeriod * 24 * 60 * 60 * 1000).toISOString()
        : mapping.tipo === "plan" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null;
      const code = generateCode();
      await supabase.from("activation_codes").insert({
        code, cakto_order_id: orderId, cakto_event: event,
        ref_id: mapping.ref_id, tipo: mapping.tipo,
        customer_email: customerEmail, expires_at: expiresAt, created_at: now,
      });
      await updateLog("processed");
      return new Response(JSON.stringify({ ok: true, status: "code_generated", code }), { headers: { "Content-Type": "application/json" } });

    } else {
      const { data: userId } = await supabase.rpc("get_user_id_by_email", { p_email: customerEmail });

      await supabase.from("activation_codes")
        .update({ expires_at: now })
        .eq("cakto_order_id", orderId)
        .is("claimed_by", null);

      if (userId) {
        if (mapping.tipo === "plan") {
          await supabase.from("user_subscriptions")
            .update({ status: event, updated_at: now })
            .eq("user_id", userId).eq("plan_id", mapping.ref_id).eq("status", "active");
          await supabase.from("user_access")
            .update({ access_expires_at: now, updated_at: now }).eq("user_id", userId);
        } else if (mapping.tipo === "upsell") {
          await supabase.from("user_upsells")
            .update({ status: event, expires_at: now })
            .eq("user_id", userId).eq("upsell_id", mapping.ref_id).eq("status", "active");
        }
      }

      await updateLog("processed");
      return new Response(JSON.stringify({ ok: true, status: "revoked" }), { headers: { "Content-Type": "application/json" } });
    }

  } catch (e: any) {
    await updateLog("error", e.message);
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
