import { useEffect, useState } from 'react'
import { Loader2, Check, X, CheckCircle2, FlaskConical, Crown, TrendingUp, GraduationCap, Gift } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { usePlan } from '@/hooks/usePlan'
import { Button } from '@/components/ui/button'
import { supabase } from '@/integrations/supabase/client'

type UpsellRow = {
  id: string
  nome: string
  descricao: string | null
  tipo: string
  valor: number | null
  preco_label: string | null
  checkout_url: string | null
  is_recorrente: boolean
  ativo: boolean
}

const UPSELL_META: Record<string, { Icon: any; color: string }> = {
  demo_balance: { Icon: FlaskConical, color: 'text-cyan-400' },
  vip:          { Icon: Crown,        color: 'text-amber-400' },
  sinais:       { Icon: TrendingUp,   color: 'text-green-400' },
  mentoria:     { Icon: GraduationCap,color: 'text-purple-400' },
  outro:        { Icon: Gift,         color: 'text-pink-400' },
}

const PLANS = [
  {
    slug: 'free',
    nome: 'Free',
    preco: 'Grátis',
    periodo: '',
    destaque: false,
    badge: null as string | null,
    checkoutUrl: '',
    maxEstrategias: 3,
    features: [
      '3 estratégias ativas',
      'Aulas selecionadas',
      'Modo demo (3 sessões)',
      'Acesso ao ranking',
      'Suporte via comunidade',
    ],
    featuresOff: [
      'Modo real',
      'Todas as aulas',
      'Sinais premium',
      'Suporte prioritário',
    ],
  },
  {
    slug: 'pro',
    nome: 'Pro',
    preco: 'R$ --',
    periodo: '/mês',
    destaque: false,
    badge: null as string | null,
    checkoutUrl: '#',
    maxEstrategias: 10,
    features: [
      '10 estratégias ativas',
      'Aulas intermediárias',
      'Modo real desbloqueado',
      'Acesso ao ranking',
      'Suporte via chat',
    ],
    featuresOff: [
      'Todas as aulas',
      'Sinais premium',
      'Suporte prioritário',
    ],
  },
  {
    slug: 'elite',
    nome: 'Elite',
    preco: 'R$ --',
    periodo: '/mês',
    destaque: true,
    badge: 'Mais Popular' as string | null,
    checkoutUrl: '#',
    maxEstrategias: 20,
    features: [
      '20 estratégias ativas',
      'Todas as aulas + novas',
      'Modo real desbloqueado',
      'Sinais premium',
      'Suporte prioritário',
      'Acesso ao ranking',
    ],
    featuresOff: [],
  },
  {
    slug: 'vitalicio',
    nome: 'Vitalício',
    preco: 'R$ --',
    periodo: ' único',
    destaque: false,
    badge: 'Melhor Valor' as string | null,
    checkoutUrl: '#',
    maxEstrategias: 20,
    features: [
      '20 estratégias ativas',
      'Todas as aulas permanentemente',
      'Modo real desbloqueado',
      'Sinais premium',
      'Suporte prioritário',
      'Pagamento único — sem mensalidade',
    ],
    featuresOff: [],
  },
]

export default function Pricing() {
  const { plan, loading } = usePlan()
  const navigate = useNavigate()
  const [upsells, setUpsells] = useState<UpsellRow[]>([])

  useEffect(() => {
    supabase
      .from('upsells')
      .select('*')
      .eq('ativo', true)
      .order('created_at')
      .then(({ data }) => setUpsells((data ?? []) as UpsellRow[]))
  }, [])

  const currentPlanSlug = plan?.plan_slug ?? 'free'
  const currentPlan = PLANS.find((p) => p.slug === currentPlanSlug)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d0d14]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d0d14] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h1 className="bg-gradient-to-r from-foreground to-primary bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">
            Escolha seu Plano
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Comece grátis e evolua conforme sua necessidade
          </p>
          {currentPlan && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-sm font-semibold text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              Seu plano atual: {currentPlan.nome}
            </div>
          )}
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((p) => {
            const isCurrent = p.slug === currentPlanSlug
            const isFree = p.slug === 'free'
            const noCheckout = !p.checkoutUrl || p.checkoutUrl === '#'
            const isVitalicio = p.slug === 'vitalicio'

            return (
              <div
                key={p.slug}
                className={`relative rounded-2xl bg-[#14141f] p-6 ${
                  p.destaque
                    ? 'border border-primary/60 shadow-[0_0_32px_hsl(var(--primary)/0.25)]'
                    : 'border border-border/50'
                }`}
              >
                {p.badge && (
                  <div
                    className={`absolute left-1/2 top-0 -mt-3 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${
                      p.badge === 'Mais Popular'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-amber-500 text-black'
                    }`}
                  >
                    {p.badge}
                  </div>
                )}

                <h3 className="text-xl font-bold">{p.nome}</h3>

                <div className="mt-4 flex items-baseline gap-1">
                  <span
                    className={`text-4xl font-extrabold ${
                      p.destaque ? 'text-primary' : 'text-foreground'
                    }`}
                  >
                    {p.preco}
                  </span>
                  {p.periodo && (
                    <span className="text-sm text-muted-foreground">{p.periodo}</span>
                  )}
                </div>

                <hr className="my-4 border-border/40" />

                <ul className="space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                      <span>{f}</span>
                    </li>
                  ))}
                  {p.featuresOff.length > 0 &&
                    p.featuresOff.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-sm line-through opacity-50"
                      >
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" />
                        <span>{f}</span>
                      </li>
                    ))}
                </ul>

                {isCurrent ? (
                  <Button disabled variant="outline" className="mt-6 w-full">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Plano atual
                  </Button>
                ) : isFree ? (
                  <Button
                    variant="outline"
                    className="mt-6 w-full"
                    onClick={() => navigate('/dashboard')}
                  >
                    Começar grátis
                  </Button>
                ) : noCheckout ? (
                  <Button disabled className="mt-6 w-full">
                    Em breve
                  </Button>
                ) : (
                  <Button
                    className={`mt-6 w-full ${
                      isVitalicio
                        ? 'bg-amber-500 text-black hover:bg-amber-400'
                        : ''
                    }`}
                    onClick={() => window.open(p.checkoutUrl, '_blank')}
                  >
                    {isVitalicio ? 'Adquirir' : 'Assinar'}
                  </Button>
                )}
              </div>
            )
          })}
        </div>

        {upsells.length > 0 && (
          <section className="mt-16">
            <div className="text-center">
              <h2 className="text-2xl font-bold sm:text-3xl">Adicione ao seu plano</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Recursos extras que podem ser adquiridos independentemente do plano.
              </p>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upsells.map((u) => {
                const meta = UPSELL_META[u.tipo] ?? UPSELL_META.outro
                const Icon = meta.Icon
                const priceLabel = u.preco_label || (u.valor != null ? `R$ ${Number(u.valor).toFixed(2)}` : '—')
                const hasUrl = !!u.checkout_url
                return (
                  <div
                    key={u.id}
                    className="rounded-xl border border-border/50 bg-[#14141f] p-5"
                  >
                    <div className="flex items-start justify-between">
                      <Icon className={`h-8 w-8 ${meta.color}`} />
                      {u.is_recorrente && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Recorrente
                        </span>
                      )}
                    </div>
                    <h3 className="mt-3 text-base font-semibold">{u.nome}</h3>
                    {u.descricao && (
                      <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{u.descricao}</p>
                    )}
                    <div className={`mt-3 text-2xl font-bold ${meta.color}`}>{priceLabel}</div>
                    {hasUrl ? (
                      <Button
                        className="mt-4 w-full"
                        onClick={() => window.open(u.checkout_url!, '_blank')}
                      >
                        Adquirir
                      </Button>
                    ) : (
                      <Button disabled className="mt-4 w-full">Em breve</Button>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        <p className="mt-12 text-center text-xs text-muted-foreground">
          Pagamentos processados com segurança pela Cakto.
          <br />
          Dúvidas? Entre em contato com o suporte.
        </p>
      </div>
    </div>
  )
}
