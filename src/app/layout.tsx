import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import NavDesktop from "~/components/ui/nav/nav-desktop";
import NavMobile from "~/components/ui/nav/nav-mobile";

export const metadata: Metadata = {
  title: "Transfer Helper",
  description: "Get your community college transfer plan in minutes",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable} dark`}>
      <body className="min-h-screen grid" style={{
        gridTemplateRows:'auto 1fr'
      }}>
        <NavDesktop className="hidden md:flex p-2 py-4 items-center flex-wrap md:gap-4 gap-2"/>
        <NavMobile className="flex md:hidden p-4 justify-between"/>
        {children}
      </body>
    </html>
  );
}
