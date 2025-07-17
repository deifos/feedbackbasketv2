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

  // Fetch the project with feedback
  const project = await prisma.project.findFirst({
    where: {
      id: id,
      userId: session.user.id,
    },
    include: {
      customization: true,
      feedback: {
        orderBy: {
          createdAt: 'desc',
        },
      },
      _count: {
        select: {
          feedback: true,
        },
      },
    },
  });

  if (!project) {
    redirect('/dashboard');
  }

  // Calculate feedback statistics
  const feedbackStats = {
    total: project.feedback.length,
    pending: project.feedback.filter(f => f.status === 'PENDING').length,
    reviewed: project.feedback.filter(f => f.status === 'REVIEWED').length,
    done: project.feedback.filter(f => f.status === 'DONE').length,
  };

  await prisma.$disconnect();

  return (
    <ProjectDashboard
      project={project}
      feedback={project.feedback}
      stats={feedbackStats}
      user={session.user}
    />
  );
}
