import { useState } from "react";
import { Upload, Star, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface Props {
  value: string[];
  mainIndex: number;
  onChange: (urls: string[], mainIndex: number) => void;
  bucket?: string;
  max?: number;
}

/** Adds a "Stay Safe" watermark to an image file via canvas and returns a new File. */
async function watermark(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxW = 1920;
      const scale = img.width > maxW ? maxW / img.width : 1;
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas")); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      // diagonal watermark grid
      const fontSize = Math.max(18, Math.round(canvas.width / 28));
      ctx.font = `600 ${fontSize}px sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.32)";
      ctx.strokeStyle = "rgba(0,0,0,0.22)";
      ctx.lineWidth = 1;
      ctx.textBaseline = "middle";
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 6);
      const text = "Stay Safe";
      const step = fontSize * 6;
      const range = Math.max(canvas.width, canvas.height);
      for (let y = -range; y < range; y += step) {
        for (let x = -range; x < range; x += step * 1.8) {
          ctx.strokeText(text, x, y);
          ctx.fillText(text, x, y);
        }
      }
      ctx.restore();
      // visible corner stamp
      ctx.font = `700 ${fontSize}px sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.strokeStyle = "rgba(0,0,0,0.55)";
      ctx.lineWidth = 2;
      const stamp = "© Stay Safe";
      const pad = fontSize * 0.6;
      ctx.strokeText(stamp, pad, canvas.height - pad);
      ctx.fillText(stamp, pad, canvas.height - pad);

      // Spróbuj WebP (lepsza kompresja). Fallback do JPEG, jeśli przeglądarka nie wspiera.
      canvas.toBlob((blob) => {
        if (blob && blob.type === "image/webp") {
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" }));
          return;
        }
        canvas.toBlob((jpg) => {
          if (!jpg) { reject(new Error("Blob")); return; }
          resolve(new File([jpg], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
        }, "image/jpeg", 0.85);
      }, "image/webp", 0.82);
    };
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = URL.createObjectURL(file);
  });
}

export function MultiImageUpload({ value, mainIndex, onChange, bucket = "property-images", max = 10 }: Props) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (!user || !e.target.files) return;
    const files = Array.from(e.target.files).slice(0, max - value.length);
    if (files.length === 0) return;
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const f of files) {
        const wm = await watermark(f);
        const path = `${user.id}/${crypto.randomUUID()}.jpg`;
        const { error } = await supabase.storage.from(bucket).upload(path, wm, {
          upsert: false, contentType: "image/jpeg",
        });
        if (error) throw error;
        urls.push(supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl);
      }
      onChange([...value, ...urls], mainIndex);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload nieudany");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  function remove(i: number) {
    const next = value.filter((_, idx) => idx !== i);
    let nextMain = mainIndex;
    if (i === mainIndex) nextMain = 0;
    else if (i < mainIndex) nextMain = mainIndex - 1;
    onChange(next, nextMain);
  }

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {value.map((url, i) => (
            <div key={url} className={`group relative overflow-hidden rounded-xl border-2 ${i === mainIndex ? "border-primary" : "border-transparent"}`}>
              <img src={url} alt="" className="h-32 w-full object-cover" />
              <button type="button" onClick={() => remove(i)}
                className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100">
                <X className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => onChange(value, i)}
                className={`absolute left-1 top-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${
                  i === mainIndex ? "bg-primary text-primary-foreground" : "bg-black/60 text-white"
                }`}>
                <Star className="h-3 w-3" /> {i === mainIndex ? "Główne" : "Ustaw główne"}
              </button>
            </div>
          ))}
        </div>
      )}
      {value.length < max && (
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed bg-muted/40 p-6 transition hover:bg-muted">
          <Upload className="h-6 w-6 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {busy ? "Wgrywam…" : `Dodaj zdjęcia (zostanie nałożony znak wodny Stay Safe) — ${value.length}/${max}`}
          </span>
          <input type="file" accept="image/*" multiple onChange={onFiles} className="hidden" disabled={busy} />
        </label>
      )}
    </div>
  );
}
