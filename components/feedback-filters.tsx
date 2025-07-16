import { Search, SortAsc, SortDesc } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FeedbackFiltersProps {
  searchQuery: string;
  sortOrder: 'newest' | 'oldest';
  selectedStatus: 'all' | 'PENDING' | 'REVIEWED' | 'DONE';
  onSearchChange: (query: string) => void;
  onSortChange: (order: 'newest' | 'oldest') => void;
  onClearFilters: () => void;
}

export function FeedbackFilters({
  searchQuery,
  sortOrder,
  selectedStatus,
  onSearchChange,
  onSortChange,
  onClearFilters,
}: FeedbackFiltersProps) {
  const hasActiveFilters = searchQuery || selectedStatus !== 'all' || sortOrder !== 'newest';

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Search Input */}
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search feedback content, email, or notes..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSortChange(sortOrder === 'newest' ? 'oldest' : 'newest')}
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
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}
