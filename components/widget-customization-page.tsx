'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WidgetCustomizer } from '@/components/widget-customizer';
import { WidgetPreview } from '@/components/widget-preview';
import { Project, ProjectCustomization } from '@/app/generated/prisma';
import { CustomizationUpdateRequest } from '@/lib/types/api';

interface WidgetCustomizationPageProps {
  project: Project;
  initialCustomization?: ProjectCustomization | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export function WidgetCustomizationPage({
  project,
  initialCustomization,
  user: _user,
}: WidgetCustomizationPageProps) {
  const [currentCustomization, setCurrentCustomization] = useState<CustomizationUpdateRequest>({
    buttonColor: initialCustomization?.buttonColor || '#3b82f6',
    buttonRadius: initialCustomization?.buttonRadius || 8,
    buttonLabel: initialCustomization?.buttonLabel || 'Feedback',
    introMessage:
      initialCustomization?.introMessage ||
      "We'd love to hear your thoughts! Your feedback helps us improve.",
    successMessage: initialCustomization?.successMessage || 'Thank you for your feedback!',
  });

  const handleCustomizationUpdate = (updatedCustomization: ProjectCustomization) => {
    setCurrentCustomization({
      buttonColor: updatedCustomization.buttonColor,
      buttonRadius: updatedCustomization.buttonRadius,
      buttonLabel: updatedCustomization.buttonLabel,
      introMessage: updatedCustomization.introMessage,
      successMessage: updatedCustomization.successMessage,
    });
  };

  const handlePreviewUpdate = (field: keyof CustomizationUpdateRequest, value: string | number) => {
    setCurrentCustomization(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href={`/dashboard/projects/${project.id}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Project
              </Button>
            </Link>
          </div>
          <div>
            <h1 className="text-3xl font-bold">Customize Widget</h1>
            <p className="text-muted-foreground mt-2">
              Customize the appearance and behavior of your feedback widget for{' '}
              <span className="font-medium">{project.name}</span>
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Customization Form */}
          <div>
            <WidgetCustomizer
              projectId={project.id}
              initialCustomization={initialCustomization || undefined}
              onUpdate={handleCustomizationUpdate}
              onPreviewUpdate={handlePreviewUpdate}
            />
          </div>

          {/* Live Preview */}
          <div>
            <WidgetPreview customization={currentCustomization} />
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Next Steps</h3>
          <p className="text-blue-800 mb-4">
            Once you&apos;re happy with your widget customization, you can generate the embed code
            and add it to your website.
          </p>
          <Link href={`/dashboard/projects/${project.id}/install`}>
            <Button className="bg-blue-600 hover:bg-blue-700">Get Embed Code</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
