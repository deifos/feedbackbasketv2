import { auth } from '@/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard-header';
import { PrismaClient } from '@/app/generated/prisma';
import { DashboardOverview } from '@/components/dashboard-overview';

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/sign-in');
  }

  const prisma = new PrismaClient();

  try {
    // Fetch user's projects with feedback counts
    const projects = await prisma.project.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        customization: true,
        _count: {
          select: {
            feedback: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Get pending feedback counts for all projects (optimized with index)
    const pendingCounts = await prisma.feedback.groupBy({
      by: ['projectId'],
      where: {
        projectId: { in: projects.map(p => p.id) },
        status: 'PENDING',
      },
      _count: {
        id: true,
      },
    });

    // Create a map for quick lookup of pending counts
    const pendingCountMap = new Map(pendingCounts.map(item => [item.projectId, item._count.id]));

    // Transform projects with counts
    const projectsWithCounts = projects.map(project => ({
      ...project,
      _count: {
        feedback: project._count.feedback,
        pendingFeedback: pendingCountMap.get(project.id) || 0,
      },
    }));

    // Calculate dashboard statistics
    const totalProjects = projects.length;
    const totalFeedback = projects.reduce((sum, project) => sum + project._count.feedback, 0);
    const totalPendingFeedback = Array.from(pendingCountMap.values()).reduce(
      (sum, count) => sum + count,
      0
    );

    // Get feedback from this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thisMonthFeedback = await prisma.feedback.count({
      where: {
        projectId: { in: projects.map(p => p.id) },
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    // Redirect new users to onboarding
    if (projects.length === 0) {
      redirect('/dashboard/onboarding');
    }

    const dashboardData = {
      projects: projectsWithCounts,
      stats: {
        totalProjects,
        totalFeedback,
        totalPendingFeedback,
        thisMonthFeedback,
      },
    };

    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader user={session.user} />
        <main className="container mx-auto py-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {session.user.name}!</h1>
              <p className="text-muted-foreground">
                Here's what's happening with your projects feedback.
              </p>
            </div>

            <DashboardOverview data={dashboardData} />
          </div>
        </main>
      </div>
    );
  } finally {
    await prisma.$disconnect();
  }
}
