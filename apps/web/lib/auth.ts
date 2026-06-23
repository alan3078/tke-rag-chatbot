import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SESSION_COOKIE = "tke-session";
const EXPIRY = "24h";

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET environment variable is not set");
  return new TextEncoder().encode(secret);
}

/** Validate login credentials against env vars */
export function validateCredentials(
  username: string,
  password: string
): boolean {
  return (
    username === process.env.AUTH_USERNAME &&
    password === process.env.AUTH_PASSWORD
  );
}

/** Create a signed session token and set it as a cookie */
export async function createSession(username: string): Promise<string> {
  const token = await new SignJWT({ username })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(EXPIRY)
    .setIssuedAt()
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });

  return token;
}

/** Verify the current session from cookies. Returns username or null. */
export async function verifySession(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return (payload.username as string) ?? null;
  } catch {
    return null;
  }
}

/** Clear the session cookie */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
