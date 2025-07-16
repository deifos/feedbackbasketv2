import { auth } from '@/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@/app/generated/prisma';
import { WidgetCustomizationPage } from '@/components/widget-customization-page';

const prisma = new PrismaClient();

interface CustomizePageProps {
  params: {
    id: string;
  };
}

export default async function CustomizePage({ params }: CustomizePageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/sign-in');
  }

  // Fetch the project with customization
  const project = await prisma.project.findFirst({
    where: {
      id: params.id,
      userId: session.user.id,
    },
    include: {
      customization: true,
    },
  });

  if (!project) {
    redirect('/dashboard');
  }

  await prisma.$disconnect();

  return <WidgetCustomizationPage project={project} initialCustomization={project.customization} />;
}
