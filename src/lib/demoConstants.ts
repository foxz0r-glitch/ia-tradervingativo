// Constantes da SIMULAÇÃO DEMO (fake — não opera CasaTrade, não toca o robô).
// Os 4 pares que a IA "analisa" no radar da demo E entre os quais escolhe o ativo da sessão.
// FONTE ÚNICA — usada pelos chips do radar (DemoFlowOverlay) e pelo sorteio do ativo (useDemoMode),
// p/ os dois nunca dessincronizarem (símbolo da lista de ops sempre = um dos pares do radar, nome limpo).
export const RADAR_PAIRS = ["EUR/USD", "GBP/USD", "AUD/USD", "USD/JPY"] as const;
