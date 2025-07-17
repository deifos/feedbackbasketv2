import { MessageSquare, Bug, Sparkles, Star, Frown, Meh, Smile } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProjectStatsProps {
  stats: {
    total: number;
    pending: number;
    reviewed: number;
    done: number;
    // Category breakdown
    bugs: number;
    features: number;
    reviews: number;
    // Sentiment breakdown
    positive: number;
    neutral: number;
    negative: number;
    // Priority indicators
    needsAttention: number; // Negative sentiment + bugs
  };
}

export function ProjectStats({ stats }: ProjectStatsProps) {
  return (
    <div className="space-y-6 mb-8">
      {/* Status Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            {stats.needsAttention > 0 && (
              <Badge className="bg-red-100 text-red-800 text-xs mt-1">
                {stats.needsAttention} need attention
              </Badge>
            )}
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

      {/* AI Analysis Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Category Breakdown Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Feedback Categories</CardTitle>
            <p className="text-sm text-muted-foreground">AI-detected issue types</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Bug className="h-5 w-5 text-red-500 mr-1" />
                  <span className="text-sm font-medium">Bugs</span>
                </div>
                <div className="text-2xl font-bold text-red-600">{stats.bugs}</div>
                <p className="text-xs text-muted-foreground">Issues to fix</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Sparkles className="h-5 w-5 text-foreground mr-1" />
                  <span className="text-sm font-medium">Features</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{stats.features}</div>
                <p className="text-xs text-muted-foreground">Requests</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Star className="h-5 w-5 text-foreground mr-1" />
                  <span className="text-sm font-medium">Reviews</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{stats.reviews}</div>
                <p className="text-xs text-muted-foreground">General feedback</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sentiment Breakdown Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">User Sentiment</CardTitle>
            <p className="text-sm text-muted-foreground">AI-detected emotional tone</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Smile className="h-5 w-5 text-foreground mr-1" />
                  <span className="text-sm font-medium">Positive</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{stats.positive}</div>
                <p className="text-xs text-muted-foreground">Happy users</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Meh className="h-5 w-5 text-foreground mr-1" />
                  <span className="text-sm font-medium">Neutral</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{stats.neutral}</div>
                <p className="text-xs text-muted-foreground">Neutral tone</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Frown className="h-5 w-5 text-red-500 mr-1" />
                  <span className="text-sm font-medium">Negative</span>
                </div>
                <div className="text-2xl font-bold text-red-600">{stats.negative}</div>
                <p className="text-xs text-muted-foreground">Need attention</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
