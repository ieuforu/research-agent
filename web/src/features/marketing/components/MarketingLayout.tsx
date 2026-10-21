import { Link, Outlet } from '@tanstack/react-router'
import { ArrowUpRight, Atom } from 'lucide-react'
import '../styles/landing.css'

export function MarketingLayout() {
  return (
    <div className="starter-home">
      <div className="landing-page">
        <a className="landing-skip" href="#main">
          Skip to content
        </a>
        <header className="landing-topbar">
          <Link to="/" className="landing-brand">
            <Atom aria-hidden="true" />
            React Starter
          </Link>
          <nav aria-label="Main navigation" className="landing-nav">
            <Link to="/" hash="components">
              Components
            </Link>
            <Link to="/" hash="examples">
              Examples
            </Link>
            <a
              className="landing-docs"
              href="https://ui.shadcn.com/docs"
              target="_blank"
              rel="noreferrer"
            >
              shadcn/ui <ArrowUpRight aria-hidden="true" />
            </a>
          </nav>
        </header>
        <main id="main">
          <Outlet />
        </main>
        <footer className="landing-footer">
          <span>React Starter · A good place to begin.</span>
          <div>
            <a href="https://react.dev/learn" target="_blank" rel="noreferrer">
              React docs ↗
            </a>
            <a href="https://ui.shadcn.com/docs" target="_blank" rel="noreferrer">
              shadcn/ui ↗
            </a>
          </div>
        </footer>
      </div>
    </div>
  )
}
