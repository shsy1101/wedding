const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '')
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export async function supabaseRequest(path: string, init?: RequestInit) {
  if (!url || !key) throw new Error('Supabase environment variables are missing.')
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    signal: init?.signal ?? AbortSignal.timeout(15_000),
    headers: { apikey: key, 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!response.ok) throw new Error(await response.text())
  return response
}
