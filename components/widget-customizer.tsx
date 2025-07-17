'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectCustomization } from '@/app/generated/prisma';
import { CustomizationUpdateRequest } from '@/lib/types/api';

interface WidgetCustomizerProps {
  projectId: string;
  initialCustomization?: ProjectCustomization;
  onUpdate?: (customization: ProjectCustomization) => void;
  onPreviewUpdate?: (field: keyof CustomizationUpdateRequest, value: string | number) => void;
}

export function WidgetCustomizer({
  projectId,
  initialCustomization,
  onUpdate,
  onPreviewUpdate,
}: WidgetCustomizerProps) {
  // Derive initial state from props using useMemo
  const initialState = useMemo(
    () => ({
      buttonColor: initialCustomization?.buttonColor || '#3b82f6',
      buttonRadius: initialCustomization?.buttonRadius || 8,
      buttonLabel: initialCustomization?.buttonLabel || 'Feedback',
      introMessage:
        initialCustomization?.introMessage ||
        "We'd love to hear your thoughts! Your feedback helps us improve.",
      successMessage: initialCustomization?.successMessage || 'Thank you for your feedback!',
    }),
    [initialCustomization]
  );

  const [customization, setCustomization] = useState<CustomizationUpdateRequest>(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Update state when initialState changes (when initialCustomization prop changes)
  if (JSON.stringify(customization) !== JSON.stringify(initialState)) {
    setCustomization(initialState);
  }

  const handleInputChange = (field: keyof CustomizationUpdateRequest, value: string | number) => {
    setCustomization(prev => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
    setSuccess(false);

    // Update preview in real-time
    onPreviewUpdate?.(field, value);
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/projects/${projectId}/customization`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customization),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update customization');
      }

      const updatedCustomization = await response.json();
      setSuccess(true);
      onUpdate?.(updatedCustomization);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setCustomization({
      buttonColor: '#3b82f6',
      buttonRadius: 8,
      buttonLabel: 'Feedback',
      introMessage: "We'd love to hear your thoughts! Your feedback helps us improve.",
      successMessage: 'Thank you for your feedback!',
    });
    setError(null);
    setSuccess(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Widget Customization</CardTitle>
        <CardDescription>
          Customize the appearance and behavior of your feedback widget
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Button Color */}
        <div className="space-y-2">
          <Label htmlFor="buttonColor">Button Color</Label>
          <div className="flex items-center space-x-3">
            <Input
              id="buttonColor"
              type="color"
              value={customization.buttonColor}
              onChange={e => handleInputChange('buttonColor', e.target.value)}
              className="w-16 h-10 p-1 border rounded"
            />
            <Input
              type="text"
              value={customization.buttonColor}
              onChange={e => handleInputChange('buttonColor', e.target.value)}
              placeholder="#3b82f6"
              className="flex-1"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Choose the background color for your feedback button
          </p>
        </div>

        {/* Button Radius */}
        <div className="space-y-2">
          <Label htmlFor="buttonRadius">Button Border Radius</Label>
          <div className="flex items-center space-x-3">
            <Input
              id="buttonRadius"
              type="range"
              min="0"
              max="50"
              value={customization.buttonRadius}
              onChange={e => handleInputChange('buttonRadius', parseInt(e.target.value))}
              className="flex-1"
            />
            <div className="w-16 text-center">
              <span className="text-sm font-medium">{customization.buttonRadius}px</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Adjust the roundness of your feedback button corners
          </p>
        </div>

        {/* Button Label */}
        <div className="space-y-2">
          <Label htmlFor="buttonLabel">Button Label</Label>
          <Input
            id="buttonLabel"
            type="text"
            value={customization.buttonLabel}
            onChange={e => handleInputChange('buttonLabel', e.target.value)}
            placeholder="Feedback"
            maxLength={50}
          />
          <p className="text-sm text-muted-foreground">
            The text displayed on your feedback button (max 50 characters)
          </p>
        </div>

        {/* Intro Message */}
        <div className="space-y-2">
          <Label htmlFor="introMessage">Intro Message</Label>
          <Input
            id="introMessage"
            type="text"
            value={customization.introMessage}
            onChange={e => handleInputChange('introMessage', e.target.value)}
            placeholder="We'd love to hear your thoughts! Your feedback helps us improve."
            maxLength={300}
          />
          <p className="text-sm text-muted-foreground">
            Message shown at the top of the feedback form (max 300 characters)
          </p>
        </div>

        {/* Success Message */}
        <div className="space-y-2">
          <Label htmlFor="successMessage">Success Message</Label>
          <Input
            id="successMessage"
            type="text"
            value={customization.successMessage}
            onChange={e => handleInputChange('successMessage', e.target.value)}
            placeholder="Thank you for your feedback!"
            maxLength={200}
          />
          <p className="text-sm text-muted-foreground">
            Message shown after successful feedback submission (max 200 characters)
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded">
            Customization saved successfully!
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button onClick={handleSave} disabled={isLoading} className="flex-1">
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button variant="outline" onClick={handleReset} disabled={isLoading}>
            Reset to Defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
