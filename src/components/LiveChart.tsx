// ============================================================================
//  LiveChart.tsx — lightweight-charts v5
//  - Timezone America/Sao_Paulo (GMT-3)
//  - Sem logo TradingView (attributionLogo: false)
//  - Recebe candles do stream centralizado do backend
//
//  ARQUITETURA — por que refs em vez de state:
//  Qualquer state no caminho de render dispara re-render. Se o useEffect
//  do WS re-executasse, o cleanup zeraria attachedWsRef → o novo handler
//  perderia a referência correta → autoFollowRef seria zerado pelo
//  cleanup do gráfico.
//
//  Solução: ÚNICO useEffect com array vazio [] — monta uma vez.
//  Estado vivo (candles, preço, auto-follow) fica em refs + manipulação
//  direta do chart: zero re-renders. Handler WS criado uma única vez;
//  lerp de preço a 60fps via requestAnimationFrame.
// ============================================================================

import { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
  ColorType,
} from "lightweight-charts";

type WsLike = WebSocket | null;

interface LiveChartProps {
  wsRef: React.MutableRefObject<WsLike>;
  ativoId: number;
  candleSize?: number;
  height?: number;
}

interface CandleMsg {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

function toBRT(utcSeconds: number): UTCTimestamp {
  return (utcSeconds - 3 * 3600) as UTCTimestamp;
}

function applyVisibleRange(
  chart: IChartApi,
  totalCandles: number,
  width: number
) {
  if (totalCandles === 0) return;
  const w = width || 800; // guard: 0/não-medido => trata como desktop (não cai em 50 por engano)
  const visiveis = w < 480 ? 35 : 55; // estreito = 35 candles (mais largos); largo = 55
  chart.timeScale().setVisibleLogicalRange({
    from: totalCandles - visiveis,
    to: totalCandles + 3,
  });
}

export default function LiveChart({
  wsRef,
  ativoId,
  candleSize = 5,
  height = 480,
}: LiveChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Todos os estados internos como refs — ZERO useState para lógica de gráfico
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const candlesRef = useRef<CandleMsg[]>([]);
  const attachedWsRef = useRef<WebSocket | null>(null);
  const lastTimeRef = useRef<number>(0);
  const autoFollowRef = useRef(false);
  // Garante que tick do candle atual não sobrescreve o close já atualizado por quote
  const quoteReceivedRef = useRef(false);

  // Lerp contínuo a 60fps — sem cancel/restart, zero micro-jumps
  const targetCloseRef = useRef<number>(0);
  const displayedCloseRef = useRef<number>(0);
  const targetHighRef = useRef<number>(0);
  const displayedHighRef = useRef<number>(0);
  const targetLowRef = useRef<number>(0);
  const displayedLowRef = useRef<number>(0);
  const priceRafRef = useRef<number | null>(null);

  // ── ÚNICO useEffect com [] — monta uma vez, nunca re-executa ────────
  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Cria o gráfico
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "#0d0d14" },
        textColor: "#555e6b",
        fontSize: 11,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      handleScroll: false,
      handleScale: false,
      kineticScroll: { touch: false, mouse: false },
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
        borderColor: "rgba(255,255,255,0.06)",
        rightOffset: 3,
        lockVisibleTimeRangeOnResize: true,
        rightBarStaysOnScroll: true,
        shiftVisibleRangeOnNewBar: true,
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.06)",
        autoScale: true,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      crosshair: {
        vertLine: { visible: false, labelVisible: false },
        horzLine: { visible: false, labelVisible: false },
      },
      localization: {
        priceFormatter: (price: number) => price.toFixed(5),
        timeFormatter: (timestamp: number) => {
          const d = new Date(timestamp * 1000);
          const hh = String(d.getUTCHours()).padStart(2, "0");
          const mm = String(d.getUTCMinutes()).padStart(2, "0");
          const ss = String(d.getUTCSeconds()).padStart(2, "0");
          return `${hh}:${mm}:${ss}`;
        },
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#26A69A",
      downColor: "#EF5350",
      borderUpColor: "#26A69A",
      borderDownColor: "#EF5350",
      wickUpColor: "#26A69A",
      wickDownColor: "#EF5350",
      borderVisible: false,
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    const ro = new ResizeObserver(() => {
      if (containerRef.current)
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
    });
    ro.observe(containerRef.current);

    // 2. Handler WS — criado UMA vez, nunca recriado
    function handler(ev: MessageEvent) {
      let data: any;
      try {
        data = JSON.parse(ev.data);
      } catch {
        return;
      }

      if (data.tipo === "candles_init") {
        console.log('[LiveChart] candles_init recebido, candles:', data.candles?.length);
        const candles: CandleMsg[] = data.candles ?? [];
        candlesRef.current = candles;
        lastTimeRef.current = 0;
        candleSeriesRef.current?.setData(
          candles.map((c) => ({
            time: toBRT(c.time),
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          }))
        );
        if (candles.length > 0) {
          const last = candles[candles.length - 1];
          displayedCloseRef.current = last.close;
          targetCloseRef.current = last.close;
          displayedHighRef.current = last.high;
          targetHighRef.current = last.high;
          displayedLowRef.current = last.low;
          targetLowRef.current = last.low;
        }
        autoFollowRef.current = true;
        if (chartRef.current) {
          applyVisibleRange(
            chartRef.current,
            candlesRef.current.length,
            containerRef.current?.clientWidth ?? 0
          );
          chartRef.current.timeScale().scrollToRealTime();
        }
        return;
      }

      if (data.tipo === "quote") {
        const price = data.price as number
        const candleFrom = data.candleFrom as number | undefined
        const arr = candlesRef.current
        if (arr.length === 0) return
        const last = arr[arr.length - 1]
        if (candleFrom !== undefined && last.time !== candleFrom) return
        const newHigh = Math.max(last.high, price);
        const newLow = Math.min(last.low, price);
        arr[arr.length - 1] = { ...last, close: price, high: newHigh, low: newLow }
        targetCloseRef.current = price
        targetHighRef.current = newHigh
        targetLowRef.current = newLow
        quoteReceivedRef.current = true  // marca: close é propriedade do quote
        return
      }

      if (data.tipo === "tick") {
        const c = data.candle as CandleMsg;
        if (c.time < lastTimeRef.current) return;
        lastTimeRef.current = c.time;
        const arr = candlesRef.current;
        const last = arr[arr.length - 1];
        if (last && last.time === c.time) {
          // Se quote já atualizou o close, tick não pode sobrescrevê-lo.
          // Tick só expande mechas — evita o "bate e volta" da race condition tick vs. quote.
          if (quoteReceivedRef.current) {
            arr[arr.length - 1] = { ...last, open: c.open, high: Math.max(last.high, c.high), low: Math.min(last.low, c.low) };
          } else {
            arr[arr.length - 1] = { ...c, high: Math.max(last.high, c.high), low: Math.min(last.low, c.low) };
            targetCloseRef.current = c.close;
          }
          targetHighRef.current = Math.max(targetHighRef.current, c.high);
          targetLowRef.current  = Math.min(targetLowRef.current,  c.low);
        } else {
          // Novo candle — reset do flag quote, salta exibição para abertura
          quoteReceivedRef.current = false;
          displayedCloseRef.current = c.open;
          targetCloseRef.current = c.close;
          displayedHighRef.current = c.high;
          targetHighRef.current = c.high;
          displayedLowRef.current = c.low;
          targetLowRef.current = c.low;
          arr.push(c);
          if (arr.length > 500) arr.shift();
        }
        return;
      }

      if (data.tipo === "candle_closed") {
        // Do NOT use lastTimeRef here: a late-arriving candle_closed (after the
        // next candle's tick has already advanced lastTimeRef) must still update
        // the closed candle's final values. Find by timestamp instead.
        const c = data.candle as CandleMsg;
        const arr = candlesRef.current;
        const idx = arr.findIndex((x) => x.time === c.time);
        if (idx < 0) return;
        arr[idx] = c;
        candleSeriesRef.current?.update({
          time: toBRT(c.time),
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        });
        return;
      }
    }

    // 3. Loop contínuo de lerp — única fonte de series.update() para o candle atual
    // Close: lerp suave 0.07
    // Mechas: extensão igual ao corpo (0.07) — wick nunca corre à frente do corpo
    // Retração lentíssima (0.015) — só reconciliação de dados, invisível ao olho
    const LERP_CLOSE        = 0.07;
    const LERP_WICK_EXTEND  = 0.07;
    const LERP_WICK_REVERT  = 0.015;
    function priceLoop() {
      const arr = candlesRef.current;
      if (candleSeriesRef.current && arr.length > 0) {
        const c = arr[arr.length - 1];
        const dClose = targetCloseRef.current - displayedCloseRef.current;
        const dHigh  = targetHighRef.current  - displayedHighRef.current;
        const dLow   = targetLowRef.current   - displayedLowRef.current;
        const moving = Math.abs(dClose) > 0.0000001 || Math.abs(dHigh) > 0.0000001 || Math.abs(dLow) > 0.0000001;
        if (moving) {
          displayedCloseRef.current += dClose * LERP_CLOSE;
          displayedHighRef.current  += dHigh  * (dHigh > 0 ? LERP_WICK_EXTEND : LERP_WICK_REVERT);
          displayedLowRef.current   += dLow   * (dLow  < 0 ? LERP_WICK_EXTEND : LERP_WICK_REVERT);
          candleSeriesRef.current.update({
            time: toBRT(c.time),
            open: c.open,
            high: displayedHighRef.current,
            low:  displayedLowRef.current,
            close: displayedCloseRef.current,
          });
          if (autoFollowRef.current && chartRef.current)
            chartRef.current.timeScale().scrollToRealTime();
        }
      }
      priceRafRef.current = requestAnimationFrame(priceLoop);
    }
    priceRafRef.current = requestAnimationFrame(priceLoop);

    // 4. Polling para reanexar WS em caso de reconexão
    function attachIfNeeded() {
      const ws = wsRef.current;
      if (!ws) return;
      if (attachedWsRef.current === ws) return;
      if (attachedWsRef.current) {
        try {
          attachedWsRef.current.removeEventListener("message", handler);
        } catch {}
      }
      ws.addEventListener("message", handler);
      attachedWsRef.current = ws;
    }

    attachIfNeeded();
    setTimeout(() => {
      attachIfNeeded();
    }, 100);
    const pollInterval = setInterval(attachIfNeeded, 500);

    // 5. Cleanup — só roda na desmontagem real
    return () => {
      clearInterval(pollInterval);
      if (priceRafRef.current) cancelAnimationFrame(priceRafRef.current);
      if (attachedWsRef.current) {
        try {
          attachedWsRef.current.removeEventListener("message", handler);
        } catch {}
        attachedWsRef.current = null;
      }
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      autoFollowRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← VAZIO: monta uma vez, nunca re-executa (independente de props)

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: `${height}px` }}>
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
