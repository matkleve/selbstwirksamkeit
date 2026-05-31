import type { Category } from '@/lib/types'

export function CategoryPills({
  categories,
  className = '',
}: {
  categories: Category[]
  className?: string
}) {
  if (!categories.length) return null
  return (
    <span className={`flex flex-wrap gap-1 ${className}`}>
      {categories.map(cat => (
        <span key={cat} className="text-[11px] text-accent bg-accent-light rounded-full px-2 py-0.5">
          {cat}
        </span>
      ))}
    </span>
  )
}
