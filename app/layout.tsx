import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BADM554 Course Survey',
  description: 'Pre-course survey for BADM554 Enterprise Database Management - Spring 2026',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
