'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, MessageSquare } from 'lucide-react';
import { CustomizationUpdateRequest } from '@/lib/types/api';

interface WidgetPreviewProps {
  customization: CustomizationUpdateRequest;
}

export function WidgetPreview({ customization }: WidgetPreviewProps) {
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
    backgroundColor: customization.buttonColor || '#3b82f6',
    borderRadius: `${customization.buttonRadius || 8}px`,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Widget Preview</CardTitle>
        <CardDescription>See how your feedback widget will appear on your website</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Preview Container */}
        <div className="relative bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 min-h-[300px]">
          <div className="text-center text-gray-500 mb-4">
            <p className="text-sm">Your website content would be here</p>
            <div className="w-full h-32 bg-gray-100 rounded mt-2 flex items-center justify-center">
              <span className="text-gray-400">Website Content</span>
            </div>
          </div>

          {/* Feedback Widget Button */}
          <div className="fixed bottom-4 right-4 z-10" style={{ position: 'absolute' }}>
            <Button
              onClick={() => setIsOpen(!isOpen)}
              style={buttonStyle}
              className="shadow-lg hover:shadow-xl transition-shadow text-white font-medium px-4 py-2"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              {customization.buttonLabel || 'Feedback'}
            </Button>
          </div>

          {/* Feedback Form Modal */}
          {isOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20"
              style={{ position: 'absolute' }}
            >
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
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
                          {customization.introMessage ||
                            "We'd love to hear your thoughts! Your feedback helps us improve."}
                        </p>
                      </div>

                      <div className="grid w-full items-center gap-2">
                        <Label htmlFor="preview-email">Email (optional)</Label>
                        <Input
                          id="preview-email"
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="your@email.com"
                        />
                      </div>

                      <div className="grid w-full items-center gap-2">
                        <Label htmlFor="preview-feedback">Your feedback *</Label>
                        <textarea
                          id="preview-feedback"
                          value={feedback}
                          onChange={e => setFeedback(e.target.value)}
                          placeholder="Tell us what you think..."
                          className="w-full p-2 border border-gray-300 rounded-md resize-none h-24 text-sm"
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
                    <p className="text-gray-800 font-medium">
                      {customization.successMessage || 'Thank you for your feedback!'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Preview Instructions */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
          <p className="font-medium mb-1">Preview Instructions:</p>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li>Click the feedback button to see the form</li>
            <li>Try submitting feedback to see the success message</li>
            <li>Changes to customization will update the preview in real-time</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
