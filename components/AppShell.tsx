import BottomTabBar from './BottomTabBar'
import MenuDropdown from './MenuDropdown'

interface Props {
  children: React.ReactNode
}

export function AppShell({ children }: Props) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'var(--bg-base)',
        borderBottom: '1px solid var(--border)',
        padding: '0 20px',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{
          fontFamily: 'var(--font-display), Georgia, serif',
          fontSize: '1.0625rem',
          fontWeight: 400,
          color: 'var(--text-primary)',
          fontStyle: 'italic',
        }}>
          Selbstwirksamkeit
        </span>
        <MenuDropdown />
      </header>

      {/* Page content */}
      <div style={{
        maxWidth: 540,
        width: '100%',
        margin: '0 auto',
        padding: '20px 16px',
        paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
      }}>
        {children}
      </div>

      <BottomTabBar />
    </div>
  )
}
