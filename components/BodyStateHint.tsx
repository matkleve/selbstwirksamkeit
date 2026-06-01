interface BodyStateHintProps {
  hint: string
}

export default function BodyStateHint({ hint }: BodyStateHintProps) {
  return (
    <p style={{
      fontSize: '0.875rem',
      color: 'var(--text-muted)',
      fontStyle: 'italic',
      fontFamily: 'var(--font-display)',
      marginBottom: 8,
      lineHeight: 1.5,
    }}>
      {hint}
    </p>
  )
}
