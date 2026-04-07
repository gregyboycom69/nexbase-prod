import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

interface PublicAppPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function PublicAppPage({ params }: PublicAppPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !workspace) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {workspace.brand_name}
            </h1>
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 mb-6">
              <p className="text-primary-800 font-medium mb-2">
                Published App Coming Soon
              </p>
              <p className="text-primary-700 text-sm">
                This workspace is being configured. Check back soon to see the
                published application.
              </p>
            </div>
            <div className="text-sm text-gray-500">
              <p>App URL: /app/{workspace.slug}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
