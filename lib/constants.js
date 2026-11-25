const prod = process.env.NODE_ENV === "production";
export const SESSION_COOKIE = prod ? "__Host-rh_session" : "rh_session";
export const VC_COOKIE = prod ? "__Host-rh_vc" : "rh_vc";
export const THEME_COOKIE = "rh_theme";
export const SESSION_TTL = 60 * 60 * 24 * 7; // 7 hari
