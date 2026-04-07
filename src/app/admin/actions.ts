'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateUserStatus(userId: string, status: 'active' | 'blocked') {
  const supabase = await createClient();

  // Verify admin access
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return { success: false, error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('user_profiles')
    .update({ status })
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin');
  return { success: true };
}

export async function updateUserPlan(
  userId: string,
  plan: 'free' | 'starter' | 'builder' | 'agency'
) {
  const supabase = await createClient();

  // Verify admin access
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return { success: false, error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('user_profiles')
    .update({ plan })
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin');
  return { success: true };
}
