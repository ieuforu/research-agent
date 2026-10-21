import { Fragment } from 'react'
import { cn } from '#/lib/utils.ts'
import type { ResearchSource } from '../types'

type Block =
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }

const HEADING = /^(#{1,3})\s+(.*)$/
const BULLET = /^[-*]\s+(.*)$/
const ORDERED = /^\d+[.)]\s+(.*)$/

/**
 * Deliberately tiny markdown subset: the model reliably emits headings, bullet
 * lists and paragraphs, and a full markdown dependency would be far more code
 * than the three cases worth rendering.
 */
export function parseReport(text: string): Block[] {
  const blocks: Block[] = []
  let list: { ordered: boolean; items: string[] } | null = null

  const flush = () => {
    if (list) {
      blocks.push({ type: 'list', ordered: list.ordered, items: list.items })
      list = null
    }
  }

  for (const raw of text.split('\n')) {
    const line = raw.trimEnd()

    if (line.trim() === '') {
      flush()
      continue
    }

    const heading = HEADING.exec(line)

    if (heading) {
      flush()
      blocks.push({
        type: 'heading',
        // `#` and `##` both read as a section title; only `###` steps down.
        level: heading[1].length >= 3 ? 3 : 2,
        text: heading[2].trim(),
      })
      continue
    }

    const bullet = BULLET.exec(line) ?? ORDERED.exec(line)

    if (bullet) {
      const ordered = !BULLET.test(line)
      const item = bullet[1].trim()

      if (list && list.ordered === ordered) {
        list.items.push(item)
      } else {
        flush()
        list = { ordered, items: [item] }
      }

      continue
    }

    flush()
    blocks.push({ type: 'paragraph', text: line.trim() })
  }

  flush()

  return blocks
}

const CITE = /\[(\d{1,2})\]/g
const BOLD = /\*\*([^*]+)\*\*/g

function renderInline(text: string, sourceCount: number): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  let cursor = 0
  let index = 0

  // Citations first: they are the only inline marker that turns into a link.
  for (const match of text.matchAll(CITE)) {
    const start = match.index ?? 0
    const number = Number(match[1])

    if (start > cursor) nodes.push(...renderBold(text.slice(cursor, start), index))
    index += 1

    if (number >= 1 && number <= sourceCount) {
      nodes.push(
        <a
          key={`cite-${index}-${number}`}
          href={`#source-${number}`}
          className="mx-0.5 inline-flex items-center rounded bg-muted px-1 align-super text-[10px] font-medium text-muted-foreground no-underline hover:bg-foreground hover:text-background"
        >
          {number}
        </a>,
      )
    } else {
      // A citation outside the retrieved range would be a hallucination; show it
      // as plain text instead of pretending it links somewhere.
      nodes.push(
        <span key={`cite-${index}-${number}`} className="text-muted-foreground/40">
          [{number}]
        </span>,
      )
    }

    cursor = start + match[0].length
  }

  if (cursor < text.length) nodes.push(...renderBold(text.slice(cursor), index))

  return nodes
}

function renderBold(text: string, keyBase: number): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  let cursor = 0
  let index = 0

  for (const match of text.matchAll(BOLD)) {
    const start = match.index ?? 0

    if (start > cursor)
      nodes.push(<Fragment key={`t-${keyBase}-${index}`}>{text.slice(cursor, start)}</Fragment>)
    index += 1
    nodes.push(
      <strong key={`b-${keyBase}-${index}`} className="font-semibold">
        {match[1]}
      </strong>,
    )
    cursor = start + match[0].length
  }

  if (cursor < text.length)
    nodes.push(<Fragment key={`t-${keyBase}-end`}>{text.slice(cursor)}</Fragment>)

  return nodes
}

export function ReportBody({
  text,
  sources,
  streaming,
}: {
  text: string
  sources: ResearchSource[]
  streaming?: boolean
}) {
  const blocks = parseReport(text)

  return (
    <div className="flex flex-col gap-3 text-[14px] leading-relaxed">
      {blocks.map((block, blockIndex) => {
        if (block.type === 'heading') {
          return (
            <h3
              key={blockIndex}
              className={cn(
                'font-semibold tracking-tight',
                block.level === 2 ? 'mt-2 text-[16px]' : 'mt-1 text-[14px]',
              )}
            >
              {renderInline(block.text, sources.length)}
            </h3>
          )
        }

        if (block.type === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul'

          return (
            <ListTag
              key={blockIndex}
              className={cn(
                'flex flex-col gap-1.5 pl-5',
                block.ordered ? 'list-decimal' : 'list-disc',
              )}
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderInline(item, sources.length)}</li>
              ))}
            </ListTag>
          )
        }

        return <p key={blockIndex}>{renderInline(block.text, sources.length)}</p>
      })}

      {streaming && (
        <span className="inline-block h-4 w-[2px] animate-pulse bg-foreground align-text-bottom" />
      )}
    </div>
  )
}
