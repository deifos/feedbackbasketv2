import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';
import { FeedbackSubmissionRequest, FeedbackSubmissionResponse } from '@/lib/types/api';

const prisma = new PrismaClient();

// POST /api/widget/feedback - Submit feedback (public endpoint)
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { projectId, content, email } = body;

    // Validate required fields
    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Project ID is required and must be a string' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Feedback content is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate and sanitize inputs
    const sanitizedContent = content.trim();
    const sanitizedEmail = email && typeof email === 'string' ? email.trim() : null;

    if (sanitizedContent.length === 0) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Feedback content cannot be empty' },
        { status: 400 }
      );
    }

    if (sanitizedContent.length > 5000) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Feedback content must be 5000 characters or less' },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (sanitizedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(sanitizedEmail)) {
        return NextResponse.json(
          { error: 'Validation Error', message: 'Please provide a valid email address' },
          { status: 400 }
        );
      }

      if (sanitizedEmail.length > 254) {
        return NextResponse.json(
          { error: 'Validation Error', message: 'Email address is too long' },
          { status: 400 }
        );
      }
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

    // Rate limiting check - prevent spam from same IP
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentFeedbackCount = await prisma.feedback.count({
      where: {
        projectId: projectId,
        ipAddress: ipAddress,
        createdAt: {
          gte: oneHourAgo,
        },
      },
    });

    // Allow max 10 feedback submissions per IP per hour
    if (recentFeedbackCount >= 10) {
      return NextResponse.json(
        {
          error: 'Rate Limit Exceeded',
          message: 'Too many feedback submissions. Please try again later.',
        },
        { status: 429 }
      );
    }

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
