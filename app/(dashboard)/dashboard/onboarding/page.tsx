import { auth } from '@/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { OnboardingFlow } from '@/components/onboarding-flow';

export default async function OnboardingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/sign-in');
  }

  // Check if user already has projects
  const existingProjects = await prisma.project.count({
    where: {
      userId: session.user.id,
    },
  });

  // If user already has projects, redirect to dashboard
  if (existingProjects > 0) {
    redirect('/dashboard');
  }

  return <OnboardingFlow user={session.user} />;
}
