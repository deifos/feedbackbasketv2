import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { FeedbackWidget } from '@/components/feedback-widget';
import { ErrorBoundary } from '@/components/error-boundary';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'FeedbackBasket - Turn feedback into action, instantly',
  description:
    'Collect user feedback and let AI help you triage, respond, and fix what matters. Build better products with intelligent feedback management.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ErrorBoundary>{children}</ErrorBoundary>

        {/* Feedback Widget */}
        {/* TODO: Simplify this process, maybe 1 url to fetch eveyrthing else. */}
        <FeedbackWidget
          projectId="cmdb6ewnv0004lb04afur4xtq"
          apiEndpoint="http://www.feedbackbasket.com/api/widget/feedback"
          buttonColor="#3b82f6"
          buttonRadius={8}
          buttonLabel="Feedback"
          introMessage="We'd love to hear your thoughts! Your feedback helps us improve."
          successMessage="Thank you for your feedback!"
        />
      </body>
    </html>
  );
}
