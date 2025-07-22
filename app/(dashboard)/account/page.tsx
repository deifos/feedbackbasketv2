import { auth } from '@/auth';
import { UsageDisplay } from '@/components/usage-display';
import { ApiKeysClient } from '@/components/api-keys-client';
import { headers } from 'next/headers';

export default async function AccountPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Session is guaranteed to exist due to layout authentication

  return (
    <main className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account details, subscription, and usage limits.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Account Information + Preferences */}
        <div className="lg:col-span-1 space-y-6">
          {/* Account Information Section */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-4 py-3 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
              <p className="text-xs text-gray-600 mt-1">Your profile details</p>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <p className="text-gray-900 text-sm">{session?.user.name || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900 text-sm">{session?.user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account ID</label>
                <p className="text-gray-500 text-xs font-mono">{session?.user.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                <p className="text-gray-900 text-sm">
                  {new Date(session?.user.createdAt || '').toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-4 py-3 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Preferences</h2>
              <p className="text-xs text-gray-600 mt-1">Customize your experience</p>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                    <p className="text-xs text-gray-600">Receive updates about your feedback</p>
                  </div>
                  <div className="text-xs text-gray-500">Coming Soon</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-md">
                  <ApiKeysClient />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Usage & Limits Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-4 py-3 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Usage & Limits</h2>
              <p className="text-xs text-gray-600 mt-1">
                Monitor your current usage and subscription limits with detailed progress tracking
              </p>
            </div>
            <div className="p-4">
              <UsageDisplay compact={true} showUpgradePrompt={true} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
