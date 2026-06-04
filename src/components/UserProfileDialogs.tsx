// Two dialogs used by UserMenu:
//  - PhotoUploadDialog: shown when clicking "Enviar uma foto"
//  - PersonalDataDialog: shown when clicking "Dados pessoais"
import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, Loader2, Pencil, Trash2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AvatarCropDialog } from "@/components/AvatarCropDialog";
import flagBrasil from "@/assets/flag-brasil.png";

const SUPPORT_URL = "https://wa.me/5500000000000";

const MONTHS_PT = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

const formatBirth = (iso: string) => {
  if (!iso) return "";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  return `${parseInt(m[3], 10)} ${MONTHS_PT[parseInt(m[2], 10) - 1]}, ${m[1]}`;
};

const formatBrPhoneFull = (raw: string) => {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const formatBrDateMask = (raw: string) => {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
};
const brToIso = (br: string) => {
  const m = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return "";
  return `${m[3]}-${m[2]}-${m[1]}`;
};

interface CommonProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  userId: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  registeredAt: string;
  brokerId: string;
  onAvatarChanged: (url: string | null) => void;
}

// Shared upload+remove logic hook-ish
function useAvatarOps(props: CommonProps) {
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const onPickFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem");
      return;
    }
    if (!/\/(jpe?g|png)$/i.test(file.type)) {
      toast.error("Use apenas JPG ou PNG");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx. 5MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCrop = async (blob: Blob) => {
    if (!props.userId) return;
    setUploading(true);
    const path = `${props.userId}/avatar.jpg`;
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
    await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
    setUploading(false);
    setCropSrc(null);
    props.onAvatarChanged(publicUrl);
    window.dispatchEvent(new Event("avatar-updated"));
    toast.success("Foto atualizada!");
  };

  const handleRemove = async () => {
    if (!props.userId) return;
    setRemoving(true);
    await supabase.storage.from("avatars").remove([`${props.userId}/avatar.jpg`]);
    await supabase.auth.updateUser({ data: { avatar_url: null } });
    setRemoving(false);
    props.onAvatarChanged(null);
    window.dispatchEvent(new CustomEvent("avatar-updated", { detail: { avatarUrl: null } }));
    toast.success("Foto removida");
  };

  return { cropSrc, setCropSrc, uploading, removing, onPickFile, handleCrop, handleRemove };
}

// ====== Photo Upload Dialog ======
export function PhotoUploadDialog(props: CommonProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const ops = useAvatarOps(props);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    ops.onPickFile(file);
  };

  return (
    <>
      <Dialog open={props.open} onOpenChange={props.onOpenChange}>
        <DialogContent className="max-w-xl overflow-hidden border-border/60 bg-card/95 p-0 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
          <div className="pointer-events-none absolute -left-16 -top-20 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-12 top-10 h-40 w-40 rounded-full bg-[hsl(217_91%_60%/0.12)] blur-3xl" />

          <DialogTitle className="sr-only">Enviar foto</DialogTitle>
          <DialogDescription className="sr-only">Envie uma foto para o seu perfil.</DialogDescription>

          <div className="relative px-6 pb-6 pt-7">
            <h2 className="text-center text-lg font-bold tracking-tight text-foreground">
              Sua foto de perfil
            </h2>

            <div className="mt-5 flex flex-col items-center">
              <PhotoBlock
                avatarUrl={props.avatarUrl}
                fullName={props.fullName}
                onPick={() => fileRef.current?.click()}
                onRemove={ops.handleRemove}
                uploading={ops.uploading}
                removing={ops.removing}
              />
            </div>

            {/* Rules card */}
            <div className="mt-6 rounded-xl border border-border/50 bg-background/40 p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Não é permitido publicar:</p>
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-9 text-xs text-muted-foreground">
                <li>imagens sexualmente explícitas ou pornográficas;</li>
                <li>imagens destinadas a incitar ódio ou hostilidade étnica ou racial;</li>
                <li>fotos de menores de 18 anos;</li>
                <li>fotos protegidas por direitos autorais de terceiros;</li>
                <li>imagens maiores que 5 MB e em um formato diferente de JPG ou PNG.</li>
              </ul>
              <p className="mt-3 text-xs text-foreground/80">
                Seu rosto deve estar claramente visível na foto.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Todas as fotos e vídeos que você enviar devem atender a estes requisitos ou poderão ser removidos.
              </p>
            </div>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={handleFile}
          />
        </DialogContent>
      </Dialog>

      <AvatarCropDialog
        open={!!ops.cropSrc}
        imageSrc={ops.cropSrc}
        onCancel={() => ops.setCropSrc(null)}
        onConfirm={ops.handleCrop}
        saving={ops.uploading}
      />
    </>
  );
}

// ====== Personal Data Dialog ======
export function PersonalDataDialog(props: CommonProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const ops = useAvatarOps(props);

  const [whatsapp, setWhatsapp] = useState("");
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);

  const [birthIso, setBirthIso] = useState("");
  const [editingBirth, setEditingBirth] = useState(false);
  const [birthDraft, setBirthDraft] = useState("");
  const [savingBirth, setSavingBirth] = useState(false);

  useEffect(() => {
    if (!props.open || !props.userId) return;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const meta = (session?.user?.user_metadata || {}) as Record<string, any>;
      const { data: profile } = await supabase
        .from("profiles")
        .select("whatsapp, birth_date")
        .eq("id", props.userId)
        .maybeSingle();
      const wpp = (profile?.whatsapp || meta.whatsapp || "").replace(/^\+55/, "");
      setWhatsapp(wpp);
      const bd = profile?.birth_date || meta.birth_date || "";
      setBirthIso(bd);
      if (!bd) setEditingBirth(true);
    })();
  }, [props.open, props.userId]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    ops.onPickFile(file);
  };

  const startEditPhone = () => {
    setPhoneDraft(formatBrPhoneFull(whatsapp));
    setEditingPhone(true);
  };

  const savePhone = async () => {
    const digits = phoneDraft.replace(/\D/g, "");
    if (digits.length < 10) {
      toast.error("WhatsApp inválido");
      return;
    }
    setSavingPhone(true);
    const fullStored = `+55${digits}`;
    const { error } = await supabase.auth.updateUser({ data: { whatsapp: fullStored } });
    await supabase.from("profiles").upsert({ id: props.userId, whatsapp: fullStored });
    setSavingPhone(false);
    if (error) {
      toast.error("Erro ao salvar", { description: error.message });
      return;
    }
    setWhatsapp(digits);
    setEditingPhone(false);
    toast.success("WhatsApp atualizado!");
  };

  const startEditBirth = () => {
    setBirthDraft(birthIso ? `${birthIso.slice(8, 10)}/${birthIso.slice(5, 7)}/${birthIso.slice(0, 4)}` : "");
    setEditingBirth(true);
  };

  const saveBirth = async () => {
    const iso = brToIso(birthDraft);
    if (!iso) {
      toast.error("Data inválida", { description: "Use dd/mm/aaaa" });
      return;
    }
    setSavingBirth(true);
    const { error } = await supabase.auth.updateUser({ data: { birth_date: iso } });
    await supabase.from("profiles").upsert({ id: props.userId, birth_date: iso });
    setSavingBirth(false);
    if (error) {
      toast.error("Erro ao salvar", { description: error.message });
      return;
    }
    setBirthIso(iso);
    setEditingBirth(false);
    toast.success("Data atualizada!");
  };

  const openSupport = () => window.open(SUPPORT_URL, "_blank");

  return (
    <>
      <Dialog open={props.open} onOpenChange={props.onOpenChange}>
        <DialogContent className="max-h-[92vh] w-[min(96vw,1040px)] max-w-none overflow-hidden border-border/60 bg-card/95 p-0 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
          <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 top-24 h-44 w-44 rounded-full bg-[hsl(217_91%_60%/0.12)] blur-3xl" />

          <DialogTitle className="sr-only">Dados pessoais</DialogTitle>
          <DialogDescription className="sr-only">Visualize e edite seus dados pessoais.</DialogDescription>

          <ProfileHeader registeredAt={props.registeredAt} brokerId={props.brokerId} />

          <div className="relative grid grid-cols-[280px_1fr] gap-0">
            {/* LEFT — Photo */}
            <div className="flex flex-col items-center border-r border-border/60 bg-background/30 px-5 py-6">
              <PhotoBlock
                avatarUrl={props.avatarUrl}
                fullName={props.fullName}
                onPick={() => fileRef.current?.click()}
                onRemove={ops.handleRemove}
                uploading={ops.uploading}
                removing={ops.removing}
                compact
              />
            </div>

            {/* RIGHT — Fields */}
            <div className="space-y-2.5 px-5 py-5">
              {/* Extrato */}
              <Card>
                <p className="text-sm text-foreground">
                  <span className="font-semibold">Extrato da conta:</span>{" "}
                  <span className="font-semibold text-primary">mensal</span>
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Caso queira solicitar seu extrato detalhado, entre em contato pelo{" "}
                  <button
                    type="button"
                    onClick={openSupport}
                    className="font-semibold text-primary hover:underline"
                  >
                    suporte
                  </button>
                  .
                </p>
              </Card>

              {/* WhatsApp */}
              <Card>
                <FieldLabel>Número de WhatsApp</FieldLabel>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {!editingPhone ? (
                    <>
                      <span className="text-sm font-semibold text-foreground">
                        {whatsapp ? `+55 ${formatBrPhoneFull(whatsapp)}` : "—"}
                      </span>
                      {whatsapp && <CheckCircle2 className="h-4 w-4 text-primary" />}
                      <button
                        type="button"
                        onClick={startEditPhone}
                        className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background/40 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:border-primary/50 hover:bg-primary/10"
                      >
                        <Pencil className="h-3 w-3" />
                        Alterar
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-1 items-center gap-2">
                      <span className="text-sm text-muted-foreground">+55</span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        placeholder="(11) 99999-9999"
                        value={phoneDraft}
                        onChange={(e) => setPhoneDraft(formatBrPhoneFull(e.target.value))}
                        className="ct-input flex-1"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={savePhone}
                        disabled={savingPhone}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {savingPhone ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingPhone(false)}
                        className="text-muted-foreground"
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              </Card>

              {/* Email */}
              <Card>
                <FieldLabel>Endereço de e-mail</FieldLabel>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{props.email}</span>
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Caso queira alterar seu endereço eletrônico, entre em contato pelo{" "}
                  <button
                    type="button"
                    onClick={openSupport}
                    className="font-semibold text-primary hover:underline"
                  >
                    suporte
                  </button>
                  .
                </p>
              </Card>

              {/* Meus dados */}
              <Card>
                <h4 className="mb-3 text-sm font-semibold text-foreground">Meus dados</h4>

                <div className="space-y-3">
                  <div>
                    <FieldLabel>Data de nascimento</FieldLabel>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      {!editingBirth ? (
                        <>
                          <span className="text-sm font-semibold text-foreground">
                            {birthIso ? formatBirth(birthIso) : "—"}
                          </span>
                          <button
                            type="button"
                            onClick={startEditBirth}
                            className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background/40 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:border-primary/50 hover:bg-primary/10"
                          >
                            <Pencil className="h-3 w-3" />
                            {birthIso ? "Alterar" : "Adicionar"}
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-1 items-center gap-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="dd/mm/aaaa"
                            value={birthDraft}
                            maxLength={10}
                            onChange={(e) => setBirthDraft(formatBrDateMask(e.target.value))}
                            className="ct-input max-w-[180px]"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={saveBirth}
                            disabled={savingBirth}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            {savingBirth ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                          </Button>
                          {birthIso && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingBirth(false)}
                              className="text-muted-foreground"
                            >
                              Cancelar
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <FieldLabel>País</FieldLabel>
                      <div className="mt-1.5 flex items-center gap-2">
                        <img src={flagBrasil} alt="Brasil" className="h-4 w-4 rounded-full object-cover" />
                        <span className="text-sm font-semibold text-foreground">Brasil</span>
                      </div>
                    </div>
                    <div>
                      <FieldLabel>Fuso horário</FieldLabel>
                      <div className="mt-1.5 text-sm font-semibold text-foreground">
                        America/Sao_Paulo
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={handleFile}
          />
        </DialogContent>
      </Dialog>

      <AvatarCropDialog
        open={!!ops.cropSrc}
        imageSrc={ops.cropSrc}
        onCancel={() => ops.setCropSrc(null)}
        onConfirm={ops.handleCrop}
        saving={ops.uploading}
      />
    </>
  );
}

// ====== Shared sub-components ======
function ProfileHeader({ registeredAt, brokerId }: { registeredAt: string; brokerId: string }) {
  return (
    <div className="relative flex items-center gap-6 border-b border-border/60 bg-background/40 px-6 py-3 text-xs">
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">ID:</span>
        <span className="font-semibold text-foreground/90">{brokerId || "—"}</span>
      </div>
      <div className="h-3 w-px bg-border/60" />
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">Registro:</span>
        <span className="font-semibold text-foreground/90">{registeredAt || "—"}</span>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative rounded-xl border border-border/50 bg-background/40 px-4 py-3 transition-colors hover:border-border">
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

function PhotoBlock({
  avatarUrl,
  fullName,
  onPick,
  onRemove,
  uploading,
  removing,
  compact,
}: {
  avatarUrl?: string;
  fullName: string;
  onPick: () => void;
  onRemove: () => void;
  uploading: boolean;
  removing: boolean;
  compact?: boolean;
}) {
  const initials = (() => {
    const parts = fullName.trim().split(/\s+/);
    if (!parts[0]) return "U";
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  })();

  const size = compact ? 108 : 124;

  return (
    <>
      <div className="relative">
        <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-primary/30 via-primary/10 to-[hsl(217_91%_60%/0.2)] blur-xl" />
        <div
          className="relative flex items-center justify-center overflow-hidden rounded-full bg-[hsl(217_33%_12%)] ring-2 ring-primary/40"
          style={{ height: size, width: size }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={fullName} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[hsl(139_80%_30%)] to-[hsl(139_80%_18%)] text-2xl font-bold text-[hsl(139_80%_85%)]">
              {initials}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onPick}
          disabled={uploading || removing}
          className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-[0_0_16px_hsl(var(--primary)/0.5)] transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Alterar foto"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        </button>
      </div>

      <h3 className={`mt-4 ${compact ? "text-base" : "text-xl"} font-bold tracking-tight text-foreground text-center`}>
        {fullName}
      </h3>

      <button
        type="button"
        onClick={onPick}
        disabled={uploading || removing}
        className="mt-3 inline-flex items-center justify-center gap-2 rounded-full border border-dashed border-primary/50 bg-primary/5 px-5 py-2 text-sm font-semibold text-primary transition-all hover:border-primary hover:bg-primary/10 hover:shadow-[0_0_24px_hsl(var(--primary)/0.25)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        {uploading ? "Enviando..." : "Enviar uma foto"}
      </button>

      {avatarUrl && (
        <button
          type="button"
          onClick={onRemove}
          disabled={uploading || removing}
          className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-full border border-border/60 bg-background/40 px-4 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-60"
        >
          {removing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          {removing ? "Removendo..." : "Remover foto"}
        </button>
      )}

      <p className="mt-3 max-w-sm text-center text-xs text-muted-foreground">
        Sua foto será exibida em diversas seções do site.
      </p>
    </>
  );
}
