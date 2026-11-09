// src/app/layout.tsx
// This is the root layout for the Next.js application.
import { Montserrat } from "next/font/google";
import ClientLayout from "./ClientLayout";
import "./globals.css";

// Montserrat is the open substitute for Gotham named in DESIGN.md.
// 300 is kept for editorial body copy; 700/800 carry headings and labels.
const myFont = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata = {
  title: "Expense Tracker",
  description:
    "Track every bank, cash balance and daily spending in one calm place — and see where your money really goes.",
  icons: {
    icon: ["/favicon.ico?v=4"],
    apple: ["/apple-touch-icon.png?v=4"],
    shortcut: ["/apple-touch-icon.png"],
  },
};

// Sets light/dark BEFORE first paint so there is no colour flash.
const themeInitScript = `
(function () {
  try {
    var saved = localStorage.getItem('theme');
    var dark = saved
      ? saved === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    if (localStorage.getItem('authUser') || localStorage.getItem('authToken')) {
      document.documentElement.setAttribute('data-has-auth', '1');
    }
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={myFont.className} suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
