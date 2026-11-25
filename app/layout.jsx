import { cookies } from "next/headers";
import { ToastProvider } from "@/components/ui/Toast";
import { THEME_COOKIE } from "@/lib/constants";
import "./globals.css";

export const metadata = {
  title: { default: "RepoHub", template: "%s · RepoHub" },
  description: "Kelola repository GitHub, upload folder/ZIP, dan deploy ke Vercel dari satu tempat.",
  robots: { index: false, follow: false },
};
export const viewport = { width: "device-width", initialScale: 1, themeColor: "#0d1117" };

export default async function RootLayout({ children }) {
  const theme = (await cookies()).get(THEME_COOKIE)?.value === "light" ? "light" : "dark";
  return (
    <html lang="id" data-theme={theme} suppressHydrationWarning>
      <body><ToastProvider>{children}</ToastProvider></body>
    </html>
  );
}
