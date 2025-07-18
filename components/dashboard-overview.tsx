'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Settings, ExternalLink, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProjectWithCounts } from '@/lib/types/api';
import { ProjectDetailsModal } from '@/components/project-details-modal';
import { AddProjectButton } from '@/components/add-project-button';
import Image from 'next/image';

interface DashboardData {
  projects: ProjectWithCounts[];
  stats: {
    totalProjects: number;
    totalFeedback: number;
    totalPendingFeedback: number;
    thisMonthFeedback: number;
  };
}

interface DashboardOverviewProps {
  data: DashboardData;
}

export function DashboardOverview({ data }: DashboardOverviewProps) {
  const { projects, stats } = data;
  const [selectedProject, setSelectedProject] = useState<ProjectWithCounts | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleProjectDetails = (project: ProjectWithCounts) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleUpdateProject = async (
    projectId: string,
    updates: {
      name: string;
      description: string;
      logoUrl?: string;
      ogImageUrl?: string;
      aiGenerated?: boolean;
      lastAnalyzedAt?: Date;
    }
  ) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        throw new Error('Failed to update project');
      }
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Redirect to dashboard after successful deletion
        window.location.href = '/dashboard';
      } else {
        throw new Error('Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  };

  return (
    <main className="container mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your feedback collection projects.</p>
      </div>
      <div className="space-y-8">
        {/* Stats Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProjects}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalProjects === 0 ? 'No projects yet' : 'Active projects'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFeedback}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalFeedback === 0 ? 'No feedback received' : 'All time feedback'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Feedback</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.totalPendingFeedback}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalPendingFeedback === 0 ? 'All caught up!' : 'Needs attention'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.thisMonthFeedback}</div>
              <p className="text-xs text-muted-foreground">
                {stats.thisMonthFeedback === 0 ? 'No feedback this month' : 'New feedback'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Projects Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Your Projects</h2>
              <p className="text-muted-foreground">Manage your feedback collection projects</p>
            </div>
            <AddProjectButton />
          </div>

          {projects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                  Get started by creating your first feedback collection project. Add the widget to
                  your website and start collecting valuable user feedback.
                </p>
                <AddProjectButton />
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map(project => (
                <Card key={project.id} className="relative overflow-hidden">
                  {/* Background Image */}
                  {project.ogImageUrl && (
                    <div className="absolute inset-0 z-0">
                      <Image
                        src={project.ogImageUrl}
                        alt={`${project.name} preview`}
                        width={1000}
                        height={600}
                        className="w-full h-full object-cover opacity-5"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-white via-white/95 to-white/90" />
                    </div>
                  )}

                  <CardHeader className="relative z-10">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {project.logoUrl && (
                            <Image
                              src={project.logoUrl}
                              alt={`${project.name} logo`}
                              className="w-6 h-6 object-contain"
                              width={24}
                              height={24}
                            />
                          )}
                          <CardTitle className="text-lg">{project.name}</CardTitle>
                          {project.aiGenerated && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                            >
                              AI Enhanced
                            </Badge>
                          )}
                        </div>

                        <CardDescription className="flex items-center mt-1">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          <a
                            href={project.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline truncate"
                          >
                            {project.url}
                          </a>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="relative z-10">
                    <div className="space-y-4">
                      {/* Feedback Stats */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total Feedback</p>
                          <p className="font-semibold">{project._count.feedback}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Pending</p>
                          <p className="font-semibold text-orange-600">
                            {project._count.pendingFeedback}
                          </p>
                        </div>
                      </div>

                      {/* Widget Preview */}
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-xs text-muted-foreground mb-2">Widget Preview</p>
                        <div
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-white rounded"
                          style={{
                            backgroundColor: project.customization?.buttonColor || '#3b82f6',
                            borderRadius: `${project.customization?.buttonRadius || 8}px`,
                          }}
                        >
                          <MessageSquare className="w-3 h-3" />
                          {project.customization?.buttonLabel || 'Feedback'}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Link
                          href={`/dashboard/projects/${project.id}`}
                          className="flex-1"
                          prefetch
                        >
                          <Button variant="outline" size="sm" className="w-full">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            View Feedback
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleProjectDetails(project)}
                        >
                          <Info className="w-4 h-4" />
                        </Button>
                        <Link href={`/dashboard/projects/${project.id}/customize`}>
                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>

                      {/* Quick Actions */}
                      <div className="pt-2 border-t">
                        <div className="flex justify-between text-xs">
                          <Link
                            href={`/dashboard/projects/${project.id}/install`}
                            className="text-blue-600 hover:underline"
                            prefetch
                          >
                            Get embed code
                          </Link>
                          <span className="text-muted-foreground">
                            Updated {new Date(project.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Project Details Modal */}
        {selectedProject && (
          <ProjectDetailsModal
            project={selectedProject}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedProject(null);
            }}
            onUpdate={handleUpdateProject}
            onDelete={handleDeleteProject}
          />
        )}
      </div>
    </main>
  );
}
