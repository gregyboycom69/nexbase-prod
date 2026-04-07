import Link from 'next/link';

export default function SuspendedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Account Suspended
        </h1>

        <p className="text-gray-600 mb-6">
          Your account has been suspended and you no longer have access to
          NexBase services.
        </p>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-800">
            If you believe this is a mistake or would like to appeal this
            decision, please contact our support team.
          </p>
        </div>

        <div className="space-y-3">
          <a
            href="mailto:support@nexbase.com?subject=Account%20Suspension%20Appeal"
            className="block w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 font-medium transition-colors"
          >
            Contact Support
          </a>

          <Link
            href="/"
            className="block w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 font-medium transition-colors"
          >
            Return to Home
          </Link>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          Need immediate assistance? Email us at{' '}
          <a
            href="mailto:support@nexbase.com"
            className="text-primary-600 hover:text-primary-700"
          >
            support@nexbase.com
          </a>
        </p>
      </div>
    </div>
  );
}
