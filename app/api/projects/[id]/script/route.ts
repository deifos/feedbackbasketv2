import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
// import { ScriptGenerationResponse, WidgetConfig } from '@/lib/types/api';

// GET /api/projects/[id]/script - Generate widget script
export async function GET(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
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

    // Fetch the project with customization
    const project = await prisma.project.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
      include: {
        customization: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Get the base URL for the widget API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Generate the widget configuration
    const widgetConfig = {
      projectId: project.id,
      apiEndpoint: `${baseUrl}/api/widget/feedback`,
      buttonColor: project.customization?.buttonColor || '#3b82f6',
      buttonRadius: project.customization?.buttonRadius || 8,
      buttonLabel: project.customization?.buttonLabel || 'Feedback',
      introMessage:
        project.customization?.introMessage ||
        "We'd love to hear your thoughts! Your feedback helps us improve.",
      successMessage: project.customization?.successMessage || 'Thank you for your feedback!',
    };

    // Generate the embeddable script using the modern async loading pattern
    const script = `<script>
(function () {
  window.__feedbackBasket = {
    projectId: '${widgetConfig.projectId}',
    apiEndpoint: '${widgetConfig.apiEndpoint}',
    buttonColor: '${widgetConfig.buttonColor}',
    buttonRadius: ${widgetConfig.buttonRadius},
    buttonLabel: '${widgetConfig.buttonLabel.replace(/'/g, "\\'")}',
    introMessage: '${widgetConfig.introMessage.replace(/'/g, "\\'")}',
    successMessage: '${widgetConfig.successMessage.replace(/'/g, "\\'")}'
  };
  const s = document.createElement('script');
  s.src = '${baseUrl}/widget/feedback-widget.js';
  s.async = true;
  document.head.appendChild(s);
})();
</script>`;

    // Generate installation instructions
    const instructions = {
      script: script,
      installation: {
        title: 'How to Install Your Feedback Widget',
        steps: [
          {
            step: 1,
            title: 'Copy the Script',
            description: 'Copy the entire script code below.',
          },
          {
            step: 2,
            title: 'Add to Your Website',
            description: 'Paste the script code just before the closing </body> tag in your HTML.',
          },
          {
            step: 3,
            title: 'Test the Widget',
            description:
              'Visit your website and look for the feedback button in the bottom-right corner.',
          },
        ],
        notes: [
          "The widget loads asynchronously and won't block your page loading.",
          'The widget will automatically appear on all pages where the script is installed.',
          'The widget is responsive and will work on both desktop and mobile devices.',
          'You can customize the appearance anytime from your dashboard.',
          'All feedback will be collected and available in your project dashboard.',
        ],
      },
      config: widgetConfig,
    };

    return NextResponse.json(instructions);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }
}
