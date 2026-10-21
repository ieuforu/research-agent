import { atom, useSetAtom, useAtomValue } from 'jotai'
import { useCallback } from 'react'

// --- Types ---
export interface ConfirmModalData {
  title?: string
  description?: string
  confirmLabel?: string
  onConfirm?: () => void | Promise<void>
}

export interface ModalPayloadMap {
  confirm: ConfirmModalData
}

export type ModalType = keyof ModalPayloadMap
export type ModalEntry = {
  [Type in ModalType]: { id: string; type: Type; data?: ModalPayloadMap[Type] }
}[ModalType]

const modalTypes: Record<ModalType, true> = { confirm: true }
let nextModalId = 0

// --- Base atoms ---
const modalStackAtom = atom<ModalEntry[]>([])

// --- Derived atoms ---
export const isAnyModalOpenAtom = atom((get) => get(modalStackAtom).length > 0)
export const topModalAtom = atom((get) => {
  const stack = get(modalStackAtom)
  return stack[stack.length - 1] ?? null
})

// --- Actions ---
export function useModal() {
  const setStack = useSetAtom(modalStackAtom)
  const topModal = useAtomValue(topModalAtom)

  const open = useCallback(
    <Type extends ModalType>(type: Type, data?: ModalPayloadMap[Type]) => {
      if (!Object.hasOwn(modalTypes, type)) throw new Error(`Unknown modal type: ${type}`)
      // IDs only identify entries in this in-memory stack; a counter avoids clock collisions.
      const id = `${type}-${++nextModalId}`
      setStack((prev) => [...prev, { id, type, data }])
      return id
    },
    [setStack],
  )

  const close = useCallback(
    (id?: string) => {
      setStack((prev) => {
        if (id) return prev.filter((m) => m.id !== id)
        return prev.slice(0, -1)
      })
    },
    [setStack],
  )

  const closeAll = useCallback(() => setStack([]), [setStack])

  return { open, close, closeAll, topModal }
}
