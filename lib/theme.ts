export type Theme = 'light' | 'dark' | 'system'

export const THEME_STORAGE_KEY = 'selbstwirksamkeit-theme'

export function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

export function applyTheme(theme: Theme) {
  const resolved = resolveTheme(theme)
  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(resolved)
}
