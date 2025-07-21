import { auth } from '@/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { IntegrationsClient } from '@/components/integrations-client';

export default async function IntegrationsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/sign-in');
  }

  try {
    // Fetch user's current telegram handle and projects
    const [user, projects] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          telegramHandle: true,
          telegramChatId: true,
        }
      }),
      prisma.project.findMany({
        where: { userId: session.user.id },
        select: {
          id: true,
          name: true,
          url: true,
          telegramNotifications: true,
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    return (
      <IntegrationsClient 
        initialTelegramHandle={user?.telegramHandle || null}
        initialTelegramChatId={user?.telegramChatId || null}
        projects={projects}
        user={session.user}
      />
    );
  } catch (error) {
    console.error('Database error in integrations page:', error);
    redirect('/dashboard?error=database');
  }
}