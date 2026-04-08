import { createClient } from './supabase/client'

export async function checkWorkspaceLimit(userId: string): Promise<{ allowed: boolean; current: number; limit: number }> {
  const supabase = createClient()

  // Get user's workspace limit
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('workspace_limit')
    .eq('id', userId)
    .single()

  if (!profile) {
    return { allowed: false, current: 0, limit: 0 }
  }

  // Count current workspaces
  const { count } = await supabase
    .from('workspaces')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', userId)

  const current = count || 0
  const limit = profile.workspace_limit || 1

  return {
    allowed: current < limit,
    current,
    limit,
  }
}

export async function checkPagesLimit(userId: string, workspaceId: string): Promise<{ allowed: boolean; current: number; limit: number }> {
  const supabase = createClient()

  // Get user's pages limit
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('pages_limit')
    .eq('id', userId)
    .single()

  if (!profile) {
    return { allowed: false, current: 0, limit: 0 }
  }

  // Count current pages in this workspace
  const { count } = await supabase
    .from('pages')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)

  const current = count || 0
  const limit = profile.pages_limit || 5

  return {
    allowed: current < limit,
    current,
    limit,
  }
}

export async function checkRowsLimit(userId: string, workspaceId: string): Promise<{ allowed: boolean; current: number; limit: number }> {
  const supabase = createClient()

  // Get user's rows limit
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('rows_limit')
    .eq('id', userId)
    .single()

  if (!profile) {
    return { allowed: false, current: 0, limit: 0 }
  }

  // Count current rows in app_data for this workspace
  const { count } = await supabase
    .from('app_data')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)

  const current = count || 0
  const limit = profile.rows_limit || 1000

  return {
    allowed: current < limit,
    current,
    limit,
  }
}

export async function getUserPlan(userId: string): Promise<{ plan: string; limits: any }> {
  const supabase = createClient()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('plan, workspace_limit, pages_limit, rows_limit, trial_ends_at')
    .eq('id', userId)
    .single()

  if (!profile) {
    return {
      plan: 'free',
      limits: { workspace_limit: 1, pages_limit: 5, rows_limit: 1000 },
    }
  }

  return {
    plan: profile.plan || 'free',
    limits: {
      workspace_limit: profile.workspace_limit,
      pages_limit: profile.pages_limit,
      rows_limit: profile.rows_limit,
      trial_ends_at: profile.trial_ends_at,
    },
  }
}
