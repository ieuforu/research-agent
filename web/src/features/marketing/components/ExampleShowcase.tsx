import { Link } from '@tanstack/react-router'
import { ArrowRight, Search } from 'lucide-react'
import { buttonVariants } from '#/components/ui/button'
import { chartData, stats } from '#/features/dashboard/mock'

const previewUsers = [
  { name: 'Emma Wilson', initials: 'EW', role: 'Admin' },
  { name: 'Liam Johnson', initials: 'LJ', role: 'Editor' },
  { name: 'Olivia Smith', initials: 'OS', role: 'Viewer' },
]

export function ExampleShowcase() {
  return (
    <section id="examples" className="landing-section" aria-labelledby="examples-title">
      <div className="landing-section-title">
        <div>
          <h2 id="examples-title">See it come together.</h2>
          <p>Working examples. Reusable blocks.</p>
        </div>
        <span>02 / EXAMPLES & BLOCKS</span>
      </div>
      <div className="landing-examples">
        <article className="landing-example">
          <div className="landing-example-visual" aria-hidden="true">
            <div className="landing-preview-window">
              <div className="landing-window-top">
                <strong>Users</strong>
                <span>100,000 people</span>
              </div>
              <div className="landing-preview-search">
                <Search />
                Search people…
              </div>
              {previewUsers.map((user) => (
                <div key={user.name} className="landing-sample-user">
                  <span className="landing-avatar">{user.initials}</span>
                  <div>
                    <strong>{user.name}</strong>
                    <small>{user.name.toLowerCase().replace(' ', '.')}@example.com</small>
                  </div>
                  <span>{user.role}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="landing-example-caption">
            <div>
              <span className="landing-tag">Example</span>
              <h3>Users / Virtual list</h3>
              <p>Search, scroll, and explore 100k people.</p>
            </div>
            <Link
              to="/examples/users"
              aria-label="Explore Users virtual list"
              className={buttonVariants({ variant: 'outline' })}
            >
              Explore <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </article>
        <article className="landing-example">
          <div className="landing-example-visual" aria-hidden="true">
            <div className="landing-preview-window">
              <div className="landing-window-top">
                <strong>Overview</strong>
                <span>Sample data</span>
              </div>
              <div className="landing-mini-stats">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <small>{stat.label}</small>
                    <strong>{stat.value}</strong>
                    <span>↗ {stat.change}</span>
                  </div>
                ))}
              </div>
              <div className="landing-chart">
                {chartData.map((height, index) => (
                  <span key={index} style={{ height: `${height}%` }} />
                ))}
              </div>
            </div>
          </div>
          <div className="landing-example-caption">
            <div>
              <span className="landing-tag">Block</span>
              <h3>Dashboard / Overview</h3>
              <p>Stats, activity, and everyday actions.</p>
            </div>
            <Link
              to="/examples"
              aria-label="Explore Dashboard block"
              className={buttonVariants({ variant: 'outline' })}
            >
              Explore <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </article>
      </div>
      <p className="landing-lower-note">
        Sample data, room for your ideas. <Link to="/examples/settings">Settings example ↗</Link>
      </p>
    </section>
  )
}
