import { auth } from '@/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@/app/generated/prisma';
import { ProjectDashboard } from '@/components/project-dashboard';

const prisma = new PrismaClient();

interface ProjectPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectPage(props: ProjectPageProps) {
  const params = await props.params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/sign-in');
  }

  const { id } = params;

  // Fetch the project (without all feedback to improve performance)
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

  // Fetch feedback statistics efficiently using database aggregation
  const [feedbackStats, recentFeedback] = await Promise.all([
    // Get feedback counts by status in a single optimized query
    prisma.feedback.groupBy({
      by: ['status'],
      where: {
        projectId: project.id,
      },
      _count: {
        id: true,
      },
    }),
    // Get recent feedback for initial display (first page)
    prisma.feedback.findMany({
      where: {
        projectId: project.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit initial load to 50 items for better performance
    }),
  ]);

  // Transform stats into the expected format
  const statsMap = new Map(feedbackStats.map(stat => [stat.status, stat._count.id]));
  const stats = {
    total: feedbackStats.reduce((sum, stat) => sum + stat._count.id, 0),
    pending: statsMap.get('PENDING') || 0,
    reviewed: statsMap.get('REVIEWED') || 0,
    done: statsMap.get('DONE') || 0,
  };

  // Add feedback to project object for compatibility
  const projectWithFeedback = {
    ...project,
    feedback: recentFeedback,
  };

  await prisma.$disconnect();

  return (
    <ProjectDashboard
      project={projectWithFeedback}
      feedback={recentFeedback}
      stats={stats}
      user={session.user}
    />
  );
}
