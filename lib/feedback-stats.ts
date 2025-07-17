import { Feedback } from '@/app/generated/prisma';

interface BasicStats {
  total: number;
  pending: number;
  reviewed: number;
  done: number;
}

interface EnhancedStats extends BasicStats {
  bugs: number;
  features: number;
  reviews: number;
  positive: number;
  neutral: number;
  negative: number;
  needsAttention: number;
}

/**
 * Calculate enhanced stats for AI analysis from feedback data
 */
export function calculateEnhancedStats(
  feedback: Feedback[],
  basicStats: BasicStats
): EnhancedStats {
  const bugs = feedback.filter(
    f => f.category === 'BUG' || (f.categoryOverridden && f.manualCategory === 'BUG')
  ).length;

  const features = feedback.filter(
    f => f.category === 'FEATURE' || (f.categoryOverridden && f.manualCategory === 'FEATURE')
  ).length;

  const reviews = feedback.filter(
    f => f.category === 'REVIEW' || (f.categoryOverridden && f.manualCategory === 'REVIEW')
  ).length;

  const positive = feedback.filter(
    f => f.sentiment === 'POSITIVE' || (f.sentimentOverridden && f.manualSentiment === 'POSITIVE')
  ).length;

  const neutral = feedback.filter(
    f => f.sentiment === 'NEUTRAL' || (f.sentimentOverridden && f.manualSentiment === 'NEUTRAL')
  ).length;

  const negative = feedback.filter(
    f => f.sentiment === 'NEGATIVE' || (f.sentimentOverridden && f.manualSentiment === 'NEGATIVE')
  ).length;

  // Calculate items that need attention (negative sentiment + bugs)
  const needsAttention = feedback.filter(f => {
    const effectiveSentiment =
      f.sentimentOverridden && f.manualSentiment ? f.manualSentiment : f.sentiment;
    const effectiveCategory =
      f.categoryOverridden && f.manualCategory ? f.manualCategory : f.category;
    return effectiveSentiment === 'NEGATIVE' || effectiveCategory === 'BUG';
  }).length;

  return {
    ...basicStats,
    bugs,
    features,
    reviews,
    positive,
    neutral,
    negative,
    needsAttention,
  };
}

/**
 * Calculate category counts for filter cards
 */
export function calculateCategoryCounts(feedback: Feedback[]) {
  return {
    BUG: feedback.filter(
      f => f.category === 'BUG' || (f.categoryOverridden && f.manualCategory === 'BUG')
    ).length,
    FEATURE: feedback.filter(
      f => f.category === 'FEATURE' || (f.categoryOverridden && f.manualCategory === 'FEATURE')
    ).length,
    REVIEW: feedback.filter(
      f => f.category === 'REVIEW' || (f.categoryOverridden && f.manualCategory === 'REVIEW')
    ).length,
    uncategorized: feedback.filter(f => !f.category && !f.manualCategory).length,
  };
}

/**
 * Calculate sentiment counts for filter cards
 */
export function calculateSentimentCounts(feedback: Feedback[]) {
  return {
    POSITIVE: feedback.filter(
      f => f.sentiment === 'POSITIVE' || (f.sentimentOverridden && f.manualSentiment === 'POSITIVE')
    ).length,
    NEUTRAL: feedback.filter(
      f => f.sentiment === 'NEUTRAL' || (f.sentimentOverridden && f.manualSentiment === 'NEUTRAL')
    ).length,
    NEGATIVE: feedback.filter(
      f => f.sentiment === 'NEGATIVE' || (f.sentimentOverridden && f.manualSentiment === 'NEGATIVE')
    ).length,
    uncategorized: feedback.filter(f => !f.sentiment && !f.manualSentiment).length,
  };
}
