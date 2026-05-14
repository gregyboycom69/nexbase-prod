'use client'
import React from 'react'

// FIX 19.11.3: Auto-calculate contrast text color for buttons
export function getContrastText(bgHex: string | undefined): string {
  if (!bgHex || bgHex === 'transparent') return '#1e293b';

  const c = bgHex.replace('#', '');
  if (c.length !== 6) return '#ffffff';

  const r = parseInt(c.substr(0, 2), 16);
  const g = parseInt(c.substr(2, 2), 16);
  const b = parseInt(c.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 155 ? '#1e293b' : '#ffffff';
}

interface NexBaseControlProps {
  ctrl: any
  formData: Record<string, any>
  setFormData: React.Dispatch<React.SetStateAction<Record<string, any>>>
  handleButtonClick: (ctrl: any) => void | Promise<void>
  visibleModal?: string | null
  setVisibleModal?: (id: string | null) => void
}

export function NexBaseControl({
  ctrl,
  formData,
  setFormData,
  handleButtonClick,
  visibleModal,
  setVisibleModal,
}: NexBaseControlProps) {
  const props = ctrl.props || {}
  const controlSource = props.controlSource || ctrl.fieldKey
  const base: React.CSSProperties = {
    width: ctrl.w,
    height: ctrl.h,
    borderRadius: ctrl.radius || props.radius,
    fontSize: ctrl.fontSize || props.fontSize,
    color: ctrl.color || props.color,
    fontFamily: 'inherit',
  }

  if (ctrl.type === 'Heading') {
    return <div style={{ ...base, display: 'flex', alignItems: 'center', fontWeight: 800 }}>{props.caption || ctrl.caption}</div>
  }

  if (ctrl.type === 'Label') {
    return <div style={{ ...base, display: 'flex', alignItems: 'center' }}>{props.caption || ctrl.caption}</div>
  }

  if (ctrl.type === 'TextBox') {
    return (
      <input
        type="text"
        placeholder={props.placeholder || ctrl.placeholder}
        value={formData[controlSource] || ''}
        onChange={(e) => setFormData((prev) => ({ ...prev, [controlSource]: e.target.value }))}
        style={{
          ...base,
          background: props.bg || ctrl.bg,
          border: '1.5px solid #e2e8f0',
          padding: '0 12px',
          outline: 'none',
          transition: 'border-color 0.2s',
        }}
        onFocus={(e) => (e.target.style.borderColor = '#6366f1')}
        onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
      />
    )
  }

  if (ctrl.type === 'Button') {
    const bgColor = props.bg || ctrl.bg;
    return (
      <button
        onClick={() => handleButtonClick(ctrl)}
        style={{
          ...base,
          background: bgColor,
          color: props.color || ctrl.color || getContrastText(bgColor),
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: `0 4px 14px ${bgColor}55`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = `0 6px 20px ${props.bg || ctrl.bg}77`
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = `0 4px 14px ${props.bg || ctrl.bg}55`
        }}
      >
        {props.label || props.caption || ctrl.caption || 'Button'}
      </button>
    )
  }

  if (ctrl.type === 'ComboBox') {
    const options = (props.options || ctrl.placeholder || 'Option 1,Option 2,Option 3').split(',')
    return (
      <select
        value={formData[controlSource] || ''}
        onChange={(e) => setFormData((prev) => ({ ...prev, [controlSource]: e.target.value }))}
        style={{
          ...base,
          background: props.bg || ctrl.bg,
          border: '1.5px solid #e2e8f0',
          padding: '0 12px',
          outline: 'none',
        }}
      >
        <option value="">{props.placeholder || 'Select...'}</option>
        {options.map((opt: string, i: number) => (
          <option key={i} value={opt.trim()}>
            {opt.trim()}
          </option>
        ))}
      </select>
    )
  }

  if (ctrl.type === 'CheckBox') {
    return (
      <label style={{ ...base, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={formData[controlSource] || false}
          onChange={(e) => setFormData((prev) => ({ ...prev, [controlSource]: e.target.checked }))}
          style={{ width: 20, height: 20 }}
        />
        <span>{props.caption || ctrl.caption}</span>
      </label>
    )
  }

  if (ctrl.type === 'DatePicker') {
    return (
      <input
        type="date"
        value={formData[controlSource] || ''}
        onChange={(e) => setFormData((prev) => ({ ...prev, [controlSource]: e.target.value }))}
        style={{
          ...base,
          background: props.bg || ctrl.bg,
          border: '1.5px solid #e2e8f0',
          padding: '0 12px',
          outline: 'none',
        }}
      />
    )
  }

  if (ctrl.type === 'NumberBox') {
    return (
      <input
        type="number"
        value={formData[controlSource] || props.value || ctrl.value || 0}
        onChange={(e) => setFormData((prev) => ({ ...prev, [controlSource]: Number(e.target.value) }))}
        style={{
          ...base,
          background: props.bg || ctrl.bg,
          border: '1.5px solid #e2e8f0',
          padding: '0 12px',
          textAlign: 'right',
          outline: 'none',
        }}
      />
    )
  }

  if (ctrl.type === 'ProgressBar') {
    const pct = formData[controlSource] || props.value || ctrl.value || 0
    return (
      <div
        style={{
          ...base,
          background: ctrl.bg || '#e5e7eb',
          borderRadius: ctrl.radius,
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${pct}%`,
            background: ctrl.color,
            transition: 'width 0.3s',
            borderRadius: ctrl.radius,
          }}
        />
        <span style={{ position: 'relative', marginLeft: 'auto', marginRight: 8, fontSize: 11, fontWeight: 600 }}>
          {pct}%
        </span>
      </div>
    )
  }

  if (ctrl.type === 'Badge') {
    return (
      <div
        style={{
          ...base,
          background: props.bg || ctrl.bg,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 12px',
          fontWeight: 600,
          border: `1.5px solid ${props.color || ctrl.color}44`,
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: props.color || ctrl.color, marginRight: 6 }} />
        {props.caption || ctrl.caption}
      </div>
    )
  }

  if (ctrl.type === 'Card') {
    return (
      <div
        style={{
          ...base,
          background: props.bg || ctrl.bg,
          color: props.color || ctrl.color,
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          padding: '14px 16px',
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 12, color: '#94a3b8', textTransform: 'uppercase' }}>
          {props.caption || ctrl.caption}
        </div>
        <div style={{ height: 1, background: '#f1f5f9', marginBottom: 10 }} />
        <div style={{ fontSize: 12, color: '#cbd5e1' }}>Content area</div>
      </div>
    )
  }

  if (ctrl.type === 'Divider') {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '100%', height: 2, background: props.bg || ctrl.bg || '#e2e8f0' }} />
      </div>
    )
  }

  // FIX 20.6.1: NavigationButtons control rendering with standard actions
  if (ctrl.type === 'NavigationButtons') {
    return (
      <div style={{
        display: 'flex',
        gap: 8,
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'flex-start',
      }}>
        <button
          onClick={() => handleButtonClick({ action: 'save' })}
          style={{
            padding: '6px 16px',
            background: '#4f46e5',
            color: '#ffffff',
            border: 'none',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Save
        </button>
        <button
          onClick={() => handleButtonClick({ action: 'new' })}
          style={{
            padding: '6px 16px',
            background: '#10b981',
            color: '#ffffff',
            border: 'none',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          New
        </button>
        <button
          onClick={() => handleButtonClick({ action: 'delete' })}
          style={{
            padding: '6px 16px',
            background: '#ef4444',
            color: '#ffffff',
            border: 'none',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Delete
        </button>
      </div>
    )
  }

  if (ctrl.type === 'Modal' && visibleModal === ctrl.id) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9998,
        }}
        onClick={() => setVisibleModal?.(null)}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: ctrl.w,
            height: ctrl.h,
            background: '#fff',
            borderRadius: props.radius || ctrl.radius,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}
        >
          <div
            style={{
              background: props.bg || ctrl.bg,
              color: props.color || ctrl.color,
              padding: '10px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontWeight: 600,
            }}
          >
            <span>{props.caption || ctrl.caption}</span>
            <button
              onClick={() => setVisibleModal?.(null)}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 20 }}
            >
              {'\u00D7'}
            </button>
          </div>
          <div style={{ flex: 1, padding: '12px', fontSize: 12, color: '#6b7280' }}>Modal content here</div>
          <div
            style={{
              padding: '10px 12px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              gap: 8,
              justifyContent: 'flex-end',
            }}
          >
            <button
              onClick={() => setVisibleModal?.(null)}
              style={{
                padding: '4px 12px',
                background: '#e5e7eb',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => setVisibleModal?.(null)}
              style={{
                padding: '4px 12px',
                background: '#4f46e5',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Simplified rendering for other controls
  return (
    <div
      style={{
        ...base,
        background: ctrl.bg || '#f3f4f6',
        border: '1px dashed #d1d5db',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        color: '#9ca3af',
      }}
    >
      {ctrl.type}
    </div>
  )
}
