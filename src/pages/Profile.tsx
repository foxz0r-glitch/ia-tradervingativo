// User profile page — ported 1:1 from the ClaudeDesign handoff (Perfil.dc.html).
// Two cards: profile (avatar + verified + Nível/Rank bars + Registro/ID) on the
// left, "Dados da conta" on the right. Only the phone (WhatsApp) is editable;
// Nome/E-mail/País are read-only. Card data is REAL (useUserXP, casatrade_user_id,
// created_at, email confirmation). Inline styles mirror the design tokens (same
// approach as UserMenu.tsx). Avatar change reuses the existing crop/upload flow.
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AvatarCropDialog } from "@/components/AvatarCropDialog";
import { useUserXP } from "@/hooks/useGamification";

const formatBrPhone = (raw: string) => {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const MONTHS_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// XP thresholds — inverse of the level formula the hook uses (level = floor(sqrt(totalXp/50))+1).
// Lets us show progress WITHIN the current level from the real total_xp.
const xpFloorForLevel = (level: number) => 50 * Math.pow(Math.max(1, level) - 1, 2);

// ── Design tokens reused across fields (Perfil.dc.html) ──
const FIELD_BOX: React.CSSProperties = {
  height: 50,
  borderRadius: 12,
  border: "1px solid rgba(34,197,94,.2)",
  background: "rgba(6,12,8,.5)",
  display: "flex",
  alignItems: "center",
  padding: "0 16px",
  font: "600 14px 'Sora'",
  color: "#eef5f0",
};
const FIELD_LABEL: React.CSSProperties = {
  font: "600 9px 'Sora'",
  letterSpacing: ".14em",
  color: "#5d8a70",
  textTransform: "uppercase",
};
const BAR_LABEL: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  font: "600 9px 'Sora'",
  letterSpacing: ".12em",
  color: "#5d7167",
  textTransform: "uppercase",
  marginBottom: 7,
};
const META_LABEL: React.CSSProperties = {
  font: "600 9px 'Sora'",
  letterSpacing: ".12em",
  color: "#5d7167",
  textTransform: "uppercase",
};

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userId, setUserId] = useState<string>("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [whatsapp, setWhatsapp] = useState("");
  const [registeredAt, setRegisteredAt] = useState("");
  const [brokerId, setBrokerId] = useState("");
  const [verified, setVerified] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [tab, setTab] = useState<"info" | "plan">("info");
  const [phoneFocused, setPhoneFocused] = useState(false);

  const { data: userXP } = useUserXP();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user || !mounted) return;
      const meta = user.user_metadata || {};
      setUserId(user.id);
      setEmail(user.email || "");
      setFirstName(meta.first_name || "");
      setLastName(meta.last_name || "");
      setAvatarUrl(meta.avatar_url || null);
      const wpp = (meta.whatsapp || "").replace(/^\+55/, "");
      setWhatsapp(formatBrPhone(wpp));
      setVerified(!!user.email_confirmed_at);
      if (user.created_at) {
        const d = new Date(user.created_at);
        const dd = String(d.getDate()).padStart(2, "0");
        setRegisteredAt(`${dd} ${MONTHS_PT[d.getMonth()]} ${d.getFullYear()}`);
      }
      // Broker (CasaTrade) ID — same source UserMenu uses for "Copiar ID".
      try {
        const { data: creds } = await supabase
          .from("user_credentials")
          .select("casatrade_user_id")
          .eq("id", user.id)
          .maybeSingle();
        if (mounted && creds?.casatrade_user_id != null) {
          setBrokerId(String(creds.casatrade_user_id));
        }
      } catch {
        /* silent */
      }
    })();
    // Keep the card avatar in sync when it's changed/removed elsewhere (header menu
    // "Enviar foto"). Mirrors the LIVE UserMenu listener (UserMenu.tsx:99-105):
    // detail.avatarUrl === null -> cleared; otherwise re-read avatar_url from session.
    const onAvatarUpdated = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.avatarUrl === null) {
        setAvatarUrl(null);
        return;
      }
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (mounted) setAvatarUrl(session?.user?.user_metadata?.avatar_url ?? null);
      });
    };
    window.addEventListener("avatar-updated", onAvatarUpdated);
    return () => {
      mounted = false;
      window.removeEventListener("avatar-updated", onAvatarUpdated);
    };
  }, [location.pathname]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, blob, { upsert: true, contentType: "image/jpeg" });

    if (uploadError) {
      setUploading(false);
      toast.error("Erro ao enviar foto", { description: uploadError.message });
      return;
    }

    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = `${pub.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase.auth.updateUser({
      data: { avatar_url: publicUrl },
    });

    setUploading(false);
    setCropSrc(null);

    if (updateError) {
      toast.error("Erro ao atualizar perfil", { description: updateError.message });
      return;
    }

    setAvatarUrl(publicUrl);
    window.dispatchEvent(new Event("avatar-updated"));
    toast.success("Foto atualizada!");
  };

  const handleSave = async () => {
    if (!userId) return;
    const digits = whatsapp.replace(/\D/g, "");
    // Reject a PARTIAL number so garbage never reaches the CRM / wa.me links (parity
    // with the canonical savePhone's >=10-digit guard). Empty is allowed on purpose:
    // clearing writes "" so the user drops off the CRM export lists.
    if (digits.length > 0 && digits.length < 10) {
      toast.error("Telefone inválido", { description: "Informe DDD + número, ou deixe o campo vazio." });
      return;
    }
    setSaving(true);
    // Same value goes to BOTH stores, mirroring the canonical savePhone
    // (UserProfileDialogs.tsx:257-259) format: `+55` + digits (empty -> "").
    const stored = digits ? `+55${digits}` : "";
    // (1) auth metadata — updateUser MERGES `data` (the avatar handlers above prove
    //     it: they send only { avatar_url } and never wipe name/whatsapp), so ONLY
    //     whatsapp changes; birth_date/gender/first_name/etc. stay intact.
    const { error: metaError } = await supabase.auth.updateUser({
      data: { whatsapp: stored },
    });
    // updateUser FIRST: if the primary (metadata) write fails, stop before touching
    // profiles so the two stores never diverge on a metadata failure.
    if (metaError) {
      setSaving(false);
      toast.error("Erro ao salvar", { description: metaError.message });
      return;
    }
    // (2) profiles table — EXACT mirror of savePhone's upsert (same columns id+whatsapp,
    //     same id, default onConflict=PK, same +55 format) so Admin/CRM (which reads
    //     profiles.whatsapp) sees the change; clearing writes "" so the user drops off
    //     the CRM export lists. Unlike savePhone, we do NOT silence this error (metadata
    //     is kept — not reverted — if this upsert fails; a retry re-syncs it).
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ id: userId, whatsapp: stored });
    setSaving(false);

    if (profileError) {
      toast.error("Erro ao salvar", { description: profileError.message });
      return;
    }
    toast.success("Alterações salvas!");
  };

  const handleCopyId = async () => {
    if (!brokerId) return;
    try {
      await navigator.clipboard.writeText(brokerId);
      toast.success("ID copiado!");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  // Real gamification values (useUserXP). Fallbacks apply only while the hook
  // loads / has no row — a brand-new user is genuinely LV 1 · Prata I · 0%.
  const level = Math.max(1, userXP?.level ?? 1);
  const totalXp = userXP?.totalXp ?? 0;
  const curFloor = xpFloorForLevel(level);
  const nextFloor = xpFloorForLevel(level + 1);
  const levelPct =
    nextFloor > curFloor
      ? Math.max(0, Math.min(100, ((totalXp - curFloor) / (nextFloor - curFloor)) * 100))
      : 0;
  const rankName = userXP?.currentRank?.name ?? "—";
  const rankPct = userXP?.progressPercent ?? 0;

  const pillStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: 11,
    borderRadius: 12,
    textAlign: "center",
    font: "700 12px 'Sora'",
    letterSpacing: ".04em",
    cursor: "pointer",
    border: active ? "1px solid rgba(34,197,94,.5)" : "1px solid rgba(255,255,255,.08)",
    background: active ? "rgba(34,197,94,.14)" : "rgba(255,255,255,.02)",
    color: active ? "#5dffa0" : "#9bb0a5",
  });

  return (
    <div
      className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6"
      style={{ fontFamily: "'Sora', sans-serif" }}
    >
      {/* Page label — mirrors the design's shell header "MEU PERFIL" (the app
          shell only shows the route label on /dashboard, so we render it here). */}
      <div style={{ font: "700 12px 'Sora'", letterSpacing: ".26em", color: "#5d8a70", marginBottom: 14 }}>
        MEU PERFIL
      </div>

      {/* Back to dashboard */}
      <button
        type="button"
        onClick={() => navigate("/dashboard")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: "#7d9488",
          font: "600 11px 'Sora'",
          cursor: "pointer",
          marginBottom: 16,
          background: "none",
          border: "none",
          padding: 0,
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 6l-6 6 6 6" />
        </svg>
        Voltar ao Dashboard
      </button>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, maxWidth: 440 }}>
        <button type="button" onClick={() => setTab("info")} style={pillStyle(tab === "info")}>
          Informações Pessoais
        </button>
        <button type="button" onClick={() => setTab("plan")} style={pillStyle(tab === "plan")}>
          Plano &amp; Uso
        </button>
      </div>

      {tab === "info" ? (
        <div className="grid grid-cols-1 items-start lg:grid-cols-[1fr_1.3fr]" style={{ gap: 20 }}>
          {/* ===================== PROFILE CARD ===================== */}
          <div
            style={{
              borderRadius: 18,
              padding: 24,
              background: "linear-gradient(180deg, rgba(34,197,94,.08), rgba(6,12,8,.3))",
              border: "1px solid rgba(34,197,94,.2)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            {/* Avatar + camera badge (reuses existing photo flow) */}
            <div style={{ position: "relative" }}>
              <div
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: "50%",
                  overflow: "hidden",
                  background: "radial-gradient(120% 120% at 35% 25%, #2ee27a, #0d5f33 70%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName || "Avatar"}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <UserIcon style={{ width: 38, height: 38, color: "rgba(4,20,10,.6)" }} strokeWidth={2} />
                )}
              </div>
              <button
                type="button"
                onClick={handleAvatarClick}
                disabled={uploading}
                aria-label="Alterar foto"
                style={{
                  position: "absolute",
                  right: -2,
                  bottom: -2,
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "#22c55e",
                  border: "3px solid #0a1810",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#04140a",
                  cursor: uploading ? "default" : "pointer",
                  padding: 0,
                }}
              >
                {uploading ? (
                  <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h1.5l1-1.5h6l1 1.5h1.5A1.5 1.5 0 0 1 19 8.5v8A1.5 1.5 0 0 1 17.5 18h-11A1.5 1.5 0 0 1 5 16.5z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            {/* Name + verified seal (real: email confirmed) */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 14 }}>
              <span style={{ font: "700 18px 'Sora'", color: "#eef5f0" }}>{fullName || "—"}</span>
              {verified && (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="#22c55e" stroke="none" aria-label="Conta verificada">
                  <path d="M12 2l2.2 1.6 2.7-.2 1 2.5 2.3 1.5-.6 2.6.9 2.5-2 1.8.1 2.7-2.6.6-1.5 2.3-2.5-.9-2.5.9-1.5-2.3-2.6-.6.1-2.7-2-1.8.9-2.5L3 7.4l2.3-1.5 1-2.5 2.7.2z" />
                  <path d="M9.5 12.5l1.8 1.8 3.5-3.8" stroke="#04140a" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <div style={{ font: "500 12px 'JetBrains Mono'", color: "#7d9488", marginTop: 4, wordBreak: "break-all" }}>
              {email}
            </div>

            {/* Nível (XP) + Rank bars */}
            <div style={{ width: "100%", marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={BAR_LABEL}>
                  <span>Nível (XP) — LV {level}</span>
                  <span>{Math.round(levelPct)}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
                  <div style={{ width: `${levelPct}%`, height: "100%", borderRadius: 3, background: "linear-gradient(90deg,#15924a,#22c55e)" }} />
                </div>
              </div>
              <div>
                <div style={BAR_LABEL}>
                  <span>Rank — {rankName}</span>
                  <span>{Math.round(rankPct)}/100</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
                  <div style={{ width: `${rankPct}%`, height: "100%", borderRadius: 3, background: "linear-gradient(90deg,#3a4250,#9bb0a5)" }} />
                </div>
              </div>
            </div>

            {/* Registro + ID */}
            <div
              style={{
                width: "100%",
                marginTop: 20,
                paddingTop: 18,
                borderTop: "1px solid rgba(34,197,94,.12)",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div style={{ textAlign: "left" }}>
                <div style={META_LABEL}>Registro</div>
                <div style={{ font: "600 13px 'Sora'", color: "#cfd6dd", marginTop: 3 }}>{registeredAt || "—"}</div>
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={META_LABEL}>ID</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                  <span style={{ font: "600 13px 'JetBrains Mono'", color: "#cfd6dd" }}>{brokerId || "—"}</span>
                  {brokerId && (
                    <button
                      type="button"
                      onClick={handleCopyId}
                      aria-label="Copiar ID"
                      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex" }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5d8a70" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="11" height="11" rx="2.5" />
                        <path d="M5 15V5a2 2 0 0 1 2-2h8" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ===================== DADOS DA CONTA CARD ===================== */}
          <div
            style={{
              borderRadius: 18,
              padding: 24,
              background: "linear-gradient(180deg, rgba(14,26,18,.5), rgba(6,12,8,.3))",
              border: "1px solid rgba(34,197,94,.16)",
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <div style={{ font: "600 10px 'Sora'", letterSpacing: ".18em", color: "#5d7167", textTransform: "uppercase" }}>
              Dados da conta
            </div>

            {/* Nome completo (read-only) */}
            <div>
              <div style={{ ...FIELD_LABEL, marginBottom: 8 }}>Nome completo</div>
              <div style={FIELD_BOX}>{fullName || "—"}</div>
            </div>

            {/* E-mail (read-only) */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={FIELD_LABEL}>E-mail</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, font: "700 8px 'Sora'", letterSpacing: ".1em", color: "#7d9488", textTransform: "uppercase" }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="11" width="14" height="9" rx="2" />
                    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                  </svg>
                  Não editável
                </span>
              </div>
              <div
                style={{
                  height: 50,
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,.06)",
                  background: "rgba(6,12,8,.62)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 16px",
                }}
              >
                <span style={{ font: "600 14px 'JetBrains Mono'", color: "#9bb0a5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {email}
                </span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5d7167" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none", marginLeft: 8 }}>
                  <rect x="5" y="11" width="14" height="9" rx="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
              </div>
            </div>

            {/* País (read-only) | Telefone (editable) */}
            <div className="flex flex-col md:flex-row" style={{ gap: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ ...FIELD_LABEL, marginBottom: 8 }}>País</div>
                <div style={{ ...FIELD_BOX, justifyContent: "space-between" }}>
                  <span>Brasil</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ ...FIELD_LABEL, marginBottom: 8 }}>Telefone</div>
                <div
                  style={{
                    height: 50,
                    borderRadius: 12,
                    border: `1px solid ${phoneFocused ? "rgba(34,197,94,.55)" : "rgba(34,197,94,.2)"}`,
                    background: "rgba(6,12,8,.5)",
                    boxShadow: phoneFocused ? "0 0 0 3px rgba(34,197,94,.15)" : "none",
                    transition: "border-color .15s, box-shadow .15s",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "0 16px",
                  }}
                >
                  <span style={{ font: "600 14px 'JetBrains Mono'", color: "#7d9488", flex: "none" }}>+55</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    aria-label="Telefone (WhatsApp)"
                    placeholder="(11) 99999-9999"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(formatBrPhone(e.target.value))}
                    onFocus={() => setPhoneFocused(true)}
                    onBlur={() => setPhoneFocused(false)}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      font: "600 14px 'JetBrains Mono'",
                      color: "#eef5f0",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Salvar (only WhatsApp is persisted) */}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                height: 54,
                marginTop: 6,
                borderRadius: 14,
                border: "none",
                background: "#22c55e",
                color: "#04140a",
                font: "700 14px 'Sora'",
                letterSpacing: ".04em",
                cursor: saving ? "default" : "pointer",
                boxShadow: "0 0 30px -8px rgba(34,197,94,.85)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: saving ? 0.85 : 1,
              }}
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} />
                  Salvando...
                </>
              ) : (
                "Salvar alterações"
              )}
            </button>
          </div>
        </div>
      ) : (
        // Plano & Uso — placeholder content kept unchanged (⛔ não mexer).
        <div className="ct-card p-12 text-center">
          <h3 className="text-2xl font-bold text-foreground">Em breve</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Detalhes do seu plano e uso aparecerão aqui.
          </p>
        </div>
      )}

      {/* Hidden file input for avatar upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <AvatarCropDialog
        open={!!cropSrc}
        imageSrc={cropSrc}
        onCancel={() => setCropSrc(null)}
        onConfirm={handleCropConfirm}
        saving={uploading}
      />
    </div>
  );
};

export default Profile;
