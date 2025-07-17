'use client';

import { useState } from 'react';

interface BulkActionsBarProps {
  totalItems: number;
  selectedIds: Set<string>;
  onSelectAll: () => void;
  onBulkStatusChange: (status: 'PENDING' | 'REVIEWED' | 'DONE') => Promise<void>;
}

export function BulkActionsBar({
  totalItems,
  selectedIds,
  onSelectAll,
  onBulkStatusChange,
}: BulkActionsBarProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleBulkAction = async (status: 'PENDING' | 'REVIEWED' | 'DONE') => {
    setIsLoading(true);
    try {
      await onBulkStatusChange(status);
    } finally {
      setIsLoading(false);
    }
  };

  if (totalItems === 0) return null;

  return (
    <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg border">
      <div className="flex items-center space-x-4">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedIds.size === totalItems && totalItems > 0}
            onChange={onSelectAll}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium">
            {selectedIds.size === totalItems && totalItems > 0 ? 'Deselect All' : 'Select All'}
          </span>
        </label>

        {selectedIds.size > 0 && (
          <span className="text-sm text-gray-600">
            {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
        )}
      </div>

      {/* Bulk Action Buttons */}
      {selectedIds.size > 0 && (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleBulkAction('PENDING')}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-orange-100 text-orange-800 rounded-md hover:bg-orange-200 disabled:opacity-50"
          >
            Mark Pending
          </button>
          <button
            onClick={() => handleBulkAction('REVIEWED')}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 disabled:opacity-50"
          >
            Mark Reviewed
          </button>
          <button
            onClick={() => handleBulkAction('DONE')}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200 disabled:opacity-50"
          >
            Mark Done
          </button>
          {isLoading && <span className="text-sm text-gray-500">Updating...</span>}
        </div>
      )}
    </div>
  );
}
