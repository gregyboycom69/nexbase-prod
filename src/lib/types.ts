export interface Workspace {
  id: string;
  slug: string;
  owner_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Page {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  is_home: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Control {
  id: string;
  page_id: string;
  control_type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  props: any;
  macro_steps: any[];
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface AppData {
  id: string;
  workspace_id: string;
  page_id: string | null;
  data: any;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  workspace_id: string;
  user_id: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  old_data: any | null;
  new_data: any | null;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  plan: 'free' | 'starter' | 'builder' | 'agency';
  status: 'active' | 'blocked';
  created_at: string;
  updated_at: string;
}
