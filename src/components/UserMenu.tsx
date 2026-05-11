import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import {
  ChevronDown,
  Camera,
  UserSquare2,
  ShieldCheck,
  PlusCircle,
  ArrowDownToLine,
  Headset,
  History,
  ClipboardList,
  Settings,
  LogOut,
  Copy,
  Check,
  BadgeCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { clearCredsCache } from "@/lib/credsCache";
import { toast } from "sonner";
import { DepositButton } from "@/components/DepositButton";
import { WithdrawButton } from "@/components/WithdrawButton";
import { AvatarCropDialog } from "@/components/AvatarCropDialog";
import { PhotoUploadDialog, PersonalDataDialog } from "@/components/UserProfileDialogs";
import { VerifyAccountDialog } from "@/components/VerifyAccountDialog";
import flagBrasil from "@/assets/flag-brasil.png";
import { rankImg } from "@/lib/rankImages";
import { nextRankOf } from "@/pages/ranking/_profileSections";

const fmt = (n: number) => n.toLocaleString("pt-BR");

const SUPPORT_URL = "https://wa.me/5500000000000";

interface UserMenuProps {
  trigger?: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  alignOffset?: number;
}

export function UserMenu({ trigger, side, align = "end", sideOffset = 12, alignOffset = 0 }: UserMenuProps = {}) {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [registeredAt, setRegisteredAt] = useState<string>("");
  const [brokerId, setBrokerId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [userRank, setUserRank] = useState<string>("Prata I");
  const [totalXp, setTotalXp] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [score, setScore] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const depositRef = useRef<HTMLDivElement>(null);
  const withdrawRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUser = () => {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        const user = session?.user;
        if (!user) return;
        const meta = (user.user_metadata || {}) as Record<string, any>;
        const first =
          meta.first_name ??
          (meta.full_name ? String(meta.full_name).trim().split(/\s+/)[0] : "") ??
          "";
        const last =
          meta.last_name ??
          (meta.full_name
            ? String(meta.full_name).trim().split(/\s+/).slice(-1)[0]
            : "") ??
          "";
        setFirstName(first || "");
        setLastName(first && last && last !== first ? last : "");
        setEmail(user.email ?? "");
        setAvatarUrl(meta.avatar_url ?? undefined);
        setUserId(user.id);
        if (user.created_at) {
          const d = new Date(user.created_at);
          const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
          const dd = String(d.getDate()).padStart(2, "0");
          setRegisteredAt(`${dd} ${months[d.getMonth()]} ${d.getFullYear()}`);
        }
        try {
          const { data: creds } = await supabase
            .from("user_credentials")
            .select("casatrade_user_id")
            .eq("id", user.id)
            .maybeSingle();
          if (creds?.casatrade_user_id != null) {
            setBrokerId(String(creds.casatrade_user_id));
          }
        } catch {
          /* silent */
        }
        try {
          const { data: xp } = await supabase
            .from("user_xp")
            .select("current_rank, total_xp, level, score")
            .eq("user_id", user.id)
            .maybeSingle();
          if (xp?.current_rank) setUserRank(xp.current_rank);
          const tx = xp?.total_xp ?? 0;
          setTotalXp(tx);
          setLevel(xp?.level ?? Math.max(1, Math.floor(Math.sqrt(tx / 50)) + 1));
          setScore(Math.max(0, Math.min(100, Math.round(xp?.score ?? 0))));
        } catch {
          /* silent */
        }
      });
    };
    fetchUser();
    const handler = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.avatarUrl === null) setAvatarUrl(undefined);
      else fetchUser();
    };
    window.addEventListener("avatar-updated", handler);
    return () => window.removeEventListener("avatar-updated", handler);
  }, []);

  const initials = (() => {
    const f = (firstName || "").trim();
    const l = (lastName || "").trim();
    if (!f && !l) return "U";
    if (!l) return f[0]?.toUpperCase() || "U";
    return (f[0] + l[0]).toUpperCase();
  })();

  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Trader";

  const handleSignOut = () => {
    clearCredsCache();
    Object.keys(localStorage)
      .filter((k) => k.startsWith("sb-"))
      .forEach((k) => localStorage.removeItem(k));
    supabase.auth.signOut({ scope: "local" }).catch(() => {});
    window.location.href = "/";
  };

  const handleCopyId = async () => {
    if (!brokerId) return;
    try {
      await navigator.clipboard.writeText(brokerId);
      setCopied(true);
      toast.success("ID copiado!");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const triggerHidden = (ref: React.RefObject<HTMLDivElement>) => {
    const btn = ref.current?.querySelector("button");
    btn?.click();
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !userId) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx. 2MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = async (blob: Blob) => {
    if (!userId) return;
    setUploading(true);
    const path = `${userId}/avatar.jpg`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
    if (upErr) {
      setUploading(false);
      toast.error("Erro ao enviar foto", { description: upErr.message });
      return;
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = `${pub.publicUrl}?t=${Date.now()}`;
    const { error: updErr } = await supabase.auth.updateUser({
      data: { avatar_url: publicUrl },
    });
    setUploading(false);
    setCropSrc(null);
    if (updErr) {
      toast.error("Erro ao atualizar perfil", { description: updErr.message });
      return;
    }
    setAvatarUrl(publicUrl);
    window.dispatchEvent(new Event("avatar-updated"));
    toast.success("Foto atualizada!");
  };

  const menuItems: Array<{
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    onClick?: () => void;
    danger?: boolean;
  }> = [
    { icon: Camera, label: "Enviar uma foto", onClick: () => setPhotoOpen(true) },
    { icon: UserSquare2, label: "Dados pessoais", onClick: () => setDataOpen(true) },
    { icon: ShieldCheck, label: "Verificar Conta", onClick: () => setVerifyOpen(true) },
    { icon: PlusCircle, label: "Depositar fundos", onClick: () => triggerHidden(depositRef) },
    { icon: ArrowDownToLine, label: "Retirar fundos", onClick: () => triggerHidden(withdrawRef) },
    { icon: Headset, label: "Contactar o suporte", onClick: () => window.open(SUPPORT_URL, "_blank") },
    { icon: History, label: "Histórico do saldo" },
    { icon: ClipboardList, label: "Histórico de trading" },
    { icon: Settings, label: "Definições" },
  ];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {trigger ?? (
            <button className="flex h-10 items-center gap-2.5 rounded-full px-2 transition-colors hover:bg-muted/60 data-[state=open]:bg-muted/60">
              <Avatar className="h-10 w-10 ring-1 ring-border/60">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-[hsl(160_84%_30%)] to-[hsl(160_84%_18%)] text-sm font-bold text-[hsl(160_84%_85%)]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden truncate text-sm font-semibold text-foreground sm:inline-block max-w-[180px]">
                {fullName}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side={side}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          className="relative w-[660px] overflow-hidden rounded-2xl border border-[hsl(160_84%_45%/0.25)] p-0 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl"
          style={{
            background: "linear-gradient(180deg, hsl(220 22% 9% / 0.92), hsl(220 25% 6% / 0.94))",
          }}
        >
          {/* Decorative layers */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
          <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 top-24 h-44 w-44 rounded-full bg-[hsl(217_91%_60%/0.12)] blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(160_84%_45%/0.06),transparent_60%)]" />

          {/* Body: 2 columns */}
          <div className="relative grid grid-cols-[1.2fr_1.05fr] gap-0">
            {/* LEFT — Profile info */}
            <div className="flex flex-col gap-3.5 p-5">
              {/* Rank badge + name */}
              <div className="min-w-0">
                <img
                  src={rankImg(userRank)}
                  alt={userRank}
                  className="mb-1.5 h-[35px] w-auto"
                  style={{ filter: "drop-shadow(0 0 6px hsl(0 0% 100% / 0.45)) drop-shadow(0 0 3px hsl(0 0% 100% / 0.3))" }}
                />
                <div className="flex items-center gap-1.5">
                  <h3 className="truncate text-2xl font-bold uppercase tracking-wide text-foreground">
                    {fullName}
                  </h3>
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <BadgeCheck className="h-5 w-5 shrink-0 cursor-help text-primary" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">Conta Verificada</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="truncate text-xs text-muted-foreground">{email}</p>
              </div>

              {/* Nível (XP) */}
              {(() => {
                const levelWidth = Math.max(1, 50 * (2 * level - 1));
                const remainingXp = Math.max(0, level * level * 50 - totalXp);
                const xpInLevel = Math.max(0, levelWidth - remainingXp);
                const pctLevel = Math.min(100, Math.max(0, Math.round((xpInLevel / levelWidth) * 100)));
                return (
                  <div>
                    <div className="mb-1 text-[12px] font-bold uppercase tracking-wider text-foreground/90">
                      Nível (XP) — Lv {level}
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[hsl(220_15%_24%)] ring-1 ring-inset ring-[hsl(220_15%_30%)]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pctLevel}%`,
                          background: "linear-gradient(90deg, hsl(220 90% 60%), hsl(265 85% 65%), hsl(310 80% 65%))",
                          boxShadow: "0 0 8px hsl(265 85% 60% / 0.55)",
                        }}
                      />
                    </div>
                    <div className="mt-1 text-[11px] tabular-nums text-muted-foreground/70">
                      Progresso {pctLevel}% · {fmt(remainingXp)} XP restantes
                    </div>
                  </div>
                );
              })()}

              {/* Patente (Score) */}
              <div>
                <div className="mb-1 text-[12px] font-bold uppercase tracking-wider text-foreground/90">
                  Patente (Score) — {userRank}
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[hsl(220_15%_24%)] ring-1 ring-inset ring-[hsl(220_15%_30%)]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${score}%`,
                      background: "linear-gradient(90deg, hsl(160 84% 55%), #eab308, #f97316, #ef4444)",
                      boxShadow: "0 0 8px hsl(160 84% 55% / 0.55)",
                    }}
                  />
                </div>
                <div className="mt-1 text-[11px] tabular-nums text-muted-foreground/70">
                  Score {score}/100 · próxima: {nextRankOf(userRank)}
                </div>
              </div>

              {/* Brasil */}
              <div className="mt-3 flex items-center gap-2">
                <img src={flagBrasil} alt="Brasil" className="h-4 w-4 rounded-full object-cover" />
                <span className="text-base font-normal leading-none text-foreground">Brasil</span>
              </div>

              {/* Registro + ID na mesma linha */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-foreground/90">
                    Registro:
                  </div>
                  <div className="text-xs font-normal text-foreground/85">
                    {registeredAt || "—"}
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-foreground/90">
                    ID:
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-normal text-foreground/85">{brokerId || "—"}</span>
                    {brokerId && (
                      <button
                        type="button"
                        onClick={handleCopyId}
                        className="rounded p-1 text-muted-foreground hover:bg-primary/15 hover:text-primary"
                        aria-label="Copiar ID"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT — Menu items */}
            <div className="flex flex-col border-l border-border/60 bg-background/30 p-2.5">
              {menuItems.map((it) => (
                <DropdownMenuItem
                  key={it.label}
                  onSelect={(e) => {
                    if (it.onClick) {
                      e.preventDefault();
                      it.onClick();
                    }
                  }}
                  className="group/mi cursor-pointer gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 transition-none focus:bg-primary/10 focus:text-foreground data-[highlighted]:bg-primary/10 data-[highlighted]:text-foreground"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/40 text-muted-foreground group-focus/mi:bg-primary/15 group-focus/mi:text-primary group-data-[highlighted]/mi:bg-primary/15 group-data-[highlighted]/mi:text-primary">
                    <it.icon className="h-4 w-4" />
                  </span>
                  {it.label}
                </DropdownMenuItem>
              ))}

              {/* Divider + Sair (aligned with Definições) */}
              <DropdownMenuSeparator className="my-1.5 bg-border/60" />

              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  handleSignOut();
                }}
                className="group/mi cursor-pointer gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 transition-none focus:bg-primary/10 focus:text-foreground data-[highlighted]:bg-primary/10 data-[highlighted]:text-foreground"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/40 text-muted-foreground group-focus/mi:bg-primary/15 group-focus/mi:text-primary group-data-[highlighted]/mi:bg-primary/15 group-data-[highlighted]/mi:text-primary">
                  <LogOut className="h-4 w-4" />
                </span>
                Sair
              </DropdownMenuItem>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Hidden file input for avatar upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {/* Hidden Deposit/Withdraw triggers — re-use existing dialogs */}
      <div ref={depositRef} className="hidden">
        <DepositButton variant="icon" />
      </div>
      <div ref={withdrawRef} className="hidden">
        <WithdrawButton />
      </div>

      <AvatarCropDialog
        open={!!cropSrc}
        imageSrc={cropSrc}
        onCancel={() => setCropSrc(null)}
        onConfirm={handleCropConfirm}
        saving={uploading}
      />

      <PhotoUploadDialog
        open={photoOpen}
        onOpenChange={setPhotoOpen}
        userId={userId}
        fullName={fullName}
        email={email}
        avatarUrl={avatarUrl}
        registeredAt={registeredAt}
        brokerId={brokerId}
        onAvatarChanged={(url) => setAvatarUrl(url || undefined)}
      />

      <PersonalDataDialog
        open={dataOpen}
        onOpenChange={setDataOpen}
        userId={userId}
        fullName={fullName}
        email={email}
        avatarUrl={avatarUrl}
        registeredAt={registeredAt}
        brokerId={brokerId}
        onAvatarChanged={(url) => setAvatarUrl(url || undefined)}
      />

      <VerifyAccountDialog open={verifyOpen} onOpenChange={setVerifyOpen} email={email} />
    </>
  );
}
