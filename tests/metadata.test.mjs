import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { createServer } from 'vite'

test('Sharing images use the deployment URL with a relative local fallback', async () => {
  const template = await readFile(new URL('../index.html', import.meta.url), 'utf8')
  const original = process.env.VITE_OG_IMAGE
  try {
    for (const url of [undefined, 'https://shylee2021.github.io/shsy1101/share-preview.jpg', 'https://shsy1101.github.io/wedding/share-preview.jpg']) {
      if (url === undefined) delete process.env.VITE_OG_IMAGE
      else process.env.VITE_OG_IMAGE = url
      const server = await createServer({
        mode: 'production',
        logLevel: 'silent',
        optimizeDeps: { noDiscovery: true },
        server: { middlewareMode: true, hmr: false, preTransformRequests: false },
      })
      try {
        const html = await server.transformIndexHtml('/', template)
        assert(html.includes(`<meta property="og:image" content="${url ?? './share-preview.jpg'}" />`))
        assert(!html.includes('%VITE_OG_IMAGE%'))
      } finally {
        await server.close()
      }
    }
  } finally {
    if (original === undefined) delete process.env.VITE_OG_IMAGE
    else process.env.VITE_OG_IMAGE = original
  }
})
