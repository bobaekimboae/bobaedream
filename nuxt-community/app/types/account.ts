export interface AccountItem {
  id: string
  label: string
  icon: string
  description: string
  badge?: string
  action?: 'favorites' | 'register' | 'dealer' | 'support' | 'feedback'
}
export interface AccountGroup { id: string; label: string; items: AccountItem[] }
