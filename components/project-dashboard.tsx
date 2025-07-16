'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  MessageSquare,
  Settings,
  ExternalLink,
  Calendar,
  Mail,
  User,
  Edit3,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardHeader } from '@/components/dashboard-header';
import { Project, ProjectCustomization, Feedback } from '@/app/generated/prisma';

interface ProjectDashboardProps {
  project: Project & {
    customization: ProjectCustomization | null;
    feedback: Feedback[];
  };
  feedback: Feedback[];
  stats: {
    total: number;
    pending: number;
    reviewed: number;
    done: number;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export function ProjectDashboard({ project, feedback, stats, user }: ProjectDashboardProps) {
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'PENDING' | 'REVIEWED' | 'DONE'>(
    'all'
  );
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  // Filter feedback based on selected status
  const filteredFeedback =
    selectedStatus === 'all' ? feedback : feedback.filter(f => f.status === selectedStatus);

  const handleStatusChange = async (
    feedbackId: string,
    newStatus: 'PENDING' | 'REVIEWED' | 'DONE'
  ) => {
    try {
      const response = await fetch(`/api/feedback/${feedbackId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Refresh the page to show updated data
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleNotesUpdate = async (feedbackId: string) => {
    try {
      const response = await fetch(`/api/feedback/${feedbackId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: noteText }),
      });

      if (response.ok) {
        setEditingNotes(null);
        setNoteText('');
        // Refresh the page to show updated data
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to update notes:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'REVIEWED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DONE':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} />

      <main className="container mx-auto py-8">
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

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
              <div className="flex items-center text-muted-foreground mb-4">
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
              <Link href={`/dashboard/projects/${project.id}/install`}>
                <Button>Get Embed Code</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <MessageSquare className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reviewed</CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.reviewed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Done</CardTitle>
              <MessageSquare className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.done}</div>
            </CardContent>
          </Card>
        </div>

        {/* Feedback Management */}
        <Card>
          <CardHeader>
            <CardTitle>Feedback Management</CardTitle>
            <CardDescription>
              View and manage all feedback received for this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedStatus} onValueChange={value => setSelectedStatus(value as any)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                <TabsTrigger value="PENDING">Pending ({stats.pending})</TabsTrigger>
                <TabsTrigger value="REVIEWED">Reviewed ({stats.reviewed})</TabsTrigger>
                <TabsTrigger value="DONE">Done ({stats.done})</TabsTrigger>
              </TabsList>

              <TabsContent value={selectedStatus} className="mt-6">
                {filteredFeedback.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No feedback yet</h3>
                    <p className="text-muted-foreground">
                      {selectedStatus === 'all'
                        ? 'No feedback has been received for this project yet.'
                        : `No ${selectedStatus.toLowerCase()} feedback found.`}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredFeedback.map(item => (
                      <Card key={item.id} className="relative">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-2">
                              <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Calendar className="w-4 h-4 mr-1" />
                                {new Date(item.createdAt).toLocaleDateString()} at{' '}
                                {new Date(item.createdAt).toLocaleTimeString()}
                              </div>
                            </div>

                            {/* Status Change Buttons */}
                            <div className="flex space-x-1">
                              {item.status !== 'PENDING' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStatusChange(item.id, 'PENDING')}
                                  className="text-orange-600 hover:text-orange-700"
                                >
                                  Mark Pending
                                </Button>
                              )}
                              {item.status !== 'REVIEWED' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStatusChange(item.id, 'REVIEWED')}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  Mark Reviewed
                                </Button>
                              )}
                              {item.status !== 'DONE' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStatusChange(item.id, 'DONE')}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  Mark Done
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Feedback Content */}
                          <div className="mb-4">
                            <p className="text-gray-900 leading-relaxed">{item.content}</p>
                          </div>

                          {/* Email if provided */}
                          {item.email && (
                            <div className="flex items-center text-sm text-muted-foreground mb-4">
                              <Mail className="w-4 h-4 mr-2" />
                              <a href={`mailto:${item.email}`} className="hover:underline">
                                {item.email}
                              </a>
                            </div>
                          )}

                          {/* Notes Section */}
                          <div className="border-t pt-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-medium text-gray-700">Private Notes</h4>
                              {editingNotes !== item.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingNotes(item.id);
                                    setNoteText(item.notes || '');
                                  }}
                                >
                                  <Edit3 className="w-4 h-4 mr-1" />
                                  {item.notes ? 'Edit' : 'Add'} Notes
                                </Button>
                              )}
                            </div>

                            {editingNotes === item.id ? (
                              <div className="space-y-2">
                                <textarea
                                  value={noteText}
                                  onChange={e => setNoteText(e.target.value)}
                                  placeholder="Add private notes about this feedback..."
                                  className="w-full p-2 border border-gray-300 rounded-md resize-none h-20 text-sm"
                                />
                                <div className="flex space-x-2">
                                  <Button size="sm" onClick={() => handleNotesUpdate(item.id)}>
                                    <Check className="w-4 h-4 mr-1" />
                                    Save
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingNotes(null);
                                      setNoteText('');
                                    }}
                                  >
                                    <X className="w-4 h-4 mr-1" />
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-600">
                                {item.notes || (
                                  <span className="italic text-gray-400">No notes added yet</span>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
