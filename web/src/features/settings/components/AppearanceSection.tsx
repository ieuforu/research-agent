import { SectionCard, FieldGroup, Field } from './settings-ui'

export function AppearanceSection() {
  return (
    <div className="space-y-4">
      <SectionCard title="Theme" desc="Customize how the app looks">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Light', active: true },
            { label: 'Dark', active: false },
            { label: 'System', active: false },
          ].map((t) => (
            <button
              key={t.label}
              className={`rounded-xl border p-4 text-center text-[13px] font-medium transition-all ${
                t.active
                  ? 'border-foreground/30 bg-foreground/[0.04] text-foreground'
                  : 'border-border/40 text-muted-foreground hover:border-border/70'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Accent color" desc="Choose your highlight color">
        <div className="flex gap-2.5">
          {[
            'oklch(0.55 0.2 260)',
            'oklch(0.55 0.2 150)',
            'oklch(0.55 0.2 30)',
            'oklch(0.55 0.2 0)',
            'oklch(0.55 0.15 300)',
          ].map((c, i) => (
            <button
              key={c}
              className={`h-8 w-8 rounded-full transition-transform hover:scale-110 ${
                i === 0 ? 'ring-2 ring-offset-2 ring-foreground' : ''
              }`}
              style={{ background: c }}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Sidebar" desc="Customize sidebar behavior">
        <FieldGroup>
          <Field label="Compact mode" hint="Show fewer items in sidebar">
            <div className="flex justify-end">
              <div className="h-5 w-9 rounded-full bg-foreground/20 p-0.5">
                <div className="h-4 w-4 rounded-full bg-foreground shadow-sm" />
              </div>
            </div>
          </Field>
        </FieldGroup>
      </SectionCard>
    </div>
  )
}
