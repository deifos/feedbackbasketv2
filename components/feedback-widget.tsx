'use client';

import Script from 'next/script';

// Extend the Window interface to include the new feedbackBasket pattern
declare global {
  interface Window {
    __feedbackBasket?: {
      projectId: string;
      apiEndpoint: string;
      buttonColor: string;
      buttonRadius: number;
      buttonLabel: string;
      introMessage: string;
      successMessage: string;
    };
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
    <Script
      id="feedback-widget"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function () {
            window.__feedbackBasket = {
              projectId: '${projectId}',
              apiEndpoint: '${apiEndpoint}',
              buttonColor: '${buttonColor}',
              buttonRadius: ${buttonRadius},
              buttonLabel: '${buttonLabel.replace(/'/g, "\\'")}',
              introMessage: '${introMessage.replace(/'/g, "\\'")}',
              successMessage: '${successMessage.replace(/'/g, "\\'")}'
            };
            const s = document.createElement('script');
            s.src = '/widget/feedback-widget.js';
            s.async = true;
            document.head.appendChild(s);
          })();
        `,
      }}
    />
  );
}
