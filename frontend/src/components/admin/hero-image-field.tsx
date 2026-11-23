"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { Button } from "./ui";

const DEFAULT_HERO = "/hero.jpg";

/** Upload / replace / reset the home page banner. Saved with the rest of the settings form. */
export function HeroImageField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    setUploading(true);
    try {
      const { urls } = await adminApi.upload([file]);
      onChange(urls[0]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Banner image</span>
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-bg-soft ring-1 ring-line-soft">
        <Image src={value || DEFAULT_HERO} alt="" fill unoptimized={!!value} sizes="600px" className="object-cover" />
        {!value && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-ink-2">
            Default image
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" size="sm" loading={uploading} onClick={() => input.current?.click()}>
          {value ? "Replace image" : "Upload your own"}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
            Use default
          </Button>
        )}
        <span className="text-[12px] text-faint">Wide images work best (16:9, at least 2000px wide).</span>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        hidden
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />
      {error && <p className="mt-2 text-[12px] text-danger">{error}</p>}
    </div>
  );
}
