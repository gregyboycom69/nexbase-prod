import React from 'react'

type CtrlProps = {
  id: string
  type: string
  x: number
  y: number
  w: number
  h: number
  caption?: string
  color?: string
  bg?: string
  radius?: number
  fontSize?: number
  placeholder?: string
  controlSource?: string
  [key: string]: any
}

type CtrlRenderProps = {
  ctrl: CtrlProps
  isPreview?: boolean
  boundData?: any
  onClick?: () => void
  onMacroRun?: (steps: any[]) => void
}

export default function CtrlRender({ ctrl, isPreview = false, boundData = {}, onClick, onMacroRun }: CtrlRenderProps) {
  const base: React.CSSProperties = {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    borderRadius: ctrl.radius || 0,
    fontSize: ctrl.fontSize || 12,
    color: ctrl.color || 'var(--color-text-primary)',
    fontFamily: 'inherit',
    userSelect: 'none',
    pointerEvents: isPreview ? 'auto' : 'none',
  }

  const boundValue = ctrl.controlSource && boundData[ctrl.controlSource] !== undefined
    ? boundData[ctrl.controlSource]
    : null

  if (ctrl.type === 'Label') {
    return (
      <div style={{
        ...base,
        display: 'flex',
        alignItems: 'center',
        background: 'transparent',
        color: ctrl.color || 'var(--color-text-secondary)',
        fontSize: ctrl.fontSize || 11,
        fontWeight: 500
      }}>
        {ctrl.caption || 'Label'}
      </div>
    )
  }

  if (ctrl.type === 'Heading') {
    return (
      <div style={{
        ...base,
        display: 'flex',
        alignItems: 'center',
        fontWeight: 500,
        background: 'transparent',
        color: ctrl.color || 'var(--color-text-primary)',
        fontSize: ctrl.fontSize || 18
      }}>
        {ctrl.caption || 'Heading'}
      </div>
    )
  }

  if (ctrl.type === 'TextBox') {
    const displayValue = boundValue !== null ? String(boundValue) : ''
    if (isPreview) {
      return (
        <input
          type="text"
          placeholder={ctrl.placeholder}
          defaultValue={displayValue}
          style={{
            ...base,
            background: ctrl.bg || 'var(--color-background-primary)',
            color: ctrl.color || 'var(--color-text-primary)',
            borderRadius: ctrl.radius !== undefined ? ctrl.radius : 'var(--border-radius-md)',
            fontSize: ctrl.fontSize || 12,
            border: '0.5px solid var(--color-border-secondary)',
            borderLeft: '2.5px solid #4f46e5',
            padding: '0 10px',
            outline: 'none'
          }}
        />
      )
    }
    return (
      <div style={{
        ...base,
        background: ctrl.bg || 'var(--color-background-primary)',
        color: ctrl.color || 'var(--color-text-primary)',
        borderRadius: ctrl.radius !== undefined ? ctrl.radius : 'var(--border-radius-md)',
        fontSize: ctrl.fontSize || 12,
        border: '0.5px solid var(--color-border-secondary)',
        borderLeft: '2.5px solid #4f46e5',
        display: 'flex',
        alignItems: 'center',
        padding: '0 10px'
      }}>
        <span style={{ color: 'var(--color-text-tertiary)', fontSize: 12 }}>{ctrl.placeholder || ''}</span>
      </div>
    )
  }

  if (ctrl.type === 'Button') {
    const handleClick = () => {
      if (isPreview && ctrl.macroSteps && onMacroRun) {
        onMacroRun(ctrl.macroSteps)
      }
      onClick?.()
    }

    return (
      <button
        onClick={handleClick}
        style={{
          ...base,
          background: ctrl.bg || '#4f46e5',
          color: ctrl.color || '#ffffff',
          borderRadius: ctrl.radius !== undefined ? ctrl.radius : 'var(--border-radius-md)',
          fontSize: ctrl.fontSize || 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 500,
          cursor: isPreview ? 'pointer' : 'default',
          border: 'none',
        }}
      >
        {ctrl.caption || 'Button'}
      </button>
    )
  }

  if (ctrl.type === 'ComboBox') {
    const displayValue = boundValue !== null ? String(boundValue) : ''

    if (isPreview) {
      let options: any[] = []
      if (ctrl.rowSourceType === 'valuelist' && ctrl.rowSource) {
        options = ctrl.rowSource.split(',').map((v: string) => v.trim())
      }

      return (
        <select
          defaultValue={displayValue}
          style={{
            ...base,
            background: ctrl.bg || 'var(--color-background-primary)',
            color: ctrl.color || 'var(--color-text-primary)',
            border: '0.5px solid var(--color-border-secondary)',
            borderLeft: '2.5px solid #4f46e5',
            borderRadius: 'var(--border-radius-md)',
            padding: '0 10px'
          }}
        >
          <option value="">{ctrl.placeholder || 'Select...'}</option>
          {options.map((opt, idx) => (
            <option key={idx} value={opt}>{opt}</option>
          ))}
        </select>
      )
    }

    return (
      <div style={{
        ...base,
        background: ctrl.bg || 'var(--color-background-primary)',
        color: ctrl.color || 'var(--color-text-primary)',
        border: '0.5px solid var(--color-border-secondary)',
        borderLeft: '2.5px solid #4f46e5',
        borderRadius: 'var(--border-radius-md)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 10px',
        justifyContent: 'space-between'
      }}>
        <span style={{ color: 'var(--color-text-tertiary)', fontSize: 12 }}>{ctrl.placeholder || ''}</span>
        <div style={{ background: 'var(--color-background-secondary)', padding: '2px 6px', marginRight: -10, height: '100%', display: 'flex', alignItems: 'center', borderLeft: '0.5px solid var(--color-border-tertiary)' }}>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 10 }}>▾</span>
        </div>
      </div>
    )
  }

  if (ctrl.type === 'CheckBox') {
    const isChecked = boundValue === true || boundValue === 1 || boundValue === 'Yes'
    return (
      <div style={{ ...base, background: 'transparent', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 16,
          height: 16,
          border: '0.5px solid var(--color-border-secondary)',
          borderRadius: 3,
          background: isChecked ? '#4f46e5' : 'var(--color-background-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {isChecked && <span style={{ color: '#ffffff', fontSize: 12, fontWeight: 600 }}>✓</span>}
        </div>
        <span style={{
          color: ctrl.color || 'var(--color-text-primary)',
          fontSize: ctrl.fontSize || 12
        }}>{ctrl.caption || 'CheckBox'}</span>
      </div>
    )
  }

  if (ctrl.type === 'DatePicker') {
    const displayValue = boundValue ? new Date(boundValue).toLocaleDateString() : ''
    return (
      <div style={{
        ...base,
        background: ctrl.bg || 'var(--color-background-primary)',
        color: ctrl.color || 'var(--color-text-primary)',
        border: '0.5px solid var(--color-border-secondary)',
        borderLeft: '2.5px solid #4f46e5',
        borderRadius: 'var(--border-radius-md)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 10px',
        gap: 6
      }}>
        <span style={{ fontSize: 13 }}>📅</span>
        <span style={{ color: displayValue ? (ctrl.color || 'var(--color-text-primary)') : 'var(--color-text-tertiary)', fontSize: 12, flex: 1 }}>{displayValue || 'DD/MM/YYYY'}</span>
      </div>
    )
  }

  if (ctrl.type === 'NumberBox') {
    const displayValue = boundValue !== null ? String(boundValue) : '0'
    return (
      <div style={{
        ...base,
        background: ctrl.bg || 'var(--color-background-primary)',
        color: ctrl.color || 'var(--color-text-primary)',
        border: '0.5px solid var(--color-border-secondary)',
        borderLeft: '2.5px solid #4f46e5',
        borderRadius: 'var(--border-radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 10px'
      }}>
        <span style={{ color: ctrl.color || 'var(--color-text-primary)', fontSize: 12, textAlign: 'right', flex: 1 }}>{displayValue}</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginLeft: 4 }}>
          <div style={{ width: 12, height: 10, background: 'var(--color-background-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, borderRadius: 2 }}>▲</div>
          <div style={{ width: 12, height: 10, background: 'var(--color-background-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, borderRadius: 2 }}>▼</div>
        </div>
      </div>
    )
  }

  if (ctrl.type === 'DataTable') {
    const cols = ['Col 1', 'Col 2', 'Col 3']
    return (
      <div style={{ ...base, background: '#fff', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ fontSize: 8, color: '#6366f1', padding: '2px 6px', background: '#f8faff' }}>DataTable</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', background: '#6366f1', color: '#fff', fontSize: 10, fontWeight: 600 }}>
          {cols.map((col, i) => (
            <div key={i} style={{ padding: '4px 8px', borderRight: i < cols.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none' }}>
              {col}
            </div>
          ))}
        </div>
        {[0, 1, 2].map((row) => (
          <div key={row} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', background: row % 2 === 0 ? '#fff' : '#f8faff', fontSize: 10, borderBottom: '1px solid #e2e8f0' }}>
            {cols.map((_, i) => (
              <div key={i} style={{ padding: '4px 8px', borderRight: i < cols.length - 1 ? '1px solid #e2e8f0' : 'none', color: '#9ca3af' }}>
                ---
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (ctrl.type === 'Chart') {
    const bars = [65, 85, 45, 75, 55]
    const colors = ['#6366f1', '#818cf8', '#a5b4fc', '#4338ca', '#4f46e5']
    return (
      <div style={{ ...base, background: '#fff', border: '1px solid #e2e8f0', padding: 16, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#1f2937', marginBottom: 12 }}>{ctrl.caption || 'Chart'}</div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 8, justifyContent: 'space-around' }}>
          {bars.map((h, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: '100%', background: colors[i], height: `${h}%`, borderRadius: '4px 4px 0 0', minHeight: 4 }} />
              <div style={{ fontSize: 8, color: '#9ca3af' }}>L{i + 1}</div>
            </div>
          ))}
        </div>
        <div style={{ height: 1, background: '#e2e8f0', marginTop: 4 }} />
      </div>
    )
  }

  if (ctrl.type === 'Modal') {
    return (
      <div style={{ ...base, background: 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.15)', width: '80%', maxHeight: '80%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ background: '#6366f1', color: '#fff', padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, fontWeight: 600 }}>
            <span>{ctrl.caption || 'Modal Title'}</span>
            <span style={{ cursor: 'pointer', fontSize: 16 }}>✕</span>
          </div>
          <div style={{ flex: 1, padding: 16, fontSize: 11, color: '#9ca3af' }}>Content here</div>
          <div style={{ padding: '8px 16px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 8, justifyContent: 'flex-end', fontSize: 11 }}>
            <div style={{ padding: '4px 12px', background: '#e5e7eb', borderRadius: 4, cursor: 'pointer' }}>Cancel</div>
            <div style={{ padding: '4px 12px', background: '#6366f1', color: '#fff', borderRadius: 4, cursor: 'pointer' }}>OK</div>
          </div>
        </div>
      </div>
    )
  }

  if (ctrl.type === 'TabPanel') {
    return (
      <div style={{ ...base, background: '#fff', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', background: '#f9fafb' }}>
          {['Tab 1', 'Tab 2', 'Tab 3'].map((tab, i) => (
            <div
              key={i}
              style={{
                padding: '8px 16px',
                fontSize: 11,
                fontWeight: 500,
                borderBottom: i === 0 ? '2px solid #6366f1' : 'none',
                color: i === 0 ? '#1f2937' : '#9ca3af',
                cursor: 'pointer',
                marginBottom: i === 0 ? -2 : 0,
              }}
            >
              {tab}
            </div>
          ))}
        </div>
        <div style={{ flex: 1, padding: 16, fontSize: 11, color: '#9ca3af' }}>Tab content</div>
      </div>
    )
  }

  if (ctrl.type === 'ProgressBar') {
    const percent = ctrl.value || 65
    return (
      <div style={{ ...base, background: 'transparent', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px' }}>
        <div style={{ flex: 1, height: 20, background: '#e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ width: `${percent}%`, height: '100%', background: '#6366f1', transition: 'width 0.3s' }} />
        </div>
        <span style={{ fontSize: 11, color: ctrl.color || '#1f2937', fontWeight: 600, minWidth: 35 }}>{percent}%</span>
      </div>
    )
  }

  if (ctrl.type === 'Badge') {
    return (
      <div style={{ ...base, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 12px' }}>
        <div style={{
          background: ctrl.bg || '#d1fae5',
          color: ctrl.color || '#065f46',
          padding: '4px 12px',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11
        }}>
          <div style={{ width: 6, height: 6, background: ctrl.color || '#065f46', borderRadius: '50%' }} />
          <span>{ctrl.caption || 'Badge'}</span>
        </div>
      </div>
    )
  }

  if (ctrl.type === 'Card') {
    return (
      <div style={{
        ...base,
        background: ctrl.bg || '#ffffff',
        color: ctrl.color || '#0f172a',
        border: '1px solid #e2e8f0',
        borderRadius: ctrl.radius !== undefined ? ctrl.radius : 12,
        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '12px 16px', fontSize: 11, textTransform: 'uppercase', color: ctrl.color || '#0f172a', letterSpacing: '0.05em', fontWeight: 600 }}>
          {ctrl.caption || 'Card Title'}
        </div>
        <div style={{ height: 1, background: '#e2e8f0' }} />
        <div style={{ flex: 1, padding: 16, fontSize: 11, color: '#9ca3af' }}>Content area</div>
      </div>
    )
  }

  if (ctrl.type === 'NavigationButtons') {
    return (
      <div style={{ ...base, background: '#f3f4f6', border: '1px solid #d1d5db', display: 'flex', overflow: 'hidden', borderRadius: 4 }}>
        {['|<', '<', '[1]', '>', '>|', '+'].map((btn, i) => (
          <div
            key={i}
            style={{
              flex: i === 2 ? 1 : 0.5,
              padding: '4px 8px',
              fontSize: 10,
              color: '#4b5563',
              borderRight: i < 5 ? '1px solid #d1d5db' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              background: i === 2 ? '#fff' : 'transparent',
            }}
          >
            {btn}
          </div>
        ))}
      </div>
    )
  }

  if (ctrl.type === 'StatusBar') {
    return (
      <div style={{ ...base, background: '#f3f4f6', border: '1px solid #d1d5db', borderTop: '2px solid #6366f1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', fontSize: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, background: '#10b981', borderRadius: '50%' }} />
          <span style={{ color: '#4b5563' }}>Ready</span>
        </div>
        <span style={{ color: '#9ca3af' }}>Record 1 of 5</span>
        <div style={{ display: 'flex', gap: 8, color: '#6b7280' }}>
          <span style={{ cursor: 'pointer' }}>‹</span>
          <span style={{ cursor: 'pointer' }}>›</span>
        </div>
      </div>
    )
  }

  if (ctrl.type === 'SectionHeader') {
    return (
      <div style={{ ...base, background: '#f9fafb', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#1f2937' }}>{ctrl.caption || 'Section'}</span>
        <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
      </div>
    )
  }

  if (ctrl.type === 'Subform') {
    return (
      <div style={{ ...base, background: '#fafbfc', border: '2px dashed #d1d5db', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 4 }}>
        <div style={{ fontSize: 9, color: '#9ca3af', padding: '4px 8px', background: '#f3f4f6' }}>Subform</div>
        <div style={{ flex: 1, padding: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
            <div style={{ background: '#e5e7eb', padding: '4px 6px', fontSize: 9, color: '#6b7280', fontWeight: 600 }}>Field 1</div>
            <div style={{ background: '#e5e7eb', padding: '4px 6px', fontSize: 9, color: '#6b7280', fontWeight: 600 }}>Field 2</div>
            <div style={{ background: '#e5e7eb', padding: '4px 6px', fontSize: 9, color: '#6b7280', fontWeight: 600 }}>Field 3</div>
            {[0, 1, 2].map((row) => (
              <React.Fragment key={row}>
                <div style={{ background: '#fff', padding: '4px 6px', fontSize: 9, color: '#9ca3af', border: '1px solid #e5e7eb' }}>---</div>
                <div style={{ background: '#fff', padding: '4px 6px', fontSize: 9, color: '#9ca3af', border: '1px solid #e5e7eb' }}>---</div>
                <div style={{ background: '#fff', padding: '4px 6px', fontSize: 9, color: '#9ca3af', border: '1px solid #e5e7eb' }}>---</div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (ctrl.type === 'Divider') {
    return (
      <div style={{ ...base, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', height: 2, background: '#e2e8f0' }} />
      </div>
    )
  }

  if (ctrl.type === 'Image') {
    return (
      <div style={{ ...base, background: '#f9fafb', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 32, opacity: 0.3 }}>🖼️</span>
        <span style={{ fontSize: 10, color: '#9ca3af' }}>Image</span>
      </div>
    )
  }

  // Fallback
  return (
    <div style={{ ...base, background: '#f3f4f6', border: '1px dashed #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#9ca3af' }}>
      {ctrl.type}
    </div>
  )
}
