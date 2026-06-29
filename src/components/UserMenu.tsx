import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { clearCredsCache } from "@/lib/credsCache";
import { toast } from "sonner";
import { DepositButton } from "@/components/DepositButton";
import { WithdrawButton } from "@/components/WithdrawButton";
import { AvatarCropDialog } from "@/components/AvatarCropDialog";
import { PhotoUploadDialog } from "@/components/UserProfileDialogs";
import { SUPPORT_WHATSAPP_URL } from "@/lib/support";
import { usePlan } from "@/hooks/usePlan";

interface UserMenuProps {
  trigger?: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  alignOffset?: number;
}

// Estilo de item — copiado do RENDER do Perfil.dc.html (desktop: gap13/pad12/radius10).
const MENU_ITEM: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 13, padding: 12,
  borderRadius: 10, cursor: "pointer", color: "#cfd6dd",
};
const MENU_LABEL: React.CSSProperties = { font: "600 13px 'Sora'" };
const ITEM_CLASS = "transition-colors !bg-transparent focus:!bg-[rgba(34,197,94,0.08)] data-[highlighted]:!bg-[rgba(34,197,94,0.08)]";

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

  const { plan } = usePlan();
  const userPlan = plan?.plan_nome ?? "Free";

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

  // 6 itens do RENDER do Perfil.dc.html (a frase em prosa lista 5 e está desatualizada — segue a tela).
  // SVG paths byte-exatos do arquivo; stroke #34d77a (Sair herda #f0726a via currentColor).
  const items: Array<{ key: string; label: string; onClick: () => void; right?: string; svg: React.ReactNode }> = [
    {
      key: "perfil", label: "Perfil", onClick: () => navigate("/perfil"),
      svg: (<><circle cx="12" cy="8.5" r="3.5" /><path d="M5 19c0-3.3 3-5.5 7-5.5s7 2.2 7 5.5" /></>),
    },
    {
      key: "foto", label: "Enviar foto", onClick: () => setPhotoOpen(true),
      svg: (<><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h1.5l1-1.5h6l1 1.5h1.5A1.5 1.5 0 0 1 19 8.5v8A1.5 1.5 0 0 1 17.5 18h-11A1.5 1.5 0 0 1 5 16.5z" /><circle cx="12" cy="12" r="3" /></>),
    },
    {
      key: "saque", label: "Retirar fundos", onClick: () => triggerHidden(withdrawRef),
      svg: (<><path d="M12 4v11" /><path d="M8 11l4 4 4-4" /><path d="M5 20h14" /></>),
    },
    {
      key: "id", label: "Copiar ID", onClick: handleCopyId, right: brokerId || undefined,
      svg: (<><rect x="9" y="9" width="11" height="11" rx="2.5" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></>),
    },
    {
      key: "suporte", label: "Contatar suporte", onClick: () => window.open(SUPPORT_WHATSAPP_URL, "_blank"),
      svg: (<><path d="M5 13v-1a7 7 0 0 1 14 0v1" /><rect x="3" y="13" width="4" height="6" rx="1.6" /><rect x="17" y="13" width="4" height="6" rx="1.6" /><path d="M19 19a3 3 0 0 1-3 3h-2" /></>),
    },
  ];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {trigger ?? (
            <button type="button" aria-label="Menu do usuário" style={{ display: "flex", alignItems: "center", gap: 5, padding: 0, border: "none", background: "transparent", cursor: "pointer" }}>
              <span
                style={{
                  width: 38, height: 38, borderRadius: "50%",
                  background: "linear-gradient(160deg,#22c55e,#15924a)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  font: "700 13px 'Sora'", color: "#04140a", overflow: "hidden",
                  boxShadow: "0 0 16px -6px rgba(34,197,94,.7)",
                }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={fullName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  initials
                )}
              </span>
              <span style={{ color: "#86a596", font: "600 11px 'Sora'" }}>▾</span>
            </button>
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side={side}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          className="min-w-0 overflow-hidden border-0 bg-transparent p-0 shadow-none"
          style={{
            width: 272,
            borderRadius: 16,
            padding: 8,
            background: "radial-gradient(120% 90% at 50% 0%, #102a1b 0%, #08120c 70%)",
            border: "1px solid rgba(34,197,94,.3)",
            boxShadow: "0 24px 60px -18px rgba(0,0,0,.75), 0 0 40px -14px rgba(34,197,94,.5)",
          }}
        >
          {/* Header: avatar 42px + nome + plano (RENDER L98) */}
          <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 12px 14px", borderBottom: "1px solid rgba(34,197,94,.12)", marginBottom: 6 }}>
            <span
              style={{
                width: 42, height: 42, borderRadius: "50%",
                background: "linear-gradient(160deg,#22c55e,#15924a)",
                display: "flex", alignItems: "center", justifyContent: "center",
                font: "700 14px 'Sora'", color: "#04140a", overflow: "hidden", flex: "none",
              }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={fullName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                initials
              )}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: "700 14px 'Sora'", color: "#eef5f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fullName}</div>
              <div style={{ font: "500 11px 'Sora'", color: "#5d8a70" }}>Plano {userPlan}</div>
            </div>
          </div>

          {items.map((it) => (
            <DropdownMenuItem
              key={it.key}
              onSelect={(e) => { e.preventDefault(); it.onClick(); }}
              className={ITEM_CLASS}
              style={MENU_ITEM}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d77a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>
                {it.svg}
              </svg>
              <span style={MENU_LABEL}>{it.label}</span>
              {it.right && (
                <span style={{ marginLeft: "auto", font: "500 10px 'JetBrains Mono'", color: "#5d7167" }}>{it.right}</span>
              )}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator style={{ height: 1, background: "rgba(34,197,94,.12)", margin: "6px 8px" }} />

          <DropdownMenuItem
            onSelect={(e) => { e.preventDefault(); handleSignOut(); }}
            className={ITEM_CLASS}
            style={{ ...MENU_ITEM, color: "#f0726a" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>
              <path d="M15 17l5-5-5-5" />
              <path d="M20 12H9" />
              <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
            </svg>
            <span style={MENU_LABEL}>Sair</span>
          </DropdownMenuItem>
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
    </>
  );
}
