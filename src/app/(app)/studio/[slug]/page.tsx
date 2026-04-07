import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import FormDesigner from '@/components/form-designer/form-designer';

interface StudioPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function StudioPage({ params }: StudioPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('slug', slug)
    .eq('owner_id', user.id)
    .single();

  if (error || !workspace) {
    redirect('/dashboard');
  }

  return (
    <FormDesigner
      workspaceId={workspace.id}
      workspaceName={workspace.name}
      workspaceSlug={workspace.slug}
      userEmail={user.email || ''}
    />
  );
}
