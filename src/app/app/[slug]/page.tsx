'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Toast, { ToastMessage } from '@/components/Toast'
import { runMacro } from '@/lib/macroEngine'
import { PopupFormOverlay } from '@/components/PopupFormOverlay'
import { NexBaseControl, getContrastText } from '@/components/NexBaseControl'

// UUID generator for toast IDs
const generateId = () => crypto.randomUUID()

export default function PublishedAppPage() {
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
  const [showPopup, setShowPopup] = useState(false)
  const [popupPageId, setPopupPageId] = useState<string | null>(null)

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

    if (!ws.published) {
      setLoading(false)
      return
    }

    const { data: pgs } = await supabase
      .from('pages')
      .select('*')
      .eq('workspace_id', ws.id)
      .order('display_order', { ascending: true })

    if (pgs && pgs.length > 0) {
      setPages(pgs)

      const regularPages = pgs.filter(p => p.form_type !== 'popup')
      if (regularPages.length > 0) {
        setActivePageId(regularPages[0].id)
      } else if (pgs.length > 0) {
        setActivePageId(pgs[0].id)
      }
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

  // FIX 21.2: Button click handler with all standard actions
  const handleButtonClick = async (ctrl: any) => {
    const action = ctrl.props?.action || ctrl.action || 'none'

    if (action === 'none') {
      showToast('This button has no action. Set Action property in designer.', 'warning')
      return
    }

    if (action === 'save') {
      await handleSaveAction()
    } else if (action === 'new') {
      handleNewAction()
    } else if (action === 'delete') {
      await handleDeleteAction()
    } else if (action === 'first') {
      if (tableData.length > 0) {
        setCurrentRecordIndex(0)
      }
    } else if (action === 'previous') {
      if (currentRecordIndex > 0) {
        setCurrentRecordIndex(currentRecordIndex - 1)
      }
    } else if (action === 'next') {
      if (currentRecordIndex < tableData.length - 1) {
        setCurrentRecordIndex(currentRecordIndex + 1)
      }
    } else if (action === 'last') {
      if (tableData.length > 0) {
        setCurrentRecordIndex(tableData.length - 1)
      }
    } else if (action === 'refresh') {
      await loadPageData(activePageId!)
      showToast('Data refreshed', 'success')
    } else if (action === 'openForm') {
      const targetFormSlug = ctrl.props?.targetForm
      if (!targetFormSlug) {
        showToast('No target form configured for this button', 'warning')
        return
      }

      const targetForm = pages.find((p: any) => p.slug === targetFormSlug)
      if (!targetForm) {
        showToast(`Form "${targetFormSlug}" not found`, 'error')
        return
      }

      setPopupPageId(targetForm.id)
      setShowPopup(true)
    }
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
          {pages.filter(page => page.form_type !== 'popup').map((page) => (
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
          {activePage?.form_type === 'popup' ? (
            // Render as modal overlay
            <div
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  const regularPages = pages.filter(p => p.form_type !== 'popup')
                  if (regularPages.length > 0) {
                    setActivePageId(regularPages[0].id)
                  }
                }
              }}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
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
                }}
              >
                {/* Close button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    const regularPages = pages.filter(p => p.form_type !== 'popup')
                    if (regularPages.length > 0) {
                      setActivePageId(regularPages[0].id)
                    } else if (pages.length > 0) {
                      setActivePageId(pages[0].id)
                    }
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
                  ×
                </button>

                {/* Form content */}
                <div style={{ position: 'relative', minHeight: 400 }}>
                  {controls.map((ctrl) => (
                    <div key={ctrl.id} style={{ position: 'absolute', left: ctrl.x, top: ctrl.y }}>
                      <NexBaseControl
                        ctrl={ctrl}
                        formData={formData}
                        setFormData={setFormData}
                        handleButtonClick={handleButtonClick}
                        visibleModal={visibleModal}
                        setVisibleModal={setVisibleModal}
                      />
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
          ) : (
            // Render as normal page
            <div style={{ background: '#fff', borderRadius: 12, padding: 32, minHeight: 600, position: 'relative', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: activePage?.record_source ? 16 : 0 }}>
              {controls.map((ctrl) => (
                <div key={ctrl.id} style={{ position: 'absolute', left: ctrl.x, top: ctrl.y }}>
                  <NexBaseControl
                    ctrl={ctrl}
                    formData={formData}
                    setFormData={setFormData}
                    handleButtonClick={handleButtonClick}
                    visibleModal={visibleModal}
                    setVisibleModal={setVisibleModal}
                  />
                </div>
              ))}
              {controls.length === 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: '#9ca3af', fontSize: 14 }}>
                  No controls on this page yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showPopup && popupPageId && (
        <PopupFormOverlay
          pageId={popupPageId}
          workspace={workspace}
          pages={pages}
          onClose={() => {
            setShowPopup(false)
            setPopupPageId(null)
            if (activePageId) {
              loadPageData(activePageId)
            }
          }}
        />
      )}
    </div>
  )
}

