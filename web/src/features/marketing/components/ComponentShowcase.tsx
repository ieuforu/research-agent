import { useState } from 'react'
import { ArrowRight, ArrowUpRight, Check, Heart } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card'
import { useModal } from '#/stores/modal.store'

export function ComponentShowcase() {
  const [favorite, setFavorite] = useState(false)
  const [name, setName] = useState('')
  const [project, setProject] = useState('Your next project')
  const [message, setMessage] = useState('')
  const [saved, setSaved] = useState(false)
  const { open } = useModal()

  return (
    <section id="components" className="landing-section" aria-labelledby="components-title">
      <div className="landing-section-title">
        <div>
          <h2 id="components-title">The building blocks.</h2>
          <p>shadcn/ui components, ready to explore.</p>
        </div>
        <span>01 / COMPONENTS</span>
      </div>
      <div className="landing-components">
        <Card className="landing-component">
          <CardHeader>
            <CardDescription className="landing-component-label">
              Button <span>01</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="landing-button-row">
              <Button size="lg" onClick={() => setMessage('Ready for your next step.')}>
                Continue <ArrowRight aria-hidden="true" />
              </Button>
              <Button
                size="icon-lg"
                variant="outline"
                aria-label="Favorite example"
                aria-pressed={favorite}
                onClick={() => setFavorite(!favorite)}
              >
                <Heart aria-hidden="true" fill={favorite ? 'currentColor' : 'none'} />
              </Button>
            </div>
            <div className="landing-button-row">
              <Button variant="secondary" onClick={() => setMessage('Secondary action selected.')}>
                Secondary
              </Button>
              <Button variant="ghost" onClick={() => setMessage('Ghost action selected.')}>
                Ghost
              </Button>
            </div>
            <p className="landing-component-note">A primary action. A quieter alternative.</p>
          </CardContent>
        </Card>
        <Card className="landing-component">
          <CardHeader>
            <CardDescription className="landing-component-label">
              Input & Label <span>02</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                if (!name.trim()) return
                setProject(name.trim())
                setSaved(true)
              }}
            >
              <Label htmlFor="project-name">Project name</Label>
              <div className="landing-input-row">
                <Input
                  id="project-name"
                  name="projectName"
                  placeholder="My next project"
                  maxLength={40}
                  required
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value)
                    setSaved(false)
                  }}
                />
                <Button type="submit" size="lg" disabled={!name.trim()}>
                  Save
                </Button>
              </div>
              <p className="landing-component-note" role="status">
                {saved ? 'Saved for this visit.' : 'Give your next idea a name.'}
              </p>
            </form>
          </CardContent>
        </Card>
        <Card className="landing-component">
          <CardHeader>
            <CardDescription className="landing-component-label">
              Card <span>03</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CardTitle className="landing-project-name">{project}</CardTitle>
            <CardDescription className="landing-project-copy">
              A small space for something new.
            </CardDescription>
            <div className="landing-member-line">
              <div className="landing-avatars" aria-label="Three sample members">
                <span>EW</span>
                <span>LJ</span>
                <span>OS</span>
              </div>
              <span className="landing-status">
                <span />
                In progress
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="landing-dialog-strip">
        <div>
          <span className="landing-dialog-icon">
            <ArrowUpRight aria-hidden="true" />
          </span>
          <div>
            <h3>One decision. A little focus.</h3>
            <p>Try the confirmation dialog.</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="lg"
          onClick={() =>
            open('confirm', {
              title: 'Ready to continue?',
              description:
                'A clear choice, with a little room to think. This example only updates the page.',
              confirmLabel: 'Confirm',
              onConfirm: () => setMessage('Example confirmed.'),
            })
          }
        >
          Open dialog <ArrowUpRight aria-hidden="true" />
        </Button>
      </div>
      <p className="landing-feedback" role="status">
        {message && (
          <>
            <Check aria-hidden="true" />
            {message}
          </>
        )}
      </p>
    </section>
  )
}
