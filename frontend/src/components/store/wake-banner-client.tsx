"use client";

import { useEffect, useState } from "react";

const POLL_MS = 3_000;
const GIVE_UP_MS = 120_000;

/**
 * Polls the API health check and reloads the page as soon as the API is back, so visitors
 * who arrive while the free-plan server is asleep get the real page without doing anything.
 */
export function WakeBannerClient() {
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    const started = Date.now();
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;

    const check = async () => {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        if (res.ok && !stopped) {
          window.location.reload();
          return;
        }
      } catch {
        /* still waking */
      }
      if (stopped) return;
      if (Date.now() - started > GIVE_UP_MS) setGaveUp(true);
      else timer = setTimeout(check, POLL_MS);
    };
    timer = setTimeout(check, POLL_MS);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, []);

  return (
    <div role="status" aria-live="polite" className="border-b border-line-soft bg-ink text-white">
      <div className="mx-auto flex max-w-[1120px] items-center justify-center gap-3 px-5 py-2.5 text-center text-[13px]">
        {gaveUp ? (
          <>
            The store is taking longer than usual to load.
            <button type="button" onClick={() => window.location.reload()} className="font-semibold underline underline-offset-2">
              Try again
            </button>
          </>
        ) : (
          <>
            <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-white/40 border-r-white" aria-hidden />
            Loading the latest products — this can take up to a minute. The page will refresh by itself.
          </>
        )}
      </div>
    </div>
  );
}
