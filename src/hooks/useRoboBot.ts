import { useEffect, useRef, useCallback } from 'react'

export interface Vela {
  open: number
  close: number
  min: number
  max: number
  from: number
}

export interface RoboConfig {
  percentualBanca: number
  valorMinimo: number
  maxPerdasSeguidas: number
  ativoId: number
  metaGain?: number
  stopLoss?: number
}

interface BotCallbacks {
  onLog: (msg: string, classe: string) => void
  onStatus: (rodando: boolean) => void
  onSaldo: (valor: number, moeda?: string) => void
  onPlacar: (ganhos: number, perdas: number, ops: number) => void
  onVelas: (velas: Vela[], rsi: number, mmRapida: number, mmLenta: number) => void
  onEstatisticas?: (stats: any) => void
  onConnect: () => void
  onDisconnect: () => void
}

export function useRoboBot(callbacks: BotCallbacks) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks
  // Prevents the async 'close' event from scheduling a reconnect after unmount,
  // which would create orphaned WebSocket connections that block onConnect on remount.
  const destroyedRef = useRef(false)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return
    const ws = new WebSocket('wss://bot.tradervingativo.pro')
    wsRef.current = ws

    ws.addEventListener('open', () => {
      callbacksRef.current.onConnect()
    })
    ws.addEventListener('close', (event) => {
      callbacksRef.current.onDisconnect()
      if (destroyedRef.current) return
      if (event.code === 4001) return  // sem conta na corretora — não reconectar
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      reconnectRef.current = setTimeout(connect, 3000)
    })
    ws.addEventListener('error', () =>
      callbacksRef.current.onLog('Erro de conexão com o servidor', 'error')
    )
    // Usando addEventListener em vez de onmessage para não sobrescrever
    // o listener do LiveChart (que também escuta mensagens do mesmo WS)
    ws.addEventListener('message', (e) => {
      try {
        const data = JSON.parse(e.data)
        const cb = callbacksRef.current
        if (data.tipo === 'log') cb.onLog(data.msg, data.classe)
        if (data.tipo === 'status') cb.onStatus(data.rodando)
        if (data.tipo === 'saldo') cb.onSaldo(data.valor, data.moeda)
        if (data.tipo === 'placar') cb.onPlacar(data.ganhos, data.perdas, data.ops)
        if (data.tipo === 'velas') cb.onVelas(data.velas, data.rsi, data.mmRapida, data.mmLenta)
        if (data.tipo === 'estatisticas') cb.onEstatisticas?.(data)
      } catch {}
    })
  }, [])

  const send = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  const iniciar = useCallback((config: RoboConfig, credenciais?: { email: string; password: string; ssid?: string }) => {
    send({ tipo: 'iniciar', config, credenciais })
  }, [send])

  const parar = useCallback(() => {
    send({ tipo: 'parar' })
  }, [send])

  const buscarSaldo = useCallback((credenciais: { email: string; password: string; ssid?: string }) => {
    send({ tipo: 'buscar_saldo', credenciais })
  }, [send])

  const entrarDashboard = useCallback((credenciais: { email: string; password: string; ssid?: string }, config: RoboConfig, token?: string) => {
    send({ tipo: 'entrar_dashboard', credenciais, config, token })
  }, [send])

  useEffect(() => {
    destroyedRef.current = false
    connect()
    return () => {
      destroyedRef.current = true
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  return { iniciar, parar, buscarSaldo, entrarDashboard, wsRef }
}
