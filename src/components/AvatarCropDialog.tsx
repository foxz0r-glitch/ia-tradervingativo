// Dialog that lets the user zoom and reposition an image before uploading it
// as an avatar. Outputs a square cropped Blob.
import { useCallback, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { ZoomIn, ZoomOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface AvatarCropDialogProps {
  open: boolean;
  imageSrc: string | null;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void | Promise<void>;
  saving?: boolean;
}

// Renders the cropped area to a square JPEG blob.
async function getCroppedBlob(imageSrc: string, area: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });

  const size = Math.min(area.width, area.height);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, size, size);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Falha ao gerar imagem"))),
      "image/jpeg",
      0.92,
    );
  });
}

export function AvatarCropDialog({
  open,
  imageSrc,
  onCancel,
  onConfirm,
  saving = false,
}: AvatarCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!imageSrc || !croppedArea) return;
    const blob = await getCroppedBlob(imageSrc, croppedArea);
    await onConfirm(blob);
  };

  // Reset state whenever the dialog closes
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      onCancel();
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedArea(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="border-border/60 bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajuste sua foto</DialogTitle>
          <DialogDescription>
            Arraste para reposicionar e use o controle abaixo para dar zoom.
          </DialogDescription>
        </DialogHeader>

        <div className="relative mt-2 h-72 w-full overflow-hidden rounded-lg border border-border bg-[hsl(217_33%_8%)]">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              restrictPosition={true}
              objectFit="cover"
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <ZoomOut className="h-4 w-4 text-muted-foreground" />
          <Slider
            min={1}
            max={3}
            step={0.01}
            value={[zoom]}
            onValueChange={(v) => setZoom(v[0])}
            className="flex-1"
          />
          <ZoomIn className="h-4 w-4 text-muted-foreground" />
        </div>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          Arraste a imagem para reposicionar. O limite é a borda da foto.
        </p>

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={saving}
            className="text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={saving || !croppedArea}
            className="bg-primary text-primary-foreground shadow-[0_0_24px_hsl(var(--primary)/0.35)] hover:bg-primary/90"
          >
            {saving ? "Salvando..." : "Salvar foto"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
