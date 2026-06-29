import { SignJWT, jwtVerify } from 'jose'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-me'
)

const COOKIE_NAME = 'auth-token'
const TOKEN_EXPIRY = '8h'

export async function signToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(secret)
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch {
    return null
  }
}

export function getTokenFromRequest(request) {
  const cookie = request.cookies.get(COOKIE_NAME)
  return cookie?.value ?? null
}

export async function getUserFromRequest(request) {
  const token = getTokenFromRequest(request)
  if (!token) return null
  return await verifyToken(token)
}

export { COOKIE_NAME, TOKEN_EXPIRY }
