import ReactDOM from 'react-dom/client'
import './styles.css'
import { StrictMode } from 'react'
import { Provider as JotaiProvider } from 'jotai'
import { RouterProvider } from '#/lib/providers/RouterProvider.tsx'
import { QueryProvider } from '#/lib/providers/QueryProvider.tsx'

const rootElement = document.getElementById('react-root')!

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <JotaiProvider>
        <QueryProvider>
          <RouterProvider />
        </QueryProvider>
      </JotaiProvider>
    </StrictMode>,
  )
}
