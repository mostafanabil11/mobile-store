"use client";

import { useEffect, useState } from "react";
import { HeroImageField } from "@/components/admin/hero-image-field";
import { Button, Card, CardHeader, Field, Input, Notice, PageHeader, Textarea } from "@/components/admin/ui";
import { adminApi } from "@/lib/admin-api";
import type { AdminUser, StoreSettings } from "@/lib/types";

type Status = { tone: "success" | "error"; text: string } | null;

export default function SettingsPage() {
  const [s, setS] = useState<StoreSettings | null>(null);
  const [me, setMe] = useState<AdminUser | null>(null);
  const [storeStatus, setStoreStatus] = useState<Status>(null);
  const [savingStore, setSavingStore] = useState(false);

  useEffect(() => {
    adminApi.settings().then(setS).catch((e: Error) => setStoreStatus({ tone: "error", text: e.message }));
    adminApi.me().then(setMe).catch(() => {});
  }, []);

  const set = (key: keyof StoreSettings, value: string) => {
    setStoreStatus(null);
    setS((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  async function saveStore(e: React.FormEvent) {
    e.preventDefault();
    if (!s) return;
    setSavingStore(true);
    try {
      setS(await adminApi.updateSettings(s));
      setStoreStatus({ tone: "success", text: "Store settings saved." });
    } catch (err) {
      setStoreStatus({ tone: "error", text: (err as Error).message });
    } finally {
      setSavingStore(false);
    }
  }

  if (!s) return <div className="skeleton h-96 rounded-2xl" />;

  const input = (key: keyof StoreSettings, props: React.ComponentProps<typeof Input> = {}) => (
    <Input value={s[key]} onChange={(e) => set(key, e.target.value)} {...props} />
  );

  return (
    <>
      <PageHeader title="Settings" description="Store details shown to customers, and your admin account." />

      <form onSubmit={saveStore} className="space-y-6">
        <Card>
          <CardHeader
            title="WhatsApp"
            description="Where product enquiries are sent."
            action={
              <Button type="submit" loading={savingStore}>
                Save
              </Button>
            }
          />
          <div className="grid gap-4 p-6 sm:grid-cols-2">
            <Field label="WhatsApp number" hint="International format with country code, e.g. 201001234567">
              {input("whatsappNumber", { inputMode: "tel", placeholder: "201001234567" })}
            </Field>
            <Field label="Message greeting" hint="First line of every enquiry message">
              {input("whatsappGreeting")}
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader title="Store" />
          <div className="grid gap-4 p-6 sm:grid-cols-2">
            <Field label="Store name">{input("storeName")}</Field>
            <Field label="Currency" hint="ISO code: EGP, USD, AED, SAR, EUR…">
              {input("currency", { maxLength: 8 })}
            </Field>
            <Field label="Tagline" className="sm:col-span-2">
              {input("tagline")}
            </Field>
            <Field label="Phone">{input("phone", { inputMode: "tel" })}</Field>
            <Field label="Email">{input("email", { type: "email" })}</Field>
            <Field label="Address" className="sm:col-span-2">
              {input("address")}
            </Field>
            <Field label="Google Maps link">{input("mapUrl", { type: "url", placeholder: "https://maps.app.goo.gl/…" })}</Field>
            <Field label="Instagram handle">{input("instagram", { placeholder: "@yourstore" })}</Field>
            <Field label="Working hours" className="sm:col-span-2">
              {input("workingHours", { placeholder: "Sat – Thu · 11am – 11pm" })}
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader title="Home page" description="The headline and banner at the top of your store." />
          <div className="grid gap-4 p-6">
            <HeroImageField value={s.heroImage ?? ""} onChange={(url) => set("heroImage", url)} />
            <Field label="Headline" hint="Use a new line to break the headline">
              <Textarea value={s.heroTitle} onChange={(e) => set("heroTitle", e.target.value)} rows={2} />
            </Field>
            <Field label="Subheading">
              <Textarea value={s.heroSubtitle} onChange={(e) => set("heroSubtitle", e.target.value)} rows={2} />
            </Field>
          </div>
        </Card>

        {storeStatus && <Notice tone={storeStatus.tone}>{storeStatus.text}</Notice>}
        <div className="flex justify-end">
          <Button type="submit" loading={savingStore}>
            Save store settings
          </Button>
        </div>
      </form>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {me && <ProfileCard me={me} onSaved={setMe} />}
        <PasswordCard />
      </div>
    </>
  );
}

function ProfileCard({ me, onSaved }: { me: AdminUser; onSaved: (u: AdminUser) => void }) {
  const [name, setName] = useState(me.name);
  const [email, setEmail] = useState(me.email);
  const [status, setStatus] = useState<Status>(null);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      onSaved(await adminApi.updateProfile({ name, email }));
      setStatus({ tone: "success", text: "Profile updated." });
    } catch (err) {
      setStatus({ tone: "error", text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Your account" />
      <form onSubmit={save} className="space-y-4 p-6">
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
        </Field>
        {status && <Notice tone={status.tone}>{status.text}</Notice>}
        <Button type="submit" variant="secondary" loading={saving}>
          Update account
        </Button>
      </form>
    </Card>
  );
}

function PasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<Status>(null);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 8) return setStatus({ tone: "error", text: "New password must be at least 8 characters." });
    if (next !== confirm) return setStatus({ tone: "error", text: "Passwords don't match." });
    setSaving(true);
    try {
      await adminApi.changePassword(current, next);
      setStatus({ tone: "success", text: "Password changed." });
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      setStatus({ tone: "error", text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Change password" />
      <form onSubmit={save} className="space-y-4 p-6">
        <Field label="Current password">
          <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
        </Field>
        <Field label="New password" hint="At least 8 characters">
          <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
        </Field>
        <Field label="Confirm new password">
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
        </Field>
        {status && <Notice tone={status.tone}>{status.text}</Notice>}
        <Button type="submit" variant="secondary" loading={saving}>
          Change password
        </Button>
      </form>
    </Card>
  );
}
