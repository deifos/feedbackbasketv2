'use client';

import { useState, useMemo } from 'react';
import { MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardHeader } from '@/components/dashboard-header';
import { ProjectHeader } from '@/components/project-header';
import { ProjectStats } from '@/components/project-stats';
import { FeedbackFilters } from '@/components/feedback-filters';
import { FeedbackItem } from '@/components/feedback-item';
import { PaginationControls } from '@/components/pagination-controls';
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

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Bulk selection state
  const [selectedFeedbackIds, setSelectedFeedbackIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

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

  // Bulk selection functions
  const handleSelectAll = () => {
    if (selectedFeedbackIds.size === paginatedFeedback.length) {
      // Deselect all
      setSelectedFeedbackIds(new Set());
    } else {
      // Select all on current page
      setSelectedFeedbackIds(new Set(paginatedFeedback.map(f => f.id)));
    }
  };

  const handleSelectFeedback = (feedbackId: string) => {
    const newSelected = new Set(selectedFeedbackIds);
    if (newSelected.has(feedbackId)) {
      newSelected.delete(feedbackId);
    } else {
      newSelected.add(feedbackId);
    }
    setSelectedFeedbackIds(newSelected);
  };

  const handleBulkStatusChange = async (newStatus: 'PENDING' | 'REVIEWED' | 'DONE') => {
    if (selectedFeedbackIds.size === 0) return;

    setBulkActionLoading(true);
    try {
      // Update all selected feedback items
      const promises = Array.from(selectedFeedbackIds).map(feedbackId =>
        fetch(`/api/feedback/${feedbackId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        })
      );

      await Promise.all(promises);

      // Clear selection and refresh
      setSelectedFeedbackIds(new Set());
      window.location.reload();
    } catch (error) {
      console.error('Failed to update bulk status:', error);
    } finally {
      setBulkActionLoading(false);
    }
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

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} />

      <main className="container mx-auto py-8">
        <ProjectHeader project={project} />

        <ProjectStats stats={stats} />

        {/* Feedback Management */}
        <Card>
          <CardHeader>
            <CardTitle>Feedback Management</CardTitle>
            <CardDescription>
              View and manage all feedback received for this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FeedbackFilters
              searchQuery={searchQuery}
              sortOrder={sortOrder}
              selectedStatus={selectedStatus}
              onSearchChange={query => {
                setSearchQuery(query);
                resetPagination();
              }}
              onSortChange={setSortOrder}
              onClearFilters={() => {
                setSearchQuery('');
                setSelectedStatus('all');
                setSortOrder('newest');
                resetPagination();
              }}
            />

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
                    {/* Bulk Actions Bar */}
                    {paginatedFeedback.length > 0 && (
                      <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={
                                selectedFeedbackIds.size === paginatedFeedback.length &&
                                paginatedFeedback.length > 0
                              }
                              onChange={handleSelectAll}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium">
                              {selectedFeedbackIds.size === paginatedFeedback.length &&
                              paginatedFeedback.length > 0
                                ? 'Deselect All'
                                : 'Select All'}
                            </span>
                          </label>

                          {selectedFeedbackIds.size > 0 && (
                            <span className="text-sm text-gray-600">
                              {selectedFeedbackIds.size} item
                              {selectedFeedbackIds.size !== 1 ? 's' : ''} selected
                            </span>
                          )}
                        </div>

                        {/* Bulk Action Buttons */}
                        {selectedFeedbackIds.size > 0 && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleBulkStatusChange('PENDING')}
                              disabled={bulkActionLoading}
                              className="px-3 py-1 text-sm bg-orange-100 text-orange-800 rounded-md hover:bg-orange-200 disabled:opacity-50"
                            >
                              Mark Pending
                            </button>
                            <button
                              onClick={() => handleBulkStatusChange('REVIEWED')}
                              disabled={bulkActionLoading}
                              className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 disabled:opacity-50"
                            >
                              Mark Reviewed
                            </button>
                            <button
                              onClick={() => handleBulkStatusChange('DONE')}
                              disabled={bulkActionLoading}
                              className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200 disabled:opacity-50"
                            >
                              Mark Done
                            </button>
                            {bulkActionLoading && (
                              <span className="text-sm text-gray-500">Updating...</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-4">
                      {paginatedFeedback.map(item => (
                        <FeedbackItem
                          key={item.id}
                          feedback={item}
                          isSelected={selectedFeedbackIds.has(item.id)}
                          onSelect={() => handleSelectFeedback(item.id)}
                          onStatusChange={handleStatusChange}
                          onNotesUpdate={(feedbackId, notes) => {
                            // Update notes via API
                            fetch(`/api/feedback/${feedbackId}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ notes }),
                            }).then(() => window.location.reload());
                          }}
                        />
                      ))}
                    </div>

                    <PaginationControls
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
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
