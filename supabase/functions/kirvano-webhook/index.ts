import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const KIRVANO_TOKEN             = Deno.env.get('KIRVANO_WEBHOOK_TOKEN') ?? ''

Deno.serve(async (req) => {
  const url   = new URL(req.url)
  const token = url.searchParams.get('token') ?? req.headers.get('x-webhook-token') ?? ''

  if (KIRVANO_TOKEN && token !== KIRVANO_TOKEN) {
    return new Response('Unauthorized', { status: 401 })
  }

  let payload: any
  try {
    payload = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const evento    = payload.event ?? payload.evento ?? 'desconhecido'
  const email     = (payload.customer?.email ?? payload.email ?? '').toLowerCase().trim()
  const orderId   = String(payload.sale?.id ?? payload.order_id ?? payload.id ?? '')
  const subId     = String(payload.sale?.subscription_id ?? payload.subscription?.id ?? '')
  const productId = String(payload.product?.id ?? payload.sale?.product_id ?? '')

  console.log(`[kirvano] evento=${evento} email=${email} order=${orderId} product=${productId}`)

  const { data: eventRow } = await supabase
    .from('kirvano_events')
    .insert({ evento, kirvano_order_id: orderId, kirvano_email: email, payload })
    .select('id')
    .single()

  const logErro = async (msg: string) => {
    console.error(`[kirvano] erro: ${msg}`)
    if (eventRow?.id) {
      await supabase.from('kirvano_events').update({ status: 'error', erro: msg }).eq('id', eventRow.id)
    }
  }

  const ignorados = ['boleto_gerado', 'pix_gerado', 'picpay_gerado',
                     'boleto_expirado', 'pix_expirado', 'carrinho_abandonado']
  if (ignorados.includes(evento)) {
    if (eventRow?.id) await supabase.from('kirvano_events').update({ status: 'ignored' }).eq('id', eventRow.id)
    return new Response('OK', { status: 200 })
  }

  if (evento === 'compra_aprovada' || evento === 'purchase_approved') {
    if (!email) { await logErro('email do cliente ausente no payload'); return new Response('OK', { status: 200 }) }

    const { data: { users }, error: userErr } = await supabase.auth.admin.listUsers()
    if (userErr) { await logErro(`listUsers: ${userErr.message}`); return new Response('OK', { status: 200 }) }

    const user = users.find(u => u.email?.toLowerCase() === email)
    if (!user) { await logErro(`usuário não encontrado: ${email}`); return new Response('OK', { status: 200 }) }

    if (!productId || productId === 'undefined') {
      await logErro('product_id ausente'); return new Response('OK', { status: 200 })
    }

    const { data: map, error: mapErr } = await supabase
      .from('kirvano_product_map')
      .select('tipo, ref_id')
      .eq('kirvano_product_id', productId)
      .eq('ativo', true)
      .single()

    if (mapErr || !map) {
      await logErro(`produto ${productId} não mapeado — configure em Admin > Integrações > Kirvano`)
      return new Response('OK', { status: 200 })
    }

    if (map.tipo === 'plan') {
      const { data: plan } = await supabase.from('plans').select('is_vitalicio').eq('id', map.ref_id).single()
      const isLifetime = plan?.is_vitalicio ?? false
      const expiresAt  = isLifetime ? null : new Date(Date.now() + 31 * 86400 * 1000).toISOString()

      const { error: subErr } = await supabase.from('user_subscriptions').upsert({
        user_id: user.id, plan_id: map.ref_id,
        kirvano_order_id: orderId, kirvano_subscription_id: subId || null,
        status: 'active', starts_at: new Date().toISOString(),
        expires_at: expiresAt, is_lifetime: isLifetime,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

      if (subErr) { await logErro(`upsert subscription: ${subErr.message}`); return new Response('OK', { status: 200 }) }
      console.log(`[kirvano] plano ${map.ref_id} ativado para ${email}`)

    } else if (map.tipo === 'upsell') {
      const { data: upsell } = await supabase.from('upsells').select('is_recorrente').eq('id', map.ref_id).single()
      const expiresAt = upsell?.is_recorrente ? new Date(Date.now() + 31 * 86400 * 1000).toISOString() : null

      const { error: upErr } = await supabase.from('user_upsells').insert({
        user_id: user.id, upsell_id: map.ref_id,
        kirvano_order_id: orderId, status: 'active', expires_at: expiresAt,
      })
      if (upErr) { await logErro(`insert user_upsell: ${upErr.message}`); return new Response('OK', { status: 200 }) }
      console.log(`[kirvano] upsell ${map.ref_id} ativado para ${email}`)
    }

    return new Response('OK', { status: 200 })
  }

  if (evento === 'chargeback' || evento === 'subscription_cancelled' || evento === 'reembolso') {
    if (subId && subId !== 'undefined') {
      await supabase.from('user_subscriptions')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('kirvano_subscription_id', subId)
    } else if (orderId) {
      await supabase.from('user_subscriptions')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('kirvano_order_id', orderId)
      await supabase.from('user_upsells')
        .update({ status: 'cancelled' })
        .eq('kirvano_order_id', orderId)
    }
    console.log(`[kirvano] acesso cancelado — order=${orderId} sub=${subId}`)
    return new Response('OK', { status: 200 })
  }

  if (eventRow?.id) await supabase.from('kirvano_events').update({ status: 'ignored' }).eq('id', eventRow.id)
  return new Response('OK', { status: 200 })
})
