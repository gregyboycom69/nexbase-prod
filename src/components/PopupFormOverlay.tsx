'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// FIX 19.11.3: Auto-calculate contrast text color for buttons
function getContrastText(bgHex: string | undefined): string {
  if (!bgHex || bgHex === 'transparent') return '#1e293b';

  const c = bgHex.replace('#', '');
  if (c.length !== 6) return '#ffffff';

  const r = parseInt(c.substr(0, 2), 16);
  const g = parseInt(c.substr(2, 2), 16);
  const b = parseInt(c.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 155 ? '#1e293b' : '#ffffff';
}

interface PopupFormOverlayProps {
  pageId: string
  workspace: any
  pages: any[]
  onClose: () => void
}

export function PopupFormOverlay({ pageId, workspace, pages, onClose }: PopupFormOverlayProps) {
  const supabase = createClient()
  const [controls, setControls] = useState<any[]>([])
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  const popupPage = pages.find((p: any) => p.id === pageId)

  useEffect(() => {
    loadPopupControls()
  }, [pageId])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const loadPopupControls = async () => {
    const { data } = await supabase
      .from('controls')
      .select('*')
      .eq('page_id', pageId)
      .order('display_order', { ascending: true })
    if (data) {
      setControls(data)
    }
    setLoading(false)
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleSave = async () => {
    if (!popupPage?.record_source) return

    const { error } = await supabase
      .from('app_data')
      .insert({
        workspace_id: workspace.id,
        table_name: popupPage.record_source,
        data: formData,
      })

    if (error) {
      alert('Save failed: ' + error.message)
    } else {
      onClose()
    }
  }

  const handleButtonClick = async (ctrl: any) => {
    const action = ctrl.props?.action || ctrl.action
    if (action === 'save') {
      await handleSave()
    } else if (action === 'close' || action === 'cancel') {
      onClose()
    }
    // All other actions (new/delete/next/prev/openForm/etc.)
    // are no-ops inside a popup — those only make sense on the
    // main form.
  }

  const renderControl = (ctrl: any) => {
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

  if (loading) return null

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: 12,
          padding: 32,
          maxWidth: 600,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
          position: 'relative',
          minHeight: 400,
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#f1f5f9'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'transparent',
            border: 'none',
            fontSize: 24,
            cursor: 'pointer',
            color: '#64748b',
            lineHeight: 1,
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            borderRadius: 4,
          }}
          aria-label="Close"
        >
          {'\u00D7'}
        </button>

        {controls.map((ctrl) => (
          <div key={ctrl.id} style={{ position: 'absolute', left: ctrl.x, top: ctrl.y }}>
            {renderControl(ctrl)}
          </div>
        ))}
        {controls.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: '#9ca3af', fontSize: 14 }}>
            No controls on this form
          </div>
        )}
      </div>
    </div>
  )
}
