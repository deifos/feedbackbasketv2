import { auth } from '@/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard-header';

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session.user} />
      <main className="container mx-auto py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {session.user.name}!</h1>
            <p className="text-muted-foreground">
              Here&spod;s what&spods;s happening with your feedback projects.
            </p>
          </div>

          {/* Dashboard content will go here */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold">Total Projects</h3>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">No projects yet</p>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold">Total Feedback</h3>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">No feedback received</p>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold">This Month</h3>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">New feedback this month</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
