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
    // Get feedback counts by status in a single optimized query - only visible feedback
    prisma.feedback.groupBy({
      by: ['status'],
      where: {
        projectId: project.id,
        isVisible: true, // Only count visible feedback based on subscription limits
      },
      _count: {
        id: true,
      },
    }),
    // Get recent feedback for initial display (first page) - only visible feedback
    prisma.feedback.findMany({
      where: {
        projectId: project.id,
        isVisible: true, // Only show visible feedback based on subscription limits
      },
      orderBy: [
        { visibilityRank: 'asc' }, // Primary sort by visibility rank (newest first)
        { createdAt: 'desc' }, // Secondary sort by creation date
      ],
      take: 50, // Limit initial load to 50 items for better performance
    }),
  ]);

  // Transform stats into the expected format
  const statsMap = new Map(feedbackStats.map(stat => [stat.status, stat._count.id]));

  // Calculate AI analysis statistics from recent feedback
  const categoryStats = recentFeedback.reduce(
    (acc, feedback) => {
      const effectiveCategory =
        feedback.categoryOverridden && feedback.manualCategory
          ? feedback.manualCategory
          : feedback.category;

      if (effectiveCategory === 'BUG') acc.bugs++;
      else if (effectiveCategory === 'FEATURE') acc.features++;
      else if (effectiveCategory === 'REVIEW') acc.reviews++;

      return acc;
    },
    { bugs: 0, features: 0, reviews: 0 }
  );

  const sentimentStats = recentFeedback.reduce(
    (acc, feedback) => {
      const effectiveSentiment =
        feedback.sentimentOverridden && feedback.manualSentiment
          ? feedback.manualSentiment
          : feedback.sentiment;

      if (effectiveSentiment === 'POSITIVE') acc.positive++;
      else if (effectiveSentiment === 'NEUTRAL') acc.neutral++;
      else if (effectiveSentiment === 'NEGATIVE') acc.negative++;

      return acc;
    },
    { positive: 0, neutral: 0, negative: 0 }
  );

  const stats = {
    total: feedbackStats.reduce((sum, stat) => sum + stat._count.id, 0),
    pending: statsMap.get('PENDING') || 0,
    reviewed: statsMap.get('REVIEWED') || 0,
    done: statsMap.get('DONE') || 0,
    // AI Analysis stats
    bugs: categoryStats.bugs,
    features: categoryStats.features,
    reviews: categoryStats.reviews,
    positive: sentimentStats.positive,
    neutral: sentimentStats.neutral,
    negative: sentimentStats.negative,
    needsAttention: categoryStats.bugs + sentimentStats.negative, // Items that need immediate attention
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
