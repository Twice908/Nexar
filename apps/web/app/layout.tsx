import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { DM_Sans, Poppins } from 'next/font/google';

import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Nexar',
  description: 'Verified employee carpooling',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <html lang="en" className="dark">
      <body className={`${poppins.variable} ${dmSans.variable}`}>
        {publishableKey ? (
          <ClerkProvider
            publishableKey={publishableKey}
            appearance={{
              variables: {
                fontFamily: 'var(--font-dm-sans)',
                colorPrimary: '#2b2b2b',
              },
            }}
          >
            {children}
          </ClerkProvider>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
