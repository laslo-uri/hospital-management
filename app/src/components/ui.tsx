import Link from "next/link";
import { cn } from "@/lib/utils";

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md px-3.5 py-2 text-sm font-semibold transition",
        variant === "primary" &&
          "bg-teal text-white hover:bg-teal-deep shadow-sm",
        variant === "secondary" &&
          "border border-line bg-card text-ink hover:bg-field",
        variant === "ghost" && "text-teal hover:bg-teal/10",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  className,
  title,
  body,
}: {
  children?: React.ReactNode;
  className?: string;
  title?: string;
  body?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-line bg-card/90 p-5 shadow-sm backdrop-blur-sm",
        className,
      )}
    >
      {title ? (
        <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
      ) : null}
      {body ? <p className="mt-1 text-sm text-muted">{body}</p> : null}
      {children ? <div className={title || body ? "mt-4" : undefined}>{children}</div> : null}
    </section>
  );
}

export function Field({
  label,
  name,
  children,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  children?: React.ReactNode;
}) {
  if (children) {
    return (
      <label className="block text-sm font-semibold text-ink">
        <span className="mb-1.5 block text-muted">{label}</span>
        {children}
      </label>
    );
  }
  return (
    <label className="block text-sm font-semibold text-ink" htmlFor={name}>
      <span className="mb-1.5 block text-muted">{label}</span>
      <input
        id={name}
        name={name}
        className="w-full rounded-md border border-line bg-field px-3 py-2 text-sm text-ink outline-none ring-teal/30 focus:ring-2"
        {...props}
      />
    </label>
  );
}

export function SelectField({
  label,
  name,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  name: string;
}) {
  return (
    <label className="block text-sm font-semibold text-ink" htmlFor={name}>
      <span className="mb-1.5 block text-muted">{label}</span>
      <select
        id={name}
        name={name}
        className="w-full rounded-md border border-line bg-field px-3 py-2 text-sm text-ink outline-none ring-teal/30 focus:ring-2"
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function TextareaField({
  label,
  name,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  name: string;
}) {
  return (
    <label className="block text-sm font-semibold text-ink" htmlFor={name}>
      <span className="mb-1.5 block text-muted">{label}</span>
      <textarea
        id={name}
        name={name}
        className="w-full rounded-md border border-line bg-field px-3 py-2 text-sm text-ink outline-none ring-teal/30 focus:ring-2"
        rows={3}
        {...props}
      />
    </label>
  );
}

export function Table({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate/40 text-xs uppercase tracking-wide text-muted">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line bg-card/60">{children}</tbody>
      </table>
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "teal" | "warn" | "danger" | "success";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
        tone === "neutral" && "bg-slate text-ink",
        tone === "teal" && "bg-teal/15 text-teal-deep",
        tone === "warn" && "bg-amber-100 text-amber-900",
        tone === "danger" && "bg-red-100 text-danger",
        tone === "success" && "bg-emerald-100 text-success",
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line px-6 py-10 text-center">
      <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-sm text-muted">{body}</p>
    </div>
  );
}

export function PageHeader({
  title,
  body,
}: {
  title: string;
  body?: string;
}) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
        {title}
      </h1>
      {body ? <p className="mt-2 max-w-2xl text-sm text-muted">{body}</p> : null}
    </div>
  );
}

export function TextLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="font-semibold text-teal hover:underline">
      {children}
    </Link>
  );
}
