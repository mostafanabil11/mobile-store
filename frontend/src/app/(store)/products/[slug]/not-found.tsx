import Link from "next/link";

export default function ProductNotFound() {
  return (
    <div className="mx-auto max-w-[1120px] px-5 py-32 text-center">
      <p className="eyebrow text-muted">Not available</p>
      <h1 className="display mt-3 text-[40px] sm:text-[56px]">This one has found a home.</h1>
      <p className="mx-auto mt-4 max-w-md text-lg text-muted">
        The device you&apos;re looking for has been sold or is no longer listed.
      </p>
      <Link
        href="/products"
        className="mt-8 inline-block rounded-full bg-ink px-6 py-3 text-[15px] font-medium text-white hover:bg-black"
      >
        See what&apos;s in store
      </Link>
    </div>
  );
}
