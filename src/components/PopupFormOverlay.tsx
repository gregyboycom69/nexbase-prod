'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

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
    const { data: page } = await supabase
      .from('pages')
      .select('*')
      .eq('id', pageId)
      .single()

    if (page) {
      // Controls are stored as JSONB array on the page itself
      setControls(page.controls || [])
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

  const renderControl = (ctrl: any) => {
    const props = ctrl.props || {}
    const controlSource = props.controlSource || ctrl.fieldKey

    if (ctrl.type === 'Label') {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: props.fontSize || 13,
          fontWeight: props.bold ? 700 : 400,
          fontStyle: props.italic ? 'italic' : 'normal',
          color: props.color || '#374151'
        }}>
          {props.caption || 'Label'}
        </div>
      )
    }

    if (ctrl.type === 'TextBox') {
      return (
        <input
          type="text"
          placeholder={props.placeholder}
          value={formData[controlSource] || ''}
          onChange={(e) => handleInputChange(controlSource, e.target.value)}
          style={{
            width: ctrl.w,
            height: ctrl.h,
            padding: '0 12px',
            border: '1.5px solid #e2e8f0',
            borderRadius: 6,
            fontSize: props.fontSize || 14,
            outline: 'none'
          }}
        />
      )
    }

    if (ctrl.type === 'Button') {
      const isSaveButton = props.action === 'save'
      return (
        <button
          onClick={isSaveButton ? handleSave : undefined}
          style={{
            width: ctrl.w,
            height: ctrl.h,
            background: props.bg || '#4f46e5',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: props.fontSize || 14,
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          {props.caption || 'Button'}
        </button>
      )
    }

    return <div style={{ fontSize: 11, color: '#9ca3af' }}>{ctrl.type}</div>
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
