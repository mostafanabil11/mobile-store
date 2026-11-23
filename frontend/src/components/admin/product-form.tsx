"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { type ProductPayload, adminApi } from "@/lib/admin-api";
import { CATEGORY_LABELS, CONDITION_LABELS, STATUS_LABELS, cn, formatPrice, variantLine } from "@/lib/format";
import { CATEGORIES, CONDITIONS, STATUSES, type CatalogDevice, type Product, type Spec, type StoreSettings } from "@/lib/types";
import { productMessage } from "@/lib/whatsapp";
import { ProductMedia } from "../store/product-media";
import { CloseIcon } from "../ui/icons";
import { CatalogPicker } from "./catalog-picker";
import { ImageUploader } from "./image-uploader";
import { Button, Card, CardHeader, Field, Input, Notice, PageHeader, Select, StatusBadge, Textarea, Toggle } from "./ui";

const COLOR_PRESETS: { name: string; hex: string }[] = [
  { name: "Black", hex: "#1d1d1f" },
  { name: "White", hex: "#f4f4f2" },
  { name: "Silver", hex: "#e3e4e6" },
  { name: "Space Black", hex: "#2b2b2d" },
  { name: "Natural Titanium", hex: "#c9c2b6" },
  { name: "Desert Titanium", hex: "#bfa48f" },
  { name: "Cosmic Orange", hex: "#d9773b" },
  { name: "Deep Blue", hex: "#2e3a52" },
  { name: "Blue", hex: "#a9bfd9" },
  { name: "Pink", hex: "#f2d4d7" },
  { name: "Green", hex: "#c9d8c5" },
  { name: "Gold", hex: "#e8d5b5" },
  { name: "Midnight", hex: "#232a35" },
  { name: "Starlight", hex: "#efe8dc" },
  { name: "(PRODUCT)RED", hex: "#c8102e" },
];

const STORAGE_PRESETS = ["64GB", "128GB", "256GB", "512GB", "1TB", "2TB"];

interface FormState {
  name: string;
  category: Product["category"];
  condition: Product["condition"];
  storage: string;
  color: string;
  colorHex: string;
  batteryHealth: string;
  price: string;
  compareAtPrice: string;
  warranty: string;
  region: string;
  inTheBox: string;
  description: string;
  specs: Spec[];
  images: string[];
  status: Product["status"];
  featured: boolean;
  quantity: string;
}

const EMPTY: FormState = {
  name: "",
  category: "iphone",
  condition: "used",
  storage: "",
  color: "",
  colorHex: "",
  batteryHealth: "",
  price: "",
  compareAtPrice: "",
  warranty: "",
  region: "",
  inTheBox: "",
  description: "",
  specs: [],
  images: [],
  status: "available",
  featured: false,
  quantity: "1",
};

function fromProduct(p: Product): FormState {
  return {
    name: p.name,
    category: p.category,
    condition: p.condition,
    storage: p.storage ?? "",
    color: p.color ?? "",
    colorHex: p.colorHex ?? "",
    batteryHealth: p.batteryHealth != null ? String(p.batteryHealth) : "",
    price: String(p.price),
    compareAtPrice: p.compareAtPrice != null ? String(p.compareAtPrice) : "",
    warranty: p.warranty ?? "",
    region: p.region ?? "",
    inTheBox: p.inTheBox ?? "",
    description: p.description ?? "",
    specs: p.specs ?? [],
    images: p.images ?? [],
    status: p.status,
    featured: p.featured,
    quantity: String(p.quantity ?? 1),
  };
}

function toPayload(f: FormState): ProductPayload {
  const num = (v: string) => (v.trim() === "" ? null : Number(v));
  return {
    name: f.name.trim(),
    category: f.category,
    condition: f.condition,
    storage: f.storage,
    color: f.color,
    colorHex: f.colorHex,
    batteryHealth: f.condition === "new" ? null : num(f.batteryHealth),
    price: Number(f.price),
    compareAtPrice: num(f.compareAtPrice),
    warranty: f.warranty,
    region: f.region,
    inTheBox: f.inTheBox,
    description: f.description,
    specs: f.specs.filter((s) => s.label.trim() && s.value.trim()),
    images: f.images,
    status: f.status,
    featured: f.featured,
    quantity: Math.max(0, Math.floor(Number(f.quantity) || 0)),
  };
}

function validate(f: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (!f.name.trim()) errors.name = "Name is required";
  if (f.price.trim() === "" || Number.isNaN(Number(f.price)) || Number(f.price) < 0) errors.price = "Enter a valid price";
  if (f.compareAtPrice && (Number.isNaN(Number(f.compareAtPrice)) || Number(f.compareAtPrice) < 0))
    errors.compareAtPrice = "Enter a valid price";
  if (f.condition !== "new" && f.batteryHealth) {
    const b = Number(f.batteryHealth);
    if (!Number.isInteger(b) || b < 0 || b > 100) errors.batteryHealth = "0 – 100";
  }
  if (f.colorHex && !/^#[0-9a-f]{6}$/i.test(f.colorHex)) errors.colorHex = "Use a hex like #1d1d1f";
  return errors;
}

export function ProductForm({ id }: { id?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [original, setOriginal] = useState<Product | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [touched, setTouched] = useState(false);
  const [model, setModel] = useState<CatalogDevice | null>(null);
  const [modelNote, setModelNote] = useState<string | null>(null);

  useEffect(() => {
    adminApi.settings().then(setSettings).catch(() => {});
    if (!id) return;
    adminApi
      .product(id)
      .then((p) => {
        setOriginal(p);
        setForm(fromProduct(p));
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setSaved(false);
    setForm((f) => ({ ...f, [key]: value }));
  };

  /** Fills model-level fields from the catalog; unit details (condition, price, battery…) stay as they are. */
  async function applyModel(device: CatalogDevice) {
    let images = form.images;
    let imported = 0;
    if (!images.length && device.images.length) {
      images = (await adminApi.importCatalogImages(device.images)).urls;
      imported = images.length;
    }
    const keepColor = device.colors.some((c) => c.name.toLowerCase() === form.color.toLowerCase());
    const keepStorage = !device.storageOptions.length || device.storageOptions.includes(form.storage);
    setSaved(false);
    setModel(device);
    setForm((f) => ({
      ...f,
      name: device.name,
      category: device.category,
      specs: device.specs,
      images,
      color: keepColor ? f.color : "",
      colorHex: keepColor ? f.colorHex : "",
      storage: keepStorage ? f.storage : "",
    }));
    setModelNote(
      `Filled from ${device.name}: name, category, ${device.specs.length} specs` +
        (imported ? ` and ${imported} photos.` : form.images.length ? ". Your existing photos were kept." : ".") +
        " Now pick the storage and colour of this unit.",
    );
  }

  const storageOptions = model?.storageOptions.length ? model.storageOptions : STORAGE_PRESETS;
  const colorOptions = model?.colors.length ? model.colors : COLOR_PRESETS;

  const errors = validate(form);
  const showErrors = touched ? errors : {};
  const used = form.condition !== "new";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (Object.keys(errors).length) return;
    setSaving(true);
    setError(null);
    try {
      const payload = toPayload(form);
      if (id) {
        const updated = await adminApi.updateProduct(id, payload);
        setOriginal(updated);
        setSaved(true);
      } else {
        const created = await adminApi.createProduct(payload);
        router.replace(`/admin/products/${created.id}`);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!id || !confirm("Delete this product? This can't be undone.")) return;
    await adminApi.deleteProduct(id);
    router.replace("/admin/products");
  }

  // Live preview of the card and WhatsApp message.
  const preview = useMemo<Product>(() => {
    const p = toPayload(form);
    return {
      ...p,
      id: id ?? "preview",
      slug: original?.slug ?? "your-product",
      name: p.name || "Product name",
      price: Number.isFinite(p.price) ? p.price : 0,
      storage: p.storage || undefined,
      color: p.color || undefined,
      colorHex: p.colorHex || undefined,
      batteryHealth: p.batteryHealth ?? undefined,
      compareAtPrice: p.compareAtPrice ?? undefined,
      createdAt: "",
      updatedAt: "",
    };
  }, [form, id, original?.slug]);

  if (loading) {
    return <div className="skeleton h-96 rounded-2xl" />;
  }

  return (
    <form onSubmit={submit} noValidate>
      <PageHeader
        title={id ? form.name || "Edit product" : "Add product"}
        description={id ? "Changes appear on the storefront as soon as you save." : "List a new device in your store."}
        action={
          <div className="flex items-center gap-2">
            {original && original.status !== "hidden" && original.status !== "sold" && (
              <Link href={`/products/${original.slug}`} target="_blank">
                <Button type="button" variant="secondary">
                  View in store ↗
                </Button>
              </Link>
            )}
            <Button type="submit" loading={saving}>
              {id ? "Save changes" : "Publish product"}
            </Button>
          </div>
        }
      />

      <div className="space-y-3">
        {error && <Notice tone="error">{error}</Notice>}
        {saved && <Notice tone="success">Saved.</Notice>}
        {touched && Object.keys(errors).length > 0 && <Notice tone="error">Please fix the highlighted fields.</Notice>}
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card className="relative z-10">
            <CardHeader
              title="Start from a model"
              description="Prefills the name, specs, photos and the model's real storage and colour options."
            />
            <div className="space-y-3 p-6">
              <CatalogPicker onPick={applyModel} />
              {modelNote && <Notice tone="success">{modelNote}</Notice>}
            </div>
          </Card>

          <Card>
            <CardHeader title="Basics" />
            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <Field label="Name" error={showErrors.name} className="sm:col-span-2">
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="iPhone 16 Pro Max" />
              </Field>
              <Field label="Category" className="sm:col-span-2 xl:col-span-1">
                <Select value={form.category} onChange={(e) => set("category", e.target.value as FormState["category"])}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Condition" className="sm:col-span-2 xl:col-span-1">
                <div className="flex rounded-xl bg-bg-soft p-1">
                  {CONDITIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => set("condition", c)}
                      className={cn(
                        "flex-1 whitespace-nowrap rounded-lg px-2 py-1.5 text-[13px] font-medium transition",
                        form.condition === c ? "bg-white shadow-sm" : "text-muted hover:text-ink",
                      )}
                    >
                      {CONDITION_LABELS[c]}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label={form.category === "watch" ? "Case size" : "Storage"} className="sm:col-span-2">
                <div className="flex flex-wrap gap-2">
                  <Input
                    value={form.storage}
                    onChange={(e) => set("storage", e.target.value)}
                    placeholder={form.category === "watch" ? "46mm" : "256GB"}
                    className="w-32"
                  />
                  {form.category !== "watch" &&
                    storageOptions.map((s) => (
                      <Chip key={s} active={form.storage === s} onClick={() => set("storage", form.storage === s ? "" : s)}>
                        {s}
                      </Chip>
                    ))}
                </div>
              </Field>
              <Field label="Colour" className="sm:col-span-2" error={showErrors.colorHex}>
                <div className="flex gap-2">
                  <Input value={form.color} onChange={(e) => set("color", e.target.value)} placeholder="Natural Titanium" />
                  <label className="relative h-10 w-12 shrink-0 cursor-pointer overflow-hidden rounded-xl ring-1 ring-line">
                    <span className="absolute inset-0" style={{ background: form.colorHex || "#f5f5f7" }} />
                    <input
                      type="color"
                      value={form.colorHex || "#c9c9ce"}
                      onChange={(e) => set("colorHex", e.target.value)}
                      className="absolute inset-0 cursor-pointer opacity-0"
                      aria-label="Pick colour"
                    />
                  </label>
                </div>
                {model?.colors.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {colorOptions.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => {
                          set("color", c.name);
                          set("colorHex", c.hex ?? "");
                        }}
                        className={cn(
                          "flex h-8 items-center gap-2 rounded-full px-3 text-[13px] font-medium ring-1 transition",
                          form.color === c.name ? "bg-ink text-white ring-ink" : "bg-white text-ink-2 ring-line hover:ring-ink-2",
                        )}
                      >
                        <span className="h-3.5 w-3.5 rounded-full ring-1 ring-black/15" style={{ background: c.hex ?? "#d2d2d7" }} />
                        {c.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        title={c.name}
                        aria-label={c.name}
                        onClick={() => {
                          set("color", c.name);
                          set("colorHex", c.hex);
                        }}
                        className={cn(
                          "h-6 w-6 rounded-full ring-1 ring-black/10 transition-transform hover:scale-110",
                          form.colorHex.toLowerCase() === c.hex && "ring-2 ring-ink ring-offset-2",
                        )}
                        style={{ background: c.hex }}
                      />
                    ))}
                  </div>
                )}
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="Price & condition" />
            <div className="grid gap-4 p-6 sm:grid-cols-3">
              <Field label={`Price (${settings?.currency ?? "EGP"})`} error={showErrors.price}>
                <Input inputMode="decimal" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="0" />
              </Field>
              <Field label="Compare-at price" hint="Optional, shown struck through" error={showErrors.compareAtPrice}>
                <Input
                  inputMode="decimal"
                  value={form.compareAtPrice}
                  onChange={(e) => set("compareAtPrice", e.target.value)}
                  placeholder="—"
                />
              </Field>
              <Field label="Battery health %" hint={used ? "From Settings › Battery" : "Not shown for new devices"} error={showErrors.batteryHealth}>
                <Input
                  inputMode="numeric"
                  value={used ? form.batteryHealth : ""}
                  onChange={(e) => set("batteryHealth", e.target.value)}
                  placeholder={used ? "92" : "—"}
                  disabled={!used}
                />
              </Field>
              <Field label="Warranty" className="sm:col-span-3">
                <Input
                  value={form.warranty}
                  onChange={(e) => set("warranty", e.target.value)}
                  placeholder={used ? "3 months store warranty" : "1 year Apple warranty"}
                />
              </Field>
              <Field label="Version / SIM" className="sm:col-span-2">
                <Input value={form.region} onChange={(e) => set("region", e.target.value)} placeholder="Physical SIM + eSIM · Middle East" />
              </Field>
              <Field label="Quantity in stock">
                <Input inputMode="numeric" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
              </Field>
              <Field label="In the box" className="sm:col-span-3">
                <Input value={form.inTheBox} onChange={(e) => set("inTheBox", e.target.value)} placeholder="Original box & cable" />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="Photos" />
            <div className="p-6">
              <ImageUploader value={form.images} onChange={(urls) => set("images", urls)} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Description & specs" />
            <div className="space-y-5 p-6">
              <Field label="Description" hint="Condition notes, scratches, repairs, what makes this unit special.">
                <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} />
              </Field>
              <div>
                <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Tech specs</span>
                <div className="space-y-2">
                  {form.specs.map((s, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        value={s.label}
                        placeholder="Chip"
                        className="w-40"
                        onChange={(e) => set("specs", form.specs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                      />
                      <Input
                        value={s.value}
                        placeholder="A18 Pro"
                        onChange={(e) => set("specs", form.specs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        aria-label="Remove spec"
                        className="w-10 shrink-0 px-0"
                        onClick={() => set("specs", form.specs.filter((_, j) => j !== i))}
                      >
                        <CloseIcon size={16} />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="secondary" size="sm" onClick={() => set("specs", [...form.specs, { label: "", value: "" }])}>
                    + Add spec
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader title="Visibility" />
            <div className="space-y-5 p-6">
              <Field label="Status">
                <Select value={form.status} onChange={(e) => set("status", e.target.value as FormState["status"])}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </Select>
              </Field>
              <p className="-mt-3 text-[12px] text-faint">Sold and hidden products are not shown in the store.</p>
              <Toggle
                checked={form.featured}
                onChange={(v) => set("featured", v)}
                label="Featured"
                description="Show on the home page"
              />
            </div>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="Preview" />
            <div className="p-4">
              <div className="overflow-hidden rounded-[22px] bg-bg-soft">
                <div className="relative aspect-[4/3]">
                  <div className="absolute inset-6">
                    <ProductMedia product={preview} sizes="300px" />
                  </div>
                </div>
                <div className="px-5 pb-5">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-muted">{CONDITION_LABELS[preview.condition]}</span>
                    <StatusBadge status={preview.status} />
                  </div>
                  <p className="font-semibold tracking-tight">{preview.name}</p>
                  <p className="text-[13px] text-muted">{variantLine(preview) || " "}</p>
                  <p className="mt-2 font-semibold">{formatPrice(preview.price, settings?.currency)}</p>
                </div>
              </div>
              {settings && (
                <div className="mt-4">
                  <p className="mb-1.5 text-[12px] font-medium text-muted">WhatsApp message</p>
                  <pre className="whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-[#dcf8c6] p-3 font-sans text-[12px] leading-relaxed text-ink">
                    {productMessage(preview, settings)}
                  </pre>
                </div>
              )}
            </div>
          </Card>

          {id && (
            <Button type="button" variant="danger" className="w-full" onClick={remove}>
              Delete product
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-10 rounded-xl px-3 text-[13px] font-medium ring-1 transition",
        active ? "bg-ink text-white ring-ink" : "bg-white text-ink-2 ring-line hover:ring-ink-2",
      )}
    >
      {children}
    </button>
  );
}
