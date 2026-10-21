import { stats, chartData } from './mock'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useModal } from '#/stores/modal.store'

export function DashboardHomePage() {
  const { open } = useModal()

  return (
    <div>
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Overview</h1>
        <p className="mt-0.5 text-[14px] text-muted-foreground">
          Here's what's happening with your project.
        </p>
        <button
          onClick={() =>
            open('confirm', {
              title: 'Try the confirmation dialog?',
              description: 'This is an example. No data will be changed.',
              confirmLabel: 'Confirm',
            })
          }
          className="mt-3 rounded-lg border border-border/60 px-4 py-2 text-[13px] font-medium transition-colors hover:bg-muted/50"
        >
          Test Modal
        </button>
      </div>

      {/* Stats */}
      <div className="mt-7 grid gap-3.5 md:grid-cols-3">
        {stats.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-border/40 bg-card/50 p-5 transition-all hover:border-border/60 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-muted-foreground">{item.label}</span>
              <item.icon className="h-4 w-4 text-muted-foreground/40" />
            </div>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-[26px] font-semibold tracking-tight">{item.value}</span>
              <span
                className={`mb-1 flex items-center gap-0.5 text-[12px] font-medium ${
                  item.positive ? 'text-emerald-600' : 'text-red-500'
                }`}
              >
                {item.positive ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {item.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Quick Actions */}
      <div className="mt-5 grid gap-3.5 md:grid-cols-[2fr_1fr]">
        {/* Chart */}
        <div className="rounded-2xl border border-border/40 bg-card/50 p-5">
          <h2 className="text-[14px] font-medium">Activity</h2>
          <div className="mt-4 flex items-end gap-[3px]" style={{ height: 80 }}>
            {chartData.map((v, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-muted/60 transition-colors hover:bg-foreground/20"
                style={{ height: `${v}%` }}
              />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-border/40 bg-card/50 p-5">
          <h2 className="text-[14px] font-medium">Quick Actions</h2>
          <div className="mt-3 flex flex-col gap-2">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                to={action.to}
                className="group flex items-center justify-between rounded-xl border border-border/30 px-3.5 py-3 transition-all hover:border-border/60 hover:bg-muted/30"
              >
                <div>
                  <p className="text-[13px] font-medium">{action.title}</p>
                  <p className="text-[11px] text-muted-foreground">{action.desc}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 transition-colors group-hover:text-foreground/60" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-5 rounded-2xl border border-border/40 bg-card/50 p-5">
        <h2 className="text-[14px] font-medium">Recent Activity</h2>
        <div className="mt-3 flex flex-col gap-0.5">
          {activities.map((act, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <span className={`h-1.5 w-1.5 rounded-full ${act.color}`} />
                <span className="text-[13px]">{act.text}</span>
              </div>
              <span className="text-[11px] text-muted-foreground">{act.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const quickActions = [
  { title: 'Browse users', desc: 'Explore the virtual list', to: '/examples/users' },
  { title: 'Manage settings', desc: 'Update your preferences', to: '/examples/settings' },
]

const activities = [
  { text: 'New user registered: sarah@example.com', time: '2 min ago', color: 'bg-emerald-500' },
  { text: 'Settings updated by admin', time: '15 min ago', color: 'bg-blue-400' },
  { text: 'Database backup completed', time: '1 hour ago', color: 'bg-emerald-500' },
  { text: 'New deployment: v1.2.3', time: '3 hours ago', color: 'bg-blue-400' },
  { text: 'User role updated: editor → admin', time: '5 hours ago', color: 'bg-amber-400' },
  { text: 'Failed login attempt detected', time: '6 hours ago', color: 'bg-red-400' },
]
