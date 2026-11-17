import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-32 text-center">
      <p className="eyebrow text-muted">404</p>
      <h1 className="display mt-3 text-[40px] sm:text-[56px]">This page isn&apos;t here.</h1>
      <Link href="/" className="mt-8 rounded-full bg-ink px-6 py-3 text-[15px] font-medium text-white hover:bg-black">
        Back to the store
      </Link>
    </main>
  );
}
