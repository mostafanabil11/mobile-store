import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminNav, AdminNavFallback } from "@/components/admin/shell";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg-soft lg:flex-row">
      <Suspense fallback={<AdminNavFallback />}>
        <AdminNav />
      </Suspense>
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-[1100px]">{children}</div>
      </main>
    </div>
  );
}
