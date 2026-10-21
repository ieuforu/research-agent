import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { userQueries } from '#/features/users/queries'
import { ArrowLeft, MapPin, Calendar, Building2, Shield, Clock } from 'lucide-react'

export function UserDetailPage({ userId }: { userId: string }) {
  const id = Number(userId)
  const { data: user, isLoading, error } = useQuery(userQueries.detail(id))

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-foreground/40" />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-[14px] text-muted-foreground">User not found</p>
        <Link
          to="/examples/users"
          className="text-[13px] text-foreground underline underline-offset-2"
        >
          Back to users
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to="/examples/users"
        className="mb-8 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Users
      </Link>

      <div className="flex flex-col items-center text-center">
        <img
          src={user.avatar}
          alt=""
          className="h-20 w-20 rounded-2xl bg-muted ring-1 ring-border/20"
        />
        <h1 className="mt-4 text-[24px] font-semibold tracking-tight">{user.name}</h1>
        <p className="mt-1 text-[14px] text-muted-foreground">{user.email}</p>
        <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-muted-foreground/70">
          {user.bio}
        </p>
        <div className="mt-4 flex gap-2">
          <RoleBadge role={user.role} />
          <StatusBadge status={user.status} />
        </div>
      </div>

      <div className="mt-10 space-y-3">
        <InfoRow icon={Building2} label="Department" value={user.department} />
        <InfoRow icon={Shield} label="Role" value={user.role} capitalize />
        <InfoRow icon={MapPin} label="Location" value={user.location} />
        <InfoRow icon={Calendar} label="Joined" value={formatDate(user.joinDate)} />
        <InfoRow icon={Clock} label="Last active" value={formatDate(user.lastActive)} />
      </div>

      <p className="mt-8 text-center text-[11px] text-muted-foreground/30">ID: {user.id}</p>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
  capitalize,
}: {
  icon: React.ElementType
  label: string
  value: string
  capitalize?: boolean
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border/30 bg-card/30 px-5 py-3.5">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground/40" />
      <span className="w-24 shrink-0 text-[13px] text-muted-foreground">{label}</span>
      <span
        className={`flex-1 text-right text-[13px] font-medium ${capitalize ? 'capitalize' : ''}`}
      >
        {value}
      </span>
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const s: Record<string, string> = {
    admin: 'bg-foreground/[0.08] text-foreground',
    editor: 'bg-blue-500/10 text-blue-600',
    viewer: 'bg-muted text-muted-foreground',
  }
  return (
    <span
      className={`rounded-full px-3 py-1 text-[12px] font-medium capitalize ${s[role] ?? s.viewer}`}
    >
      {role}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const s: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-600',
    inactive: 'bg-muted text-muted-foreground',
    suspended: 'bg-red-500/10 text-red-500',
  }
  return (
    <span
      className={`rounded-full px-3 py-1 text-[12px] font-medium capitalize ${s[status] ?? s.inactive}`}
    >
      {status}
    </span>
  )
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}
