import { auth } from '@/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { ScriptInstallationGuide } from '@/components/script-installation-guide';

interface InstallPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function InstallPage(props: InstallPageProps) {
  const params = await props.params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/sign-in');
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
    redirect('/dashboard');
  }

  // Fetch script data from the API endpoint
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    const response = await fetch(`${baseUrl}/api/projects/${id}/script`, {
      headers: {
        Cookie: await headers().then(h => h.get('cookie') || ''),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch script data');
    }

    const scriptResponse = await response.json();

    return (
      <ScriptInstallationGuide
        project={project}
        scriptResponse={scriptResponse}
        user={session.user}
      />
    );
  } catch (error) {
    console.error('Error fetching script data:', error);

    // Fallback to generating script data locally if API fails
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

    // Generate the new script format as fallback
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

    const fallbackScriptResponse = {
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

    return (
      <ScriptInstallationGuide
        project={project}
        scriptResponse={fallbackScriptResponse}
        user={session.user}
      />
    );
  }
}
