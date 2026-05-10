import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Workspace } from '@/lib/types';
import Link from 'next/link';
import WorkspaceModal from '@/components/workspace-modal';
import { getUserPlan, checkWorkspaceLimit, checkPagesLimit, checkRowsLimit } from '@/lib/limits';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: workspaces, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching workspaces:', error);
  }

  // Get user's plan and limits
  const { plan, limits } = await getUserPlan(user.id);
  const workspaceLimit = await checkWorkspaceLimit(user.id);

  // Calculate total pages and rows across all workspaces
  let totalPages = 0;
  let totalRows = 0;

  if (workspaces) {
    for (const workspace of workspaces) {
      const { data: pages } = await supabase
        .from('pages')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspace.id);

      const { data: rows } = await supabase
        .from('app_data')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspace.id);

      totalPages += (pages as any)?.count || 0;
      totalRows += (rows as any)?.count || 0;
    }
  }

  // Calculate trial days remaining
  let trialDaysRemaining = null;
  if (limits.trial_ends_at) {
    const trialEnd = new Date(limits.trial_ends_at);
    const now = new Date();
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft > 0) {
      trialDaysRemaining = daysLeft;
    }
  }

  // FIX 19.3: Dynamic bar color based on usage ratio
  const getBarColor = (count: number, limit: number) => {
    const ratio = count / limit;
    if (ratio >= 1) return 'bg-red-500';        // red - at/over limit
    if (ratio >= 0.8) return 'bg-amber-500';    // yellow - near limit
    return 'bg-green-500';                       // green - room to grow
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">NexBase</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Trial Banner */}
        {trialDaysRemaining !== null && (
          <div className="mb-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-lg">
                    You have {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} left in your trial
                  </div>
                  <div className="text-sm opacity-90">
                    Upgrade now to continue using NexBase after your trial ends
                  </div>
                </div>
              </div>
              <Link
                href="/pricing"
                className="bg-white text-orange-600 px-6 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors"
              >
                Upgrade Now
              </Link>
            </div>
          </div>
        )}

        {/* Billing Section */}
        <div className="mb-8 bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Your Plan</h3>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary-600 capitalize">{plan}</span>
                {plan === 'free' && (
                  <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                    Free
                  </span>
                )}
                {plan === 'trial' && (
                  <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">
                    Trial
                  </span>
                )}
                {plan === 'starter' && (
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    Starter
                  </span>
                )}
                {plan === 'builder' && (
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                    Builder
                  </span>
                )}
                {plan === 'agency' && (
                  <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
                    Agency
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {plan !== 'agency' && (
                <Link
                  href="/pricing"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 font-medium transition-colors"
                >
                  Upgrade Plan
                </Link>
              )}
              {plan !== 'free' && plan !== 'trial' && (
                <form action="/api/stripe/portal" method="POST">
                  <button
                    type="submit"
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                  >
                    Manage Subscription
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Usage Stats */}
          <div className="space-y-4">
            {/* Workspaces */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">Workspaces</span>
                <span className="text-gray-600">
                  {workspaceLimit.current} / {workspaceLimit.limit === 999 ? '∞' : workspaceLimit.limit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getBarColor(workspaceLimit.current, workspaceLimit.limit)}`}
                  style={{
                    width: `${Math.min(
                      (workspaceLimit.current / (workspaceLimit.limit === 999 ? workspaceLimit.current + 1 : workspaceLimit.limit)) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Pages */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">Pages</span>
                <span className="text-gray-600">
                  {totalPages} / {limits.pages_limit === 999 ? '∞' : limits.pages_limit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getBarColor(totalPages, limits.pages_limit === 999 ? 999 : limits.pages_limit)}`}
                  style={{
                    width: `${Math.min(
                      (totalPages / (limits.pages_limit === 999 ? totalPages + 1 : limits.pages_limit)) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Data Rows */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">Data Rows</span>
                <span className="text-gray-600">
                  {totalRows.toLocaleString()} / {limits.rows_limit === 9999999 ? '∞' : limits.rows_limit.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getBarColor(totalRows, limits.rows_limit === 9999999 ? 9999999 : limits.rows_limit)}`}
                  style={{
                    width: `${Math.min(
                      (totalRows / (limits.rows_limit === 9999999 ? totalRows + 1 : limits.rows_limit)) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">My Workspaces</h2>
            <p className="text-gray-600 mt-1">
              Create and manage your custom CRM applications
            </p>
          </div>
          <WorkspaceModal userId={user.id} />
        </div>

        {workspaces && workspaces.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((workspace: Workspace) => (
              <Link
                key={workspace.id}
                href={`/workspace/${workspace.slug}`}
                className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {workspace.name}
                    </h3>
                    <p className="text-sm text-gray-500">/{workspace.slug}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-primary-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Created {new Date(workspace.created_at).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No workspaces
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new workspace
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
