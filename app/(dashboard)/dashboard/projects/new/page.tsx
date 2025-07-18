import { auth } from '@/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { NewProjectForm } from '@/components/new-project-form';
import { subscriptionService } from '@/lib/services/subscription-service';
import { AddProjectButton } from '@/components/add-project-button';

export default async function NewProjectPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/sign-in');
  }

  // Check if user can create projects before showing the form
  const canCreate = await subscriptionService.canCreateProject(session.user.id);

  if (!canCreate) {
    // User has reached their limit, show upgrade prompt instead of form
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Create New Project</h1>
            <p className="text-gray-600">
              You&apos;ve reached your project limit for your current plan.
            </p>
          </div>

          <AddProjectButton variant="card" className="w-full" />

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Need help choosing a plan?{' '}
              <a href="/pricing" className="text-blue-600 hover:text-blue-700">
                Compare all plans
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <NewProjectForm user={session.user} />;
}
