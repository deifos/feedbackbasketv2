import { auth } from '@/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@/app/generated/prisma';
import { ScriptInstallationGuide } from '@/components/script-installation-guide';

const prisma = new PrismaClient();

interface InstallPageProps {
  params: {
    id: string;
  };
}

export default async function InstallPage({ params }: InstallPageProps) {
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

  // Generate the script data
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const scriptData = {
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

  await prisma.$disconnect();

  return <ScriptInstallationGuide project={project} scriptData={scriptData} user={session.user} />;
}
