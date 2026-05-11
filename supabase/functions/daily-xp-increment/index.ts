import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Score thresholds for rank + daily delta ranges (simulates trading activity)
const RANKS = [
  { name: 'Prata I',    scoreMin: 0,      dailyMin: 10,  dailyMax: 80   },
  { name: 'Prata II',   scoreMin: 500,    dailyMin: 20,  dailyMax: 100  },
  { name: 'Prata III',  scoreMin: 1200,   dailyMin: 30,  dailyMax: 130  },
  { name: 'Ouro I',     scoreMin: 2500,   dailyMin: 50,  dailyMax: 200  },
  { name: 'Ouro II',    scoreMin: 4500,   dailyMin: 80,  dailyMax: 250  },
  { name: 'Ouro III',   scoreMin: 7500,   dailyMin: 100, dailyMax: 350  },
  { name: 'AK I',       scoreMin: 12000,  dailyMin: 150, dailyMax: 450  },
  { name: 'AK II',      scoreMin: 19000,  dailyMin: 200, dailyMax: 500  },
  { name: 'AK Cruzada', scoreMin: 28000,  dailyMin: 250, dailyMax: 600  },
  { name: 'Xerife',     scoreMin: 40000,  dailyMin: 300, dailyMax: 700  },
  { name: 'Águia I',    scoreMin: 55000,  dailyMin: 350, dailyMax: 800  },
  { name: 'Águia II',   scoreMin: 75000,  dailyMin: 400, dailyMax: 900  },
  { name: 'Supremo',    scoreMin: 100000, dailyMin: 500, dailyMax: 1200 },
  { name: 'Global',     scoreMin: 150000, dailyMin: 600, dailyMax: 1500 },
]

function getRankForScore(score: number) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (score >= RANKS[i].scoreMin) return RANKS[i]
  }
  return RANKS[0]
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const hoje = new Date()
  const isFimDeSemana = hoje.getDay() === 0 || hoje.getDay() === 6
  const chanceAtivo = isFimDeSemana ? 0.45 : 0.70
  const seasonId = hoje.toISOString().slice(0, 7)  // 'YYYY-MM'
  const today   = hoje.toISOString().split('T')[0] // 'YYYY-MM-DD'

  // Fetch score (not total_xp) — streak/last_login NOT touched here
  const { data: traders, error } = await supabase
    .from('user_xp')
    .select('user_id, score, season_id, season_xp')

  if (error) {
    return new Response(JSON.stringify({ error }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const updates = []
  let atualizados = 0

  // post-update scores for ALL traders (active + inactive) — needed for rank positions
  const postScores: { user_id: string; score: number }[] = []

  for (const trader of traders) {
    const currentScore = trader.score ?? 0

    if (Math.random() > chanceAtivo) {
      // Not active today — score unchanged
      postScores.push({ user_id: trader.user_id, score: currentScore })
      continue
    }

    const rankInfo = getRankForScore(currentScore)
    const delta = rand(rankInfo.dailyMin, rankInfo.dailyMax)
    const novoScore = currentScore + delta
    const novoRank = getRankForScore(novoScore)

    // season_xp: reset if new season, otherwise accumulate
    const isSameSeason = trader.season_id === seasonId
    const novoSeasonXp = isSameSeason ? (trader.season_xp ?? 0) + delta : delta

    updates.push(
      supabase.from('user_xp').update({
        score:        novoScore,
        current_rank: novoRank.name,
        season_xp:    novoSeasonXp,
        season_id:    seasonId,
        // streak_days and last_login_date are NEVER touched here —
        // those track real logins only (handleDailyLogin in frontend)
      }).eq('user_id', trader.user_id)
    )
    atualizados++
    postScores.push({ user_id: trader.user_id, score: novoScore })
  }

  await Promise.all(updates)

  // ── Daily rank snapshot ────────────────────────────────────────────────────
  // Sort post-update scores to determine today's rank positions, then upsert
  // into rank_history. The profile modal uses yesterday's snapshot to display
  // ↑/↓ N posições (rank_change = yesterday_position − today_position).
  postScores.sort((a, b) => b.score - a.score)

  const rankRows = postScores.map((u, i) => ({
    user_id:       u.user_id,
    rank_position: i + 1,
    score:         u.score,
    recorded_date: today,
  }))

  // Upsert in batches of 50 (avoids payload size limits)
  const BATCH = 50
  for (let i = 0; i < rankRows.length; i += BATCH) {
    await supabase
      .from('rank_history')
      .upsert(rankRows.slice(i, i + BATCH), { onConflict: 'user_id,recorded_date' })
  }

  return new Response(
    JSON.stringify({
      sucesso:          true,
      atualizados,
      total:            traders?.length ?? 0,
      rank_snapshots:   rankRows.length,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
