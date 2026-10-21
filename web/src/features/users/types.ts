export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
  status: 'active' | 'inactive' | 'suspended'
  avatar: string
  department: string
  joinDate: string
  lastActive: string
  location: string
  bio: string
}
