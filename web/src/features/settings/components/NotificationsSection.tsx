import { SectionCard } from './settings-ui'

export function NotificationsSection() {
  return (
    <div className="space-y-4">
      <SectionCard title="Email notifications" desc="Choose what you receive via email">
        <div className="space-y-4">
          {[
            { label: 'Product updates', desc: 'News about features and improvements', on: true },
            { label: 'Security alerts', desc: 'Important security notifications', on: true },
            { label: 'Marketing', desc: 'Tips, offers, and promotions', on: false },
            { label: 'Weekly digest', desc: 'Summary of your account activity', on: true },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium">{item.label}</p>
                <p className="text-[12px] text-muted-foreground/60">{item.desc}</p>
              </div>
              <div
                className={`h-5 w-9 cursor-pointer rounded-full p-0.5 transition-colors ${
                  item.on ? 'bg-foreground' : 'bg-foreground/20'
                }`}
              >
                <div
                  className={`h-4 w-4 rounded-full bg-background shadow-sm transition-transform ${
                    item.on ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <button className="rounded-lg bg-foreground px-4 py-2 text-[13px] font-medium text-background transition-all hover:opacity-90 active:scale-[0.99]">
          Save preferences
        </button>
      </div>
    </div>
  )
}
