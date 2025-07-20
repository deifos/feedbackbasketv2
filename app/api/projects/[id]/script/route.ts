import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import { PrismaClient } from '@/app/generated/prisma';
// import { ScriptGenerationResponse, WidgetConfig } from '@/lib/types/api';

const prisma = new PrismaClient();

// GET /api/projects/[id]/script - Generate widget script
export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
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

    // Generate the embeddable script
    const script = `
<!-- Feedback Widget Script -->
<script>
(function() {
  // Widget configuration
  const FEEDBACK_CONFIG = ${JSON.stringify(widgetConfig, null, 2)};
  
  // Create widget container
  function createWidget() {
    // Check if widget already exists
    if (document.getElementById('feedback-widget-container')) {
      return;
    }

    // Create widget button
    const button = document.createElement('button');
    button.id = 'feedback-widget-button';
    button.innerHTML = \`
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      \${FEEDBACK_CONFIG.buttonLabel}
    \`;
    
    // Style the button
    button.style.cssText = \`
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: \${FEEDBACK_CONFIG.buttonColor};
      color: white;
      border: none;
      border-radius: \${FEEDBACK_CONFIG.buttonRadius}px;
      padding: 12px 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
      text-decoration: none;
      outline: none;
    \`;

    // Add hover effects
    button.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px)';
      this.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
    });

    button.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    });

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'feedback-widget-modal';
    modal.style.cssText = \`
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 10000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
      box-sizing: border-box;
    \`;

    // Create form container
    const formContainer = document.createElement('div');
    formContainer.style.cssText = \`
      background: white;
      border-radius: 8px;
      padding: 24px;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      position: relative;
    \`;

    // Create form HTML
    formContainer.innerHTML = \`
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 18px; font-weight: 600; color: #1f2937;">Send Feedback</h3>
        <button id="feedback-close-btn" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280; padding: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">&times;</button>
      </div>
      <form id="feedback-form">
        <div style="margin-bottom: 16px;">
          <p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; color: #6b7280; line-height: 1.5;">\${FEEDBACK_CONFIG.introMessage}</p>
        </div>
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 500; color: #374151;">Email (optional)</label>
          <input type="email" id="feedback-email" placeholder="your@email.com" style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; box-sizing: border-box; outline: none;">
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 500; color: #374151;">Your feedback *</label>
          <textarea id="feedback-content" required placeholder="Tell us what you think..." style="width: 100%; height: 100px; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; resize: vertical; box-sizing: border-box; outline: none;"></textarea>
        </div>
        <div style="display: flex; gap: 12px;">
          <button type="submit" id="feedback-submit-btn" style="flex: 1; background-color: \${FEEDBACK_CONFIG.buttonColor}; color: white; border: none; border-radius: 6px; padding: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 500; cursor: pointer;">Send Feedback</button>
          <button type="button" id="feedback-cancel-btn" style="flex: 1; background-color: #f3f4f6; color: #374151; border: none; border-radius: 6px; padding: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 500; cursor: pointer;">Cancel</button>
        </div>
      </form>
      <div id="feedback-success" style="display: none; text-align: center; padding: 20px;">
        <div style="width: 48px; height: 48px; background-color: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <polyline points="20,6 9,17 4,12"/>
          </svg>
        </div>
        <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; color: #1f2937;">\${FEEDBACK_CONFIG.successMessage}</p>
      </div>
    \`;

    modal.appendChild(formContainer);

    // Create container
    const container = document.createElement('div');
    container.id = 'feedback-widget-container';
    container.appendChild(button);
    container.appendChild(modal);

    // Add event listeners
    button.addEventListener('click', function() {
      modal.style.display = 'flex';
      document.getElementById('feedback-content').focus();
    });

    // Close modal events
    function closeModal() {
      modal.style.display = 'none';
      document.getElementById('feedback-form').reset();
      document.getElementById('feedback-form').style.display = 'block';
      document.getElementById('feedback-success').style.display = 'none';
    }

    document.getElementById('feedback-close-btn').addEventListener('click', closeModal);
    document.getElementById('feedback-cancel-btn').addEventListener('click', closeModal);
    
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Form submission
    document.getElementById('feedback-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const submitBtn = document.getElementById('feedback-submit-btn');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;

      try {
        const response = await fetch(FEEDBACK_CONFIG.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId: FEEDBACK_CONFIG.projectId,
            content: document.getElementById('feedback-content').value,
            email: document.getElementById('feedback-email').value || null,
          }),
        });

        if (response.ok) {
          document.getElementById('feedback-form').style.display = 'none';
          document.getElementById('feedback-success').style.display = 'block';
          
          setTimeout(closeModal, 3000);
        } else {
          throw new Error('Failed to submit feedback');
        }
      } catch (error) {
        alert('Failed to submit feedback. Please try again.');
      } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });

    // Add to page
    document.body.appendChild(container);
  }

  // Initialize widget when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();
</script>`.trim();

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
    console.error('Error generating widget script:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to generate widget script' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
