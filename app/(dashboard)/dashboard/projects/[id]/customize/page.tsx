import { auth } from '@/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { WidgetCustomizationPage } from '@/components/widget-customization-page';

interface CustomizePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CustomizePage(props: CustomizePageProps) {
  const params = await props.params;
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

  return (
    <WidgetCustomizationPage
      project={project}
      initialCustomization={project.customization}
      user={session.user}
    />
  );
}
