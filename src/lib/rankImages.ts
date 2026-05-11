/**
 * Map dos nomes de patente (RANKS) para o SVG correspondente em /public/ranks.
 * Reutilizado em todas as páginas de Ranking.
 */
export const RANK_IMAGES: Record<string, string> = {
  "Prata I": "/ranks/rank-prata-1.svg",
  "Prata II": "/ranks/rank-prata-2.svg",
  "Prata III": "/ranks/rank-prata-3.svg",
  "Ouro I": "/ranks/rank-ouro-1.svg",
  "Ouro II": "/ranks/rank-ouro-2.svg",
  "Ouro III": "/ranks/rank-ouro-3.svg",
  "AK I": "/ranks/rank-ak-1.svg",
  "AK II": "/ranks/rank-ak-2.svg",
  "AK Cruzada": "/ranks/rank-ak-cruzada.svg",
  Xerife: "/ranks/rank-xerife.svg",
  "Águia I": "/ranks/rank-aguia-1.svg",
  "Águia II": "/ranks/rank-aguia-2.svg",
  Supremo: "/ranks/rank-supremo.svg",
  Global: "/ranks/rank-global.svg",
};

export const rankImg = (name: string) =>
  RANK_IMAGES[name] ?? "/ranks/rank-prata-1.svg";
