import { analyzeFeedbackWithAI } from '../ai-analysis';

// Mock the AI SDK to avoid making real API calls in tests
jest.mock('ai', () => ({
  generateObject: jest.fn(),
}));

jest.mock('@ai-sdk/google', () => ({
  google: jest.fn(() => 'mocked-model'),
}));

import { generateObject } from 'ai';

const mockGenerateObject = generateObject as jest.MockedFunction<typeof generateObject>;

describe('AI Analysis Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should analyze positive feedback correctly', async () => {
    // Mock successful AI response
    mockGenerateObject.mockResolvedValue({
      object: {
        sentiment: 'POSITIVE',
        category: 'REVIEW',
        sentimentConfidence: 0.9,
        categoryConfidence: 0.8,
        reasoning: 'User expresses satisfaction with the product',
      },
    });

    const result = await analyzeFeedbackWithAI('This app is amazing! I love it.');

    expect(result).toEqual({
      sentiment: 'POSITIVE',
      category: 'REVIEW',
      sentimentConfidence: 0.9,
      categoryConfidence: 0.8,
      reasoning: 'User expresses satisfaction with the product',
      analysisMethod: 'AI',
      processingTime: expect.any(Number),
    });
  });

  it('should analyze bug reports correctly', async () => {
    mockGenerateObject.mockResolvedValue({
      object: {
        sentiment: 'NEGATIVE',
        category: 'BUG',
        sentimentConfidence: 0.85,
        categoryConfidence: 0.95,
        reasoning: 'User reports a technical issue that needs fixing',
      },
    });

    const result = await analyzeFeedbackWithAI('The login button is broken and not working.');

    expect(result).toEqual({
      sentiment: 'NEGATIVE',
      category: 'BUG',
      sentimentConfidence: 0.85,
      categoryConfidence: 0.95,
      reasoning: 'User reports a technical issue that needs fixing',
      analysisMethod: 'AI',
      processingTime: expect.any(Number),
    });
  });

  it('should fall back to rule-based analysis when AI fails', async () => {
    // Mock AI failure
    mockGenerateObject.mockRejectedValue(new Error('AI service unavailable'));

    const result = await analyzeFeedbackWithAI('This is a bug report about broken functionality.');

    expect(result.analysisMethod).toBe('FALLBACK');
    expect(result.category).toBe('BUG'); // Should detect "bug" keyword
    expect(result.sentiment).toBeDefined();
    expect(result.reasoning).toContain('Fallback analysis');
  });

  it('should handle empty content gracefully', async () => {
    const result = await analyzeFeedbackWithAI('');

    expect(result.analysisMethod).toBe('FALLBACK');
    expect(result.category).toBeDefined();
    expect(result.sentiment).toBeDefined();
  });

  it('should handle very long content', async () => {
    const longContent = 'a'.repeat(6000); // Exceeds 5000 character limit

    const result = await analyzeFeedbackWithAI(longContent);

    expect(result.analysisMethod).toBe('FALLBACK');
    expect(result.category).toBeDefined();
    expect(result.sentiment).toBeDefined();
  });

  it('should clamp confidence scores to valid range', async () => {
    // Mock response with invalid confidence scores
    mockGenerateObject.mockResolvedValue({
      object: {
        sentiment: 'POSITIVE',
        category: 'REVIEW',
        sentimentConfidence: 1.5, // Invalid - above 1.0
        categoryConfidence: -0.2, // Invalid - below 0.0
        reasoning: 'Test reasoning',
      },
    });

    const result = await analyzeFeedbackWithAI('Test feedback');

    expect(result.sentimentConfidence).toBe(1.0); // Clamped to max
    expect(result.categoryConfidence).toBe(0.0); // Clamped to min
  });
});
