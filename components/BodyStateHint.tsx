interface BodyStateHintProps {
  hint: string
}

export default function BodyStateHint({ hint }: BodyStateHintProps) {
  return (
    <p className="text-quote mb-2 text-sm">
      {hint}
    </p>
  )
}
