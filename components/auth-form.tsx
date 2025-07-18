'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { authClient } from '@/lib/auth-client';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
// import { useRouter } from 'next/navigation';

interface AuthFormProps extends React.ComponentProps<'div'> {
  mode: 'signin' | 'signup';
}

export function AuthForm({ className, mode, ...props }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/dashboard',
      });
    } catch (err) {
      setError(
        `Failed to ${mode === 'signin' ? 'sign in' : 'sign up'} with Google. Please try again.`
      );
      console.error('Google auth error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const isSignIn = mode === 'signin';
  const title = isSignIn ? 'Welcome back' : 'Create your account';
  const subtitle = isSignIn
    ? 'Login to your Feedbackbasket account'
    : 'Sign up for your Feedbackbasket account';
  const buttonText = isSignIn ? 'Continue with Google' : 'Sign up with Google';
  const linkText = isSignIn ? "Don't have an account?" : 'Already have an account?';
  const linkLabel = isSignIn ? 'Sign up' : 'Sign in';
  const linkHref = isSignIn ? '/sign-up' : '/sign-in';

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">{title}</h1>
                <p className="text-muted-foreground text-balance">{subtitle}</p>
              </div>
              {error && (
                <div className="rounded-md bg-red-50 p-3 border border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              <div className="grid grid-cols-1 gap-4">
                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="mr-2 h-4 w-4"
                    >
                      <path
                        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                        fill="currentColor"
                      />
                    </svg>
                  )}
                  {isLoading ? `${isSignIn ? 'Signing in' : 'Signing up'}...` : buttonText}
                </Button>
              </div>
              <div className="text-center text-sm">
                {linkText}{' '}
                <Link href={linkHref} className="underline underline-offset-4">
                  {linkLabel}
                </Link>
              </div>
            </div>
          </form>
          <div className="bg-muted relative hidden md:block">
            <Image
              src="/feedback-basket-login.png"
              alt="Authentication background"
              fill
              className="object-cover dark:brightness-[0.2] dark:grayscale"
              priority
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a> and{' '}
        <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
