'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectCreationForm } from '@/components/project-creation-form';

interface NewProjectFormProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export function NewProjectForm({ user: _user }: NewProjectFormProps) {
  const router = useRouter();

  const handleProjectSuccess = (project: any) => {
    // Redirect to customization page after successful creation
    router.push(`/dashboard/projects/${project.id}/customize`);
  };

  const handleCancel = () => {
    router.push('/dashboard');
  };

  return (
    <div>
      <main className="container mx-auto">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Add New Project</h1>
              <p className="text-muted-foreground">
                Create a new feedback collection project for your website.
              </p>
            </div>
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>
                Tell us about the website where you want to collect feedback.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectCreationForm
                onSuccess={handleProjectSuccess}
                onCancel={handleCancel}
                showCancelButton={true}
                submitButtonText="Create Project"
              />
            </CardContent>
          </Card>

          {/* Next Steps Info */}
          <div className="mt-8">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">What happens next?</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Your project will be created</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>You&apos;ll be taken to customize your feedback widget</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Get the embed code to add to your website</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Start collecting valuable feedback from your users</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
