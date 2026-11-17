"use client";

import { useState } from "react";
import { CheckIcon, ShareIcon } from "../ui/icons";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* cancelled */
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={share}
      className="flex h-[52px] items-center justify-center gap-2 rounded-full px-5 text-[15px] font-medium text-ink ring-1 ring-line transition-colors hover:bg-bg-soft"
    >
      {copied ? <CheckIcon size={17} /> : <ShareIcon size={17} />}
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
