// Fonte ÚNICA dos limites dos controles do cockpit.
// Usado em DOIS lugares (não dessincronizar):
//   1) CockpitVariants/Sliders3 — limites dos sliders (UI)
//   2) Index/handleStart — clamp defensivo antes de montar o payload do robô (money-safety)
// Fórmula extraída de Sliders3 (era inline): floor = floor(saldo) se saldo>0; senão fallbacks 500/2500.

export interface CockpitLimits {
  maxEntrada: number;
  maxStopLoss: number;
  maxMeta: number;
}

export function cockpitLimits(saldo: number | null): CockpitLimits {
  const floor = saldo != null && saldo > 0 ? Math.floor(saldo) : null;
  return {
    maxEntrada:  floor != null ? Math.max(2, floor)      : 500,
    maxStopLoss: floor != null ? Math.max(2, floor)      : 500,
    maxMeta:     floor != null ? Math.max(10, floor * 5) : 2500,
  };
}

export const clampRange = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, v));
