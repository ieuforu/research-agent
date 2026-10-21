import { Cpu, Scaling, Globe, Rocket } from 'lucide-react'

const features = [
  {
    badge: 'POWER ENGINE',
    icon: Cpu,
    title: 'Financial Performance.',
    description: 'Run financial operations on high-speed infrastructure.',
    chart: ChartPerformance,
  },
  {
    badge: 'AUTO SCALE',
    icon: Scaling,
    title: 'Instant Scalability.',
    description: 'Automatically scale services in real time with no setup or manual.',
    chart: ChartScalability,
  },
  {
    badge: 'GLOBAL REACH',
    icon: Globe,
    title: 'Global Coverage.',
    description: 'Deliver low-latency access across 50+ global locations.',
    chart: ChartGlobal,
  },
  {
    badge: 'SWIFT DEPLOY',
    icon: Rocket,
    title: 'Workflow Deployment.',
    description: 'Deploy APIs or financial models using Git or CLI.',
    chart: ChartDeploy,
  },
]

function ChartPerformance() {
  return (
    <svg viewBox="0 0 200 100" className="h-full w-full" fill="none">
      <line x1="0" y1="25" x2="200" y2="25" stroke="#e5e7eb" strokeWidth="0.5" />
      <line x1="0" y1="50" x2="200" y2="50" stroke="#e5e7eb" strokeWidth="0.5" />
      <line x1="0" y1="75" x2="200" y2="75" stroke="#e5e7eb" strokeWidth="0.5" />
      <path
        d="M0,80 C20,78 30,75 50,70 C70,65 80,55 100,50 C120,45 140,30 160,20 C170,15 180,18 200,10"
        stroke="#0ea5e9"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M0,80 C20,78 30,75 50,70 C70,65 80,55 100,50 C120,45 140,30 160,20 C170,15 180,18 200,10 L200,100 L0,100 Z"
        fill="url(#blueGrad)"
        opacity="0.1"
      />
      <defs>
        <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="70" r="3" fill="#0ea5e9" />
      <circle cx="100" cy="50" r="3" fill="#0ea5e9" />
      <circle cx="160" cy="20" r="3" fill="#0ea5e9" />
    </svg>
  )
}

function ChartScalability() {
  return (
    <svg viewBox="0 0 200 100" className="h-full w-full" fill="none">
      <line x1="0" y1="25" x2="200" y2="25" stroke="#e5e7eb" strokeWidth="0.5" />
      <line x1="0" y1="50" x2="200" y2="50" stroke="#e5e7eb" strokeWidth="0.5" />
      <line x1="0" y1="75" x2="200" y2="75" stroke="#e5e7eb" strokeWidth="0.5" />
      <line
        x1="0"
        y1="40"
        x2="200"
        y2="40"
        stroke="#0ea5e9"
        strokeWidth="1"
        strokeDasharray="4 4"
        opacity="0.4"
      />
      <path
        d="M0,70 C15,70 20,70 30,70 C40,70 45,68 50,65 C55,62 60,40 65,35 C70,30 75,32 80,35 C90,40 95,45 100,55 C110,65 115,62 120,58 C125,54 130,38 135,30 C140,22 150,20 160,22 C170,24 175,30 180,38 C190,50 195,45 200,42"
        stroke="#0ea5e9"
        strokeWidth="2"
        fill="none"
      />
      <circle cx="65" cy="35" r="3" fill="#0ea5e9" />
      <circle cx="135" cy="30" r="3" fill="#0ea5e9" />
    </svg>
  )
}

function ChartGlobal() {
  return (
    <svg viewBox="0 0 200 100" className="h-full w-full" fill="none">
      <ellipse cx="100" cy="50" rx="80" ry="40" stroke="#e5e7eb" strokeWidth="0.8" fill="none" />
      <ellipse cx="100" cy="50" rx="40" ry="40" stroke="#e5e7eb" strokeWidth="0.5" fill="none" />
      <ellipse cx="100" cy="50" rx="80" ry="15" stroke="#e5e7eb" strokeWidth="0.5" fill="none" />
      <line x1="20" y1="50" x2="180" y2="50" stroke="#e5e7eb" strokeWidth="0.5" />
      <circle cx="55" cy="38" r="4" fill="#0ea5e9" opacity="0.8" />
      <circle cx="90" cy="45" r="4" fill="#0ea5e9" opacity="0.8" />
      <circle cx="130" cy="42" r="4" fill="#0ea5e9" opacity="0.8" />
      <circle cx="115" cy="55" r="4" fill="#0ea5e9" opacity="0.8" />
      <circle cx="70" cy="58" r="4" fill="#0ea5e9" opacity="0.8" />
      <circle cx="155" cy="50" r="4" fill="#0ea5e9" opacity="0.8" />
      <path d="M55,38 Q72,40 90,45" stroke="#0ea5e9" strokeWidth="0.8" opacity="0.4" fill="none" />
      <path
        d="M90,45 Q110,43 130,42"
        stroke="#0ea5e9"
        strokeWidth="0.8"
        opacity="0.4"
        fill="none"
      />
      <path
        d="M90,45 Q102,50 115,55"
        stroke="#0ea5e9"
        strokeWidth="0.8"
        opacity="0.4"
        fill="none"
      />
    </svg>
  )
}

function ChartDeploy() {
  return (
    <svg viewBox="0 0 200 100" className="h-full w-full" fill="none">
      <circle cx="140" cy="50" r="35" stroke="#e5e7eb" strokeWidth="0.8" fill="none" />
      <ellipse cx="140" cy="50" rx="15" ry="35" stroke="#e5e7eb" strokeWidth="0.5" fill="none" />
      <line x1="105" y1="50" x2="175" y2="50" stroke="#e5e7eb" strokeWidth="0.5" />
      <path
        d="M15,50 C30,50 40,48 50,45 C60,42 65,35 70,32 C75,29 80,30 85,35"
        stroke="#0ea5e9"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M15,55 C30,55 45,58 55,60 C65,62 72,58 78,52 C82,48 86,46 90,48"
        stroke="#0ea5e9"
        strokeWidth="1.5"
        fill="none"
      />
      <circle cx="15" cy="50" r="4" fill="#0ea5e9" opacity="0.6" />
      <circle cx="85" cy="35" r="3" fill="#0ea5e9" />
      <circle cx="90" cy="48" r="3" fill="#0ea5e9" />
      <circle cx="140" cy="35" r="2" fill="#0ea5e9" opacity="0.5" />
      <circle cx="155" cy="50" r="2" fill="#0ea5e9" opacity="0.5" />
    </svg>
  )
}

export function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 flex items-center justify-center p-8">
      <div className="w-full max-w-5xl rounded-2xl bg-white shadow-sm p-12 md:p-16">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight leading-snug">
            Smart tools designed to{' '}
            <span className="font-bold">simplify, streamline, and elevate</span> your financial
            workflow.
          </h1>
          <p className="mt-5 text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
            Accelerate decision-making with intelligent automation and real-time financial data you
            can trust.
          </p>
        </div>

        {/* Feature cards */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.badge} className="flex flex-col">
              <div className="inline-flex items-center gap-1.5 self-start rounded bg-gray-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                <f.icon className="h-3 w-3" />
                {f.badge}
              </div>
              <div className="mt-4 h-28 w-full">
                <f.chart />
              </div>
              <h3 className="mt-3 text-sm font-semibold">{f.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
