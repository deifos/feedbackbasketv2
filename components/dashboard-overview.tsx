'use client';

import Link from 'next/link';
import { Plus, MessageSquare, Settings, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProjectWithCounts } from '@/lib/types/api';

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

  return (
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
          <Link href="/dashboard/projects/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Project
            </Button>
          </Link>
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
              <Link href="/dashboard/projects/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Project
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map(project => (
              <Card key={project.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
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
                    {project._count.pendingFeedback > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {project._count.pendingFeedback} pending
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
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
                      <Link href={`/dashboard/projects/${project.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          View Feedback
                        </Button>
                      </Link>
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
    </div>
  );
}
