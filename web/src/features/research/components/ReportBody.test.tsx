import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { parseReport, ReportBody } from './ReportBody'

describe('parseReport', () => {
  it('groups consecutive bullets and keeps paragraphs separate', () => {
    const blocks = parseReport('引言段落\n\n- 一\n- 二\n\n结尾段落')

    expect(blocks).toEqual([
      { type: 'paragraph', text: '引言段落' },
      { type: 'list', ordered: false, items: ['一', '二'] },
      { type: 'paragraph', text: '结尾段落' },
    ])
  })

  it('distinguishes ordered lists from bullets', () => {
    expect(parseReport('1. 先\n2. 后')).toEqual([
      { type: 'list', ordered: true, items: ['先', '后'] },
    ])
  })

  it('maps heading levels and flushes the active list', () => {
    expect(parseReport('## 标题\n- 项\n### 小标题')).toEqual([
      { type: 'heading', level: 2, text: '标题' },
      { type: 'list', ordered: false, items: ['项'] },
      { type: 'heading', level: 3, text: '小标题' },
    ])
  })

  it('treats carriage returns and trailing spaces as plain text', () => {
    expect(parseReport('  一段  \n\n')).toEqual([{ type: 'paragraph', text: '一段' }])
  })
})

describe('ReportBody', () => {
  const sources = [
    { title: 'A', url: 'https://example.com/a', snippet: 'a' },
    { title: 'B', url: 'https://example.com/b', snippet: 'b' },
  ]

  it('turns in-range citations into anchors to the source list', () => {
    render(<ReportBody text="结论见 [1] 与 [2]。" sources={sources} />)

    expect(screen.getByRole('link', { name: '1' })).toHaveAttribute('href', '#source-1')
    expect(screen.getByRole('link', { name: '2' })).toHaveAttribute('href', '#source-2')
  })

  it('renders an out-of-range citation as text, not a dead link', () => {
    render(<ReportBody text="编造的引用 [7]。" sources={sources} />)

    expect(screen.getByText('[7]')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: '7' })).not.toBeInTheDocument()
  })

  it('renders bold spans', () => {
    render(<ReportBody text="**重点** 内容" sources={[]} />)

    expect(screen.getByText('重点').tagName).toBe('STRONG')
  })

  it('shows a caret while streaming', () => {
    const { container } = render(<ReportBody text="进行中" sources={[]} streaming />)

    expect(container.querySelector('.animate-pulse')).not.toBeNull()
  })
})
