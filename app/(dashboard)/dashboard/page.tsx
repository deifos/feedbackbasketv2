import { auth } from '@/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { DashboardOverview } from '@/components/dashboard-overview';
import { UpgradeStatusHandler } from '@/components/upgrade-status-handler';

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/sign-in');
  }

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
    const _totalProjects = projects.length;
    const _totalFeedback = projects.reduce((sum, project) => sum + project._count.feedback, 0);
    const _totalPendingFeedback = Array.from(pendingCountMap.values()).reduce(
      (sum, count) => sum + count,
      0
    );

    // Get feedback from this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const _thisMonthFeedback = await prisma.feedback.count({
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

    // Dashboard data structure
    const dashboardData = {
      projects: projectsWithCounts,
      stats: {
        totalProjects: _totalProjects,
        totalFeedback: _totalFeedback,
        totalPendingFeedback: _totalPendingFeedback,
        thisMonthFeedback: _thisMonthFeedback,
      },
    };

    return (
      <>
        <UpgradeStatusHandler />
        <DashboardOverview data={dashboardData} />
      </>
    );
  } catch (error) {
    console.error('Dashboard error:', error);
    throw error;
  }
}
