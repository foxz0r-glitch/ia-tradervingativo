import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await req.json()
    const {
      // Campos de saldo real (fluxo normal)
      user_id,
      casatrade_user_id,
      saldo_real,
      tipo_variacao,
      valor_variacao,
      deposito_detectado,
      saque_detectado,
      // Campos de postback (fluxo CasaTrade)
      postback_evento,
      postback_trader_id,
      postback_valor,
      postback_profit,
      postback_instrument,
      postback_email,
      postback_afftrack,
      postback_recebido_em,
    } = body ?? {}

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── Fluxo postback ──────────────────────────────────────────────
    if (postback_evento) {
      const traderId = postback_trader_id ? String(postback_trader_id) : null

      const { error } = await supabase.from('casatrade_data').upsert({
        casatrade_user_id: traderId,
        postback_evento,
        postback_recebido_em: postback_recebido_em ?? new Date().toISOString(),
      }, { onConflict: 'casatrade_user_id', ignoreDuplicates: false })

      if (error) {
        console.error('Erro ao salvar postback:', error)
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      console.log('Postback salvo:', { postback_evento, traderId })
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Fluxo saldo real ────────────────────────────────────────────
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { error } = await supabase.from('casatrade_balance_history').insert({
      user_id,
      casatrade_user_id: casatrade_user_id ? String(casatrade_user_id) : null,
      saldo_real: Number(saldo_real ?? 0),
      valor_variacao: Number(valor_variacao ?? 0),
      tipo_variacao: tipo_variacao ?? 'inicial',
      deposito_detectado: Boolean(deposito_detectado),
      saque_detectado: Boolean(saque_detectado),
    })

    if (error) {
      console.error('Erro ao salvar balance:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Balance salvo:', { user_id, saldo_real, tipo_variacao })
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Erro inesperado:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
