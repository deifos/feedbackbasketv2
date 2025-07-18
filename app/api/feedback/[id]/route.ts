import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import { PrismaClient } from '@/app/generated/prisma';
import { feedbackUpdateSchema } from '@/lib/validation';
import { sanitizeNotes } from '@/lib/sanitization';

const prisma = new PrismaClient();

// PUT /api/feedback/[id] - Update feedback status or notes
export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    // Get the authenticated session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Parse request body
    const body = await request.json();

    // Validate input using Zod schema
    const validationResult = feedbackUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(err => ({
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

    const {
      status,
      notes,
      manualCategory,
      manualSentiment,
      categoryOverridden,
      sentimentOverridden,
    } = validationResult.data;

    // Check if feedback exists, user owns the project, and feedback is visible
    const feedback = await prisma.feedback.findFirst({
      where: {
        id: id,
        project: {
          userId: session.user.id,
        },
        isVisible: true, // Only allow access to visible feedback
      },
      include: {
        project: true,
      },
    });

    if (!feedback) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Feedback not found or access denied' },
        { status: 404 }
      );
    }

    // Prepare update data with sanitization
    const updateData: Partial<{
      status?: 'PENDING' | 'REVIEWED' | 'DONE';
      notes?: string | null;
      manualCategory?: 'BUG' | 'FEATURE' | 'REVIEW' | null;
      manualSentiment?: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | null;
      categoryOverridden?: boolean;
      sentimentOverridden?: boolean;
    }> = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) {
      const sanitizedNotes = sanitizeNotes(notes);
      updateData.notes = sanitizedNotes || null;
    }

    // Handle manual overrides for AI analysis
    if (manualCategory !== undefined) {
      updateData.manualCategory = manualCategory;
      updateData.categoryOverridden = true;
    }
    if (manualSentiment !== undefined) {
      updateData.manualSentiment = manualSentiment;
      updateData.sentimentOverridden = true;
    }
    if (categoryOverridden !== undefined) {
      updateData.categoryOverridden = categoryOverridden;
      // If setting to false, clear the manual category
      if (!categoryOverridden) {
        updateData.manualCategory = null;
      }
    }
    if (sentimentOverridden !== undefined) {
      updateData.sentimentOverridden = sentimentOverridden;
      // If setting to false, clear the manual sentiment
      if (!sentimentOverridden) {
        updateData.manualSentiment = null;
      }
    }

    // Update the feedback
    const updatedFeedback = await prisma.feedback.update({
      where: {
        id: id,
      },
      data: updateData,
    });

    return NextResponse.json(updatedFeedback);
  } catch (error) {
    console.error('Error updating feedback:', error);

    // Handle Prisma record not found
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Not Found', message: 'Feedback not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to update feedback' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE /api/feedback/[id] - Delete feedback
export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    // Get the authenticated session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Check if feedback exists, user owns the project, and feedback is visible
    const feedback = await prisma.feedback.findFirst({
      where: {
        id: id,
        project: {
          userId: session.user.id,
        },
        isVisible: true, // Only allow deletion of visible feedback
      },
    });

    if (!feedback) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Feedback not found or access denied' },
        { status: 404 }
      );
    }

    // Delete the feedback
    await prisma.feedback.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({ message: 'Feedback deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting feedback:', error);

    // Handle Prisma record not found
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Not Found', message: 'Feedback not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to delete feedback' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
