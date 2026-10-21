import type { User } from './types'

// Deterministic PRNG for consistent mock data
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const firstNames = [
  'Emma',
  'Liam',
  'Olivia',
  'Noah',
  'Ava',
  'Elijah',
  'Sophia',
  'James',
  'Isabella',
  'Lucas',
  'Mia',
  'Mason',
  'Charlotte',
  'Ethan',
  'Amelia',
  'Logan',
  'Harper',
  'Alexander',
  'Evelyn',
  'Sebastian',
  'Aria',
  'Jack',
  'Chloe',
  'Aiden',
  'Abigail',
  'Owen',
  'Emily',
  'Samuel',
  'Ella',
  'Ryan',
  'Scarlett',
  'Nathan',
  'Grace',
  'Caleb',
  'Lily',
  'Hunter',
  'Victoria',
  'Henry',
  'Riley',
  'Daniel',
  'Zoey',
  'Matthew',
  'Nora',
  'Wyatt',
  'Layla',
  'Carter',
  'Penelope',
  'Michael',
  'Hannah',
  'David',
]

const lastNames = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
  'Hernandez',
  'Lopez',
  'Gonzalez',
  'Wilson',
  'Anderson',
  'Thomas',
  'Taylor',
  'Moore',
  'Jackson',
  'Martin',
  'Lee',
  'Perez',
  'Thompson',
  'White',
  'Harris',
  'Sanchez',
  'Clark',
  'Ramirez',
  'Lewis',
  'Robinson',
  'Walker',
  'Young',
  'Allen',
  'King',
  'Wright',
  'Scott',
  'Torres',
  'Nguyen',
  'Hill',
  'Flores',
  'Green',
  'Adams',
  'Nelson',
  'Baker',
  'Hall',
  'Rivera',
  'Campbell',
  'Mitchell',
]

const departments = [
  'Engineering',
  'Design',
  'Marketing',
  'Sales',
  'Product',
  'Operations',
  'Finance',
  'Legal',
  'HR',
  'Data Science',
]

const locations = [
  'San Francisco, CA',
  'New York, NY',
  'Austin, TX',
  'Seattle, WA',
  'London, UK',
  'Berlin, DE',
  'Tokyo, JP',
  'Toronto, CA',
  'Sydney, AU',
  'Singapore, SG',
  'Paris, FR',
  'Seoul, KR',
]

const bios = [
  'Passionate about building products that make a difference.',
  'Coffee enthusiast and full-stack developer.',
  'Designing the future, one pixel at a time.',
  'Data-driven decision maker with a creative edge.',
  'Remote work advocate and async communication fan.',
  'Turning complex problems into simple solutions.',
  'Building bridges between engineering and design.',
  'Always learning, always shipping.',
]

const roles: User['role'][] = ['admin', 'editor', 'viewer']
const statuses: User['status'][] = ['active', 'inactive', 'suspended']

const roleWeights = [0.08, 0.32, 0.6]
const statusWeights = [0.75, 0.18, 0.07]

function weightedPick<T>(items: T[], weights: number[], rand: () => number): T {
  const r = rand()
  let sum = 0
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i]
    if (r < sum) return items[i]
  }
  return items[items.length - 1]
}

function generateUser(id: number, rand: () => number): User {
  const firstName = firstNames[Math.floor(rand() * firstNames.length)]
  const lastName = lastNames[Math.floor(rand() * lastNames.length)]
  const name = `${firstName} ${lastName}`
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${id}@example.com`

  // Random date in last 3 years
  const now = Date.now()
  const threeYears = 3 * 365 * 24 * 60 * 60 * 1000
  const joinTimestamp = now - Math.floor(rand() * threeYears)
  const lastActiveTimestamp = joinTimestamp + Math.floor(rand() * (now - joinTimestamp))

  return {
    id,
    name,
    email,
    role: weightedPick(roles, roleWeights, rand),
    status: weightedPick(statuses, statusWeights, rand),
    avatar: `https://api.dicebear.com/9.x/notionists/svg?seed=${id}`,
    department: departments[Math.floor(rand() * departments.length)],
    joinDate: new Date(joinTimestamp).toISOString().split('T')[0],
    lastActive: new Date(lastActiveTimestamp).toISOString().split('T')[0],
    location: locations[Math.floor(rand() * locations.length)],
    bio: bios[Math.floor(rand() * bios.length)],
  }
}

// Pre-generate all 100k users
const TOTAL = 100_000
const users: User[] = new Array(TOTAL)
const rand = mulberry32(42)
for (let i = 0; i < TOTAL; i++) {
  users[i] = generateUser(i + 1, rand)
}

// Simulate network delay
function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function fetchUsers({
  page = 1,
  pageSize = 50,
  search = '',
}: {
  page?: number
  pageSize?: number
  search?: string
}) {
  await delay(200 + Math.random() * 200)

  let filtered = users
  if (search) {
    const q = search.toLowerCase()
    filtered = users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q),
    )
  }

  const start = (page - 1) * pageSize
  return {
    data: filtered.slice(start, start + pageSize),
    total: filtered.length,
    page,
    pageSize,
    totalPages: Math.ceil(filtered.length / pageSize),
  }
}

export async function fetchUserById(id: number) {
  await delay(150 + Math.random() * 100)
  const user = users.find((u) => u.id === id)
  if (!user) throw new Error(`User ${id} not found`)
  return user
}
