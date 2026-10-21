import { afterEach, describe, it, expect, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { createStore, Provider } from 'jotai'
import { isAnyModalOpenAtom, topModalAtom, useModal } from './modal.store'

afterEach(() => vi.restoreAllMocks())

// We can test the atoms directly without React
describe('modal store atoms', () => {
  it('isAnyModalOpenAtom is false by default', () => {
    const store = createStore()
    expect(store.get(isAnyModalOpenAtom)).toBe(false)
  })

  it('topModalAtom is null by default', () => {
    const store = createStore()
    expect(store.get(topModalAtom)).toBeNull()
  })

  it('can close one of two modals opened in the same millisecond', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1234)
    const { result } = renderHook(() => useModal(), { wrapper: Provider })
    let first = ''
    let second = ''
    act(() => {
      first = result.current.open('confirm', { title: 'First' })
      second = result.current.open('confirm', { title: 'Second' })
    })

    expect(first).not.toBe(second)
    act(() => result.current.close(first))
    expect(result.current.topModal?.id).toBe(second)
    act(() => result.current.close(second))
    expect(result.current.topModal).toBeNull()
  })

  it('returns to the previous entry when closing the top, and can clear the stack', () => {
    const { result } = renderHook(() => useModal(), { wrapper: Provider })
    let first = ''
    act(() => {
      first = result.current.open('confirm', { title: 'First' })
      result.current.open('confirm', { title: 'Second' })
    })
    act(() => result.current.close())
    expect(result.current.topModal?.id).toBe(first)
    act(() => result.current.closeAll())
    expect(result.current.topModal).toBeNull()
  })

  it('rejects an unknown type without hiding the current modal', () => {
    const { result } = renderHook(() => useModal(), { wrapper: Provider })
    act(() => result.current.open('confirm', { title: 'Keep me' }))
    expect(() => {
      // @ts-expect-error A misspelled modal name must also fail type checking.
      result.current.open('confrim')
    }).toThrow('Unknown modal type: confrim')
    expect(result.current.topModal?.data?.title).toBe('Keep me')
  })
})
