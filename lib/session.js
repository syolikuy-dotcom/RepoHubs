import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { seal, unseal } from "./crypto";
import { SESSION_COOKIE, SESSION_TTL, VC_COOKIE } from "./constants";

async function cookieOpts() {
  const h = await headers();
  const isHttps = h.get("x-forwarded-proto") === "https" || process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? "none" : "lax",
    path: "/",
  };
}

async function read(name) {
  const store = await cookies();
  const raw = store.get(name)?.value;
  return raw ? unseal(raw) : null;
}

/** @returns {Promise<{token:string,user:{login:string,id:number,name:string|null,avatar_url:string},scopes:string[]}|null>} */
export const getSession = () => read(SESSION_COOKIE);
export const getVercelSession = () => read(VC_COOKIE);

export async function requireSession() {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
}

export async function setSession(data) {
  const opts = await cookieOpts();
  (await cookies()).set(SESSION_COOKIE, seal(data, SESSION_TTL), { ...opts, maxAge: SESSION_TTL });
}
export async function setVercelSession(data) {
  const opts = await cookieOpts();
  (await cookies()).set(VC_COOKIE, seal(data, SESSION_TTL), { ...opts, maxAge: SESSION_TTL });
}
export async function clearSession() {
  const store = await cookies();
  const opts = await cookieOpts();
  store.set(SESSION_COOKIE, "", { ...opts, maxAge: 0 });
  store.set(VC_COOKIE, "", { ...opts, maxAge: 0 });
}
export async function clearVercelSession() {
  const store = await cookies();
  const opts = await cookieOpts();
  store.set(VC_COOKIE, "", { ...opts, maxAge: 0 });
}
