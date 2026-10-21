import { SectionCard, FieldGroup, Field, Input } from './settings-ui'

export function ProfileSection() {
  return (
    <div className="space-y-4">
      <SectionCard title="Personal information" desc="Update your profile details">
        <FieldGroup>
          <Field label="Avatar">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-[14px] font-medium text-background">
                U
              </div>
              <button className="text-[13px] text-foreground underline underline-offset-2">
                Change
              </button>
            </div>
          </Field>
          <Field label="Full name">
            <Input defaultValue="John Doe" />
          </Field>
          <Field label="Email" hint="Used for sign-in and notifications">
            <Input defaultValue="john@example.com" type="email" />
          </Field>
          <Field label="Username">
            <Input defaultValue="johndoe" />
          </Field>
          <Field label="Bio">
            <textarea
              defaultValue="Building cool things."
              rows={3}
              className="flex w-full resize-none rounded-lg border border-border/60 bg-background px-3 py-2 text-[13px] outline-none transition-all placeholder:text-muted-foreground/40 focus:border-foreground/30 focus:ring-2 focus:ring-foreground/[0.06]"
            />
          </Field>
        </FieldGroup>
      </SectionCard>

      <div className="flex justify-end">
        <button className="rounded-lg bg-foreground px-4 py-2 text-[13px] font-medium text-background transition-all hover:opacity-90 active:scale-[0.99]">
          Save changes
        </button>
      </div>
    </div>
  )
}
