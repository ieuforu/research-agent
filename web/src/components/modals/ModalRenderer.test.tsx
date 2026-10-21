import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'jotai'
import { describe, expect, it, vi } from 'vitest'
import { useModal, type ConfirmModalData } from '#/stores/modal.store'
import { ModalRenderer } from './ModalRenderer'

function Harness({ data }: { data?: ConfirmModalData }) {
  const { open } = useModal()
  return (
    <>
      <button onClick={() => open('confirm', data)}>Open confirmation</button>
      <button>Background action</button>
      <ModalRenderer />
    </>
  )
}

async function openModal(data?: ConfirmModalData) {
  const user = userEvent.setup()
  const { container } = render(
    <Provider>
      <Harness data={data} />
    </Provider>,
  )
  const opener = screen.getByRole('button', { name: 'Open confirmation' })
  await user.click(opener)
  const dialog = await screen.findByRole('dialog')
  return { user, opener, dialog, container }
}

function overlay() {
  const element = document.querySelector<HTMLElement>('[data-slot="dialog-overlay"]')
  if (!element) throw new Error('Dialog overlay is missing')
  return element
}

describe('global confirmation dialog', () => {
  it('portals the dialog, labels it, and keeps keyboard focus inside', async () => {
    const { user, dialog, container } = await openModal({
      title: 'Delete project?',
      description: 'All project files will be removed.',
      confirmLabel: 'Delete',
    })
    expect(dialog).toHaveAccessibleName('Delete project?')
    expect(dialog).toHaveAccessibleDescription('All project files will be removed.')
    expect(container).not.toContainElement(dialog)
    const cancel = within(dialog).getByRole('button', { name: 'Cancel' })
    const confirm = within(dialog).getByRole('button', { name: 'Delete' })
    await waitFor(() => expect(cancel).toHaveFocus())
    await user.tab({ shift: true })
    await waitFor(() => expect(confirm).toHaveFocus())
    await user.tab()
    await waitFor(() => expect(cancel).toHaveFocus())
  })

  it.each(['cancel', 'escape', 'outside'] as const)(
    'supports %s dismissal without confirming',
    async (method) => {
      const onConfirm = vi.fn()
      const { user, dialog, opener } = await openModal({ onConfirm })
      if (method === 'cancel') {
        await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
      } else if (method === 'escape') {
        await user.keyboard('{Escape}')
      } else {
        await user.click(overlay())
      }
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      // jsdom cannot detect focus({ preventScroll }) support, which Base UI checks
      // for outside presses. Exercise focus restoration through Cancel and Escape.
      if (method !== 'outside') await waitFor(() => expect(opener).toHaveFocus())
      expect(onConfirm).not.toHaveBeenCalled()
    },
  )

  it('waits for success and blocks duplicate submissions and dismissal while pending', async () => {
    let finish!: () => void
    const task = new Promise<void>((resolve) => {
      finish = resolve
    })
    const onConfirm = vi.fn(() => task)
    const { user, dialog, opener } = await openModal({ onConfirm })
    await user.dblClick(within(dialog).getByRole('button', { name: 'Confirm' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(dialog).toHaveAttribute('aria-busy', 'true')
    expect(within(dialog).getByRole('button', { name: 'Working…' })).toBeDisabled()
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeDisabled()
    await user.keyboard('{Escape}')
    await user.click(overlay())
    expect(screen.getByRole('dialog')).toBe(dialog)

    await act(async () => finish())
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(opener).toHaveFocus())
  })

  it('keeps a failed confirmation open, announces the error, and allows retry', async () => {
    const onConfirm = vi
      .fn<NonNullable<ConfirmModalData['onConfirm']>>()
      .mockRejectedValueOnce(new Error('Unable to delete the project'))
      .mockResolvedValueOnce(undefined)
    const { user, dialog } = await openModal({ onConfirm })
    await user.click(within(dialog).getByRole('button', { name: 'Confirm' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to delete the project')
    expect(dialog).toHaveAttribute('aria-busy', 'false')
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeEnabled()

    await user.click(within(dialog).getByRole('button', { name: 'Confirm' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(onConfirm).toHaveBeenCalledTimes(2)
  })

  it('handles a synchronous non-Error failure without closing the dialog', async () => {
    const { user, dialog } = await openModal({
      onConfirm: () => {
        throw { reason: 'failed' }
      },
    })
    await user.click(within(dialog).getByRole('button', { name: 'Confirm' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to complete this action. Please try again.',
    )
    expect(within(dialog).getByRole('button', { name: 'Confirm' })).toBeEnabled()
  })

  it('preserves a follow-up modal opened by the confirmation callback', async () => {
    function FollowUp() {
      const { open } = useModal()
      return (
        <>
          <button
            onClick={() =>
              open('confirm', {
                title: 'First',
                onConfirm: () => {
                  open('confirm', { title: 'Second' })
                },
              })
            }
          >
            Open
          </button>
          <ModalRenderer />
        </>
      )
    }
    const user = userEvent.setup()
    render(
      <Provider>
        <FollowUp />
      </Provider>,
    )
    await user.click(screen.getByRole('button', { name: 'Open' }))
    await user.click(screen.getByRole('button', { name: 'Confirm' }))
    const dialog = await screen.findByRole('dialog', { name: 'Second' })
    expect(dialog).toHaveAttribute('aria-busy', 'false')
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
