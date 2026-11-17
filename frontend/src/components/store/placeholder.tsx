import { cn } from "@/lib/format";

/** Neutral stand-in shown wherever a real photo hasn't been added yet. */
export function Placeholder({ label, className, iconSize = 28 }: { label?: string; className?: string; iconSize?: number }) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-2 rounded-[inherit] text-line",
        className,
      )}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
        <circle cx="9" cy="10" r="1.6" />
        <path d="m20.5 15.5-4.6-4.6a1.5 1.5 0 0 0-2.1 0L5 19.5" />
      </svg>
      {label && <span className="text-[12px] font-medium">{label}</span>}
    </div>
  );
}
