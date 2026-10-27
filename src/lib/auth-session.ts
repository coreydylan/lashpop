import { makeSignature } from 'better-auth/crypto'
import { parseCookies } from 'better-auth/cookies'

/**
 * Phone login already issues an opaque, httpOnly auth_token stored in D1.
 * Adapt it to Better Auth's signed-cookie format only inside the server request.
 * Better Auth must still find an unexpired session and its user in D1. This
 * neither creates a session nor sends a new credential to the browser.
 */
export async function bridgePhoneSessionHeaders(
  headers: Headers,
  cookieName: string,
  secret: string,
): Promise<Headers> {
  const cookie = headers.get('cookie') || ''
  const cookies = parseCookies(cookie)
  // A supplied native cookie must pass its own signature check. Never downgrade
  // a rejected native credential to the legacy cookie in the same request.
  if (cookies.has(cookieName)) return headers

  const token = cookies.get('auth_token')
  if (!token || !/^[A-Za-z0-9_-]{32}$/.test(token)) return headers

  const signature = await makeSignature(token, secret)
  const bridged = new Headers(headers)
  bridged.set('cookie', `${cookie}; ${cookieName}=${encodeURIComponent(`${token}.${signature}`)}`)
  return bridged
}

export function clearPhoneSessionCookie(response: Response, secure: boolean): void {
  response.headers.append('set-cookie',
    `auth_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`)
}
