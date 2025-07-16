'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, MessageSquare } from 'lucide-react';

interface WidgetPreviewOnboardingProps {
  customization: {
    buttonColor: string;
    buttonRadius: number;
    buttonLabel: string;
    introMessage: string;
    successMessage: string;
  };
}

export function WidgetPreviewOnboarding({ customization }: WidgetPreviewOnboardingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    // Reset after 3 seconds to show the form again
    setTimeout(() => {
      setIsSubmitted(false);
      setFeedback('');
      setEmail('');
      setIsOpen(false);
    }, 3000);
  };

  const buttonStyle = {
    backgroundColor: customization.buttonColor,
    borderRadius: `${customization.buttonRadius}px`,
  };

  return (
    <div className="bg-white p-4 rounded border-2 border-dashed border-gray-200 min-h-[200px] relative">
      <p className="text-sm text-gray-500 text-center">Your website content</p>
      <div className="absolute bottom-4 right-4">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          style={buttonStyle}
          className="shadow-lg hover:shadow-xl transition-shadow text-white font-medium px-4 py-2"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          {customization.buttonLabel}
        </Button>
      </div>

      {/* Feedback Form Modal */}
      {isOpen && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20 rounded">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
            {!isSubmitted ? (
              <>
                {/* Form Header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="text-lg font-semibold">Send Feedback</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                      {customization.introMessage}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="preview-email">Email (optional)</Label>
                    <Input
                      id="preview-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="preview-feedback">Your feedback *</Label>
                    <textarea
                      id="preview-feedback"
                      value={feedback}
                      onChange={e => setFeedback(e.target.value)}
                      placeholder="Tell us what you think..."
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md resize-none h-20 text-sm"
                      required
                    />
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button type="submit" style={buttonStyle} className="flex-1 text-white">
                      Send Feedback
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              /* Success Message */
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="text-gray-800 font-medium">{customization.successMessage}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
