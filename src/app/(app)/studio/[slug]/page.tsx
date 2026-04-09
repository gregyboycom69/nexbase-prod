'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import NavPane from '@/components/studio/NavPane'
import CtrlRender from '@/components/controls/CtrlRender'

type Tab = {
  id: string
  type: 'table' | 'query' | 'form' | 'macro'
  objectId: string
  name: string
  view: 'data' | 'design' | 'form'
}

type Control = {
  id: string
  page_id: string
  type: string
  x: number
  y: number
  w: number
  h: number
  section: 'header' | 'detail' | 'footer'
  props: any
}

const CONTROL_TYPES = [
  // BASIC
  { name: 'Select', icon: '↖', group: 'BASIC' },
  { name: 'Label', icon: 'Aa', group: 'BASIC' },
  { name: 'Heading', icon: 'H', group: 'BASIC' },
  { name: 'TextBox', icon: '⬜', group: 'BASIC' },
  { name: 'Button', icon: '⬡', group: 'BASIC' },
  // INPUTS
  { name: 'ComboBox', icon: '▾', group: 'INPUTS' },
  { name: 'CheckBox', icon: '☑', group: 'INPUTS' },
  { name: 'DatePicker', icon: '📅', group: 'INPUTS' },
  { name: 'NumberBox', icon: '#', group: 'INPUTS' },
  { name: 'Lookup', icon: '🔍', group: 'INPUTS' },
  // DATA
  { name: 'DataTable', icon: '⊞', group: 'DATA' },
  { name: 'Chart', icon: '📊', group: 'DATA' },
  { name: 'Subform', icon: '▭▭', group: 'DATA' },
  // LAYOUT
  { name: 'Card', icon: '▭', group: 'LAYOUT' },
  { name: 'TabPanel', icon: '⬜⬜', group: 'LAYOUT' },
  { name: 'Modal', icon: '💬', group: 'LAYOUT' },
  { name: 'Divider', icon: '—', group: 'LAYOUT' },
  { name: 'ProgressBar', icon: '▬', group: 'LAYOUT' },
  { name: 'NavigationButtons', icon: '◀▶', group: 'LAYOUT' },
  { name: 'Badge', icon: '◉', group: 'LAYOUT' },
  { name: 'Image', icon: '🖼', group: 'LAYOUT' },
  { name: 'StatusBar', icon: '▬', group: 'LAYOUT' },
]

export default function StudioPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const supabase = createClient()

  const [workspace, setWorkspace] = useState<any>(null)
  const [tables, setTables] = useState<any[]>([])
  const [queries, setQueries] = useState<any[]>([])
  const [forms, setForms] = useState<any[]>([])
  const [macros, setMacros] = useState<any[]>([])
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<'all' | 'tables' | 'queries' | 'forms' | 'macros'>('all')

  useEffect(() => {
    loadWorkspace()
  }, [slug])

  async function loadWorkspace() {
    const { data: ws } = await supabase
      .from('workspaces')
      .select('*')
      .eq('slug', slug)
      .single()

    if (!ws) {
      router.push('/dashboard')
      return
    }

    setWorkspace(ws)
    loadAllObjects(ws.id)
  }

  async function loadAllObjects(workspaceId: string) {
    const { data: tablesData } = await supabase
      .from('workspace_tables')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('name')
    setTables(tablesData || [])

    const { data: queriesData } = await supabase
      .from('workspace_queries')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('name')
    setQueries(queriesData || [])

    const { data: formsData } = await supabase
      .from('pages')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('slug')
    setForms(formsData || [])

    const { data: macrosData } = await supabase
      .from('workspace_macros')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('name')
    setMacros(macrosData || [])
  }

  function handleOpenObject(type: string, id: string, name: string) {
    const baseType = type.replace('-design', '')
    const view = type.includes('-design') ? 'design' : (baseType === 'form' ? 'form' : 'data')

    const existingTab = tabs.find(t => t.objectId === id && t.type === baseType as any)
    if (existingTab) {
      setActiveTabId(existingTab.id)
      return
    }

    const newTab: Tab = {
      id: `tab-${Date.now()}`,
      type: baseType as any,
      objectId: id,
      name,
      view,
    }

    setTabs([...tabs, newTab])
    setActiveTabId(newTab.id)
  }

  function handleCloseTab(tabId: string) {
    const newTabs = tabs.filter(t => t.id !== tabId)
    setTabs(newTabs)

    if (activeTabId === tabId) {
      setActiveTabId(newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null)
    }
  }

  async function handleNewObject(type: string) {
    if (type === 'table') {
      router.push(`/studio/${slug}/tables`)
    } else if (type === 'form') {
      const name = prompt('Enter form name:')
      if (!name || !workspace) return

      const formSlug = name.toLowerCase().replace(/\s+/g, '-')
      const { data, error } = await supabase
        .from('pages')
        .insert({
          workspace_id: workspace.id,
          slug: formSlug,
          title: name,
          name: name,
          published: false,
        })
        .select()
        .single()

      if (!error && data) {
        loadAllObjects(workspace.id)
        handleOpenObject('form-design', data.id, data.name || data.title || data.slug)
      }
    } else if (type === 'query') {
      router.push(`/studio/${slug}/queries`)
    } else if (type === 'macro') {
      const name = prompt('Enter macro name:')
      if (!name || !workspace) return

      const { data, error } = await supabase
        .from('workspace_macros')
        .insert({
          workspace_id: workspace.id,
          name,
          steps: []
        })
        .select()
        .single()

      if (!error && data) {
        loadAllObjects(workspace.id)
      }
    }
  }

  async function handleDeleteObject(type: string, id: string) {
    if (type === 'table') {
      await supabase.from('workspace_tables').delete().eq('id', id)
    } else if (type === 'query') {
      await supabase.from('workspace_queries').delete().eq('id', id)
    } else if (type === 'form') {
      await supabase.from('pages').delete().eq('id', id)
    } else if (type === 'macro') {
      await supabase.from('workspace_macros').delete().eq('id', id)
    }

    loadAllObjects(workspace?.id)

    const newTabs = tabs.filter(t => t.objectId !== id)
    setTabs(newTabs)
  }

  const activeTab = tabs.find(t => t.id === activeTabId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f1117', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Top Bar */}
      <div style={{ height: 56, background: '#1a1d2e', borderBottom: '1px solid #252840', display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => router.push(`/workspace/${slug}`)}
            style={{ background: 'none', border: 'none', color: '#8890b8', fontSize: 20, cursor: 'pointer', padding: 0 }}
          >
            ←
          </button>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#6366f1' }}>
            {workspace?.name || slug}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          {(['all', 'tables', 'queries', 'forms', 'macros'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              style={{
                padding: '8px 16px',
                background: activeFilter === filter ? '#6366f1' : 'transparent',
                color: activeFilter === filter ? '#fff' : '#8890b8',
                border: 'none',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {filter}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 12, color: '#8890b8' }}>
          Studio
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <NavPane
          tables={tables}
          queries={queries}
          forms={forms}
          macros={macros}
          activeFilter={activeFilter}
          onOpenObject={handleOpenObject}
          onNewObject={handleNewObject}
          onDeleteObject={handleDeleteObject}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0f1117' }}>
          {tabs.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 24 }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#c8d0f0' }}>
                Welcome to {workspace?.name}
              </div>
              <div style={{ fontSize: 14, color: '#8890b8', marginBottom: 16 }}>
                Get started:
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <button
                  onClick={() => handleNewObject('table')}
                  style={{ padding: '12px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                  📊 Create a Table
                </button>
                <button
                  onClick={() => handleNewObject('form')}
                  style={{ padding: '12px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                  📄 Create a Form
                </button>
                <button
                  onClick={() => handleNewObject('query')}
                  style={{ padding: '12px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                  🔍 Create a Query
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', background: '#1a1d2e', borderBottom: '1px solid #252840', padding: '0 8px', gap: 4 }}>
                {tabs.map((tab) => (
                  <div
                    key={tab.id}
                    onClick={() => setActiveTabId(tab.id)}
                    style={{
                      padding: '10px 16px',
                      background: activeTabId === tab.id ? '#252840' : 'transparent',
                      color: activeTabId === tab.id ? '#c8d0f0' : '#8890b8',
                      borderRadius: '4px 4px 0 0',
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      maxWidth: 200,
                    }}
                  >
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tab.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCloseTab(tab.id)
                      }}
                      style={{ background: 'none', border: 'none', color: '#8890b8', fontSize: 14, cursor: 'pointer', padding: 0, lineHeight: 1 }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ flex: 1, overflow: 'hidden' }}>
                {activeTab && activeTab.type === 'form' && (
                  <FormDesigner
                    pageId={activeTab.objectId}
                    pageName={activeTab.name}
                    workspace={workspace}
                    tables={tables}
                    queries={queries}
                    macros={macros}
                    forms={forms}
                  />
                )}
                {activeTab && activeTab.type !== 'form' && (
                  <div style={{ padding: 40, color: '#8890b8', textAlign: 'center' }}>
                    {activeTab.type} - {activeTab.name}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Form Designer Component
function FormDesigner({ pageId, pageName, workspace, tables, queries, macros, forms }: any) {
  type ViewType = 'design' | 'form' | 'datasheet'
  const supabase = createClient()
  const [view, setView] = useState<ViewType>('design')
  const [controls, setControls] = useState<Control[]>([])
  const [selectedControlId, setSelectedControlId] = useState<string | null>(null)
  const [activeTool, setActiveTool] = useState<string>('Select')
  const [propertyTab, setPropertyTab] = useState<'format' | 'data' | 'event' | 'other' | 'all'>('format')
  const [showFieldList, setShowFieldList] = useState(false)
  const [formProps, setFormProps] = useState<any>({})
  const [recordSourceFields, setRecordSourceFields] = useState<any[]>([])
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')

  const canvasRef = useRef<HTMLDivElement>(null)
  const isDrawing = useRef(false)
  const drawStart = useRef({ x: 0, y: 0 })
  const [ghostRect, setGhostRect] = useState<any>(null)
  const [currentSection, setCurrentSection] = useState<'header' | 'detail' | 'footer'>('detail')

  useEffect(() => {
    loadFormData()
  }, [pageId])

  useEffect(() => {
    if (formProps.recordSource) {
      const table = tables.find((t: any) => t.name === formProps.recordSource)
      if (table) {
        setRecordSourceFields(table.fields || [])
      }
    }
  }, [formProps.recordSource, tables])

  async function loadFormData() {
    const { data: page } = await supabase.from('pages').select('*').eq('id', pageId).single()
    if (page) {
      setFormProps({
        recordSource: page.record_source,
        allowEdits: page.allow_edits ?? true,
        allowAdditions: page.allow_additions ?? true,
        allowDeletions: page.allow_deletions ?? true,
        navigationButtons: page.navigation_buttons ?? true,
      })
    }

    const { data: controlsData } = await supabase
      .from('controls')
      .select('*')
      .eq('page_id', pageId)
      .order('created_at')

    setControls(controlsData || [])
  }

  async function saveControl(control: Control) {
    setSaveStatus('saving')
    await supabase.from('controls').upsert({
      id: control.id,
      page_id: pageId,
      type: control.type,
      x: control.x,
      y: control.y,
      w: control.w,
      h: control.h,
      section: control.section,
      props: control.props,
    })
    setSaveStatus('saved')
  }

  async function saveFormProps(props: any) {
    await supabase.from('pages').update({
      record_source: props.recordSource,
      allow_edits: props.allowEdits,
      allow_additions: props.allowAdditions,
      allow_deletions: props.allowDeletions,
      navigation_buttons: props.navigationButtons,
    }).eq('id', pageId)
  }

  function handleCanvasMouseDown(e: React.MouseEvent, section: 'header' | 'detail' | 'footer') {
    if (activeTool === 'Select') return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    isDrawing.current = true
    drawStart.current = { x, y }
    setCurrentSection(section)
    setGhostRect({ x, y, w: 0, h: 0, section })
  }

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!isDrawing.current || !canvasRef.current) return

      const rect = canvasRef.current.getBoundingClientRect()
      const x = Math.min(drawStart.current.x, e.clientX - rect.left)
      const y = Math.min(drawStart.current.y, e.clientY - rect.top)
      const w = Math.abs(e.clientX - rect.left - drawStart.current.x)
      const h = Math.abs(e.clientY - rect.top - drawStart.current.y)

      setGhostRect({ x, y, w, h, section: currentSection })
    }

    function handleMouseUp(e: MouseEvent) {
      if (!isDrawing.current) return

      if (ghostRect && ghostRect.w > 10 && ghostRect.h > 10) {
        const newControl: Control = {
          id: `ctrl-${Date.now()}`,
          page_id: pageId,
          type: activeTool,
          x: ghostRect.x,
          y: ghostRect.y,
          w: ghostRect.w,
          h: ghostRect.h,
          section: currentSection,
          props: getDefaultProps(activeTool),
        }

        setControls([...controls, newControl])
        saveControl(newControl)
      }

      isDrawing.current = false
      setGhostRect(null)
      setActiveTool('Select')
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [activeTool, currentSection, ghostRect, controls])

  function getDefaultProps(type: string) {
    const defaults: any = {
      Label: { caption: 'Label', color: '#1f2937', fontSize: 14 },
      Heading: { caption: 'Heading', color: '#1f2937', fontSize: 24, fontWeight: 'bold' },
      TextBox: { placeholder: 'Type here...', color: '#1f2937', bg: '#fff', fontSize: 14 },
      Button: { caption: 'Button', bg: '#6366f1', color: '#fff', fontSize: 14 },
      ComboBox: { placeholder: 'Select...', color: '#1f2937', bg: '#fff', fontSize: 14 },
      CheckBox: { caption: 'Checkbox', checked: false },
      DatePicker: { placeholder: 'DD/MM/YYYY', bg: '#fff' },
      NumberBox: { value: 0, min: 0, max: 100, step: 1 },
      DataTable: { caption: 'Table', columns: '' },
      Chart: { caption: 'Chart Title', chartType: 'bar' },
      Subform: { sourceObject: '', linkMasterFields: '', linkChildFields: '' },
      Card: { caption: 'Card Title' },
      TabPanel: { tabs: 'Tab 1,Tab 2,Tab 3' },
      Modal: { caption: 'Modal Title' },
      Badge: { caption: 'Badge', bg: '#6366f1', color: '#fff' },
      Image: { src: '', alt: 'Image' },
      ProgressBar: { value: 65, max: 100 },
      NavigationButtons: {},
      StatusBar: { text: 'Ready' },
      Divider: {},
      Lookup: { placeholder: 'Search...', rowSource: '' },
    }
    return defaults[type] || {}
  }

  function updateControlProp(controlId: string, propName: string, value: any) {
    const control = controls.find(c => c.id === controlId)
    if (!control) return

    const updated = {
      ...control,
      props: { ...control.props, [propName]: value }
    }

    setControls(controls.map(c => c.id === controlId ? updated : c))
    saveControl(updated)
  }

  function updateControlGeometry(controlId: string, updates: Partial<Control>) {
    const control = controls.find(c => c.id === controlId)
    if (!control) return

    const updated = { ...control, ...updates }
    setControls(controls.map(c => c.id === controlId ? updated : c))
    saveControl(updated)
  }

  function deleteControl() {
    if (!selectedControlId) return
    if (!confirm('Delete this control?')) return

    supabase.from('controls').delete().eq('id', selectedControlId)
    setControls(controls.filter(c => c.id !== selectedControlId))
    setSelectedControlId(null)
  }

  const selectedControl = controls.find(c => c.id === selectedControlId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#13141f' }}>
      {/* Toolbar */}
      <div style={{ background: '#1a1d2e', borderBottom: '1px solid #252840', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => setView('design')}
          style={{ padding: '6px 12px', background: view === 'design' ? '#6366f1' : '#252840', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}
        >
          Design View
        </button>
        <button
          onClick={() => setView('form')}
          style={{ padding: '6px 12px', background: view === 'form' ? '#6366f1' : '#252840', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}
        >
          Form View
        </button>
        <button
          onClick={() => setView('datasheet')}
          style={{ padding: '6px 12px', background: view === 'datasheet' ? '#6366f1' : '#252840', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}
        >
          Datasheet
        </button>
        <button
          onClick={() => setShowFieldList(!showFieldList)}
          style={{ padding: '6px 12px', background: showFieldList ? '#6366f1' : '#252840', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}
        >
          Field List
        </button>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 10, color: saveStatus === 'saving' ? '#fbbf24' : '#10b981' }}>
          {saveStatus === 'saving' ? 'Saving...' : 'Saved ✓'}
        </div>
      </div>

      {view === 'form' ? (
        <FormView controls={controls} formProps={formProps} pageId={pageId} workspace={workspace} />
      ) : (
        <div style={{ flex: 1, display: 'flex', background: '#13141f' }}>
          {/* Toolbox */}
          <div style={{ width: 72, background: '#1e2035', borderRight: '1px solid #252840', padding: '8px 4px', overflow: 'auto' }}>
            {['BASIC', 'INPUTS', 'DATA', 'LAYOUT'].map((group) => (
          <div key={group}>
            <div style={{ fontSize: 9, color: '#8890b8', marginTop: group !== 'BASIC' ? 12 : 0, marginBottom: 4, textAlign: 'center', fontWeight: 700 }}>
              {group}
            </div>
            {CONTROL_TYPES.filter(ct => ct.group === group).map((ct) => (
              <div
                key={ct.name}
                onClick={() => setActiveTool(ct.name)}
                style={{
                  padding: '8px 4px',
                  background: activeTool === ct.name ? '#6366f1' : '#252840',
                  border: activeTool === ct.name ? '2px solid #818cf8' : '1px solid transparent',
                  borderRadius: 4,
                  marginBottom: 4,
                  fontSize: 9,
                  color: '#c8d0f0',
                  textAlign: 'center',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <div style={{ fontSize: 16 }}>{ct.icon}</div>
                <div>{ct.name}</div>
              </div>
            ))}
          </div>
        ))}
      </div>

          {/* Canvas */}
          <div ref={canvasRef} style={{ flex: 1, overflow: 'auto', background: '#fff', cursor: activeTool !== 'Select' ? 'crosshair' : 'default' }}>
            {/* Form Header */}
        <div style={{ background: '#e5e7eb', borderBottom: '1px solid #d1d5db', padding: '4px 8px', fontSize: 10, color: '#6b7280', fontWeight: 600 }}>
          ▼ Form Header
        </div>
        <div
          style={{ minHeight: 60, position: 'relative', background: '#f0f4ff' }}
          onMouseDown={(e) => handleCanvasMouseDown(e, 'header')}
        >
          {controls.filter(c => c.section === 'header').map((ctrl) => (
            <ControlWrapper
              key={ctrl.id}
              control={ctrl}
              selected={selectedControlId === ctrl.id}
              onSelect={() => setSelectedControlId(ctrl.id)}
              onUpdate={(updates: any) => updateControlGeometry(ctrl.id, updates)}
            />
          ))}
          {ghostRect && ghostRect.section === 'header' && (
            <div
              style={{
                position: 'absolute',
                left: ghostRect.x,
                top: ghostRect.y,
                width: ghostRect.w,
                height: ghostRect.h,
                border: '2px dashed #6366f1',
                background: 'rgba(99, 102, 241, 0.1)',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>

        {/* Detail */}
        <div style={{ background: '#e5e7eb', borderBottom: '1px solid #d1d5db', padding: '4px 8px', fontSize: 10, color: '#6b7280', fontWeight: 600 }}>
          ▼ Detail
        </div>
        <div
          style={{
            minHeight: 400,
            position: 'relative',
            background: '#fff',
            backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
            backgroundSize: '8px 8px'
          }}
          onMouseDown={(e) => handleCanvasMouseDown(e, 'detail')}
        >
          {controls.filter(c => c.section === 'detail').map((ctrl) => (
            <ControlWrapper
              key={ctrl.id}
              control={ctrl}
              selected={selectedControlId === ctrl.id}
              onSelect={() => setSelectedControlId(ctrl.id)}
              onUpdate={(updates: any) => updateControlGeometry(ctrl.id, updates)}
            />
          ))}
          {ghostRect && ghostRect.section === 'detail' && (
            <div
              style={{
                position: 'absolute',
                left: ghostRect.x,
                top: ghostRect.y,
                width: ghostRect.w,
                height: ghostRect.h,
                border: '2px dashed #6366f1',
                background: 'rgba(99, 102, 241, 0.1)',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>

        {/* Form Footer */}
        <div style={{ background: '#e5e7eb', borderBottom: '1px solid #d1d5db', padding: '4px 8px', fontSize: 10, color: '#6b7280', fontWeight: 600 }}>
          ▼ Form Footer
        </div>
        <div
          style={{ minHeight: 60, position: 'relative', background: '#f0f4ff' }}
          onMouseDown={(e) => handleCanvasMouseDown(e, 'footer')}
        >
          {controls.filter(c => c.section === 'footer').map((ctrl) => (
            <ControlWrapper
              key={ctrl.id}
              control={ctrl}
              selected={selectedControlId === ctrl.id}
              onSelect={() => setSelectedControlId(ctrl.id)}
              onUpdate={(updates: any) => updateControlGeometry(ctrl.id, updates)}
            />
          ))}
          {ghostRect && ghostRect.section === 'footer' && (
            <div
              style={{
                position: 'absolute',
                left: ghostRect.x,
                top: ghostRect.y,
                width: ghostRect.w,
                height: ghostRect.h,
                border: '2px dashed #6366f1',
                background: 'rgba(99, 102, 241, 0.1)',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>

        {/* Field List Panel */}
        {showFieldList && (
          <div style={{
            position: 'absolute',
            top: 60,
            right: 260,
            width: 180,
            background: '#1a1d2e',
            border: '1px solid #252840',
            borderRadius: 4,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 100,
          }}>
            <div style={{ padding: '8px 12px', background: '#252840', color: '#c8d0f0', fontSize: 12, fontWeight: 700, borderBottom: '1px solid #1a1d2e' }}>
              Field List
            </div>
            <div style={{ padding: 8 }}>
              {formProps.recordSource ? (
                <div>
                  <div style={{ fontSize: 11, color: '#8890b8', marginBottom: 8 }}>{formProps.recordSource}</div>
                  {recordSourceFields.map((field: any) => (
                    <div
                      key={field.name}
                      style={{ padding: '4px 8px', fontSize: 11, color: '#c8d0f0', cursor: 'pointer', borderRadius: 4 }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#252840'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      📝 {field.name}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 12, fontSize: 11, color: '#8890b8', textAlign: 'center' }}>
                  Set Record Source in the Data tab first
                </div>
              )}
            </div>
          </div>
        )}
      </div>

          {/* Property Sheet */}
          <PropertySheet
            selectedControl={selectedControl}
            formProps={formProps}
            propertyTab={propertyTab}
            setPropertyTab={setPropertyTab}
            tables={tables}
            queries={queries}
            macros={macros}
            recordSourceFields={recordSourceFields}
            onUpdateControlProp={updateControlProp}
            onUpdateFormProp={(prop: string, value: any) => {
              const updated = { ...formProps, [prop]: value }
              setFormProps(updated)
              saveFormProps(updated)
            }}
            onDelete={deleteControl}
          />
        </div>
      )}
    </div>
  )
}

// Control Wrapper with drag/resize
function ControlWrapper({ control, selected, onSelect, onUpdate }: any) {
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, ctrlX: 0, ctrlY: 0 })

  function handleMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return
    e.stopPropagation()
    onSelect()

    setIsDragging(true)
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      ctrlX: control.x,
      ctrlY: control.y,
    }
  }

  useEffect(() => {
    if (!isDragging) return

    function handleMove(e: MouseEvent) {
      const dx = e.clientX - dragStart.current.x
      const dy = e.clientY - dragStart.current.y

      onUpdate({
        x: dragStart.current.ctrlX + dx,
        y: dragStart.current.ctrlY + dy,
      })
    }

    function handleUp() {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)

    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [isDragging])

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        left: control.x,
        top: control.y,
        width: control.w,
        height: control.h,
        border: selected ? '2px solid #6366f1' : '1px solid transparent',
        cursor: 'move',
        boxSizing: 'border-box',
      }}
    >
      <CtrlRender ctrl={{ ...control, ...control.props }} />
      {selected && (
        <>
          {/* Resize handles */}
          {[
            { cursor: 'nw-resize', top: -4, left: -4 },
            { cursor: 'n-resize', top: -4, left: '50%', transform: 'translateX(-50%)' },
            { cursor: 'ne-resize', top: -4, right: -4 },
            { cursor: 'e-resize', top: '50%', right: -4, transform: 'translateY(-50%)' },
            { cursor: 'se-resize', bottom: -4, right: -4 },
            { cursor: 's-resize', bottom: -4, left: '50%', transform: 'translateX(-50%)' },
            { cursor: 'sw-resize', bottom: -4, left: -4 },
            { cursor: 'w-resize', top: '50%', left: -4, transform: 'translateY(-50%)' },
          ].map((handle, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: 8,
                height: 8,
                background: '#6366f1',
                border: '1px solid #fff',
                ...handle,
              }}
              onMouseDown={(e) => e.stopPropagation()}
            />
          ))}
        </>
      )}
    </div>
  )
}

// Property Sheet Component
function PropertySheet({ selectedControl, formProps, propertyTab, setPropertyTab, tables, queries, macros, recordSourceFields, onUpdateControlProp, onUpdateFormProp, onDelete }: any) {
  const tabs = ['format', 'data', 'event', 'other', 'all'] as const

  return (
    <div style={{ width: 240, background: '#1a1d2e', borderLeft: '1px solid #252840', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#252840', padding: '8px 12px', borderBottom: '1px solid #1a1d2e' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>Property Sheet</div>
        <div style={{ fontSize: 11, color: '#8890b8' }}>
          Selection: {selectedControl ? selectedControl.type : 'Form'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 2, padding: '8px 8px', background: '#252840', borderBottom: '1px solid #1a1d2e', flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setPropertyTab(tab)}
            style={{
              padding: '4px 8px',
              background: propertyTab === tab ? '#6366f1' : '#1a1d2e',
              color: propertyTab === tab ? '#fff' : '#7480a8',
              border: 'none',
              borderRadius: 4,
              fontSize: 10,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
        {selectedControl ? (
          <ControlProperties
            control={selectedControl}
            tab={propertyTab}
            tables={tables}
            queries={queries}
            macros={macros}
            recordSourceFields={recordSourceFields}
            onUpdate={onUpdateControlProp}
            onDelete={onDelete}
          />
        ) : (
          <FormProperties
            formProps={formProps}
            tab={propertyTab}
            tables={tables}
            queries={queries}
            macros={macros}
            onUpdate={onUpdateFormProp}
          />
        )}
      </div>
    </div>
  )
}

// Control Properties
function ControlProperties({ control, tab, tables, queries, macros, recordSourceFields, onUpdate, onDelete }: any) {
  const props = control.props || {}

  function PropRow({ label, value, onChange, type = 'text', options = [] }: any) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', borderBottom: '1px solid #252840', padding: '3px 8px', height: 24, alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: '#8890b8', fontFamily: "'JetBrains Mono', monospace" }}>{label}</span>
        {type === 'select' ? (
          <select value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', background: '#0f1117', color: '#c8d0f0', border: 'none', fontSize: 10, padding: '2px 4px' }}>
            {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ) : type === 'color' ? (
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', height: 18, background: '#0f1117', border: 'none' }} />
        ) : type === 'number' ? (
          <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: '100%', background: '#0f1117', color: '#c8d0f0', border: 'none', fontSize: 10, padding: '2px 4px' }} />
        ) : (
          <input type="text" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', background: '#0f1117', color: '#c8d0f0', border: 'none', fontSize: 10, padding: '2px 4px' }} />
        )}
      </div>
    )
  }

  if (tab === 'format' || tab === 'all') {
    return (
      <>
        <div style={{ background: '#252840', color: '#6366f1', fontSize: 9, textTransform: 'uppercase', padding: '3px 8px', fontWeight: 700 }}>POSITION</div>
        <PropRow label="Width" value={control.w} onChange={(v: number) => onUpdate(control.id, 'w', v)} type="number" />
        <PropRow label="Height" value={control.h} onChange={(v: number) => onUpdate(control.id, 'h', v)} type="number" />
        <PropRow label="Left" value={control.x} onChange={(v: number) => onUpdate(control.id, 'x', v)} type="number" />
        <PropRow label="Top" value={control.y} onChange={(v: number) => onUpdate(control.id, 'y', v)} type="number" />

        <div style={{ background: '#252840', color: '#6366f1', fontSize: 9, textTransform: 'uppercase', padding: '3px 8px', fontWeight: 700, marginTop: 8 }}>APPEARANCE</div>
        {control.type !== 'Divider' && <PropRow label="Caption" value={props.caption || ''} onChange={(v: string) => onUpdate(control.id, 'caption', v)} />}
        {['TextBox', 'Button', 'ComboBox', 'DatePicker'].includes(control.type) && (
          <>
            <PropRow label="Back Color" value={props.bg || '#fff'} onChange={(v: string) => onUpdate(control.id, 'bg', v)} type="color" />
            <PropRow label="Fore Color" value={props.color || '#000'} onChange={(v: string) => onUpdate(control.id, 'color', v)} type="color" />
          </>
        )}
        {['Label', 'Heading', 'TextBox', 'Button', 'ComboBox'].includes(control.type) && (
          <PropRow label="Font Size" value={props.fontSize || 14} onChange={(v: number) => onUpdate(control.id, 'fontSize', v)} type="number" />
        )}

        <div style={{ padding: 8, marginTop: 8 }}>
          <button onClick={onDelete} style={{ width: '100%', padding: '6px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, fontSize: 10, cursor: 'pointer' }}>
            Delete Control
          </button>
        </div>
      </>
    )
  }

  if (tab === 'data') {
    return (
      <>
        <div style={{ background: '#252840', color: '#6366f1', fontSize: 9, textTransform: 'uppercase', padding: '3px 8px', fontWeight: 700 }}>DATA</div>
        {['TextBox', 'ComboBox', 'CheckBox', 'DatePicker', 'NumberBox'].includes(control.type) && (
          <PropRow
            label="Control Source"
            value={props.controlSource || ''}
            onChange={(v: string) => onUpdate(control.id, 'controlSource', v)}
            type="select"
            options={['', ...recordSourceFields.map((f: any) => f.name)]}
          />
        )}
        {control.type === 'TextBox' && <PropRow label="Default Value" value={props.defaultValue || ''} onChange={(v: string) => onUpdate(control.id, 'defaultValue', v)} />}
      </>
    )
  }

  return (
    <div style={{ padding: 12, fontSize: 11, color: '#8890b8', textAlign: 'center' }}>
      {tab} properties for {control.type}
    </div>
  )
}

// Form Properties
function FormProperties({ formProps, tab, tables, queries, macros, onUpdate }: any) {
  function PropRow({ label, value, onChange, type = 'text', options = [] }: any) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', borderBottom: '1px solid #252840', padding: '3px 8px', height: 24, alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: '#8890b8', fontFamily: "'JetBrains Mono', monospace" }}>{label}</span>
        {type === 'select' ? (
          <select value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', background: '#0f1117', color: '#c8d0f0', border: 'none', fontSize: 10, padding: '2px 4px' }}>
            {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ) : type === 'yesno' ? (
          <select value={value ? 'Yes' : 'No'} onChange={(e) => onChange(e.target.value === 'Yes')} style={{ width: '100%', background: '#0f1117', color: '#c8d0f0', border: 'none', fontSize: 10, padding: '2px 4px' }}>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        ) : (
          <input type="text" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', background: '#0f1117', color: '#c8d0f0', border: 'none', fontSize: 10, padding: '2px 4px' }} />
        )}
      </div>
    )
  }

  if (tab === 'data' || tab === 'all') {
    return (
      <>
        <div style={{ background: '#252840', color: '#6366f1', fontSize: 9, textTransform: 'uppercase', padding: '3px 8px', fontWeight: 700 }}>DATA</div>
        <PropRow
          label="Record Source"
          value={formProps.recordSource || ''}
          onChange={(v: string) => onUpdate('recordSource', v)}
          type="select"
          options={['', ...tables.map((t: any) => t.name), ...queries.map((q: any) => q.name)]}
        />
        <PropRow label="Allow Edits" value={formProps.allowEdits} onChange={(v: boolean) => onUpdate('allowEdits', v)} type="yesno" />
        <PropRow label="Allow Additions" value={formProps.allowAdditions} onChange={(v: boolean) => onUpdate('allowAdditions', v)} type="yesno" />
        <PropRow label="Allow Deletions" value={formProps.allowDeletions} onChange={(v: boolean) => onUpdate('allowDeletions', v)} type="yesno" />
      </>
    )
  }

  return (
    <div style={{ padding: 12, fontSize: 11, color: '#8890b8', textAlign: 'center' }}>
      {tab} properties
    </div>
  )
}

// Form View Component
function FormView({ controls, formProps, pageId, workspace }: any) {
  return (
    <div style={{ padding: 40, background: '#f3f4f6', minHeight: '100%' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', background: '#fff', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: 40 }}>
        {controls.filter((c: Control) => c.section === 'header').map((ctrl: Control) => (
          <div key={ctrl.id} style={{ position: 'relative', marginBottom: 16 }}>
            <CtrlRender ctrl={{ ...ctrl, ...ctrl.props }} isPreview={true} />
          </div>
        ))}

        {controls.filter((c: Control) => c.section === 'detail').map((ctrl: Control) => (
          <div key={ctrl.id} style={{ position: 'relative', marginBottom: 16 }}>
            <CtrlRender ctrl={{ ...ctrl, ...ctrl.props }} isPreview={true} />
          </div>
        ))}

        {controls.filter((c: Control) => c.section === 'footer').map((ctrl: Control) => (
          <div key={ctrl.id} style={{ position: 'relative', marginTop: 24 }}>
            <CtrlRender ctrl={{ ...ctrl, ...ctrl.props }} isPreview={true} />
          </div>
        ))}
      </div>
    </div>
  )
}
