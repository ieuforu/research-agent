import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import { HTTPError, TimeoutError, type Options } from 'ky'
import { ApiError, NetworkError, apiDelete, apiGet, apiPost, apiPut, http } from './http'

const options: Options = {
  prefix: 'https://example.test/api',
  retry: { delay: () => 0 },
}
const methods = [
  { method: 'GET', request: apiGet },
  { method: 'POST', request: apiPost },
  { method: 'PUT', request: apiPut },
  { method: 'DELETE', request: apiDelete },
]

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

afterEach(() => {
  window.localStorage.clear()
  vi.restoreAllMocks()
})

describe.each(methods)('$method response handling', ({ request }) => {
  it('returns JSON data with an explicit possible empty result', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({ id: 1 }))
    const result = request<{ id: number }>('users', { ...options, fetch })

    expectTypeOf(result).toEqualTypeOf<Promise<{ id: number } | undefined>>()
    await expect(result).resolves.toEqual({ id: 1 })
  })

  it.each([200, 204, 205])('returns undefined for an empty HTTP %i response', async (status) => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status }))

    await expect(request('users', { ...options, fetch })).resolves.toBeUndefined()
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})

describe('JSON parsing', () => {
  it('preserves a JSON null response', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse(null))
    await expect(apiGet('users', { ...options, fetch })).resolves.toBeNull()
  })

  it.each(['not JSON', '   '])('preserves SyntaxError for invalid JSON: %j', async (body) => {
    const fetch = vi.fn().mockResolvedValue(new Response(body))
    await expect(apiGet('users', { ...options, fetch })).rejects.toBeInstanceOf(SyntaxError)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('allows an explicit custom JSON parser', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('custom payload'))
    const parseJson = vi.fn().mockReturnValue({ id: 2 })
    await expect(apiGet('users', { ...options, fetch, parseJson })).resolves.toEqual({ id: 2 })
    expect(parseJson).toHaveBeenCalledWith('custom payload', expect.any(Object))
  })
})

describe('HTTP errors and retries', () => {
  it('retries a transient GET 503 before returning the successful response', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ message: 'Busy' }, 503))
      .mockResolvedValueOnce(jsonResponse({ id: 1 }))

    await expect(apiGet('users', { ...options, fetch })).resolves.toEqual({ id: 1 })
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('converts the final HTTP error after retries and preserves its body and cause', async () => {
    const fetch = vi
      .fn()
      .mockImplementation(async () => jsonResponse({ message: 'Still busy' }, 503))
    const failure = apiGet('users', { ...options, fetch })

    await expect(failure).rejects.toBeInstanceOf(ApiError)
    await expect(failure).rejects.toMatchObject({
      message: 'Still busy',
      status: 503,
      body: { message: 'Still busy' },
      cause: expect.any(HTTPError),
    })
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it.each(methods.filter(({ method }) => method !== 'GET'))(
    'does not retry $method writes by default',
    async ({ request }) => {
      const fetch = vi.fn().mockImplementation(async () => jsonResponse({ message: 'Busy' }, 503))
      await expect(request('users', { ...options, fetch })).rejects.toBeInstanceOf(ApiError)
      expect(fetch).toHaveBeenCalledTimes(1)
    },
  )

  it.each([null, { message: 123 }, { message: '' }])(
    'uses a status fallback when the error body has no usable message: %j',
    async (body) => {
      const fetch = vi.fn().mockResolvedValue(jsonResponse(body, 400))
      await expect(apiGet('users', { ...options, fetch })).rejects.toMatchObject({
        name: 'ApiError',
        message: 'HTTP 400',
        status: 400,
        body,
      })
      expect(fetch).toHaveBeenCalledTimes(1)
    },
  )

  it('retains non-JSON error bodies and uses the response status text', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response('Upstream unavailable', {
        status: 502,
        statusText: 'Bad Gateway',
        headers: { 'Content-Type': 'text/plain' },
      }),
    )
    await expect(apiGet('users', { ...options, fetch, retry: 0 })).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Bad Gateway',
      status: 502,
      body: 'Upstream unavailable',
    })
  })

  it('applies the same HTTP error handling when using the shared Ky instance directly', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({ message: 'Denied' }, 403))
    await expect(http.get('users', { ...options, fetch })).rejects.toBeInstanceOf(ApiError)
  })
})

describe('transport errors and cancellation', () => {
  it('preserves the abort reason for an already-aborted signal', async () => {
    const controller = new AbortController()
    controller.abort()

    const fetch = vi.fn()

    await expect(apiGet('users', { ...options, fetch, signal: controller.signal })).rejects.toBe(
      controller.signal.reason,
    )

    expect(fetch).not.toHaveBeenCalled()
  })

  it('preserves cancellation while a request is in flight', async () => {
    const controller = new AbortController()
    const reason = new Error('Navigation cancelled the request')
    const fetch = vi.fn().mockImplementation(
      (request: Request) =>
        new Promise<Response>((_resolve, reject) => {
          request.signal.addEventListener('abort', () => reject(request.signal.reason), {
            once: true,
          })
        }),
    )
    const failure = apiGet('users', { ...options, fetch, signal: controller.signal })
    const assertion = expect(failure).rejects.toBe(reason)
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
    controller.abort(reason)
    await assertion
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('preserves TimeoutError', async () => {
    const fetch = vi.fn().mockImplementation(() => new Promise<Response>(() => {}))
    await expect(apiGet('users', { ...options, fetch, timeout: 10 })).rejects.toBeInstanceOf(
      TimeoutError,
    )
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('reports a real network failure and preserves its cause after retrying', async () => {
    const cause = new TypeError('fetch failed')
    const fetch = vi.fn().mockRejectedValue(cause)
    const failure = apiGet('users', { ...options, fetch })
    await expect(failure).rejects.toBeInstanceOf(NetworkError)
    await expect(failure).rejects.toMatchObject({ cause })
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('does not relabel programming errors in request hooks as network failures', async () => {
    const cause = new TypeError('Invalid application configuration')
    const fetch = vi.fn()
    await expect(
      apiGet('users', {
        ...options,
        fetch,
        hooks: {
          beforeRequest: [
            () => {
              throw cause
            },
          ],
        },
      }),
    ).rejects.toBe(cause)
    expect(fetch).not.toHaveBeenCalled()
  })
})

it('preserves the API prefix, bearer token, JSON accept header, and request body', async () => {
  window.localStorage.setItem('auth_token', 'test-token')
  let requestBody: unknown
  const fetch = vi.fn().mockImplementation(async (request: Request) => {
    requestBody = await request.json()
    return jsonResponse({ id: 1 }, 201)
  })
  await apiPost('users', { ...options, fetch, json: { name: 'Ada' } })

  const request = fetch.mock.calls[0][0] as Request
  expect(request.url).toBe('https://example.test/api/users')
  expect(request.headers.get('Authorization')).toBe('Bearer test-token')
  expect(request.headers.get('Accept')).toBe('application/json')
  expect(requestBody).toEqual({ name: 'Ada' })
})
