import { FeedbackCategory, Sentiment } from '@/app/generated/prisma';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

// AI Analysis result interface
export interface AIAnalysisResult {
  category: FeedbackCategory;
  sentiment: Sentiment;
  categoryConfidence: number; // 0-1
  sentimentConfidence: number; // 0-1
  reasoning: string;
  analysisMethod: 'AI' | 'FALLBACK';
  processingTime?: number; // milliseconds
}

// AI Analysis Client
class AIAnalysisClient {
  private model: ReturnType<typeof google>;

  constructor() {
    // Initialize with Google Gemini model - can easily switch to other models
    this.model = google('gemini-1.5-flash');
  }

  async analyzeContent(content: string): Promise<AIAnalysisResult> {
    const startTime = Date.now();

    // Input validation
    if (!content || content.trim().length === 0) {
      throw new Error('Content cannot be empty for AI analysis');
    }

    if (content.length > 5000) {
      throw new Error('Content too long for AI analysis (max 5000 characters)');
    }

    try {
      const { object } = await generateObject({
        model: this.model,
        prompt: this.buildPrompt(content),
        schema: z.object({
          sentiment: z.enum(['POSITIVE', 'NEGATIVE', 'NEUTRAL']),
          category: z.enum(['BUG', 'FEATURE', 'REVIEW']),
          sentimentConfidence: z.number().min(0).max(1),
          categoryConfidence: z.number().min(0).max(1),
          reasoning: z.string(),
        }),
        temperature: 0.1, // Low temperature for consistent results
      });

      // Validate the response
      if (!object.sentiment || !object.category) {
        throw new Error('Invalid AI response: missing required fields');
      }

      return {
        sentiment: object.sentiment as Sentiment,
        category: object.category as FeedbackCategory,
        sentimentConfidence: Math.max(0, Math.min(1, object.sentimentConfidence)), // Clamp to 0-1
        categoryConfidence: Math.max(0, Math.min(1, object.categoryConfidence)), // Clamp to 0-1
        reasoning: object.reasoning || 'No reasoning provided',
        analysisMethod: 'AI',
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('AI analysis failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        contentLength: content.length,
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });
      throw new Error(
        `Failed to analyze content with AI: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private buildPrompt(content: string): string {
    return `
Analyze the following user feedback and classify it:

Feedback: "${content}"

Provide:
- sentiment: POSITIVE (happy, satisfied, praise), NEGATIVE (frustrated, angry, complaints), or NEUTRAL (informational, questions)
- category: BUG (errors, issues, problems), FEATURE (requests, suggestions, improvements), or REVIEW (general feedback, opinions)
- sentimentConfidence: 0.0 to 1.0 scale indicating certainty of sentiment
- categoryConfidence: 0.0 to 1.0 scale indicating certainty of category
- reasoning: Brief 1-2 sentence explanation of the classification
    `;
  }
}

// Create a singleton instance
const aiClient = new AIAnalysisClient();

/**
 * Analyze feedback content using AI to determine category and sentiment
 */
export async function analyzeFeedbackWithAI(content: string): Promise<AIAnalysisResult> {
  try {
    return await aiClient.analyzeContent(content);
  } catch (error) {
    console.error('AI analysis failed, falling back to rule-based analysis:', error);
    // Fall back to rule-based analysis
    return await analyzeFeedbackWithFallback(content);
  }
}

/**
 * Fallback rule-based analysis (enhanced version of the original)
 */
async function analyzeFeedbackWithFallback(content: string): Promise<AIAnalysisResult> {
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
    reasoning: `Fallback analysis: Detected ${category.toLowerCase()} with ${sentiment.toLowerCase()} sentiment based on keyword analysis`,
    analysisMethod: 'FALLBACK',
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
