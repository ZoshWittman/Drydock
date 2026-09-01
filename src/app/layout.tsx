import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Drydock - Ship Acceptance Studio',
  description: 'Ship-acceptance studio for agent-authored PRs',
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
