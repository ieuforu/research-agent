import React from 'react'

export function SectionCard({
  title,
  desc,
  children,
}: {
  title: string
  desc?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card/50">
      <div className="border-b border-border/30 px-6 py-4">
        <h3 className="text-[15px] font-medium">{title}</h3>
        {desc && <p className="mt-0.5 text-[13px] text-muted-foreground">{desc}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

export function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4">{children}</div>
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="flex items-start justify-between gap-8">
      <div className="pt-2">
        <label className="text-[13px] font-medium">{label}</label>
        {hint && <p className="mt-0.5 text-[12px] text-muted-foreground/60">{hint}</p>}
      </div>
      <div className="w-72 shrink-0">{children}</div>
    </div>
  )
}

export function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="flex h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-[13px] outline-none transition-all placeholder:text-muted-foreground/40 focus:border-foreground/30 focus:ring-2 focus:ring-foreground/[0.06]"
    />
  )
}
