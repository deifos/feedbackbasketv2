'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Copy, Eye, EyeOff, Trash2, Settings, Key, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  url: string;
}

interface ApiKey {
  id: string;
  name: string;
  keyPreview: string;
  key?: string; // Only present when just created
  isActive: boolean;
  lastUsed?: string;
  usageCount: number;
  createdAt: string;
  projects: Project[];
}

export function ApiKeysClient() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [showKey, setShowKey] = useState<string | null>(null);
  const [fullKeys, setFullKeys] = useState<Record<string, string>>({});
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; keyId?: string; keyName?: string }>({ 
    isOpen: false 
  });
  const [deleting, setDeleting] = useState(false);

  // Load API keys and projects
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [keysRes, projectsRes] = await Promise.all([
        fetch('/api/mcp/keys'),
        fetch('/api/projects')
      ]);

      if (keysRes.ok) {
        const keysData = await keysRes.json();
        setApiKeys(keysData.apiKeys || []);
      }

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData.projects || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for your API key');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/mcp/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName.trim(),
          projectIds: selectedProjectIds,
        }),
      });

      if (response.ok) {
        const newKey = await response.json();
        // Store the full key temporarily for copying
        if (newKey.key) {
          setFullKeys(prev => ({ ...prev, [newKey.id]: newKey.key }));
        }
        setApiKeys(prev => [newKey, ...prev]);
        setShowCreateDialog(false);
        setNewKeyName('');
        setSelectedProjectIds([]);
        setShowKey(newKey.id);
        toast.success('API key created successfully!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create API key');
      }
    } catch (error) {
      console.error('Failed to create API key:', error);
      toast.error('Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const openDeleteDialog = (keyId: string, keyName: string) => {
    setDeleteDialog({ isOpen: true, keyId, keyName });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ isOpen: false });
    setDeleting(false);
  };

  const deleteApiKey = async () => {
    if (!deleteDialog.keyId) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/mcp/keys/${deleteDialog.keyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setApiKeys(prev => prev.filter(key => key.id !== deleteDialog.keyId));
        // Clean up stored full key
        setFullKeys(prev => {
          const { [deleteDialog.keyId!]: _, ...rest } = prev;
          return rest;
        });
        toast.success('API key deleted successfully');
        closeDeleteDialog();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete API key');
      }
    } catch (error) {
      console.error('Failed to delete API key:', error);
      toast.error('Failed to delete API key');
    } finally {
      setDeleting(false);
    }
  };

  const copyToClipboard = (text: string, description: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${description} copied to clipboard`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading API keys...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-900 flex items-center">
            <Key className="h-4 w-4 mr-2" />
            MCP API Keys
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Connect AI assistants to your FeedbackBasket data
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center">
              <Plus className="h-3 w-3 mr-1" />
              New Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>
                Create an API key to allow AI assistants to access your FeedbackBasket projects.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="keyName">API Key Name</Label>
                <Input
                  id="keyName"
                  placeholder="e.g., Claude Desktop, Cursor IDE"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>
              <div className="grid w-full items-center gap-2">
                <Label>Project Access</Label>
                <p className="text-sm text-muted-foreground">
                  Select which projects this API key can access. Leave empty to grant access to all projects.
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                  {projects.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-2">
                      No projects found. Create a project first.
                    </p>
                  ) : (
                    projects.map((project) => (
                      <div key={project.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={project.id}
                          checked={selectedProjectIds.includes(project.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedProjectIds(prev => [...prev, project.id]);
                            } else {
                              setSelectedProjectIds(prev => prev.filter(id => id !== project.id));
                            }
                          }}
                        />
                        <Label htmlFor={project.id} className="text-sm">
                          {project.name}
                          <span className="text-xs text-gray-500 ml-1">({project.url})</span>
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createApiKey} disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create API Key
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <div className="text-center py-6">
          <Key className="h-8 w-8 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600 mb-3">
            No API keys yet. Create one to connect AI assistants.
          </p>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-3 w-3 mr-1" />
            Create First Key
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {apiKeys.map((apiKey) => (
            <div key={apiKey.id} className="border rounded-md p-3 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900">{apiKey.name}</span>
                    {!apiKey.isActive && (
                      <Badge variant="secondary" className="ml-2 text-xs">Inactive</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">
                    Created {formatDate(apiKey.createdAt)} • {apiKey.usageCount} uses
                    {apiKey.lastUsed && ` • Last used ${formatDate(apiKey.lastUsed)}`}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDeleteDialog(apiKey.id, apiKey.name)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              {/* API Key Display */}
              <div>
                <div className="flex items-center space-x-2">
                  <Input
                    readOnly
                    value={showKey === apiKey.id && fullKeys[apiKey.id] ? fullKeys[apiKey.id] : apiKey.keyPreview}
                    className="font-mono text-xs"
                  />
                  {/* Only show eye button if we have the full key stored */}
                  {fullKeys[apiKey.id] && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowKey(showKey === apiKey.id ? null : apiKey.id)}
                    >
                      {showKey === apiKey.id ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  )}
                  {/* Only show copy button if we have the full key */}
                  {fullKeys[apiKey.id] && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(fullKeys[apiKey.id], 'API key')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Project Access */}
              <div>
                <p className="text-xs text-gray-600 mb-1">Project Access:</p>
                {!apiKey.projects || apiKey.projects.length === 0 ? (
                  <Badge variant="secondary" className="text-xs">No projects</Badge>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {apiKey.projects.slice(0, 3).map((project) => (
                      <Badge key={project.id} variant="outline" className="text-xs">
                        {project.name}
                      </Badge>
                    ))}
                    {apiKey.projects.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{apiKey.projects.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Show new key alert */}
              {apiKey.key && (
                <Alert className="py-2">
                  <CheckCircle className="h-3 w-3" />
                  <AlertDescription className="text-xs">
                    <strong>Copy this key now!</strong> You won't see the full key again.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Quick usage hint */}
      {apiKeys.length > 0 && (
        <div className="text-xs text-gray-500 mt-2">
          💡 Add to your AI assistant config: <code className="bg-gray-100 px-1 rounded">npx @feedbackbasket/mcp-server@latest --api-key your_key</code>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.isOpen} onOpenChange={closeDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              Delete API Key
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the API key <strong>"{deleteDialog.keyName}"</strong>?
              <br />
              <br />
              This action cannot be undone and will immediately revoke access for any applications using this key.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteDialog} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteApiKey} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Key
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}