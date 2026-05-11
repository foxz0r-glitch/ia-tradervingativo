import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/integrations/supabase/client'

interface PlanInfo {
  plan_slug: string
  plan_nome: string
  max_estrategias: number
  is_vitalicio: boolean
  is_recorrente: boolean
  status: string
  expires_at: string | null
}

interface UsePlanReturn {
  plan: PlanInfo | null
  maxEstrategias: number
  loading: boolean
}

export function usePlan(): UsePlanReturn {
  const [plan, setPlan] = useState<PlanInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const cancelledRef = useRef(false)

  useEffect(() => {
    cancelledRef.current = false

    const load = async () => {
      try {
        // getSession() reads from localStorage — safer than getUser() which hits the network
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user
        if (!user) {
          if (!cancelledRef.current) setLoading(false)
          return
        }
        const { data } = await supabase.rpc('get_user_plan', { p_user_id: user.id })
        if (!cancelledRef.current) {
          setPlan((data as PlanInfo[] | null)?.[0] ?? null)
          setLoading(false)
        }
      } catch {
        if (!cancelledRef.current) setLoading(false)
      }
    }

    load()

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !cancelledRef.current) {
        setLoading(true)
        load()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelledRef.current = true
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  return {
    plan,
    maxEstrategias: plan?.max_estrategias ?? 3,
    loading,
  }
}
