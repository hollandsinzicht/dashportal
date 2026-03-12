"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";

interface ThumbnailUploadProps {
  entityId: string;
  entityType: "workspace" | "report";
  tenantId: string;
  currentUrl: string | null;
  onUploaded: (url: string) => void;
  onRemoved: () => void;
}

export function ThumbnailUpload({
  entityId,
  entityType,
  tenantId,
  currentUrl,
  onUploaded,
  onRemoved,
}: ThumbnailUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validatie
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Alleen PNG, JPG of WebP bestanden zijn toegestaan.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Bestand is te groot. Maximaal 5MB.");
      return;
    }

    setUploading(true);

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "png";
      const filePath = `${tenantId}/${entityType}/${entityId}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("thumbnails")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Public URL met cache-busting
      const {
        data: { publicUrl },
      } = supabase.storage.from("thumbnails").getPublicUrl(filePath);

      const url = `${publicUrl}?t=${Date.now()}`;
      onUploaded(url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Upload mislukt"
      );
    } finally {
      setUploading(false);
      // Reset input zodat hetzelfde bestand opnieuw gekozen kan worden
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    try {
      onRemoved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Verwijderen mislukt"
      );
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleUpload}
        className="hidden"
      />

      {currentUrl ? (
        // Preview met verwijder-optie
        <div className="relative group w-fit">
          <img
            src={currentUrl}
            alt="Thumbnail"
            className="w-32 h-20 object-cover rounded-lg border border-border"
          />
          <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="p-1.5 bg-white/20 rounded-md text-white hover:bg-white/30 transition-colors"
              title="Wijzigen"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 bg-white/20 rounded-md text-white hover:bg-danger/80 transition-colors"
              title="Verwijderen"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        // Upload dropzone
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 text-text-secondary transition-all disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ImageIcon className="w-5 h-5" />
          )}
          <div className="text-left">
            <p className="text-sm font-medium">
              {uploading ? "Uploaden..." : "Klik om afbeelding te uploaden"}
            </p>
            <p className="text-xs text-text-secondary/70">
              PNG, JPG of WebP — Max 5MB
            </p>
          </div>
        </button>
      )}

      {error && (
        <p className="text-sm text-danger">{error}</p>
      )}
    </div>
  );
}
