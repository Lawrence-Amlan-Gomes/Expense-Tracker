// src/app/layout.tsx
// This is the root layout for the Next.js application.
import { Google_Sans } from "next/font/google";
import ClientLayout from "./ClientLayout";
import "./globals.css";

const myFont = Google_Sans({
  subsets: ["latin"],
});

export const metadata = {
  title: "Expense Tracker",
  description: "Expense Tracker",
  icons: {
    icon: ["/favicon.ico?v=4"],
    apple: ["/apple-touch-icon.png?v=4"],
    shortcut: ["/apple-touch-icon.png"],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={myFont.className} suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
