'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Send, Settings, Trash2, CheckCircle, AlertCircle, Loader2, ExternalLink, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  url: string;
  telegramNotifications: boolean;
}

interface IntegrationsClientProps {
  initialTelegramHandle: string | null;
  projects: Project[];
  user: {
    id: string;
    name: string;
    email: string;
  };
  initialTelegramChatId?: string | null;
}

export function IntegrationsClient({ 
  initialTelegramHandle, 
  projects: initialProjects, 
  user: _user,
  initialTelegramChatId
}: IntegrationsClientProps) {
  const [telegramHandle, setTelegramHandle] = useState(initialTelegramHandle || '');
  const [projects, setProjects] = useState(initialProjects);
  const [isLoading, setIsLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [projectToggleLoading, setProjectToggleLoading] = useState<Set<string>>(new Set());
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [handleSaved, setHandleSaved] = useState(!!initialTelegramHandle);
  const [isLinked, setIsLinked] = useState(() => !!initialTelegramChatId); // Only true after successful linking via bot
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [linkCodeExpiration, setLinkCodeExpiration] = useState<Date | null>(null);
  const [linkCodeLoading, setLinkCodeLoading] = useState(false);
  const [showLinkFlow, setShowLinkFlow] = useState(false);
  const [linkCommandCopied, setLinkCommandCopied] = useState(false);

  // Validate handle format as user types
  const validateHandleFormat = (handle: string) => {
    if (!handle.trim()) {
      setValidationError(null);
      return;
    }

    const trimmed = handle.trim();

    // Check if it's a numeric chat ID
    if (/^\d+$/.test(trimmed)) {
      const chatId = parseInt(trimmed);
      if (chatId <= 0) {
        setValidationError('Chat ID must be a positive number');
      } else {
        setValidationError(null);
      }
      return;
    }

    // It's a username - validate username format
    const cleanHandle = trimmed.replace(/^@/, '');
    
    if (cleanHandle.length < 5 || cleanHandle.length > 32) {
      setValidationError('Username must be 5-32 characters long');
      return;
    }

    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(cleanHandle)) {
      setValidationError('Username must start with a letter and contain only letters, numbers, and underscores');
      return;
    }

    if (cleanHandle.endsWith('_') || cleanHandle.includes('__')) {
      setValidationError('Username cannot end with underscore or contain consecutive underscores');
      return;
    }

    setValidationError(null);
  };

  // Function to refresh projects from server
  const refreshProjects = useCallback(async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        const projectsWithTelegramField = (data.projects || data)?.map((p: Project & { telegramNotifications?: boolean }) => ({
          id: p.id,
          name: p.name,
          url: p.url,
          telegramNotifications: p.telegramNotifications ?? true
        })) || [];
        setProjects(projectsWithTelegramField);
      }
    } catch (error) {
      console.error('Error refreshing projects:', error);
    }
  }, []);

  const handleSaveTelegramHandle = async () => {
    if (!telegramHandle.trim()) {
      toast.error("Please enter a Telegram handle or Chat ID");
      return;
    }

    // Clear any previous validation errors
    setValidationError(null);

    setIsLoading(true);
    try {
      const response = await fetch('/api/integrations/telegram', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramHandle: telegramHandle.trim() })
      });

      const data = await response.json();

      if (response.ok) {
        setTelegramHandle(data.telegramHandle);
        setHandleSaved(true);
        toast.success(data.message);
        // Refresh projects to show them with telegram toggles
        await refreshProjects();
      } else {
        toast.error(data.error || "Failed to save Telegram handle");
      }
    } catch (error) {
      console.error('Error saving telegram handle:', error);
      toast.error("Failed to save Telegram handle");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    // For manual config, use the handle; for bot-linked, we'll pass a special flag
    const testPayload = isLinked 
      ? { testLinkedAccount: true } 
      : { telegramHandle: telegramHandle.trim() };

    if (!isLinked && !telegramHandle.trim()) {
      toast.error("Please save a Telegram handle first");
      return;
    }

    setTestLoading(true);
    try {
      const response = await fetch('/api/integrations/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });

      const data = await response.json();

      if (data.success) {
        setIsConnected(true);
        toast.success(data.message || "Test successful!");
      } else {
        setIsConnected(false);
        toast.error(data.message || "Failed to send test message");
      }
    } catch (error) {
      console.error('Error testing telegram connection:', error);
      toast.error("Failed to test connection");
    } finally {
      setTestLoading(false);
    }
  };

  const handleRemoveIntegration = async () => {
    setRemoveLoading(true);
    try {
      const response = await fetch('/api/integrations/telegram', {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        setTelegramHandle('');
        setHandleSaved(false);
        setIsConnected(false);
        setIsLinked(false);
        toast.success(data.message);
      } else {
        toast.error(data.error || "Failed to remove integration");
      }
    } catch (error) {
      console.error('Error removing telegram integration:', error);
      toast.error("Failed to remove integration");
    } finally {
      setRemoveLoading(false);
    }
  };

  const handleProjectToggle = async (projectId: string, enabled: boolean) => {
    // Add project to loading set
    setProjectToggleLoading(prev => new Set([...prev, projectId]));
    
    try {
      const response = await fetch(`/api/projects/${projectId}/telegram`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramNotifications: enabled })
      });

      const data = await response.json();

      if (response.ok) {
        setProjects(prev => prev.map(p => 
          p.id === projectId 
            ? { ...p, telegramNotifications: enabled }
            : p
        ));
        toast.success(data.message);
      } else {
        toast.error(data.error || "Failed to update project settings");
      }
    } catch (error) {
      console.error('Error updating project telegram settings:', error);
      toast.error("Failed to update project settings");
    } finally {
      // Remove project from loading set
      setProjectToggleLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(projectId);
        return newSet;
      });
    }
  };

  // Generate a new link code
  const generateLinkCode = async () => {
    setLinkCodeLoading(true);
    try {
      const response = await fetch('/api/integrations/telegram/link-code', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setLinkCode(data.linkCode);
        setLinkCodeExpiration(new Date(data.expiresAt));
        setShowLinkFlow(true);
        toast.success('Link code generated successfully');
      } else {
        toast.error(data.error || 'Failed to generate link code');
      }
    } catch (error) {
      console.error('Error generating link code:', error);
      toast.error('Failed to generate link code');
    } finally {
      setLinkCodeLoading(false);
    }
  };

  // Check link status
  const checkLinkStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/integrations/telegram/link-code');
      const data = await response.json();

      if (response.ok) {
        const wasLinked = isLinked;
        
        // Only set linked if we don't have a manual handle or if we're transitioning from unlinked
        // This prevents manual configs from being treated as bot-linked
        if (!initialTelegramHandle || (!wasLinked && data.isLinked)) {
          setIsLinked(data.isLinked);
        }
        
        // Show success message if just linked via bot
        if (!wasLinked && data.isLinked && !initialTelegramHandle) {
          toast.success('🎉 Telegram account linked successfully! You can now receive notifications.');
          setShowLinkFlow(false);
          setLinkCode(null);
          setLinkCodeExpiration(null);
          await refreshProjects();
        }
        
        if (data.hasValidCode && !data.isLinked) {
          setLinkCode(data.linkCode);
          setLinkCodeExpiration(new Date(data.expiresAt));
          setShowLinkFlow(true);
        }
      }
    } catch (error) {
      console.error('Error checking link status:', error);
    }
  }, [isLinked, initialTelegramHandle, refreshProjects]);

  // Check if link code has expired
  const isLinkCodeExpired = useCallback(() => {
    return linkCodeExpiration && new Date() > linkCodeExpiration;
  }, [linkCodeExpiration]);

  // Copy link command to clipboard
  const copyLinkCommand = useCallback(async () => {
    if (!linkCode) return;
    
    try {
      await navigator.clipboard.writeText(`/link ${linkCode}`);
      setLinkCommandCopied(true);
      toast.success('Link command copied to clipboard!');
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setLinkCommandCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy to clipboard');
    }
  }, [linkCode]);

  // Effect to periodically check link status when code is active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (linkCode && showLinkFlow && !isLinked && !isLinkCodeExpired()) {
      interval = setInterval(() => {
        checkLinkStatus();
      }, 3000); // Check every 3 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [linkCode, showLinkFlow, isLinked, checkLinkStatus, isLinkCodeExpired]);

  // Initialize link status check on mount
  useEffect(() => {
    // Don't check link status if we already have a manual handle saved or chat ID
    // This prevents the "linked" message from showing for manual configs
    if (!initialTelegramHandle && !initialTelegramChatId) {
      checkLinkStatus();
    }
  }, [initialTelegramHandle, initialTelegramChatId, checkLinkStatus]);

  // Account is configured if either:
  // 1. Manual setup is tested and working (isConnected && handleSaved)
  // 2. Automatic bot linking is complete (isLinked)
  const isConfigured = (isConnected && handleSaved) || isLinked;
  
  // Show manual config section if not linked via bot
  const showManualConfig = !isLinked;
  
  // User has manually configured but not bot-linked
  const hasManualConfig = !!initialTelegramHandle && !isLinked;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Integrations</h1>
            <p className="text-muted-foreground mt-2">
              Connect your FeedbackBasket account with external services to enhance your workflow.
            </p>
          </div>

          {/* Telegram Integration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5 text-blue-500" />
                    Telegram Notifications
                    {isConfigured && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    )}
                    {handleSaved && !isConnected && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Saved - Test Required
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Receive instant notifications when new feedback is submitted to your projects.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Setup Instructions */}
              {!isConfigured && !hasManualConfig && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Setup Required</AlertTitle>
                  <AlertDescription>
                    <div className="space-y-4">
                      <div>
                        <strong>Recommended: Automatic Setup (Most Reliable)</strong>
                        <ol className="list-decimal list-inside mt-2 space-y-2 text-sm">
                          <li className="flex items-start gap-1">
                            Start a chat with our bot:
                            <a 
                              href="https://t.me/FeedbackBasketNotifyBot" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1 ml-1"
                            >
                              @FeedbackBasketNotifyBot
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </li>
                          <li>Send <code className="bg-muted px-1 rounded text-xs">/start</code> to the bot</li>
                          <li>Click &quot;Link Account&quot; below to generate a unique code</li>
                          <li>Send <code className="bg-muted px-1 rounded text-xs">/link YOUR_CODE</code> to the bot</li>
                          <li>Your account will be automatically linked!</li>
                        </ol>
                      </div>
                      
                      <div className="border-t pt-3">
                        <strong>Alternative: Manual Setup</strong>
                        <p className="text-sm mt-1 text-muted-foreground">
                          If the automatic setup doesn&apos;t work, you can manually enter your Telegram username or Chat ID below. 
                          Note: This method is less reliable due to Telegram&apos;s username limitations.
                        </p>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Link Account Section */}
              {showManualConfig && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50 border-blue-200">
                    <div>
                      <h4 className="font-medium text-blue-900">Automatic Account Linking</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Generate a secure code to link your Telegram account automatically
                      </p>
                    </div>
                    <Button
                      onClick={generateLinkCode}
                      disabled={linkCodeLoading}
                      variant="default"
                    >
                      {linkCodeLoading ? (
                        <>
                          <Loader2 className="animate-spin h-4 w-4 mr-2" />
                          Generating...
                        </>
                      ) : (
                        'Link Account'
                      )}
                    </Button>
                  </div>

                  {/* Link Code Display */}
                  {linkCode && showLinkFlow && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-900">Link Code Generated</AlertTitle>
                      <AlertDescription className="text-green-800">
                        <div className="space-y-3">
                          <div>
                            <p className="font-medium">Your link code:</p>
                            <div className="bg-white p-3 rounded border font-mono text-lg text-center mt-1">
                              {linkCode}
                            </div>
                          </div>
                          
                          <div>
                            <p className="font-medium">Next steps:</p>
                            <ol className="list-decimal list-inside mt-1 space-y-2 text-sm">
                              <li>Open your chat with @FeedbackBasketNotifyBot</li>
                              <li className="flex items-center gap-2">
                                <span>Send this command:</span>
                                <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border">
                                  <code className="text-sm font-mono">/link {linkCode}</code>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-gray-100"
                                    onClick={copyLinkCommand}
                                    title="Copy to clipboard"
                                  >
                                    {linkCommandCopied ? (
                                      <Check className="h-3 w-3 text-green-600" />
                                    ) : (
                                      <Copy className="h-3 w-3 text-gray-500" />
                                    )}
                                  </Button>
                                </div>
                              </li>
                              <li>The bot will confirm your account is linked</li>
                            </ol>
                          </div>

                          {linkCodeExpiration && (
                            <p className="text-sm text-amber-700">
                              ⏰ Code expires at: {linkCodeExpiration.toLocaleString()}
                              {isLinkCodeExpired() && (
                                <span className="text-red-600 font-medium"> (EXPIRED)</span>
                              )}
                            </p>
                          )}

                          {isLinkCodeExpired() && (
                            <Button
                              onClick={generateLinkCode}
                              disabled={linkCodeLoading}
                              variant="outline"
                              size="sm"
                            >
                              Generate New Code
                            </Button>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Account Linked Status */}
              {isLinked && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-900">Account Linked Successfully</AlertTitle>
                  <AlertDescription className="text-green-800">
                    Your Telegram account is linked and ready to receive notifications!
                  </AlertDescription>
                </Alert>
              )}

              {/* Manual Configuration (fallback) */}
              {showManualConfig && (
                <div className="space-y-4">
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Manual Configuration</h4>
                  </div>
                <div className="grid w-full max-w-md items-center gap-1.5">
                  <Label htmlFor="telegram-handle">Telegram Username or Chat ID</Label>
                  <div className="flex gap-2">
                    <Input
                      id="telegram-handle"
                      type="text"
                      placeholder="@username or 123456789"
                      value={telegramHandle}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setTelegramHandle(newValue);
                        validateHandleFormat(newValue);
                      }}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSaveTelegramHandle}
                      disabled={isLoading}
                      size="default"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="animate-spin h-4 w-4 mr-2" />
                          Saving...
                        </>
                      ) : (
                        'Save'
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enter your Telegram username (@username) or numeric Chat ID
                  </p>
                  {validationError && (
                    <p className="text-sm text-red-600">
                      {validationError}
                    </p>
                  )}
                </div>

                {/* Test Required Message */}
                {handleSaved && !isConnected && showManualConfig && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Test Connection Required</AlertTitle>
                    <AlertDescription>
                      Your Telegram handle has been saved. Please test the connection to verify it works correctly.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              )}

              {/* Action Buttons - Always show for any configured integration */}
              {(handleSaved || isLinked) && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleTestConnection}
                      disabled={testLoading}
                      variant="outline"
                      size="sm"
                    >
                      {testLoading ? (
                        <>
                          <Loader2 className="animate-spin h-4 w-4 mr-2" />
                          Testing...
                        </>
                      ) : (
                        'Test Connection'
                      )}
                    </Button>
                    <Button
                      onClick={handleRemoveIntegration}
                      disabled={removeLoading}
                      variant="destructive"
                      size="sm"
                    >
                      {removeLoading ? (
                        <>
                          <Loader2 className="animate-spin h-4 w-4 mr-2" />
                          Removing...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove Integration
                        </>
                      )}
                    </Button>
                  </div>
                )}
            </CardContent>
          </Card>

          {/* Project Notification Settings */}
          {isConfigured && projects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Project Notifications
                </CardTitle>
                <CardDescription>
                  Configure which projects should send Telegram notifications.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div 
                      key={project.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{project.name}</h4>
                        <p className="text-sm text-muted-foreground">{project.url}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {projectToggleLoading.has(project.id) ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="animate-spin h-4 w-4" />
                            <span className="text-sm text-muted-foreground">Updating...</span>
                          </div>
                        ) : (
                          <>
                            <Switch
                              checked={project.telegramNotifications}
                              onCheckedChange={(enabled) => 
                                handleProjectToggle(project.id, enabled)
                              }
                            />
                            <span className="text-sm text-muted-foreground">
                              {project.telegramNotifications ? 'Enabled' : 'Disabled'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Projects Message */}
          {isConfigured && projects.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  No projects found. Create a project to start receiving notifications.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Troubleshooting Section */}
          {isConfigured && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Troubleshooting</CardTitle>
                <CardDescription>
                  Having issues with Telegram notifications? Try these solutions:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-medium text-base mb-2">Common Issues:</h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="font-medium">•</span>
                        <div>
                          <strong>Test fails with &quot;chat not found&quot;:</strong> Your username might be different or case-sensitive. 
                          Try using your Chat ID instead (send <code className="bg-muted px-1 rounded text-xs">/chatid</code> to @FeedbackBasketNotifyBot)
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-medium">•</span>
                        <div>
                          <strong>Username not recognized:</strong> Make sure you&apos;ve started a chat with the bot and sent <code className="bg-muted px-1 rounded text-xs">/start</code>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-medium">•</span>
                        <div>
                          <strong>Not receiving notifications:</strong> Check that your project has notifications enabled and you haven&apos;t blocked the bot
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-medium">•</span>
                        <div>
                          <strong>How to find your Chat ID:</strong> Send <code className="bg-muted px-1 rounded text-xs">/chatid</code> to @FeedbackBasketNotifyBot and it will reply with your numeric Chat ID
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}