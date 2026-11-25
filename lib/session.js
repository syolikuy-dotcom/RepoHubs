import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { seal, unseal } from "./crypto";
import { SESSION_COOKIE, SESSION_TTL, VC_COOKIE } from "./constants";

const base = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" };

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
  (await cookies()).set(SESSION_COOKIE, seal(data, SESSION_TTL), { ...base, maxAge: SESSION_TTL });
}
export async function setVercelSession(data) {
  (await cookies()).set(VC_COOKIE, seal(data, SESSION_TTL), { ...base, maxAge: SESSION_TTL });
}
export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(VC_COOKIE);
}
export async function clearVercelSession() {
  (await cookies()).delete(VC_COOKIE);
}
