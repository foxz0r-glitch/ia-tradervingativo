import { useEffect } from "react";

interface RankUpToastProps {
  newRank: string;
  rankImage: string;
  onClose: () => void;
}

export function RankUpToast({ newRank, rankImage, onClose }: RankUpToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center gap-4 rounded-2xl border border-primary/40 bg-gradient-to-b from-card via-card to-primary/10 px-8 py-8 shadow-[0_0_60px_-10px_hsl(139_80%_45%/0.6)] animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
          ★ Rank Up ★
        </div>

        <img
          src={rankImage}
          alt={newRank}
          className="h-32 w-32 object-contain drop-shadow-[0_0_24px_hsl(139_80%_45%/0.65)]"
        />

        <div className="text-center">
          <p className="text-2xl font-extrabold text-foreground">{newRank}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Você avançou para um novo rank!
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-2 rounded-lg border border-primary/40 bg-primary/15 px-6 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/25"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
