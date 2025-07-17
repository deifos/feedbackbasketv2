'use client';

import Script from 'next/script';

// Extend the Window interface to include FeedbackWidget
// @TODO: Look into how to make this simpler and offer script templates
//
declare global {
  interface Window {
    FeedbackWidget?: {
      init: (config: {
        projectId: string;
        apiEndpoint: string;
        buttonColor: string;
        buttonRadius: number;
        buttonLabel: string;
        introMessage: string;
        successMessage: string;
      }) => void;
    };
  }
}

interface FeedbackWidgetProps {
  projectId: string;
  apiEndpoint?: string;
  buttonColor?: string;
  buttonRadius?: number;
  buttonLabel?: string;
  introMessage?: string;
  successMessage?: string;
}

export function FeedbackWidget({
  projectId,
  apiEndpoint = '/api/widget/feedback',
  buttonColor = '#3b82f6',
  buttonRadius = 8,
  buttonLabel = 'Feedback',
  introMessage = "We'd love to hear your thoughts! Your feedback helps us improve.",
  successMessage = 'Thank you for your feedback!',
}: FeedbackWidgetProps) {
  return (
    <>
      <Script
        src="/widget/feedback-widget.js"
        strategy="afterInteractive"
        onLoad={() => {
          // Initialize the widget after the script has loaded
          if (window.FeedbackWidget) {
            window.FeedbackWidget.init({
              projectId: projectId,
              apiEndpoint: apiEndpoint,
              buttonColor: buttonColor,
              buttonRadius: buttonRadius,
              buttonLabel: buttonLabel,
              introMessage: introMessage,
              successMessage: successMessage,
            });
          }
        }}
      />
    </>
  );
}
