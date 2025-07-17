'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardHeader } from '@/components/dashboard-header';

interface NewProjectFormProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export function NewProjectForm({ user }: NewProjectFormProps) {
  const router = useRouter();
  const [projectData, setProjectData] = useState({
    name: '',
    url: '',
    description: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{
    title: string;
    description: string;
    aiDescription: string;
    logoUrl?: string;
    ogImageUrl?: string;
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleAnalyzeWebsite = async () => {
    if (!projectData.url) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: projectData.url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze website');
      }

      const result = await response.json();

      if (result.success && result.data) {
        setAnalysisResult(result.data);
        setShowPreview(true);

        // Auto-fill project name if not already set
        if (!projectData.name && result.data.title) {
          setProjectData(prev => ({ ...prev, name: result.data.title }));
        }

        // Auto-fill description with AI-generated content
        if (result.data.aiDescription) {
          setProjectData(prev => ({ ...prev, description: result.data.aiDescription }));
        }
      } else {
        throw new Error(result.error || 'Failed to analyze website');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze website');
    } finally {
      setIsAnalyzing(false);
    }
  };

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
          description: projectData.description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create project');
      }

      const project = await response.json();

      // Redirect to customization page after successful creation
      router.push(`/dashboard/projects/${project.id}/customize`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} />

      <main className="container mx-auto py-8">
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
              <form onSubmit={handleCreateProject} className="space-y-6">
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
                  <div className="flex gap-2">
                    <Input
                      id="project-url"
                      type="url"
                      placeholder="https://mywebsite.com"
                      value={projectData.url}
                      onChange={e => setProjectData(prev => ({ ...prev, url: e.target.value }))}
                      required
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAnalyzeWebsite}
                      disabled={!projectData.url || isAnalyzing}
                    >
                      {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    The URL where you'll embed the feedback widget. Click "Analyze" to auto-generate
                    project details.
                  </p>
                </div>

                <div>
                  <Label htmlFor="project-description">Project Description</Label>
                  <textarea
                    id="project-description"
                    placeholder="Describe your project..."
                    value={projectData.description || ''}
                    onChange={e =>
                      setProjectData(prev => ({ ...prev, description: e.target.value }))
                    }
                    className="w-full min-h-[100px] px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md resize-vertical"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {analysisResult
                      ? 'AI-generated description (you can edit this)'
                      : 'Optional description for your project'}
                  </p>
                </div>

                {/* Website Analysis Preview */}
                {showPreview && analysisResult && (
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="text-green-800 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        Website Analysis Complete
                      </CardTitle>
                      <CardDescription className="text-green-700">
                        AI has analyzed your website and generated the following project details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {analysisResult.ogImageUrl && (
                        <div>
                          <Label className="text-sm font-medium text-green-800">
                            Preview Image
                          </Label>
                          <div className="mt-1 relative h-32 bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={analysisResult.ogImageUrl}
                              alt="Website preview"
                              className="w-full h-full object-cover opacity-75"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                          </div>
                        </div>
                      )}

                      <div>
                        <Label className="text-sm font-medium text-green-800">
                          AI-Generated Description
                        </Label>
                        <p className="mt-1 text-sm text-green-700 bg-white/50 p-3 rounded border">
                          {analysisResult.aiDescription}
                        </p>
                      </div>

                      {analysisResult.logoUrl && (
                        <div>
                          <Label className="text-sm font-medium text-green-800">Logo Found</Label>
                          <div className="mt-1 flex items-center gap-2">
                            <img
                              src={analysisResult.logoUrl}
                              alt="Website logo"
                              className="w-8 h-8 object-contain"
                            />
                            <span className="text-sm text-green-700">
                              Logo will be displayed with your project
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPreview(false)}
                          className="text-green-700 border-green-300 hover:bg-green-100"
                        >
                          Hide Preview
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <Link href="/dashboard" className="flex-1">
                    <Button type="button" variant="outline" className="w-full">
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? 'Creating Project...' : 'Create Project'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </form>
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
                    <span>You'll be taken to customize your feedback widget</span>
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
