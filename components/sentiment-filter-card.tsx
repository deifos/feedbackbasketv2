'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sentiment } from '@/app/generated/prisma';
import { getSentimentInfo } from '@/lib/ai-analysis';
import { Badge } from '@/components/ui/badge';
import { Smile, Frown, Meh, HelpCircle, Search } from 'lucide-react';

interface SentimentFilterCardProps {
  selectedSentiment: 'all' | Sentiment;
  onSentimentChange: (sentiment: 'all' | Sentiment) => void;
  sentimentCounts: {
    POSITIVE: number;
    NEUTRAL: number;
    NEGATIVE: number;
    uncategorized: number;
  };
}

export function SentimentFilterCard({
  selectedSentiment,
  onSentimentChange,
  sentimentCounts,
}: SentimentFilterCardProps) {
  const totalCategorized =
    sentimentCounts.POSITIVE + sentimentCounts.NEUTRAL + sentimentCounts.NEGATIVE;

  const totalFeedback = totalCategorized + sentimentCounts.uncategorized;

  const sentiments: Array<'all' | Sentiment> = ['all', 'POSITIVE', 'NEUTRAL', 'NEGATIVE'];

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Smile':
        return <Smile className="h-4 w-4" />;
      case 'Frown':
        return <Frown className="h-4 w-4" />;
      case 'Meh':
        return <Meh className="h-4 w-4" />;
      case 'HelpCircle':
        return <HelpCircle className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Filter by Sentiment</CardTitle>
        <CardDescription>AI-detected feedback sentiment</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {sentiments.map(sentiment => {
            const isAll = sentiment === 'all';
            const count = isAll ? totalFeedback : sentimentCounts[sentiment] || 0;

            const info = isAll
              ? {
                  label: 'All Sentiments',
                  color: 'bg-gray-100 text-gray-800 border-gray-200',
                  icon: 'Search',
                }
              : getSentimentInfo(sentiment);

            return (
              <button
                key={sentiment}
                onClick={() => onSentimentChange(sentiment)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-full transition-colors ${
                  selectedSentiment === sentiment
                    ? info.color + ' ring-2 ring-offset-1'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                {getIconComponent(info.icon)}
                <span className="text-sm font-medium">{info.label}</span>
                <Badge variant="outline" className="ml-1 text-xs">
                  {count}
                </Badge>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
