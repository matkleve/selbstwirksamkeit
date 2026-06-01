export default function MainLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} aria-busy="true" aria-label="Lädt">
      {[1, 2, 3].map(i => (
        <div
          key={i}
          style={{
            height: i === 1 ? 120 : 88,
            borderRadius: 12,
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border)',
            animation: 'pulse 1.2s ease-in-out infinite',
          }}
        />
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
      `}</style>
    </div>
  )
}
