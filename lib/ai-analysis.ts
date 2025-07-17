import { FeedbackCategory, Sentiment } from '@/app/generated/prisma';

// AI Analysis result interface
export interface AIAnalysisResult {
  category: FeedbackCategory;
  sentiment: Sentiment;
  categoryConfidence: number; // 0-1
  sentimentConfidence: number; // 0-1
  reasoning?: string; // Optional explanation
}

/**
 * Analyze feedback content using AI to determine category and sentiment
 * This is a placeholder implementation - replace with actual AI service
 */
export async function analyzeFeedbackWithAI(content: string): Promise<AIAnalysisResult> {
  // TODO: Replace with actual AI service (OpenAI, Claude, etc.)
  // For now, we'll use a simple rule-based approach as a placeholder

  const lowerContent = content.toLowerCase();

  // Simple category detection based on keywords
  let category: FeedbackCategory = 'REVIEW'; // default
  let categoryConfidence = 0.6;

  if (
    lowerContent.includes('bug') ||
    lowerContent.includes('error') ||
    lowerContent.includes('broken') ||
    lowerContent.includes('issue') ||
    lowerContent.includes('problem') ||
    lowerContent.includes('not working')
  ) {
    category = 'BUG';
    categoryConfidence = 0.8;
  } else if (
    lowerContent.includes('feature') ||
    lowerContent.includes('add') ||
    lowerContent.includes('would like') ||
    lowerContent.includes('suggestion') ||
    lowerContent.includes('improve') ||
    lowerContent.includes('enhancement')
  ) {
    category = 'FEATURE';
    categoryConfidence = 0.7;
  }

  // Simple sentiment detection based on keywords
  let sentiment: Sentiment = 'NEUTRAL'; // default
  let sentimentConfidence = 0.6;

  const positiveWords = [
    'great',
    'awesome',
    'love',
    'excellent',
    'amazing',
    'good',
    'nice',
    'perfect',
    'wonderful',
  ];
  const negativeWords = [
    'hate',
    'terrible',
    'awful',
    'bad',
    'horrible',
    'worst',
    'sucks',
    'annoying',
    'frustrating',
  ];

  const positiveCount = positiveWords.filter(word => lowerContent.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerContent.includes(word)).length;

  if (positiveCount > negativeCount && positiveCount > 0) {
    sentiment = 'POSITIVE';
    sentimentConfidence = Math.min(0.9, 0.6 + positiveCount * 0.1);
  } else if (negativeCount > positiveCount && negativeCount > 0) {
    sentiment = 'NEGATIVE';
    sentimentConfidence = Math.min(0.9, 0.6 + negativeCount * 0.1);
  }

  return {
    category,
    sentiment,
    categoryConfidence,
    sentimentConfidence,
    reasoning: `Detected ${category.toLowerCase()} with ${sentiment.toLowerCase()} sentiment based on content analysis`,
  };
}

/**
 * Analyze feedback with OpenAI GPT (when API key is available)
 * This is a more sophisticated implementation using actual AI
 */
export async function analyzeFeedbackWithOpenAI(content: string): Promise<AIAnalysisResult> {
  // TODO: Implement OpenAI integration
  // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // For now, fall back to the simple analysis
  return analyzeFeedbackWithAI(content);
}

/**
 * Get the effective category (manual override takes precedence over AI)
 */
export function getEffectiveCategory(feedback: {
  category: FeedbackCategory | null;
  manualCategory: FeedbackCategory | null;
  categoryOverridden: boolean;
}): FeedbackCategory | null {
  if (feedback.categoryOverridden && feedback.manualCategory) {
    return feedback.manualCategory;
  }
  return feedback.category;
}

/**
 * Get the effective sentiment (manual override takes precedence over AI)
 */
export function getEffectiveSentiment(feedback: {
  sentiment: Sentiment | null;
  manualSentiment: Sentiment | null;
  sentimentOverridden: boolean;
}): Sentiment | null {
  if (feedback.sentimentOverridden && feedback.manualSentiment) {
    return feedback.manualSentiment;
  }
  return feedback.sentiment;
}

/**
 * Get category display information
 */
export function getCategoryInfo(category: FeedbackCategory | null) {
  switch (category) {
    case 'BUG':
      return {
        label: 'Bug',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: 'Bug',
      };
    case 'FEATURE':
      return {
        label: 'Feature',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: 'Sparkles',
      };
    case 'REVIEW':
      return {
        label: 'Review',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: 'Star',
      };
    default:
      return {
        label: 'Uncategorized',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: 'HelpCircle',
      };
  }
}

/**
 * Get sentiment display information
 */
export function getSentimentInfo(sentiment: Sentiment | null) {
  switch (sentiment) {
    case 'POSITIVE':
      return {
        label: 'Positive',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: 'Smile',
      };
    case 'NEGATIVE':
      return {
        label: 'Negative',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: 'Frown',
      };
    case 'NEUTRAL':
      return {
        label: 'Neutral',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: 'Meh',
      };
    default:
      return {
        label: 'Unknown',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: 'HelpCircle',
      };
  }
}
