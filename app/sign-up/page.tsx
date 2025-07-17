import { auth } from '@/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth-form';

export default async function SignUpPage() {
  // Check if user is already logged in
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // If user is already logged in, redirect to dashboard
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <AuthForm mode="signup" />
      </div>
    </div>
  );
}
