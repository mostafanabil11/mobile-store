import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { STATUS_LABELS, cn } from "@/lib/format";
import type { Status } from "@/lib/types";
import { ChevronDown } from "../ui/icons";

type Variant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  variant = "primary",
  size = "md",
  className,
  loading,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md"; loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "h-8 px-3.5 text-[13px]" : "h-10 px-5 text-[14px]",
        variant === "primary" && "bg-ink text-white hover:bg-black",
        variant === "secondary" && "bg-white text-ink ring-1 ring-line hover:bg-bg-soft",
        variant === "ghost" && "text-ink-2 hover:bg-black/5",
        variant === "danger" && "bg-white text-danger ring-1 ring-line hover:bg-[#fff1f3]",
        className,
      )}
    >
      {loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />}
      {children}
    </button>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-2xl bg-white ring-1 ring-black/[0.05]", className)}>{children}</div>;
}

export function CardHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line-soft px-6 py-5">
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[13px] font-medium text-ink-2">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-[12px] text-danger">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-[12px] text-faint">{hint}</span>
      ) : null}
    </label>
  );
}

const control =
  "w-full rounded-xl bg-white px-3.5 text-[14px] text-ink outline-none ring-1 ring-line transition placeholder:text-faint focus:ring-2 focus:ring-accent/50 disabled:bg-bg-soft";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(control, "h-10", className)} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(control, "min-h-24 py-2.5 leading-relaxed", className)} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className={cn("relative block", className)}>
      <select {...props} className={cn(control, "h-10 appearance-none pr-9")}>
        {children}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
    </span>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 text-left"
    >
      <span>
        <span className="block text-[14px] font-medium">{label}</span>
        {description && <span className="block text-[12px] text-muted">{description}</span>}
      </span>
      <span
        className={cn(
          "relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors",
          checked ? "bg-success" : "bg-bg-sunken",
        )}
      >
        <span
          className={cn(
            "absolute top-[3px] h-5 w-5 rounded-full bg-white shadow transition-[left]",
            checked ? "left-[21px]" : "left-[3px]",
          )}
        />
      </span>
    </button>
  );
}

const STATUS_STYLES: Record<Status, string> = {
  available: "bg-[#e8f6ee] text-success",
  reserved: "bg-[#fff4e0] text-warn",
  sold: "bg-bg-soft text-muted",
  hidden: "bg-bg-soft text-faint",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium", STATUS_STYLES[status])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="display text-[30px]">{title}</h1>
        {description && <p className="mt-1 text-[14px] text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "success"; children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-xl px-4 py-3 text-[13px]",
        tone === "error" && "bg-[#fff1f3] text-danger",
        tone === "success" && "bg-[#e8f6ee] text-success",
        tone === "info" && "bg-bg-soft text-ink-2",
      )}
    >
      {children}
    </div>
  );
}
