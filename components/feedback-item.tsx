import { useState } from 'react';
import { Calendar, Mail, Edit3, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Feedback } from '@/app/generated/prisma';

interface FeedbackItemProps {
  feedback: Feedback;
  isSelected?: boolean;
  onSelect?: () => void;
  onStatusChange: (feedbackId: string, newStatus: 'PENDING' | 'REVIEWED' | 'DONE') => void;
  onNotesUpdate: (feedbackId: string, notes: string) => void;
}

export function FeedbackItem({
  feedback,
  isSelected = false,
  onSelect,
  onStatusChange,
  onNotesUpdate,
}: FeedbackItemProps) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [noteText, setNoteText] = useState(feedback.notes || '');

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

  const handleNotesUpdate = () => {
    onNotesUpdate(feedback.id, noteText);
    setEditingNotes(false);
  };

  const handleNotesCancel = () => {
    setNoteText(feedback.notes || '');
    setEditingNotes(false);
  };

  return (
    <Card className={`relative ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            {/* Selection Checkbox */}
            {onSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onSelect}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            )}
            <Badge className={getStatusColor(feedback.status)}>{feedback.status}</Badge>
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 mr-1" />
              {new Date(feedback.createdAt).toLocaleDateString()} at{' '}
              {new Date(feedback.createdAt).toLocaleTimeString()}
            </div>
          </div>

          {/* Status Change Buttons */}
          <div className="flex space-x-1">
            {feedback.status !== 'PENDING' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange(feedback.id, 'PENDING')}
                className="text-orange-600 hover:text-orange-700"
              >
                Mark Pending
              </Button>
            )}
            {feedback.status !== 'REVIEWED' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange(feedback.id, 'REVIEWED')}
                className="text-blue-600 hover:text-blue-700"
              >
                Mark Reviewed
              </Button>
            )}
            {feedback.status !== 'DONE' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange(feedback.id, 'DONE')}
                className="text-green-600 hover:text-green-700"
              >
                Mark Done
              </Button>
            )}
          </div>
        </div>

        {/* Feedback Content */}
        <div className="mb-4">
          <p className="text-gray-900 leading-relaxed">{feedback.content}</p>
        </div>

        {/* Email if provided */}
        {feedback.email && (
          <div className="flex items-center text-sm text-muted-foreground mb-4">
            <Mail className="w-4 h-4 mr-2" />
            <a href={`mailto:${feedback.email}`} className="hover:underline">
              {feedback.email}
            </a>
          </div>
        )}

        {/* Notes Section */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">Private Notes</h4>
            {!editingNotes && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingNotes(true);
                  setNoteText(feedback.notes || '');
                }}
              >
                <Edit3 className="w-4 h-4 mr-1" />
                {feedback.notes ? 'Edit' : 'Add'} Notes
              </Button>
            )}
          </div>

          {editingNotes ? (
            <div className="space-y-2">
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Add private notes about this feedback..."
                className="w-full p-2 border border-gray-300 rounded-md resize-none h-20 text-sm"
              />
              <div className="flex space-x-2">
                <Button size="sm" onClick={handleNotesUpdate}>
                  <Check className="w-4 h-4 mr-1" />
                  Save
                </Button>
                <Button variant="outline" size="sm" onClick={handleNotesCancel}>
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              {feedback.notes || <span className="italic text-gray-400">No notes added yet</span>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
