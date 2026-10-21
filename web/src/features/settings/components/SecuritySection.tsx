import { SectionCard, FieldGroup, Field, Input } from './settings-ui'

export function SecuritySection() {
  return (
    <div className="space-y-4">
      <SectionCard title="Change password" desc="Update your account password">
        <FieldGroup>
          <Field label="Current password">
            <Input type="password" placeholder="••••••••" />
          </Field>
          <Field label="New password">
            <Input type="password" placeholder="At least 8 characters" />
          </Field>
          <Field label="Confirm password">
            <Input type="password" placeholder="Repeat new password" />
          </Field>
        </FieldGroup>
      </SectionCard>

      <SectionCard title="Two-factor authentication" desc="Add an extra layer of security">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px]">Authenticator app</p>
            <p className="text-[12px] text-muted-foreground/60">Not configured</p>
          </div>
          <button className="rounded-lg border border-border/60 px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-muted/50">
            Set up
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Sessions" desc="Manage your active sessions">
        <div className="space-y-3">
          {[
            { device: 'MacBook Pro — Chrome', location: 'San Francisco, CA', current: true },
            { device: 'iPhone 16 Pro — Safari', location: 'San Francisco, CA', current: false },
          ].map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-border/30 px-4 py-3"
            >
              <div>
                <p className="text-[13px] font-medium">{s.device}</p>
                <p className="text-[12px] text-muted-foreground/60">{s.location}</p>
              </div>
              {s.current ? (
                <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
                  Current
                </span>
              ) : (
                <button className="text-[12px] text-red-500 hover:underline">Revoke</button>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.03]">
        <div className="px-6 py-5">
          <h3 className="text-[15px] font-medium text-red-500">Danger zone</h3>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Permanently delete your account and all associated data.
          </p>
          <button className="mt-3 rounded-lg border border-red-500/30 px-3 py-1.5 text-[13px] font-medium text-red-500 transition-colors hover:bg-red-500/10">
            Delete account
          </button>
        </div>
      </div>
    </div>
  )
}
