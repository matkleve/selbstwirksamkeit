export type Category = 'allgemein' | 'studium' | 'arbeit / bewerbung' | 'projekt' | 'persönlich'

export interface Entry {
  id: string
  user_id: string
  text: string
  category: Category
  created_at: string
}
