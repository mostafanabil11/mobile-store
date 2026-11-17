"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { cn } from "@/lib/format";
import type { CatalogDevice, CatalogListing } from "@/lib/types";
import { SearchIcon } from "../ui/icons";

/**
 * Search the Apple device catalog and hand the chosen model back to the form.
 * The caller decides which fields to fill.
 */
export function CatalogPicker({ onPick }: { onPick: (device: CatalogDevice) => Promise<void> | void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<CatalogListing[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (!term) return;
    const t = setTimeout(() => {
      setLoading(true);
      adminApi
        .catalogSearch(term)
        .then((r) => {
          setResults(r);
          setError(null);
        })
        .catch((e: Error) => setError(e.message))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  async function pick(item: CatalogListing) {
    setApplying(item.slug);
    setError(null);
    try {
      const device = await adminApi.catalogDevice(item.slug);
      await onPick(device);
      setOpen(false);
      setQ("");
      setResults([]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setApplying(null);
    }
  }

  const showList = open && q.trim().length > 0;

  return (
    <div ref={box} className="relative">
      <label className="relative block">
        <SearchIcon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search a model, e.g. iPhone 16 Pro"
          className="h-11 w-full rounded-xl bg-white pl-10 pr-10 text-[14px] outline-none ring-1 ring-line transition placeholder:text-faint focus:ring-2 focus:ring-accent/50"
        />
        {(loading || applying) && (
          <span className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-muted border-r-transparent" />
        )}
      </label>

      {showList && (
        <div className="absolute inset-x-0 top-full z-20 mt-2 max-h-80 overflow-y-auto rounded-2xl bg-white p-1.5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.25)] ring-1 ring-black/5">
          {results.length === 0 && !loading && (
            <p className="px-3 py-4 text-center text-[13px] text-muted">{error ?? "No models found"}</p>
          )}
          {results.map((r) => (
            <button
              key={r.slug}
              type="button"
              disabled={!!applying}
              onClick={() => pick(r)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-bg-soft disabled:opacity-60",
                applying === r.slug && "bg-bg-soft",
              )}
            >
              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white">
                <Image src={r.image} alt="" fill unoptimized sizes="40px" className="object-contain" />
              </span>
              <span className="flex-1 text-[14px] font-medium">{r.name}</span>
              {applying === r.slug && <span className="text-[12px] text-muted">Importing…</span>}
            </button>
          ))}
        </div>
      )}
      {error && !showList && <p className="mt-2 text-[12px] text-danger">{error}</p>}
    </div>
  );
}
