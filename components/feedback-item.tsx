import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Mail,
  Edit3,
  Check,
  X,
  Bug,
  Sparkles,
  Star,
  HelpCircle,
  Smile,
  Frown,
  Meh,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Feedback } from '@/app/generated/prisma';
import {
  getEffectiveCategory,
  getEffectiveSentiment,
  getCategoryInfo,
  getSentimentInfo,
} from '@/lib/ai-analysis';

interface FeedbackItemProps {
  feedback: Feedback;
  isSelected?: boolean;
  onSelect?: () => void;
  onNotesUpdate: (feedbackId: string, notes: string) => Promise<void>;
  onDelete?: (feedbackId: string) => void;
}

export function FeedbackItem({
  feedback,
  isSelected = false,
  onSelect,
  onNotesUpdate,
  onDelete,
}: FeedbackItemProps) {
  const router = useRouter();
  const [editingNotes, setEditingNotes] = useState(false);
  const [noteText, setNoteText] = useState(feedback.notes || '');
  const [updatingCategory, setUpdatingCategory] = useState(false);
  const [updatingSentiment, setUpdatingSentiment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteNoteDialog, setShowDeleteNoteDialog] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isDeletingNote, setIsDeletingNote] = useState(false);

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

  const handleNotesUpdate = async () => {
    setIsSavingNote(true);
    try {
      await onNotesUpdate(feedback.id, noteText);
      // Only close editing mode after successful save
      setEditingNotes(false);
      setIsSavingNote(false);
    } catch (error) {
      console.error('Error saving note:', error);
      setIsSavingNote(false);
    }
  };

  const handleNotesCancel = () => {
    setNoteText(feedback.notes || '');
    setEditingNotes(false);
  };

  const handleStatusChange = async (newStatus: 'PENDING' | 'REVIEWED' | 'DONE') => {
    setUpdatingStatus(newStatus);
    try {
      const response = await fetch(`/api/feedback/${feedback.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Refresh the data to show updated changes
        router.refresh();
        setUpdatingStatus(null);
      } else {
        console.error('Failed to update status');
        setUpdatingStatus(null);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setUpdatingStatus(null);
    }
  };

  const handleDeleteFeedback = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/feedback/${feedback.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setShowDeleteDialog(false);
        if (onDelete) {
          onDelete(feedback.id);
        } else {
          router.refresh();
        }
      } else {
        console.error('Failed to delete feedback');
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteNote = async () => {
    setIsDeletingNote(true);
    try {
      const response = await fetch(`/api/feedback/${feedback.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: null }),
      });

      if (response.ok) {
        setShowDeleteNoteDialog(false);
        setNoteText('');
        router.refresh();
      } else {
        console.error('Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    } finally {
      setIsDeletingNote(false);
    }
  };

  const getIconComponent = (iconName: string, className = 'h-3 w-3') => {
    switch (iconName) {
      case 'Bug':
        return <Bug className={className} />;
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'Star':
        return <Star className={className} />;
      case 'Smile':
        return <Smile className={className} />;
      case 'Frown':
        return <Frown className={className} />;
      case 'Meh':
        return <Meh className={className} />;
      case 'HelpCircle':
        return <HelpCircle className={className} />;
      default:
        return null;
    }
  };

  return (
    <Card className={`relative ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2 flex-wrap">
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

            {/* Category and Sentiment Badges with AI Confidence */}
            {(() => {
              const effectiveCategory = getEffectiveCategory(feedback);
              const effectiveSentiment = getEffectiveSentiment(feedback);
              const categoryInfo = getCategoryInfo(effectiveCategory);
              const sentimentInfo = getSentimentInfo(effectiveSentiment);

              return (
                <>
                  {effectiveCategory && (
                    <div className="flex items-center gap-1">
                      <Badge className={`${categoryInfo.color} text-xs flex items-center gap-1`}>
                        {getIconComponent(categoryInfo.icon)}
                        {categoryInfo.label}
                        {feedback.categoryOverridden && (
                          <span className="text-xs opacity-75">(Manual)</span>
                        )}
                      </Badge>
                      {feedback.categoryConfidence && !feedback.categoryOverridden && (
                        <span className="text-xs text-muted-foreground">
                          {Math.round(feedback.categoryConfidence * 100)}%
                        </span>
                      )}
                    </div>
                  )}
                  {effectiveSentiment && (
                    <div className="flex items-center gap-1">
                      <Badge className={`${sentimentInfo.color} text-xs flex items-center gap-1`}>
                        {getIconComponent(sentimentInfo.icon)}
                        {sentimentInfo.label}
                        {feedback.sentimentOverridden && (
                          <span className="text-xs opacity-75">(Manual)</span>
                        )}
                      </Badge>
                      {feedback.sentimentConfidence && !feedback.sentimentOverridden && (
                        <span className="text-xs text-muted-foreground">
                          {Math.round(feedback.sentimentConfidence * 100)}%
                        </span>
                      )}
                    </div>
                  )}
                  {/* Analysis Method Indicator - only show if no manual overrides */}
                  {feedback.analysisMethod &&
                    !feedback.categoryOverridden &&
                    !feedback.sentimentOverridden && (
                      <Badge variant="outline" className="text-xs">
                        {feedback.analysisMethod === 'AI' ? '🤖 AI' : '📋 Rule-based'}
                      </Badge>
                    )}
                </>
              );
            })()}

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
                disabled={updatingStatus === 'PENDING'}
                onClick={() => handleStatusChange('PENDING')}
                className="text-orange-600 hover:text-orange-700 disabled:opacity-50"
              >
                {updatingStatus === 'PENDING' && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                Mark Pending
              </Button>
            )}
            {feedback.status !== 'REVIEWED' && (
              <Button
                variant="outline"
                size="sm"
                disabled={updatingStatus === 'REVIEWED'}
                onClick={() => handleStatusChange('REVIEWED')}
                className="text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                {updatingStatus === 'REVIEWED' && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                Mark Reviewed
              </Button>
            )}
            {feedback.status !== 'DONE' && (
              <Button
                variant="outline"
                size="sm"
                disabled={updatingStatus === 'DONE'}
                onClick={() => handleStatusChange('DONE')}
                className="text-green-600 hover:text-green-700 disabled:opacity-50"
              >
                {updatingStatus === 'DONE' && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
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

        {/* AI Analysis Reasoning */}
        {feedback.aiReasoning && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
            <h5 className="text-sm font-medium text-blue-900 mb-1">AI Analysis</h5>
            <p className="text-sm text-blue-800">{feedback.aiReasoning}</p>

            {/* Manual Override Controls */}
            <div className="mt-3 pt-3 border-t border-blue-200">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="text-blue-700 font-medium">Override:</span>

                {/* Category Override */}
                <div className="flex items-center gap-1">
                  <select
                    value={feedback.categoryOverridden ? feedback.manualCategory || '' : ''}
                    disabled={updatingCategory}
                    onChange={async e => {
                      const newCategory = e.target.value;
                      if (newCategory) {
                        setUpdatingCategory(true);
                        try {
                          const response = await fetch(`/api/feedback/${feedback.id}`, {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              manualCategory: newCategory,
                            }),
                          });

                          if (response.ok) {
                            // Refresh the data to show updated changes
                            router.refresh();
                            setUpdatingCategory(false);
                          } else {
                            console.error('Failed to update category override');
                            setUpdatingCategory(false);
                          }
                        } catch (error) {
                          console.error('Error updating category override:', error);
                          setUpdatingCategory(false);
                        }
                      }
                    }}
                    className={`text-xs border border-blue-300 rounded px-2 py-1 bg-white ${
                      updatingCategory ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="">
                      Category: {getCategoryInfo(getEffectiveCategory(feedback)).label}
                    </option>
                    <option value="BUG">Bug</option>
                    <option value="FEATURE">Feature</option>
                    <option value="REVIEW">Review</option>
                  </select>
                  {updatingCategory && <Loader2 className="h-3 w-3 animate-spin text-blue-600" />}
                </div>

                {/* Sentiment Override */}
                <div className="flex items-center gap-1">
                  <select
                    value={feedback.sentimentOverridden ? feedback.manualSentiment || '' : ''}
                    disabled={updatingSentiment}
                    onChange={async e => {
                      const newSentiment = e.target.value;
                      if (newSentiment) {
                        setUpdatingSentiment(true);
                        try {
                          const response = await fetch(`/api/feedback/${feedback.id}`, {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              manualSentiment: newSentiment,
                            }),
                          });

                          if (response.ok) {
                            // Refresh the data to show updated changes
                            router.refresh();
                            setUpdatingSentiment(false);
                          } else {
                            console.error('Failed to update sentiment override');
                            setUpdatingSentiment(false);
                          }
                        } catch (error) {
                          console.error('Error updating sentiment override:', error);
                          setUpdatingSentiment(false);
                        }
                      }
                    }}
                    className={`text-xs border border-blue-300 rounded px-2 py-1 bg-white ${
                      updatingSentiment ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="">
                      Sentiment: {getSentimentInfo(getEffectiveSentiment(feedback)).label}
                    </option>
                    <option value="POSITIVE">Positive</option>
                    <option value="NEUTRAL">Neutral</option>
                    <option value="NEGATIVE">Negative</option>
                  </select>
                  {updatingSentiment && <Loader2 className="h-3 w-3 animate-spin text-blue-600" />}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Feedback Button */}
        <div className="border-t pt-4 pb-4 flex justify-end">
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="w-4 h-4 mr-1" />
                Delete Feedback
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Feedback</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this feedback? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteFeedback}
                  disabled={isDeleting}
                >
                  {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Notes Section */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">Private Notes</h4>
            <div className="flex items-center space-x-2">
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
              {feedback.notes && !editingNotes && (
                <Dialog open={showDeleteNoteDialog} onOpenChange={setShowDeleteNoteDialog}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete Note
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Note</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete this note? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowDeleteNoteDialog(false)}
                        disabled={isDeletingNote}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleDeleteNote}
                        disabled={isDeletingNote}
                      >
                        {isDeletingNote && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {isDeletingNote ? 'Deleting...' : 'Delete Note'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
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
                <Button size="sm" onClick={handleNotesUpdate} disabled={isSavingNote}>
                  {isSavingNote ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                  {isSavingNote ? 'Saving...' : 'Save'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleNotesCancel} disabled={isSavingNote}>
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
