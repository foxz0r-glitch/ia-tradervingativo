export interface Vela {
  open: number
  close: number
  min: number
  max: number
  from: number
}

export function desenharGrafico(canvas: HTMLCanvasElement, velas: Vela[]) {
  const ctx = canvas.getContext('2d')
  if (!ctx || !velas.length) return

  const W = canvas.offsetWidth
  canvas.width = W
  canvas.height = 220

  const precos = velas.flatMap(v => [v.open, v.close, v.min, v.max])
  const minP = Math.min(...precos)
  const maxP = Math.max(...precos)
  const range = maxP - minP || 0.0001

  const pad = { top: 12, bottom: 20, left: 8, right: 72 }
  const chartW = W - pad.left - pad.right
  const chartH = canvas.height - pad.top - pad.bottom
  const cw = Math.floor(chartW / velas.length)
  const candleW = Math.max(3, cw - 3)

  function toY(p: number) { return pad.top + chartH - ((p - minP) / range) * chartH }
  function toX(i: number) { return pad.left + i * cw + (cw - candleW) / 2 }

  ctx.fillStyle = 'hsl(220, 25%, 4%)'
  ctx.fillRect(0, 0, W, canvas.height)

  ctx.strokeStyle = 'rgba(30,45,61,0.5)'
  ctx.lineWidth = 1
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (chartH / 4) * i
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
  }

  // MM lenta (10)
  ctx.beginPath(); ctx.strokeStyle = 'hsl(48, 100%, 62%)'; ctx.lineWidth = 1.5
  for (let i = 9; i < velas.length; i++) {
    const avg = velas.slice(i - 9, i + 1).reduce((a, v) => a + v.close, 0) / 10
    const x = toX(i) + candleW / 2; const y = toY(avg)
    i === 9 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.stroke()

  // MM rápida (5)
  ctx.beginPath(); ctx.strokeStyle = 'hsl(187, 100%, 50%)'; ctx.lineWidth = 1.5
  for (let i = 4; i < velas.length; i++) {
    const avg = velas.slice(i - 4, i + 1).reduce((a, v) => a + v.close, 0) / 5
    const x = toX(i) + candleW / 2; const y = toY(avg)
    i === 4 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.stroke()

  // Candles
  velas.forEach((v, i) => {
    const alta = v.close >= v.open
    const cor = alta ? 'hsl(152, 100%, 50%)' : 'hsl(350, 100%, 62%)'
    const x = toX(i)
    ctx.strokeStyle = cor; ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x + candleW / 2, toY(v.max))
    ctx.lineTo(x + candleW / 2, toY(v.min))
    ctx.stroke()
    const bodyTop = Math.min(toY(v.open), toY(v.close))
    const bodyH = Math.max(1, Math.abs(toY(v.close) - toY(v.open)))
    ctx.fillStyle = cor
    ctx.fillRect(x, bodyTop, candleW, bodyH)
  })

  // Linha do último preço + label
  const ultima = velas[velas.length - 1]
  const precoY = toY(ultima.close)
  ctx.strokeStyle = 'rgba(0,229,255,0.5)'; ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  ctx.beginPath(); ctx.moveTo(0, precoY); ctx.lineTo(W, precoY); ctx.stroke()
  ctx.setLineDash([])

  ctx.fillStyle = 'hsl(187, 100%, 50%)'
  ctx.fillRect(W - 68, precoY - 9, 66, 18)
  ctx.fillStyle = 'hsl(220, 25%, 4%)'
  ctx.font = 'bold 11px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(ultima.close.toFixed(5), W - 35, precoY)
}
