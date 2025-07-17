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
import { CategoryFilterCard } from '@/components/category-filter-card';
import { SentimentFilterCard } from '@/components/sentiment-filter-card';
import { ProjectDetailsModal } from '@/components/project-details-modal';
import { BulkActionsBar } from '@/components/bulk-actions-bar';
import { Project, ProjectCustomization, Feedback } from '@/app/generated/prisma';
import { useFeedbackFilters } from '@/hooks/use-feedback-filters';
import {
  calculateEnhancedStats,
  calculateCategoryCounts,
  calculateSentimentCounts,
} from '@/lib/feedback-stats';

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
  // Calculate additional stats for AI analysis using helper function
  const enhancedStats = useMemo(() => calculateEnhancedStats(feedback, stats), [feedback, stats]);

  // Use custom hook for filtering logic
  const {
    filters,
    paginatedFeedback,
    totalPages,
    totalFilteredItems,
    updateFilter,
    resetPagination,
    clearAllFilters,
  } = useFeedbackFilters({ feedback, itemsPerPage: 10 });

  // Bulk selection state
  const [selectedFeedbackIds, setSelectedFeedbackIds] = useState<Set<string>>(new Set());
  const [_bulkActionLoading, setBulkActionLoading] = useState(false);

  // Project details modal state
  const [isProjectDetailsModalOpen, setIsProjectDetailsModalOpen] = useState(false);

  const handleProjectDetails = () => {
    setIsProjectDetailsModalOpen(true);
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
        <ProjectHeader project={project} onProjectDetails={handleProjectDetails} />

        <ProjectStats stats={enhancedStats} />

        {/* Feedback Management */}
        <Card>
          <CardHeader>
            <CardTitle>Feedback Management</CardTitle>
            <CardDescription>
              View and manage all feedback received for this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Basic Search and Sort */}
            <FeedbackFilters
              searchQuery={filters.searchQuery}
              sortOrder={filters.sortOrder}
              onSearchChange={query => {
                updateFilter('searchQuery', query);
                resetPagination();
              }}
              onSortChange={order => updateFilter('sortOrder', order)}
              onClearFilters={clearAllFilters}
            />

            {/* AI Analysis Filter Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 mb-6">
              {/* Category Filter Card */}
              <CategoryFilterCard
                selectedCategory={filters.selectedCategory}
                onCategoryChange={category => {
                  updateFilter('selectedCategory', category);
                  resetPagination();
                }}
                categoryCounts={calculateCategoryCounts(feedback)}
              />

              {/* Sentiment Filter Card */}
              <SentimentFilterCard
                selectedSentiment={filters.selectedSentiment}
                onSentimentChange={sentiment => {
                  updateFilter('selectedSentiment', sentiment);
                  resetPagination();
                }}
                sentimentCounts={calculateSentimentCounts(feedback)}
              />
            </div>

            <Tabs
              value={filters.selectedStatus}
              onValueChange={value => {
                updateFilter('selectedStatus', value as any);
                resetPagination();
              }}
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                <TabsTrigger value="PENDING">Pending ({stats.pending})</TabsTrigger>
                <TabsTrigger value="REVIEWED">Reviewed ({stats.reviewed})</TabsTrigger>
                <TabsTrigger value="DONE">Done ({stats.done})</TabsTrigger>
              </TabsList>

              <TabsContent value={filters.selectedStatus} className="mt-6">
                {/* Results info and pagination info */}
                {totalFilteredItems > 0 && (
                  <div className="flex justify-between items-center mb-4 text-sm text-muted-foreground">
                    <span>
                      Showing {(filters.currentPage - 1) * 10 + 1} to{' '}
                      {Math.min(filters.currentPage * 10, totalFilteredItems)} of{' '}
                      {totalFilteredItems} results
                      {filters.searchQuery && ` for "${filters.searchQuery}"`}
                    </span>
                    {totalPages > 1 && (
                      <span>
                        Page {filters.currentPage} of {totalPages}
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
                        : filters.searchQuery
                          ? `No feedback matching "${filters.searchQuery}" found.`
                          : filters.selectedStatus === 'all'
                            ? 'No feedback matches the current filters.'
                            : `No ${filters.selectedStatus.toLowerCase()} feedback found.`}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Bulk Actions Bar */}
                    <BulkActionsBar
                      totalItems={paginatedFeedback.length}
                      selectedIds={selectedFeedbackIds}
                      onSelectAll={handleSelectAll}
                      onBulkStatusChange={handleBulkStatusChange}
                    />

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
                      currentPage={filters.currentPage}
                      totalPages={totalPages}
                      onPageChange={page => updateFilter('currentPage', page)}
                    />
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Project Details Modal */}
        <ProjectDetailsModal
          project={project}
          isOpen={isProjectDetailsModalOpen}
          onClose={() => setIsProjectDetailsModalOpen(false)}
          onUpdate={handleUpdateProject}
          onDelete={handleDeleteProject}
        />
      </main>
    </div>
  );
}
