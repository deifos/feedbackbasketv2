import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-4 text-gray-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Page Not Found</h2>
        <p className="text-gray-600 mb-4">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="space-y-2">
          <Link
            href="/dashboard"
            className="block w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="block w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
