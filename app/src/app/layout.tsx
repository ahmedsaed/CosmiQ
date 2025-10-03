import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'CosmiQ - AI Research Assistant',
  description: 'An open source, privacy-focused alternative to Google Notebook LM',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen relative">
        {/* Fixed star field background */}
        <div className="fixed inset-0 star-field -z-10" aria-hidden="true" />
        
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
