'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NexBaseControl } from '@/components/NexBaseControl'

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
  const popupWidth = popupPage?.width || 800
  const popupHeight = popupPage?.height || 600
  const popupAutoCenter = popupPage?.auto_center !== false

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
    // Other actions (new/delete/next/prev/openForm/refresh/etc.)
    // are no-ops inside a popup — they only make sense on the
    // main published form, not in a modal.
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
        alignItems: popupAutoCenter ? 'center' : 'flex-start',
        justifyContent: popupAutoCenter ? 'center' : 'flex-start',
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
          width: popupWidth,
          height: popupHeight,
          maxWidth: '95vw',
          maxHeight: '95vh',
          overflowY: 'auto',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
          position: 'relative',
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
            <NexBaseControl
              ctrl={ctrl}
              formData={formData}
              setFormData={setFormData}
              handleButtonClick={handleButtonClick}
            />
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
