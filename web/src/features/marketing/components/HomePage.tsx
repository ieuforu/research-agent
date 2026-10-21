import { ArrowRight } from 'lucide-react'
import { buttonVariants } from '#/components/ui/button'
import { ComponentShowcase } from './ComponentShowcase'
import { ExampleShowcase } from './ExampleShowcase'

export function Home() {
  return (
    <>
      <section className="landing-hero">
        <p className="landing-eyebrow">
          <span />
          React / Components / Examples
        </p>
        <h1>
          A fresh start.
          <br />
          <em>Ready to build.</em>
        </h1>
        <p className="landing-description">
          Your React template, brought together.
          <br />
          Explore the components. Try an example. Make it yours.
        </p>
        <div className="landing-actions">
          <a href="#components" className={buttonVariants({ size: 'lg' })}>
            Explore components <ArrowRight aria-hidden="true" />
          </a>
          <a href="#examples" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            Browse examples
          </a>
        </div>
      </section>
      <ComponentShowcase />
      <ExampleShowcase />
    </>
  )
}
