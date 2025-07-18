import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import { feedbackVisibilityService } from '@/lib/services/feedback-visibility-service';

// GET /api/feedback/visibility - Get visibility statistics for current user
export async function GET(_request: NextRequest) {
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

    const stats = await feedbackVisibilityService.getVisibilityStats(session.user.id);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching visibility stats:', error);
    return NextResponse.json({ error: 'Failed to fetch visibility statistics' }, { status: 500 });
  }
}

// POST /api/feedback/visibility - Update feedback visibility for current user
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { action, projectId } = body;

    switch (action) {
      case 'update_visibility':
        await feedbackVisibilityService.updateFeedbackVisibility(session.user.id);

        return NextResponse.json({
          message: 'Feedback visibility updated successfully',
          timestamp: new Date().toISOString(),
        });

      case 'get_visible_feedback':
        if (!projectId) {
          return NextResponse.json(
            { error: 'Project ID required for get_visible_feedback action' },
            { status: 400 }
          );
        }

        const { skip = 0, take = 50, includeHidden = false } = body;

        const feedback = await feedbackVisibilityService.getVisibleFeedback(
          session.user.id,
          projectId,
          { skip, take, includeHidden }
        );

        return NextResponse.json({
          feedback,
          count: feedback.length,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: update_visibility or get_visible_feedback' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in feedback visibility action:', error);
    return NextResponse.json({ error: 'Failed to perform visibility action' }, { status: 500 });
  }
}
