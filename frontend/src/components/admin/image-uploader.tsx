"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { cn } from "@/lib/format";
import { ChevronLeft, ChevronRight, CloseIcon } from "../ui/icons";

export function ImageUploader({ value, onChange }: { value: string[]; onChange: (urls: string[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    setError(null);
    setUploading(true);
    try {
      const { urls } = await adminApi.upload(list);
      onChange([...value, ...urls]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...value];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {value.map((url, i) => (
          <div key={url} className="group relative aspect-square overflow-hidden rounded-xl bg-bg-soft ring-1 ring-line-soft">
            <Image src={url} alt="" fill unoptimized sizes="160px" className="object-contain p-2" />
            {i === 0 && (
              <span className="absolute left-2 top-2 rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold text-white">
                Cover
              </span>
            )}
            <div className="absolute inset-x-2 bottom-2 flex justify-between opacity-0 transition-opacity group-hover:opacity-100">
              <div className="flex gap-1">
                <IconBtn label="Move left" onClick={() => move(i, -1)} disabled={i === 0}>
                  <ChevronLeft size={14} />
                </IconBtn>
                <IconBtn label="Move right" onClick={() => move(i, 1)} disabled={i === value.length - 1}>
                  <ChevronRight size={14} />
                </IconBtn>
              </div>
              <IconBtn label="Remove" onClick={() => onChange(value.filter((u) => u !== url))}>
                <CloseIcon size={14} />
              </IconBtn>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void upload(e.dataTransfer.files);
          }}
          className={cn(
            "flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-[12px] text-muted transition-colors",
            dragging ? "border-accent bg-accent/5" : "border-line hover:border-ink-2 hover:text-ink",
          )}
        >
          {uploading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-r-transparent" />
          ) : (
            <>
              <span className="text-2xl leading-none">+</span>
              Add photos
            </>
          )}
        </button>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        hidden
        onChange={(e) => e.target.files && upload(e.target.files)}
      />
      <p className="text-[12px] text-faint">
        JPG, PNG, WebP or AVIF up to 10 MB. The first photo is the cover. Without photos, a coloured illustration is
        shown.
      </p>
      {error && <p className="text-[12px] text-danger">{error}</p>}
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-ink shadow-sm backdrop-blur hover:bg-white disabled:opacity-30"
    >
      {children}
    </button>
  );
}
