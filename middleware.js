import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/constants";

export function middleware(req) {
  if (req.cookies.get(SESSION_COOKIE)?.value) return NextResponse.next();
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ message: "Belum login" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = req.nextUrl.pathname !== "/" ? `?next=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}` : "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icon\\.svg|favicon\\.ico|login(?:/|$)|api/auth(?:/|$)).*)"],
};
