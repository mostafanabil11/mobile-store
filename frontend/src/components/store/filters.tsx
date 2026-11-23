"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { CATEGORY_LABELS, CONDITION_LABELS, cn } from "@/lib/format";
import { CATEGORIES, CONDITIONS, type Facets } from "@/lib/types";
import { ChevronDown, CloseIcon, SearchIcon } from "../ui/icons";

export interface FilterState {
  q?: string;
  category?: string;
  condition?: string;
  storage?: string;
  sort?: string;
}

const SORTS = [
  { value: "newest", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

export function Filters({ current, facets, total }: { current: FilterState; facets: Facets | null; total: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(current.q ?? "");
  const input = useRef<HTMLInputElement>(null);

  // Keep the box in sync when the URL changes elsewhere (e.g. header links), unless the user is typing.
  useEffect(() => {
    if (document.activeElement !== input.current) setQ(current.q ?? "");
  }, [current.q]);

  function go(patch: Partial<FilterState>) {
    const next = { ...current, ...patch };
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v) params.set(k, v);
    const qs = params.toString();
    startTransition(() => router.push(`/products${qs ? `?${qs}` : ""}`, { scroll: false }));
  }

  // Debounced search.
  useEffect(() => {
    if (q.trim() === (current.q ?? "")) return;
    const t = setTimeout(() => go({ q: q.trim() || undefined }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const count = (n?: number) => (n ? <span className="ml-1 text-faint">{n}</span> : null);
  const active = current.category || current.condition || current.storage || current.q;

  return (
    // A fragment, not a wrapper: the sticky bar's parent must be the tall page column for it to stay stuck.
    <>
      {/* Categories */}
      <div className="no-scrollbar -mx-5 mb-4 flex gap-2 overflow-x-auto px-5">
        <Pill active={!current.category} onClick={() => go({ category: undefined, storage: undefined })}>
          All
        </Pill>
        {CATEGORIES.map((c) => (
          <Pill key={c} active={current.category === c} onClick={() => go({ category: c, storage: undefined })}>
            {CATEGORY_LABELS[c]}
            {count(facets?.categories[c])}
          </Pill>
        ))}
      </div>

      <div
        className={cn(
          "sticky top-12 z-30 -mx-5 flex flex-col gap-3 border-y border-line-soft bg-white/85 px-5 py-3 backdrop-blur-xl backdrop-saturate-150 transition-opacity lg:flex-row lg:items-center lg:justify-between",
          pending && "opacity-70",
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            value={current.condition ?? ""}
            onChange={(v) => go({ condition: v || undefined })}
            options={[{ value: "", label: "Any condition" }, ...CONDITIONS.map((c) => ({ value: c, label: CONDITION_LABELS[c] }))]}
          />
          {facets && facets.storages.length > 0 && (
            <Select
              value={current.storage ?? ""}
              onChange={(v) => go({ storage: v || undefined })}
              options={[{ value: "", label: "Any capacity" }, ...facets.storages.map((s) => ({ value: s, label: s }))]}
            />
          )}
          {active && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                go({ category: undefined, condition: undefined, storage: undefined, q: undefined });
              }}
              className="flex items-center gap-1 rounded-full px-3 py-2 text-[13px] text-muted hover:text-ink"
            >
              <CloseIcon size={14} /> Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="relative flex-1 lg:w-64 lg:flex-none">
            <SearchIcon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
            <input
              ref={input}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search"
              aria-label="Search products"
              className="h-10 w-full rounded-full bg-bg-soft pl-10 pr-4 text-[14px] outline-none ring-accent/40 placeholder:text-faint focus:ring-2"
            />
          </label>
          <Select value={current.sort ?? "newest"} onChange={(v) => go({ sort: v === "newest" ? undefined : v })} options={SORTS} />
        </div>
      </div>

      <p className="mt-4 text-[13px] text-muted">
        {total} {total === 1 ? "item" : "items"}
      </p>
    </>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-4 py-2 text-[14px] font-medium transition-colors",
        active ? "bg-ink text-white" : "bg-bg-soft text-ink-2 hover:bg-bg-sunken",
      )}
    >
      {children}
    </button>
  );
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="no-scrollbar flex max-w-full overflow-x-auto rounded-full bg-bg-soft p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all",
            value === o.value ? "bg-white text-ink shadow-[0_1px_4px_rgba(0,0,0,0.12)]" : "text-muted hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <span className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 appearance-none rounded-full bg-bg-soft pl-4 pr-9 text-[13px] font-medium text-ink-2 outline-none focus:ring-2 focus:ring-accent/40"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" />
    </span>
  );
}
