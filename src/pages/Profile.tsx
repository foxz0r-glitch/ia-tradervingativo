// User profile page. Two-column layout: avatar (left) + personal info (right).
// Avatar removal is instant (optimistic UI), with background cleanup.
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Lock, User as UserIcon, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvatarCropDialog } from "@/components/AvatarCropDialog";

const formatBrPhone = (raw: string) => {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

// dd/mm/aaaa mask — year capped at 4 digits (max 8 digits total)
const formatBrDate = (raw: string) => {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
};

// dd/mm/aaaa <-> yyyy-mm-dd helpers (storage uses ISO)
const isoToBr = (iso: string) => {
  if (!iso) return "";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso.includes("/") ? iso : "";
  return `${m[3]}/${m[2]}/${m[1]}`;
};
const brToIso = (br: string) => {
  const m = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return "";
  return `${m[3]}-${m[2]}-${m[1]}`;
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

  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

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
      setBirthDate(isoToBr(meta.birth_date || ""));
      setGender(meta.gender || "");
      const wpp = (meta.whatsapp || "").replace(/^\+55/, "");
      setWhatsapp(formatBrPhone(wpp));
    })();
    return () => {
      mounted = false;
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

  const handleRemoveAvatar = async () => {
    // 1. Update ALL local state immediately BEFORE any async call
    setAvatarUrl(null);
    setCropSrc(null);

    // 2. Dispatch event immediately so UserMenu also updates
    window.dispatchEvent(
      new CustomEvent("avatar-updated", { detail: { avatarUrl: null } })
    );
    toast.success("Foto removida");

    // 3. Background cleanup
    try {
      if (!userId) return;
      await supabase.storage
        .from("avatars")
        .remove([
          `${userId}/avatar.jpg`,
          `${userId}/avatar.jpeg`,
          `${userId}/avatar.png`,
          `${userId}/avatar.webp`,
        ]);
      await supabase.auth.updateUser({ data: { avatar_url: null } });
    } catch (e) {
      console.error("Erro ao remover avatar:", e);
    }
  };

  const handleSave = async () => {
    if (birthDate && !brToIso(birthDate)) {
      toast.error("Data de nascimento inválida", { description: "Use o formato dd/mm/aaaa" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: {
        birth_date: birthDate ? brToIso(birthDate) : "",
        gender,
        whatsapp: whatsapp ? `+55${whatsapp.replace(/\D/g, "")}` : "",
      },
    });
    setSaving(false);

    if (error) {
      toast.error("Erro ao salvar", { description: error.message });
      return;
    }
    toast.success("Alterações salvas!");
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      {/* Back button — normal: dark bg + border; hover: green bg */}
      <button
        onClick={() => navigate("/dashboard")}
        className="group mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao Dashboard
      </button>

      {/* Page title — match dashboard "Bem-vindo" heading */}
      <h1 className="mb-8 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        Meu Perfil
      </h1>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="info">Informações Pessoais</TabsTrigger>
          <TabsTrigger value="plan">Plano &amp; Uso</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-0">
          {/* Two-column layout */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
            {/* Left: Avatar card */}
            <div className="ct-card p-8">
              <div className="flex flex-col items-center">
                <div
                  className="flex h-[120px] w-[120px] items-center justify-center overflow-hidden rounded-full bg-[hsl(217_33%_12%)]"
                  style={
                    avatarUrl
                      ? { border: "1px solid hsl(139, 80%, 45%)" }
                      : undefined
                  }
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={firstName || "Avatar"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-14 w-14 text-muted-foreground" />
                  )}
                </div>

                <h2 className="mt-4 text-center text-xl font-semibold text-foreground">
                  {firstName} {lastName}
                </h2>
                <p className="text-center text-sm text-muted-foreground break-all">
                  {email}
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <Button
                    type="button"
                    onClick={handleAvatarClick}
                    disabled={uploading}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4" />
                        Alterar Avatar
                      </>
                    )}
                  </Button>

                  {avatarUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRemoveAvatar}
                      className="border-border bg-transparent text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remover
                    </Button>
                  )}
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  JPG, PNG ou GIF (máx. 2MB)
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {/* Right: Personal info */}
            <div className="space-y-6">
              {/* Read-only personal info */}
              <div className="ct-card p-6">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Dados pessoais
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <ReadOnlyField label="Nome" value={firstName} />
                  <ReadOnlyField label="Sobrenome" value={lastName} />
                  <div className="md:col-span-2">
                    <ReadOnlyField label="E-mail" value={email} />
                  </div>
                </div>
              </div>

              {/* Editable fields */}
              <div className="ct-card p-6">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Informações adicionais
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="ct-label mb-1.5 block">Data de nascimento</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="dd/mm/aaaa"
                      value={birthDate}
                      maxLength={10}
                      onChange={(e) => setBirthDate(formatBrDate(e.target.value))}
                      className="ct-input"
                    />
                  </div>

                  <div>
                    <label className="ct-label mb-1.5 block">Gênero</label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger className="ct-input h-auto">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="feminino">Feminino</SelectItem>
                        <SelectItem value="outro">Prefiro não informar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="ct-label mb-1.5 block">WhatsApp</label>
                    <div className="flex gap-2">
                      <input
                        value="+55"
                        disabled
                        className="ct-input w-16 cursor-not-allowed text-center opacity-60"
                      />
                      <input
                        type="tel"
                        inputMode="numeric"
                        placeholder="(11) 99999-9999"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(formatBrPhone(e.target.value))}
                        className="ct-input flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-primary text-primary-foreground shadow-[0_0_24px_hsl(var(--primary)/0.35)] hover:bg-primary/90"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar alterações"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="plan" className="mt-0">
          <div className="ct-card p-12 text-center">
            <h3 className="text-2xl font-bold text-foreground">Em breve</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Detalhes do seu plano e uso aparecerão aqui.
            </p>
          </div>
        </TabsContent>
      </Tabs>

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

const ReadOnlyField = ({ label, value }: { label: string; value: string }) => (
  <div>
    <label className="ct-label mb-1.5 block">{label}</label>
    <div className="relative">
      <input
        value={value}
        disabled
        className="ct-input cursor-not-allowed pr-9 opacity-70"
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
          </span>
        </TooltipTrigger>
        <TooltipContent>Não é possível alterar</TooltipContent>
      </Tooltip>
    </div>
  </div>
);

export default Profile;
