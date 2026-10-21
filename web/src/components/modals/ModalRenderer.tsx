import type { ComponentType } from 'react'
import { useModal, type ModalPayloadMap, type ModalType } from '#/stores/modal.store'
import { ConfirmModal } from './ConfirmModal'

// Modal registry — add new modals here
const MODALS = {
  confirm: ConfirmModal,
} satisfies {
  [Type in ModalType]: ComponentType<{ data?: ModalPayloadMap[Type]; onClose: () => void }>
}

export function ModalRenderer() {
  const { close, topModal } = useModal()

  if (!topModal) return null

  const ModalComponent = MODALS[topModal.type]

  return (
    <ModalComponent key={topModal.id} data={topModal.data} onClose={() => close(topModal.id)} />
  )
}
