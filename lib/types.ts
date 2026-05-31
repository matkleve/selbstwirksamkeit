export type Category = 'allgemein' | 'studium' | 'arbeit / bewerbung' | 'projekt' | 'persönlich'

export interface Entry {
  id: string
  user_id: string
  text: string
  categories: Category[]
  created_at: string
}
