'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight, MessageSquare, Settings, Code, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardHeader } from '@/components/dashboard-header';
import { WidgetPreviewOnboarding } from '@/components/widget-preview-onboarding';

interface OnboardingFlowProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

type OnboardingStep = 'welcome' | 'create-project' | 'customize' | 'install' | 'complete';

export function OnboardingFlow({ user }: OnboardingFlowProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [projectData, setProjectData] = useState({
    name: '',
    url: '',
    id: '',
  });
  const [customization, setCustomization] = useState({
    buttonColor: '#3b82f6',
    buttonRadius: 8,
    buttonLabel: 'Feedback',
    introMessage: "We'd love to hear your thoughts! Your feedback helps us improve.",
    successMessage: 'Thank you for your feedback!',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    { id: 'welcome', title: 'Welcome', completed: currentStep !== 'welcome' },
    {
      id: 'create-project',
      title: 'Create Project',
      completed: ['customize', 'install', 'complete'].includes(currentStep),
    },
    {
      id: 'customize',
      title: 'Customize Widget',
      completed: ['install', 'complete'].includes(currentStep),
    },
    { id: 'install', title: 'Install Widget', completed: currentStep === 'complete' },
    { id: 'complete', title: 'Complete', completed: false },
  ];

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectData.name,
          url: projectData.url,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create project');
      }

      const project = await response.json();
      setProjectData(prev => ({ ...prev, id: project.id }));
      setCurrentStep('customize');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomizeWidget = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectData.id}/customization`, {
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

      setCurrentStep('install');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteOnboarding = () => {
    setCurrentStep('complete');
    // Redirect to dashboard after a short delay
    setTimeout(() => {
      router.push('/dashboard');
    }, 2000);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome to Feedback Basket!</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Let's get you set up with your first feedback collection project. This will only
                take a few minutes.
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">What you'll accomplish:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ Create your first project</li>
                <li>✓ Customize your feedback widget</li>
                <li>✓ Get the embed code for your website</li>
                <li>✓ Start collecting feedback!</li>
              </ul>
            </div>
            <Button onClick={() => setCurrentStep('create-project')} size="lg">
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        );

      case 'create-project':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Create Your First Project</h2>
              <p className="text-muted-foreground">
                Tell us about the website where you want to collect feedback.
              </p>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  type="text"
                  placeholder="My Awesome Website"
                  value={projectData.name}
                  onChange={e => setProjectData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Give your project a memorable name
                </p>
              </div>

              <div>
                <Label htmlFor="project-url">Website URL</Label>
                <Input
                  id="project-url"
                  type="url"
                  placeholder="https://mywebsite.com"
                  value={projectData.url}
                  onChange={e => setProjectData(prev => ({ ...prev, url: e.target.value }))}
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  The URL where you'll embed the feedback widget
                </p>
              </div>

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Creating Project...' : 'Create Project'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </div>
        );

      case 'customize':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Customize Your Widget</h2>
              <p className="text-muted-foreground">
                Make the feedback widget match your website's style.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Customization Controls */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="button-color">Button Color</Label>
                  <div className="flex items-center space-x-3">
                    <Input
                      id="button-color"
                      type="color"
                      value={customization.buttonColor}
                      onChange={e =>
                        setCustomization(prev => ({ ...prev, buttonColor: e.target.value }))
                      }
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={customization.buttonColor}
                      onChange={e =>
                        setCustomization(prev => ({ ...prev, buttonColor: e.target.value }))
                      }
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="button-radius">
                    Border Radius: {customization.buttonRadius}px
                  </Label>
                  <Input
                    id="button-radius"
                    type="range"
                    min="0"
                    max="50"
                    value={customization.buttonRadius}
                    onChange={e =>
                      setCustomization(prev => ({
                        ...prev,
                        buttonRadius: parseInt(e.target.value),
                      }))
                    }
                    className="w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="button-label">Button Label</Label>
                  <Input
                    id="button-label"
                    type="text"
                    value={customization.buttonLabel}
                    onChange={e =>
                      setCustomization(prev => ({ ...prev, buttonLabel: e.target.value }))
                    }
                    maxLength={50}
                  />
                </div>

                <div>
                  <Label htmlFor="intro-message">Intro Message</Label>
                  <Input
                    id="intro-message"
                    type="text"
                    value={customization.introMessage}
                    onChange={e =>
                      setCustomization(prev => ({ ...prev, introMessage: e.target.value }))
                    }
                    maxLength={300}
                  />
                </div>

                <div>
                  <Label htmlFor="success-message">Success Message</Label>
                  <Input
                    id="success-message"
                    type="text"
                    value={customization.successMessage}
                    onChange={e =>
                      setCustomization(prev => ({ ...prev, successMessage: e.target.value }))
                    }
                    maxLength={200}
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold mb-4">Preview</h3>
                <WidgetPreviewOnboarding customization={customization} />
              </div>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                {error}
              </div>
            )}

            <Button onClick={handleCustomizeWidget} disabled={isLoading} className="w-full">
              {isLoading ? 'Saving Customization...' : 'Save & Continue'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        );

      case 'install':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Code className="w-8 h-8 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Install Your Widget</h2>
              <p className="text-muted-foreground">
                You're almost done! Just add this code to your website.
              </p>
            </div>

            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">
                {`<script>
  window.FeedbackWidget.init({
    projectId: '${projectData.id}',
    apiEndpoint: '${window.location.origin}/api/widget/feedback',
    buttonColor: '${customization.buttonColor}',
    buttonRadius: ${customization.buttonRadius},
    buttonLabel: '${customization.buttonLabel}',
    introMessage: '${customization.introMessage}',
    successMessage: '${customization.successMessage}'
  });
</script>
<script src="${window.location.origin}/widget/feedback-widget.js"></script>`}
              </pre>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Installation Instructions:</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Copy the code above</li>
                <li>Paste it just before the closing &lt;/body&gt; tag in your HTML</li>
                <li>Save and upload your changes</li>
                <li>Visit your website to see the feedback widget!</li>
              </ol>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() =>
                  navigator.clipboard.writeText(`<script>
  window.FeedbackWidget.init({
    projectId: '${projectData.id}',
    apiEndpoint: '${window.location.origin}/api/widget/feedback',
    buttonColor: '${customization.buttonColor}',
    buttonRadius: ${customization.buttonRadius},
    buttonLabel: '${customization.buttonLabel}',
    introMessage: '${customization.introMessage}',
    successMessage: '${customization.successMessage}'
  });
</script>
<script src="${window.location.origin}/widget/feedback-widget.js"></script>`)
                }
                variant="outline"
                className="flex-1"
              >
                Copy Code
              </Button>
              <Button onClick={handleCompleteOnboarding} className="flex-1">
                I've Installed It
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                You've successfully set up your first feedback collection project. You'll be
                redirected to your dashboard shortly.
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">What's Next?</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>✓ Your widget is ready to collect feedback</li>
                <li>✓ Check your dashboard to see incoming feedback</li>
                <li>✓ Customize more projects as needed</li>
                <li>✓ Monitor and respond to user feedback</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} />

      <main className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                      step.completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : currentStep === step.id
                          ? 'border-blue-500 text-blue-500'
                          : 'border-gray-300 text-gray-300'
                    }`}
                  >
                    {step.completed ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium ${
                      step.completed || currentStep === step.id ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-12 h-0.5 mx-4 ${
                        step.completed ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <Card>
            <CardContent className="p-8">{renderStepContent()}</CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
