import { useState, useMemo } from 'react';
import { Feedback } from '@/app/generated/prisma';

interface UseFeedbackFiltersProps {
  feedback: Feedback[];
  itemsPerPage?: number;
}

interface FilterState {
  selectedStatus: 'all' | 'PENDING' | 'REVIEWED' | 'DONE';
  searchQuery: string;
  sortOrder: 'newest' | 'oldest';
  selectedCategory: 'all' | 'BUG' | 'FEATURE' | 'REVIEW';
  selectedSentiment: 'all' | 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  currentPage: number;
}

export function useFeedbackFilters({ feedback, itemsPerPage = 10 }: UseFeedbackFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    selectedStatus: 'all',
    searchQuery: '',
    sortOrder: 'newest',
    selectedCategory: 'all',
    selectedSentiment: 'all',
    currentPage: 1,
  });

  // Advanced filtering, sorting, and pagination with useMemo for performance
  const { paginatedFeedback, totalPages, totalFilteredItems } = useMemo(() => {
    let filtered = feedback;

    // Filter by status
    if (filters.selectedStatus !== 'all') {
      filtered = filtered.filter(f => f.status === filters.selectedStatus);
    }

    // Filter by category (check both AI and manual categories)
    if (filters.selectedCategory !== 'all') {
      filtered = filtered.filter(f => {
        const effectiveCategory =
          f.categoryOverridden && f.manualCategory ? f.manualCategory : f.category;
        return effectiveCategory === filters.selectedCategory;
      });
    }

    // Filter by sentiment (check both AI and manual sentiment)
    if (filters.selectedSentiment !== 'all') {
      filtered = filtered.filter(f => {
        const effectiveSentiment =
          f.sentimentOverridden && f.manualSentiment ? f.manualSentiment : f.sentiment;
        return effectiveSentiment === filters.selectedSentiment;
      });
    }

    // Filter by search query (search in content and email)
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim();
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
      return filters.sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    // Calculate pagination
    const totalFilteredItems = filtered.length;
    const totalPages = Math.ceil(totalFilteredItems / itemsPerPage);
    const startIndex = (filters.currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedFeedback = filtered.slice(startIndex, endIndex);

    return {
      paginatedFeedback,
      totalPages,
      totalFilteredItems,
    };
  }, [
    feedback,
    filters.selectedStatus,
    filters.selectedCategory,
    filters.selectedSentiment,
    filters.searchQuery,
    filters.sortOrder,
    filters.currentPage,
    itemsPerPage,
  ]);

  // Helper functions
  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetPagination = () => {
    setFilters(prev => ({ ...prev, currentPage: 1 }));
  };

  const clearAllFilters = () => {
    setFilters({
      selectedStatus: 'all',
      searchQuery: '',
      sortOrder: 'newest',
      selectedCategory: 'all',
      selectedSentiment: 'all',
      currentPage: 1,
    });
  };

  return {
    filters,
    paginatedFeedback,
    totalPages,
    totalFilteredItems,
    updateFilter,
    resetPagination,
    clearAllFilters,
  };
}
