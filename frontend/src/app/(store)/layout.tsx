import { Suspense } from "react";
import { Footer } from "@/components/store/footer";
import { Header } from "@/components/store/header";
import { WakeBanner } from "@/components/store/wake-banner";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <Suspense fallback={null}>
        <WakeBanner />
      </Suspense>
      <main className="flex-1">{children}</main>
      <Suspense fallback={<div className="h-80 bg-bg-soft" />}>
        <Footer />
      </Suspense>
    </>
  );
}
