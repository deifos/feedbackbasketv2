'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { signOut } from '@/lib/auth-client';
import { ChevronDown, LogOut, User } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface DashboardHeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push('/sign-in');
          },
        },
      });
      // The redirect will be handled by Better Auth
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">FB</span>
              </div>
              <span className="font-bold text-xl">FeedbackBasket</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-6">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/pricing"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2"
              >
                <div className="flex items-center space-x-2">
                  {user?.image ? (
                    <Image
                      src={user.image}
                      alt={user.name || 'User'}
                      width={24}
                      height={24}
                      className="h-6 w-6 rounded-full"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-3 w-3" />
                    </div>
                  )}
                  <span className="text-sm font-medium">{user?.name || user?.email}</span>
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md border bg-popover p-1 shadow-md">
                  <Link href="/account">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-left"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Account
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="w-full justify-start text-left"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </header>
  );
}
