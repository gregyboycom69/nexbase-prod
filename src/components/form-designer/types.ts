export type ControlType =
  | 'select'
  | 'heading'
  | 'label'
  | 'textbox'
  | 'button'
  | 'combobox'
  | 'checkbox'
  | 'badge'
  | 'card'
  | 'divider'
  | 'image';

export interface ControlProps {
  caption?: string;
  placeholder?: string;
  fieldKey?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
  fontSize?: number;
  bold?: boolean;
  options?: string; // comma-separated for combobox
  [key: string]: any;
}

export interface MacroStep {
  id: string;
  action: string;
  params: Record<string, any>;
}

export interface Control {
  id: string;
  page_id: string;
  control_type: ControlType;
  x: number;
  y: number;
  w: number;
  h: number;
  props: ControlProps;
  macro_steps: MacroStep[];
  display_order: number;
}

export interface Page {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  is_home: boolean;
  display_order: number;
}

export interface ToolDefinition {
  type: ControlType;
  icon: string;
  label: string;
  defaultWidth: number;
  defaultHeight: number;
}
