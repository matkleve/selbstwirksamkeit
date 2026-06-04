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
        <header className="sticky top-0 z-40 flex h-[52px] items-center justify-between border-b border-edge bg-canvas px-5">
          <span className="inline-flex items-center gap-2 font-display text-[1.0625rem] font-normal italic text-ink">
            <Sprout size={18} strokeWidth={1.75} className="shrink-0 text-ink-2" aria-hidden />
            Selbstwirksamkeit
          </span>
          <MenuDropdown />
        </header>

        <div className="app-main">
          {children}
        </div>

        <BottomTabBar />
      </div>
    </EntriesProvider>
  )
}
