'use client'

import { Sprout } from 'lucide-react'
import BottomTabBar from './BottomTabBar'
import MenuDropdown from './MenuDropdown'
import { EntriesProvider } from '@/components/EntriesProvider'
import { PushRegistrar } from '@/components/PushRegistrar'
interface Props {
  children: React.ReactNode
}

export function AppShell({ children }: Props) {
  return (
    <EntriesProvider>
      <PushRegistrar />
      <div className="min-h-screen bg-canvas">
        <header className="sticky top-0 z-40 bg-canvas">
          <div className="app-content flex h-[52px] items-center justify-between">
            <span className="inline-flex items-center gap-2 font-display text-[1.0625rem] font-normal italic text-ink">
              <Sprout size={18} strokeWidth={1.75} className="shrink-0 text-ink-2" aria-hidden />
              Selbstwirksamkeit
            </span>
            <MenuDropdown />
          </div>
        </header>

        <div className="app-main app-content">
          {children}
        </div>

        <BottomTabBar />
      </div>
    </EntriesProvider>
  )
}
