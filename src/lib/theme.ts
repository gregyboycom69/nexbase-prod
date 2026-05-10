// FIX 19.4: Centralized theme system for consistent colors across NexBase
export const theme = {
  bg: {
    page: '#f8fafc',
    card: '#ffffff',
    panel: '#f1f5f9',
    hover: '#f1f5f9',
    canvas: '#ffffff',
  },

  text: {
    primary: '#0f172a',
    secondary: '#374151',
    muted: '#64748b',
    disabled: '#94a3b8',
    inverse: '#ffffff',
  },

  border: {
    light: '#f1f5f9',
    default: '#e2e8f0',
    strong: '#cbd5e1',
  },

  brand: {
    primary: '#4f46e5',
    primaryHover: '#4338ca',
    primaryLight: '#eef2ff',
    primaryText: '#ffffff',
    secondary: '#6366f1',
  },

  status: {
    success: '#10b981',
    successLight: '#d1fae5',
    warning: '#f59e0b',
    warningLight: '#fef3c7',
    danger: '#ef4444',
    dangerLight: '#fee2e2',
    info: '#3b82f6',
    infoLight: '#dbeafe',
  },

  controls: {
    textBoxBg: '#ffffff',
    textBoxText: '#1e293b',
    textBoxBorder: '#e2e8f0',
    textBoxBorderFocus: '#4f46e5',
    labelText: '#374151',
    headingText: '#0f172a',
    buttonBg: '#4f46e5',
    buttonText: '#ffffff',
    buttonHover: '#4338ca',
    comboBg: '#ffffff',
    comboText: '#374151',
    checkboxText: '#374151',
    badgeBg: '#eff6ff',
    badgeText: '#4f46e5',
    cardBg: '#ffffff',
    cardText: '#0f172a',
    dividerColor: '#e2e8f0',
  },

  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.04)',
    md: '0 4px 8px rgba(0,0,0,0.06)',
    lg: '0 10px 20px rgba(0,0,0,0.08)',
  },

  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
};

export type Theme = typeof theme;
