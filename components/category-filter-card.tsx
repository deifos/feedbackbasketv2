'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FeedbackCategory } from '@/app/generated/prisma';
import { getCategoryInfo } from '@/lib/ai-analysis';
import { Badge } from '@/components/ui/badge';
import { Bug, Sparkles, Star, HelpCircle, MessageSquare } from 'lucide-react';

interface CategoryFilterCardProps {
  selectedCategory: 'all' | FeedbackCategory;
  onCategoryChange: (category: 'all' | FeedbackCategory) => void;
  categoryCounts: {
    BUG: number;
    FEATURE: number;
    REVIEW: number;
    uncategorized: number;
  };
}

export function CategoryFilterCard({
  selectedCategory,
  onCategoryChange,
  categoryCounts,
}: CategoryFilterCardProps) {
  const totalCategorized = categoryCounts.BUG + categoryCounts.FEATURE + categoryCounts.REVIEW;

  const totalFeedback = totalCategorized + categoryCounts.uncategorized;

  const categories: Array<'all' | FeedbackCategory> = ['all', 'BUG', 'FEATURE', 'REVIEW'];

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Bug':
        return <Bug className="h-4 w-4" />;
      case 'Sparkles':
        return <Sparkles className="h-4 w-4" />;
      case 'Star':
        return <Star className="h-4 w-4" />;
      case 'HelpCircle':
        return <HelpCircle className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Filter by Category</CardTitle>
        <CardDescription>AI-detected feedback categories</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {categories.map(category => {
            const isAll = category === 'all';
            const count = isAll ? totalFeedback : categoryCounts[category] || 0;

            const info = isAll
              ? {
                  label: 'All Categories',
                  color: 'bg-gray-100 text-gray-800 border-gray-200',
                  icon: 'MessageSquare',
                }
              : getCategoryInfo(category);

            return (
              <button
                key={category}
                onClick={() => onCategoryChange(category)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-full transition-colors ${
                  selectedCategory === category
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
