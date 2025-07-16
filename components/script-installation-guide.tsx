'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Copy,
  Check,
  Code,
  Globe,
  Settings,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardHeader } from '@/components/dashboard-header';
import { Project, ProjectCustomization } from '@/app/generated/prisma';

interface ScriptInstallationGuideProps {
  project: Project & {
    customization: ProjectCustomization | null;
  };
  scriptData: {
    projectId: string;
    apiEndpoint: string;
    buttonColor: string;
    buttonRadius: number;
    buttonLabel: string;
    introMessage: string;
    successMessage: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export function ScriptInstallationGuide({
  project,
  scriptData,
  user,
}: ScriptInstallationGuideProps) {
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedCdn, setCopiedCdn] = useState(false);

  // Generate the embed script
  const embedScript = `<script>
  window.FeedbackWidget.init({
    projectId: '${scriptData.projectId}',
    apiEndpoint: '${scriptData.apiEndpoint}',
    buttonColor: '${scriptData.buttonColor}',
    buttonRadius: ${scriptData.buttonRadius},
    buttonLabel: '${scriptData.buttonLabel}',
    introMessage: '${scriptData.introMessage}',
    successMessage: '${scriptData.successMessage}'
  });
</script>
<script src="${scriptData.apiEndpoint.replace('/api/widget/feedback', '')}/widget/feedback-widget.js"></script>`;

  // Generate the CDN version (simplified)
  const cdnScript = `<script src="${scriptData.apiEndpoint.replace('/api/widget/feedback', '')}/widget/feedback-widget.js" 
        data-project-id="${scriptData.projectId}"
        data-api-endpoint="${scriptData.apiEndpoint}"
        data-button-color="${scriptData.buttonColor}"
        data-button-radius="${scriptData.buttonRadius}"
        data-button-label="${scriptData.buttonLabel}"
        data-success-message="${scriptData.successMessage}">
</script>`;

  const copyToClipboard = async (text: string, type: 'script' | 'cdn') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'script') {
        setCopiedScript(true);
        setTimeout(() => setCopiedScript(false), 2000);
      } else {
        setCopiedCdn(true);
        setTimeout(() => setCopiedCdn(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} />

      <main className="container mx-auto py-8">
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

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Install Widget</h1>
              <p className="text-muted-foreground mb-4">
                Add the feedback widget to <span className="font-medium">{project.name}</span>
              </p>
              <div className="flex items-center text-muted-foreground">
                <ExternalLink className="w-4 h-4 mr-2" />
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {project.url}
                </a>
              </div>
            </div>

            <div className="flex space-x-2">
              <Link href={`/dashboard/projects/${project.id}/customize`}>
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Customize Widget
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Installation Instructions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Code className="w-5 h-5 mr-2" />
                  Installation Methods
                </CardTitle>
                <CardDescription>
                  Choose the installation method that works best for your website
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="standard" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="standard">Standard Installation</TabsTrigger>
                    <TabsTrigger value="cdn">CDN Installation</TabsTrigger>
                  </TabsList>

                  <TabsContent value="standard" className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Standard Installation</h3>
                      <p className="text-muted-foreground mb-4">
                        This method gives you full control over the widget configuration.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">Embed Code</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(embedScript, 'script')}
                          >
                            {copiedScript ? (
                              <>
                                <Check className="w-4 h-4 mr-2" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 mr-2" />
                                Copy Code
                              </>
                            )}
                          </Button>
                        </div>
                        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                          <pre className="text-sm">
                            <code>{embedScript}</code>
                          </pre>
                        </div>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">Installation Steps:</h4>
                        <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                          <li>Copy the embed code above</li>
                          <li>Open your website's HTML file</li>
                          <li>
                            Paste the code just before the closing <code>&lt;/body&gt;</code> tag
                          </li>
                          <li>Save and upload your changes</li>
                          <li>Visit your website to see the feedback widget!</li>
                        </ol>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="cdn" className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">CDN Installation</h3>
                      <p className="text-muted-foreground mb-4">
                        Simplified installation using data attributes. Perfect for quick setup.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">CDN Code</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(cdnScript, 'cdn')}
                          >
                            {copiedCdn ? (
                              <>
                                <Check className="w-4 h-4 mr-2" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 mr-2" />
                                Copy Code
                              </>
                            )}
                          </Button>
                        </div>
                        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                          <pre className="text-sm">
                            <code>{cdnScript}</code>
                          </pre>
                        </div>
                      </div>

                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-900 mb-2">CDN Benefits:</h4>
                        <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                          <li>Single script tag - easier to manage</li>
                          <li>Configuration via data attributes</li>
                          <li>Automatic initialization</li>
                          <li>Perfect for CMS platforms</li>
                        </ul>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Troubleshooting */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Troubleshooting
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Widget not appearing?</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>
                        Make sure the script is placed before the closing <code>&lt;/body&gt;</code>{' '}
                        tag
                      </li>
                      <li>Check browser console for any JavaScript errors</li>
                      <li>Ensure your website allows external scripts</li>
                      <li>Try refreshing the page or clearing browser cache</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Feedback not submitting?</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Check your internet connection</li>
                      <li>Verify the project ID is correct</li>
                      <li>Make sure the API endpoint is accessible</li>
                      <li>Check if your website has CORS restrictions</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Need help?</h4>
                    <p className="text-sm text-muted-foreground">
                      If you're still having issues, feel free to reach out for support. Include
                      your project ID and website URL for faster assistance.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Widget Preview */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Widget Preview</CardTitle>
                <CardDescription>
                  This is how your widget will appear on your website
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-6 min-h-[200px] relative">
                  <p className="text-sm text-gray-500 text-center mb-4">Your website content</p>
                  <div className="absolute bottom-4 right-4">
                    <div
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm text-white font-medium shadow-lg cursor-pointer"
                      style={{
                        backgroundColor: scriptData.buttonColor,
                        borderRadius: `${scriptData.buttonRadius}px`,
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      {scriptData.buttonLabel}
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Button Color:</span>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: scriptData.buttonColor }}
                      />
                      <span className="font-mono">{scriptData.buttonColor}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Border Radius:</span>
                    <span>{scriptData.buttonRadius}px</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Button Label:</span>
                    <span>"{scriptData.buttonLabel}"</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <Link href={`/dashboard/projects/${project.id}/customize`}>
                    <Button variant="outline" size="sm" className="w-full">
                      <Settings className="w-4 h-4 mr-2" />
                      Customize Appearance
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Project Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Project ID:</span>
                    <span className="font-mono text-xs">{project.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
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
