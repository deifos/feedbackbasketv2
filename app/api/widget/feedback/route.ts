import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';
import { FeedbackSubmissionRequest, FeedbackSubmissionResponse } from '@/lib/types/api';
import { feedbackSchema } from '@/lib/validation';
import { sanitizeFeedbackContent, sanitizeEmail } from '@/lib/sanitization';
import { rateLimitFeedback } from '@/lib/rate-limit';

const prisma = new PrismaClient();

// POST /api/widget/feedback - Submit feedback (public endpoint)
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting first
    const rateLimitResult = rateLimitFeedback(request);
    if (!rateLimitResult.isAllowed) {
      return NextResponse.json(
        {
          error: 'Rate Limit Exceeded',
          message: 'Too many feedback submissions. Please try again later.',
          resetTime: rateLimitResult.resetTime,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate input using Zod schema
    const validationResult = feedbackSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid input data',
          details: errors,
        },
        { status: 400 }
      );
    }

    const { projectId, content, email } = validationResult.data;

    // Sanitize inputs to prevent XSS and other attacks
    const sanitizedContent = sanitizeFeedbackContent(content);
    const sanitizedEmail = email ? sanitizeEmail(email) : null;

    // Double-check sanitized content isn't empty after sanitization
    if (!sanitizedContent || sanitizedContent.length === 0) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Feedback content cannot be empty after sanitization',
        },
        { status: 400 }
      );
    }

    // Verify that the project exists
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Project not found' },
        { status: 404 }
      );
    }

    // Get client IP address and user agent for security/analytics
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwarded?.split(',')[0] || realIp || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create the feedback record
    const feedback = await prisma.feedback.create({
      data: {
        projectId: projectId,
        content: sanitizedContent,
        email: sanitizedEmail,
        status: 'PENDING',
        ipAddress: ipAddress,
        userAgent: userAgent,
      },
      select: {
        id: true,
        createdAt: true,
        status: true,
      },
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Feedback submitted successfully',
        feedback: {
          id: feedback.id,
          status: feedback.status,
          submittedAt: feedback.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting feedback:', error);

    // Handle specific Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'Conflict', message: 'Duplicate feedback submission detected' },
          { status: 409 }
        );
      }

      if (error.code === 'P2003') {
        return NextResponse.json(
          { error: 'Invalid Reference', message: 'Invalid project reference' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to submit feedback' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// OPTIONS method for CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
