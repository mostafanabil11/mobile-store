"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Input, Notice } from "@/components/admin/ui";
import { adminApi } from "@/lib/admin-api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await adminApi.login(email, password);
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-bg-soft px-5 py-16">
      <div className="rise w-full max-w-[380px]">
        <div className="mb-8 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-[14px] bg-ink text-white">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
              <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
            </svg>
          </span>
          <h1 className="display mt-5 text-[28px]">Store admin</h1>
          <p className="mt-1 text-[14px] text-muted">Sign in to manage your inventory.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 rounded-3xl bg-white p-6 ring-1 ring-black/[0.05]">
          {error && <Notice tone="error">{error}</Notice>}
          <Input
            type="email"
            autoComplete="username"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            className="h-11"
          />
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-11"
          />
          <Button type="submit" loading={loading} className="h-11 w-full">
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-[13px] text-muted">
          <Link href="/" className="hover:text-ink">
            ← Back to the store
          </Link>
        </p>
      </div>
    </main>
  );
}
