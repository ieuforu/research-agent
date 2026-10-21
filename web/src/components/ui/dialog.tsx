import type { ComponentProps } from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { cn } from '#/lib/utils'

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogClose = DialogPrimitive.Close
const DialogPortal = DialogPrimitive.Portal

function DialogOverlay({ className, ...props }: ComponentProps<typeof DialogPrimitive.Backdrop>) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={(state) =>
        cn(
          'fixed inset-0 z-50 bg-black/40 backdrop-blur-sm',
          typeof className === 'function' ? className(state) : className,
        )
      }
      {...props}
    />
  )
}

function DialogContent({ className, ...props }: ComponentProps<typeof DialogPrimitive.Popup>) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={(state) =>
          cn(
            'fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[380px] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border/40 bg-background p-6 shadow-2xl outline-none',
            typeof className === 'function' ? className(state) : className,
          )
        }
        {...props}
      />
    </DialogPortal>
  )
}

function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={(state) =>
        cn(
          'text-base font-semibold',
          typeof className === 'function' ? className(state) : className,
        )
      }
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={(state) =>
        cn(
          'mt-1.5 text-[13px] leading-relaxed text-muted-foreground',
          typeof className === 'function' ? className(state) : className,
        )
      }
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn('mt-6 flex justify-end gap-2.5', className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
}
