import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer } from 'vite'

test('Supabase requests preserve options, report failures, and time out without retrying', async (t) => {
  const server = await createServer({
    configFile: false,
    envFile: false,
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true, hmr: false },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://example.invalid/'),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify('test-key'),
    },
  })

  try {
    const { supabaseRequest } = await server.ssrLoadModule('/src/supabase.ts')
    const fetchMock = t.mock.method(globalThis, 'fetch', async (url, init) => {
      assert.equal(url, 'https://example.invalid/rest/v1/rsvp')
      assert.equal(init.method, 'POST')
      assert.equal(init.headers.apikey, 'test-key')
      assert.equal(init.headers.Prefer, 'return=minimal')
      assert.equal(init.body, '{}')
      assert(init.signal instanceof AbortSignal)
      return new Response(null, { status: 204 })
    })
    const response = await supabaseRequest('rsvp', {
      method: 'POST', headers: { Prefer: 'return=minimal' }, body: '{}',
    })
    assert.equal(response.status, 204)

    fetchMock.mock.mockImplementation(async () => new Response('Invalid input', { status: 400 }))
    await assert.rejects(supabaseRequest('rsvp'), /Invalid input/)

    const nativeTimeout = AbortSignal.timeout
    t.mock.method(AbortSignal, 'timeout', (milliseconds) => {
      assert.equal(milliseconds, 15_000)
      return nativeTimeout(20)
    })
    fetchMock.mock.mockImplementation((url, { signal }) => new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason), { once: true })
    }))
    await assert.rejects(supabaseRequest('rsvp', { method: 'POST' }), { name: 'TimeoutError' })
    assert.equal(fetchMock.mock.callCount(), 3)
  } finally {
    await server.close()
  }
})
