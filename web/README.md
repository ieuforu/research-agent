# React Starter

A modern React application starter.

## Stack

- React 19
- Vite 8
- TypeScript
- TanStack Router
- Tailwind CSS
- oxlint
- oxfmt

## Build

Run `pnpm build` after installing dependencies. Vite generates the ignored
`src/routeTree.gen.ts` through the Router plugin before TypeScript checks run,
so a fresh clone can build without first starting the dev server. Type errors
still fail the build command; `dist` may already exist when the check fails.

## HTTP client

`src/lib/http.ts` provides a shared Ky instance and typed JSON helpers. The helpers
return `Promise<T | undefined>`: an empty successful response (including HTTP 204)
returns `undefined`, while a JSON `null` remains `null`. Invalid non-empty JSON
throws its original parsing error. A custom `parseJson` option overrides the
default parser and is responsible for its own empty-body handling.
Ky 2.1 or newer is required so the custom parser receives empty response bodies.

Only GET requests are retried by default, at most once for transient network
failures or HTTP 408, 502, 503, and 504. Final HTTP failures become `ApiError` with
`status`, `body`, and the original Ky error in `cause`. `NetworkError` and
`TimeoutError` are re-exported from Ky; abort reasons and application errors pass
through unchanged. Callers should distinguish cancellation from a failed request.

## Global modals

`src/components/ui/dialog.tsx` wraps Base UI Dialog for portals, accessible labels,
focus management, and Escape/outside dismissal. `ModalRenderer` renders the top
entry in the Jotai modal stack; `useModal()` provides typed `open`, `close(id?)`,
and `closeAll` actions. Closing by ID leaves other entries intact.

```tsx
const { open } = useModal()

open('confirm', {
  title: 'Delete project?',
  description: 'All project files will be removed.',
  confirmLabel: 'Delete',
  onConfirm: async () => {
    await deleteProject(projectId)
  },
})
```

Confirmation initially focuses Cancel. While `onConfirm` runs, buttons and user
dismissal are disabled to prevent duplicate submissions or premature closing.
Success closes that entry; a thrown error keeps it open, displays an error message,
and allows retry. Add new modal types to `ModalPayloadMap`, the store's accepted
types, and the component registry in `ModalRenderer`.

## Homepage and examples

The default `/` page is a small component showcase. Edit the copy and layout in
`src/features/marketing/components/HomePage.tsx` and its sibling showcase components;
visual styling is scoped in `src/features/marketing/styles/landing.css`.
The form, buttons, cards and global confirmation dialog use the shared UI components.

Public examples live at `/examples` (Dashboard), `/examples/users` (virtual list
and user details), and `/examples/settings`. They reuse the existing feature modules
with local mock data. Dashboard fixtures are shared with its homepage preview.
Login and registration remain separate mock examples; the public examples do not
require a session. Apply `requireAuth` to routes that need protection in your app.
