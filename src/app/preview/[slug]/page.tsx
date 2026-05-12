'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Toast, { ToastMessage } from '@/components/Toast'
import { runMacro } from '@/lib/macroEngine'

// UUID generator for toast IDs
const generateId = () => crypto.randomUUID()

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

export default function PreviewAppPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [workspace, setWorkspace] = useState<any>(null)
  const [pages, setPages] = useState<any[]>([])
  const [activePageId, setActivePageId] = useState<string | null>(null)
  const [controls, setControls] = useState<any[]>([])
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [visibleModal, setVisibleModal] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [tableData, setTableData] = useState<any[]>([])
  const [currentRecordIndex, setCurrentRecordIndex] = useState(0)
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null)
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null)

  useEffect(() => {
    loadWorkspace()
  }, [slug])

  useEffect(() => {
    if (activePageId) {
      loadControls(activePageId)
      loadPageData(activePageId)
    }
  }, [activePageId])

  useEffect(() => {
    // Update formData when currentRecordIndex changes
    if (tableData.length > 0 && currentRecordIndex >= 0 && currentRecordIndex < tableData.length) {
      setFormData(tableData[currentRecordIndex].data)
      setCurrentRecordId(tableData[currentRecordIndex].id)
    }
  }, [currentRecordIndex, tableData])

  const loadWorkspace = async () => {
    setLoading(true)
    const { data: ws } = await supabase.from('workspaces').select('*').eq('slug', slug).single()

    if (!ws) {
      setLoading(false)
      return
    }

    setWorkspace(ws)

    // FIX 20.5.3: Preview mode - don't check if published
    const { data: pgs } = await supabase
      .from('pages')
      .select('*')
      .eq('workspace_id', ws.id)
      .order('display_order', { ascending: true })

    if (pgs && pgs.length > 0) {
      setPages(pgs)
      setActivePageId(pgs[0].id)
    }

    setLoading(false)
  }

  const loadControls = async (pageId: string) => {
    const { data } = await supabase
      .from('controls')
      .select('*')
      .eq('page_id', pageId)
      .order('display_order', { ascending: true })

    if (data) {
      setControls(data)
    }
  }

  const loadPageData = async (pageId: string) => {
    const page = pages.find((p) => p.id === pageId)
    if (!page || !page.record_source) {
      setTableData([])
      setCurrentRecordIndex(0)
      setFormData({})
      setCurrentRecordId(null)
      return
    }

    // Load data from app_data table for this workspace and table
    const { data } = await supabase
      .from('app_data')
      .select('*')
      .eq('workspace_id', workspace.id)
      .eq('table_name', page.record_source)
      .order('created_at', { ascending: true })

    if (data && data.length > 0) {
      setTableData(data)
      setCurrentRecordIndex(0)
      setFormData(data[0].data)
      setCurrentRecordId(data[0].id)
    } else {
      setTableData([])
      setCurrentRecordIndex(0)
      setFormData({})
      setCurrentRecordId(null)
    }
  }

  const goToFirstRecord = () => {
    if (tableData.length > 0) setCurrentRecordIndex(0)
  }

  const goToPreviousRecord = () => {
    if (currentRecordIndex > 0) setCurrentRecordIndex(currentRecordIndex - 1)
  }

  const goToNextRecord = () => {
    if (currentRecordIndex < tableData.length - 1) setCurrentRecordIndex(currentRecordIndex + 1)
  }

  const goToLastRecord = () => {
    if (tableData.length > 0) setCurrentRecordIndex(tableData.length - 1)
  }

  const createNewRecord = () => {
    setFormData({})
    setCurrentRecordIndex(-1)
    setCurrentRecordId(null)
  }

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = generateId()
    setToasts((prev) => [...prev, { id, message, type }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  // FIX 20.6.2: Save action implementation
  const handleSaveAction = async () => {
    const activePage = pages.find((p) => p.id === activePageId)
    if (!activePage?.record_source) {
      showToast('No table configured for this form', 'error')
      return
    }

    if (currentRecordId) {
      // Update existing record
      const { error } = await supabase
        .from('app_data')
        .update({ data: formData })
        .eq('id', currentRecordId)

      if (error) {
        showToast('Save failed: ' + error.message, 'error')
      } else {
        setSaveFeedback('Saved!')
        setTimeout(() => setSaveFeedback(null), 2000)
        // Reload data to refresh the list
        await loadPageData(activePageId!)
      }
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from('app_data')
        .insert({
          workspace_id: workspace.id,
          table_name: activePage.record_source,
          data: formData,
        })
        .select('id')
        .single()

      if (error) {
        showToast('Save failed: ' + error.message, 'error')
      } else {
        setCurrentRecordId(data.id)
        setSaveFeedback('Saved!')
        setTimeout(() => setSaveFeedback(null), 2000)
        // Reload data to refresh the list
        await loadPageData(activePageId!)
      }
    }
  }

  // FIX 20.6.3: New action implementation
  const handleNewAction = () => {
    if (Object.keys(formData).length > 0 && !currentRecordId) {
      if (!confirm('Discard unsaved changes?')) return
    }
    setFormData({})
    setCurrentRecordId(null)
    setCurrentRecordIndex(-1)
    setSaveFeedback('New record')
    setTimeout(() => setSaveFeedback(null), 2000)
  }

  // FIX 20.6.4: Delete action implementation
  const handleDeleteAction = async () => {
    if (!currentRecordId) {
      showToast('No record loaded. Save first or load existing record.', 'warning')
      return
    }

    if (!confirm('Delete this record? This cannot be undone.')) return

    const { error } = await supabase
      .from('app_data')
      .delete()
      .eq('id', currentRecordId)

    if (error) {
      showToast('Delete failed: ' + error.message, 'error')
    } else {
      setFormData({})
      setCurrentRecordId(null)
      setCurrentRecordIndex(-1)
      setSaveFeedback('Deleted')
      setTimeout(() => setSaveFeedback(null), 2000)
      // Reload data to refresh the list
      await loadPageData(activePageId!)
    }
  }

  // FIX 20.6.1: Updated button click handler to support standard actions
  const handleButtonClick = async (ctrl: any) => {
    const action = ctrl.action

    if (action === 'save') {
      await handleSaveAction()
    } else if (action === 'new') {
      handleNewAction()
    } else if (action === 'delete') {
      await handleDeleteAction()
    } else if (ctrl.macro_steps && ctrl.macro_steps.length > 0) {
      await runMacro(ctrl.macro_steps, {
        formData,
        setFormData,
        workspaceId: workspace.id,
        showToast,
        showModal: (id) => setVisibleModal(id),
        hideModal: () => setVisibleModal(null),
      })
    }
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
          {props.caption || ctrl.caption}
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
          onClick={() => setVisibleModal(null)}
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
                onClick={() => setVisibleModal(null)}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 20 }}
              >
                ✕
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
                onClick={() => setVisibleModal(null)}
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
                onClick={() => setVisibleModal(null)}
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

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', background: '#f3f4f6' }}>
        <div style={{ width: 210, background: '#1e293b', borderRight: '1px solid #334155', padding: 20 }}>
          <div style={{ width: 60, height: 60, background: '#334155', borderRadius: 8, marginBottom: 16, animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ width: '80%', height: 20, background: '#334155', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ height: 56, background: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', padding: '0 20px' }}>
            <div style={{ width: 200, height: 24, background: '#e5e7eb', borderRadius: 4, animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
          <div style={{ padding: 32 }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, minHeight: 400 }}>
              <div style={{ width: '100%', height: 200, background: '#f3f4f6', borderRadius: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
            </div>
          </div>
        </div>
        <style jsx>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    )
  }

  if (!workspace) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f3f4f6' }}>
        <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>App Not Found</div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>The app you're looking for doesn't exist.</div>
        </div>
      </div>
    )
  }

  if (!workspace.published) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f3f4f6' }}>
        <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>{workspace.name}</div>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>
            This app is not published yet. The owner is still building it.
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af', padding: '12px 16px', background: '#f9fafb', borderRadius: 8 }}>
            App URL: /app/{workspace.slug}
          </div>
        </div>
      </div>
    )
  }

  const activePage = pages.find((p) => p.id === activePageId)
  const brandColor = workspace.brand_color || '#4f46e5'

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f3f4f6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* FIX 20.6.6: Visual feedback for save actions */}
      {saveFeedback && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          background: '#10b981',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
          zIndex: 1000,
          fontSize: 14,
          fontWeight: 500,
        }}>
          ✓ {saveFeedback}
        </div>
      )}

      {/* Sidebar */}
      <div
        style={{
          width: sidebarOpen ? 210 : 0,
          background: `linear-gradient(180deg, ${brandColor} 0%, ${brandColor}dd 100%)`,
          borderRight: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'width 0.3s',
        }}
      >
        <div style={{ padding: 20, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.2)', borderRadius: 12, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
            🚀
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{workspace.name}</div>
        </div>

        <div style={{ flex: 1, padding: '12px 0', overflow: 'auto' }}>
          {pages.map((page) => (
            <button
              key={page.id}
              onClick={() => setActivePageId(page.id)}
              style={{
                width: '100%',
                padding: '10px 20px',
                background: page.id === activePageId ? 'rgba(255,255,255,0.15)' : 'transparent',
                border: 'none',
                borderLeft: page.id === activePageId ? '3px solid #fff' : '3px solid transparent',
                color: '#fff',
                fontSize: 14,
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (page.id !== activePageId) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
              }}
              onMouseLeave={(e) => {
                if (page.id !== activePageId) e.currentTarget.style.background = 'transparent'
              }}
            >
              <span>📄</span>
              <span>{page.name}</span>
            </button>
          ))}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: 10, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
          Powered by NexBase
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* FIX 20.5.3: Preview Mode Banner */}
        <div style={{
          background: '#fef3c7',
          color: '#92400e',
          padding: '12px 24px',
          textAlign: 'center',
          borderBottom: '1px solid #fcd34d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          fontSize: 13,
          fontWeight: 500,
        }}>
          <span>👁 Preview Mode - Form behaves as users will see it</span>
          <button
            onClick={() => window.close()}
            style={{
              padding: '4px 12px',
              background: '#92400e',
              color: '#fef3c7',
              border: 'none',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Close Preview
          </button>
        </div>

        {/* Header */}
        <div style={{ height: 56, background: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280', marginRight: 16 }}
          >
            ☰
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1f2937' }}>{activePage?.name || 'Home'}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280' }}>🔔</button>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: brandColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14 }}>
              G
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24, display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, minHeight: 600, position: 'relative', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: activePage?.record_source ? 16 : 0 }}>
            {controls.map((ctrl) => (
              <div key={ctrl.id} style={{ position: 'absolute', left: ctrl.x, top: ctrl.y }}>
                {renderControl(ctrl)}
              </div>
            ))}
            {controls.length === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: '#9ca3af', fontSize: 14 }}>
                No controls on this page yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
