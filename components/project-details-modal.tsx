'use client';

import { useState } from 'react';
import { X, Edit, Save, ExternalLink, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProjectDetailsModalProps {
  project: {
    id: string;
    name: string;
    url: string;
    description?: string | null;
    logoUrl?: string | null;
    ogImageUrl?: string | null;
    aiGenerated?: boolean;
    lastAnalyzedAt?: Date | null;
  };
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (
    projectId: string,
    updates: {
      name: string;
      description: string;
      logoUrl?: string;
      ogImageUrl?: string;
      aiGenerated?: boolean;
      lastAnalyzedAt?: Date;
    }
  ) => void;
  onDelete?: (projectId: string) => void;
}

export function ProjectDetailsModal({
  project,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: ProjectDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: project.name,
    description: project.description || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    title: string;
    description: string;
    aiDescription: string;
    logoUrl?: string;
    ogImageUrl?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!onUpdate) return;

    setIsSaving(true);
    try {
      const updates = {
        ...editData,
        ...(analysisResult && {
          logoUrl: analysisResult.logoUrl,
          ogImageUrl: analysisResult.ogImageUrl,
          aiGenerated: !!analysisResult.aiDescription,
          lastAnalyzedAt: new Date(),
        }),
      };
      await onUpdate(project.id, updates);
      setIsEditing(false);
      setAnalysisResult(null); // Clear analysis result after saving
    } catch (error) {
      console.error('Failed to update project:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      name: project.name,
      description: project.description || '',
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(project.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete project:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleAnalyzeWebsite = async () => {
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: project.url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze website');
      }

      const result = await response.json();

      if (result.success && result.data) {
        setAnalysisResult(result.data);

        // Auto-fill the description with AI-generated content
        if (result.data.aiDescription) {
          setEditData(prev => ({
            ...prev,
            description: result.data.aiDescription,
          }));
        }
      } else {
        throw new Error(result.error || 'Failed to analyze website');
      }
    } catch (error) {
      console.error('Website analysis failed:', error);
      // You could add a toast notification here for better UX
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  value={editData.name}
                  onChange={e => setEditData(prev => ({ ...prev, name: e.target.value }))}
                  className="text-lg font-semibold"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {project.logoUrl && (
                  <img
                    src={project.logoUrl}
                    alt={`${project.name} logo`}
                    className="w-8 h-8 object-contain"
                  />
                )}
                <CardTitle className="text-xl">{project.name}</CardTitle>
                {project.aiGenerated && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                  >
                    AI Enhanced
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && onUpdate && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
            {!isEditing && onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Website URL */}
          <div>
            <Label className="text-sm font-medium">Website URL</Label>
            <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {project.url}
              </a>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium">
                {project.aiGenerated ? 'AI-Generated Description' : 'Description'}
              </Label>
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAnalyzeWebsite}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Website'}
                </Button>
              )}
            </div>
            {isEditing ? (
              <textarea
                value={editData.description}
                onChange={e => setEditData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-2 w-full min-h-[120px] px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md resize-vertical"
                placeholder="Enter project description..."
              />
            ) : (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                {project.description ? (
                  <p className="text-sm text-gray-700 leading-relaxed">{project.description}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No description available</p>
                )}
              </div>
            )}
            {isEditing && analysisResult && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium mb-1">
                  ✓ Website analyzed successfully!
                </p>
                <p className="text-xs text-green-700">
                  The description above has been updated with AI-generated content from your
                  website.
                </p>
              </div>
            )}
          </div>

          {/* Preview Image */}
          {(() => {
            const imageUrl = analysisResult?.ogImageUrl || project.ogImageUrl;
            if (!imageUrl) return null;

            return (
              <div>
                <Label className="text-sm font-medium">Website Preview</Label>
                <div className="mt-2 relative h-48 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={`${project.name} preview`}
                    className="w-full h-full object-cover"
                  />
                </div>
                {analysisResult?.ogImageUrl && analysisResult.ogImageUrl !== project.ogImageUrl && (
                  <p className="text-xs text-green-700 mt-1">
                    ✓ Updated preview image from website analysis
                  </p>
                )}
              </div>
            );
          })()}

          {/* Analysis Info */}
          {project.lastAnalyzedAt && (
            <div className="text-xs text-muted-foreground">
              Last analyzed: {new Date(project.lastAnalyzedAt).toLocaleDateString()}
            </div>
          )}

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  'Saving...'
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">Delete Project</CardTitle>
              <CardDescription>
                Are you sure you want to delete "{project.name}"? This action cannot be undone and
                will permanently remove all feedback data.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? (
                  'Deleting...'
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete Project
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
