'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  MessageSquare,
  Settings,
  ExternalLink,
  Calendar,
  Mail,
  Edit3,
  Check,
  X,
  Search,
  Filter,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Advanced filtering, sorting, and pagination with useMemo for performance
  const { paginatedFeedback, totalPages, totalFilteredItems } = useMemo(() => {
    let filtered = feedback;

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(f => f.status === selectedStatus);
    }

    // Filter by search query (search in content and email)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        f =>
          f.content.toLowerCase().includes(query) ||
          (f.email && f.email.toLowerCase().includes(query)) ||
          (f.notes && f.notes.toLowerCase().includes(query))
      );
    }

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    // Calculate pagination
    const totalFilteredItems = filtered.length;
    const totalPages = Math.ceil(totalFilteredItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedFeedback = filtered.slice(startIndex, endIndex);

    return {
      paginatedFeedback,
      totalPages,
      totalFilteredItems,
    };
  }, [feedback, selectedStatus, searchQuery, sortOrder, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  const resetPagination = () => {
    setCurrentPage(1);
  };

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
            {/* Filtering Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              {/* Search Input */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search feedback content, email, or notes..."
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      resetPagination();
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Sort Controls */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                  className="flex items-center space-x-2"
                >
                  {sortOrder === 'newest' ? (
                    <SortDesc className="w-4 h-4" />
                  ) : (
                    <SortAsc className="w-4 h-4" />
                  )}
                  <span>{sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
                </Button>

                {/* Clear Filters */}
                {(searchQuery || selectedStatus !== 'all' || sortOrder !== 'newest') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedStatus('all');
                      setSortOrder('newest');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>

            <Tabs
              value={selectedStatus}
              onValueChange={value => {
                setSelectedStatus(value as any);
                resetPagination();
              }}
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                <TabsTrigger value="PENDING">Pending ({stats.pending})</TabsTrigger>
                <TabsTrigger value="REVIEWED">Reviewed ({stats.reviewed})</TabsTrigger>
                <TabsTrigger value="DONE">Done ({stats.done})</TabsTrigger>
              </TabsList>

              <TabsContent value={selectedStatus} className="mt-6">
                {/* Results info and pagination info */}
                {totalFilteredItems > 0 && (
                  <div className="flex justify-between items-center mb-4 text-sm text-muted-foreground">
                    <span>
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                      {Math.min(currentPage * itemsPerPage, totalFilteredItems)} of{' '}
                      {totalFilteredItems} results
                      {searchQuery && ` for "${searchQuery}"`}
                    </span>
                    {totalPages > 1 && (
                      <span>
                        Page {currentPage} of {totalPages}
                      </span>
                    )}
                  </div>
                )}

                {paginatedFeedback.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No feedback yet</h3>
                    <p className="text-muted-foreground">
                      {feedback.length === 0
                        ? 'No feedback has been received for this project yet.'
                        : searchQuery
                          ? `No feedback matching "${searchQuery}" found.`
                          : selectedStatus === 'all'
                            ? 'No feedback matches the current filters.'
                            : `No ${selectedStatus.toLowerCase()} feedback found.`}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {paginatedFeedback.map(item => (
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

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6 pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </Button>

                          {/* Page numbers */}
                          <div className="flex items-center space-x-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }

                              return (
                                <Button
                                  key={pageNum}
                                  variant={currentPage === pageNum ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setCurrentPage(pageNum)}
                                  className="w-8 h-8 p-0"
                                >
                                  {pageNum}
                                </Button>
                              );
                            })}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
