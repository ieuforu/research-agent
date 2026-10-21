import { useState } from 'react'
import { User, Bell, Shield, Palette } from 'lucide-react'
import { ProfileSection } from './ProfileSection'
import { AppearanceSection } from './AppearanceSection'
import { NotificationsSection } from './NotificationsSection'
import { SecuritySection } from './SecuritySection'

type Section = 'profile' | 'appearance' | 'notifications' | 'security'

const navItems = [
  { id: 'profile' as const, label: 'Profile', icon: User },
  { id: 'appearance' as const, label: 'Appearance', icon: Palette },
  { id: 'notifications' as const, label: 'Notifications', icon: Bell },
  { id: 'security' as const, label: 'Security', icon: Shield },
]

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>('profile')

  return (
    <div>
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Settings</h1>
        <p className="mt-0.5 text-[14px] text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      <div className="mt-7 flex gap-8">
        <nav className="w-48 shrink-0 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-all ${
                  isActive
                    ? 'bg-foreground/[0.05] font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="min-w-0 flex-1">
          {activeSection === 'profile' && <ProfileSection />}
          {activeSection === 'appearance' && <AppearanceSection />}
          {activeSection === 'notifications' && <NotificationsSection />}
          {activeSection === 'security' && <SecuritySection />}
        </div>
      </div>
    </div>
  )
}
