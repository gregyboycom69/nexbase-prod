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

// Default control sizes (ISSUE 1)
const DEFAULT_SIZES: Record<string, { w: number; h: number }> = {
  Label: { w: 120, h: 20 },
  Heading: { w: 200, h: 32 },
  TextBox: { w: 200, h: 24 },
  Button: { w: 100, h: 28 },
  ComboBox: { w: 180, h: 24 },
  CheckBox: { w: 150, h: 20 },
  DatePicker: { w: 160, h: 24 },
  NumberBox: { w: 100, h: 24 },
  Lookup: { w: 180, h: 24 },
  DataTable: { w: 400, h: 160 },
  Chart: { w: 300, h: 160 },
  Subform: { w: 380, h: 140 },
  Card: { w: 220, h: 100 },
  TabPanel: { w: 340, h: 180 },
  Modal: { w: 280, h: 180 },
  Divider: { w: 300, h: 2 },
  ProgressBar: { w: 200, h: 16 },
  NavigationButtons: { w: 240, h: 28 },
  Badge: { w: 80, h: 22 },
  Image: { w: 120, h: 80 },
  StatusBar: { w: 400, h: 20 },
}

const CONTROL_TYPES = [
  { name: 'Select', icon: '↖', group: 'BASIC' },
  { name: 'Label', icon: 'Aa', group: 'BASIC' },
  { name: 'Heading', icon: 'H', group: 'BASIC' },
  { name: 'TextBox', icon: '⬜', group: 'BASIC' },
  { name: 'Button', icon: '⬡', group: 'BASIC' },
  { name: 'ComboBox', icon: '▾', group: 'INPUTS' },
  { name: 'CheckBox', icon: '☑', group: 'INPUTS' },
  { name: 'DatePicker', icon: '📅', group: 'INPUTS' },
  { name: 'NumberBox', icon: '#', group: 'INPUTS' },
  { name: 'Lookup', icon: '🔍', group: 'INPUTS' },
  { name: 'DataTable', icon: '⊞', group: 'DATA' },
  { name: 'Chart', icon: '📊', group: 'DATA' },
  { name: 'Subform', icon: '▭▭', group: 'DATA' },
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
    const { data: ws } = await supabase.from('workspaces').select('*').eq('slug', slug).single()
    if (!ws) {
      router.push('/dashboard')
      return
    }
    setWorkspace(ws)
    loadAllObjects(ws.id)
  }

  async function loadAllObjects(workspaceId: string) {
    const { data: tablesData } = await supabase.from('workspace_tables').select('*').eq('workspace_id', workspaceId).order('name')
    setTables(tablesData || [])

    const { data: queriesData } = await supabase.from('workspace_queries').select('*').eq('workspace_id', workspaceId).order('name')
    setQueries(queriesData || [])

    const { data: formsData } = await supabase.from('pages').select('*').eq('workspace_id', workspaceId).order('slug')
    setForms(formsData || [])

    const { data: macrosData } = await supabase.from('workspace_macros').select('*').eq('workspace_id', workspaceId).order('name')
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
      // ISSUE 5: Form creation dialog
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
          form_type: 'regular',
          default_view: 'single',
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

      const { data, error } = await supabase.from('workspace_macros').insert({
        workspace_id: workspace.id,
        name,
        steps: []
      }).select().single()

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

        <div style={{ fontSize: 12, color: '#8890b8' }}>Studio</div>
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
              <div style={{ fontSize: 32, fontWeight: 700, color: '#c8d0f0' }}>Welcome to {workspace?.name}</div>
              <div style={{ fontSize: 14, color: '#8890b8', marginBottom: 16 }}>Get started:</div>
              <div style={{ display: 'flex', gap: 16 }}>
                <button onClick={() => handleNewObject('table')} style={{ padding: '12px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  📊 Create a Table
                </button>
                <button onClick={() => handleNewObject('form')} style={{ padding: '12px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  📄 Create a Form
                </button>
                <button onClick={() => handleNewObject('query')} style={{ padding: '12px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
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
                    onReload={() => loadAllObjects(workspace.id)}
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

// Form Designer Component (with all fixes)
function FormDesigner({ pageId, pageName, workspace, tables, queries, macros, forms, onReload }: any) {
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
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; controlId: string } | null>(null)

  // Form View state (ISSUE 4)
  const [formData, setFormData] = useState<any>({})
  const [records, setRecords] = useState<any[]>([])
  const [currentRecordIndex, setCurrentRecordIndex] = useState(0)

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

  // ISSUE 6: Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (view !== 'design') return

      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        // Save is automatic
      } else if (e.key === 'Delete' && selectedControlId) {
        e.preventDefault()
        deleteControl()
      } else if (e.key === 'Escape') {
        setSelectedControlId(null)
      } else if (e.ctrlKey && e.key === 'd' && selectedControlId) {
        e.preventDefault()
        duplicateControl()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [view, selectedControlId, controls])

  async function loadFormData() {
    const { data: page } = await supabase.from('pages').select('*').eq('id', pageId).single()
    if (page) {
      setFormProps({
        recordSource: page.record_source,
        allowEdits: page.allow_edits ?? true,
        allowAdditions: page.allow_additions ?? true,
        allowDeletions: page.allow_deletions ?? true,
        navigationButtons: page.navigation_buttons ?? true,
        defaultView: page.default_view || 'single',
        formType: page.form_type || 'regular',
      })
    }

    const { data: controlsData } = await supabase.from('controls').select('*').eq('page_id', pageId).order('created_at')
    setControls(controlsData || [])
  }

  async function loadRecords() {
    if (!formProps.recordSource || !workspace) return

    const table = tables.find((t: any) => t.name === formProps.recordSource)
    if (!table) return

    const { data } = await supabase
      .from('app_data')
      .select('*')
      .eq('workspace_id', workspace.id)
      .eq('table_name', table.slug)
      .order('created_at')

    setRecords(data || [])
    if (data && data.length > 0) {
      setFormData(data[0].data)
      setCurrentRecordIndex(0)
    }
  }

  useEffect(() => {
    if (view === 'form') {
      loadRecords()
    }
  }, [view, formProps.recordSource])

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
    setTimeout(() => setSaveStatus('saved'), 500)
  }

  async function saveFormProps(props: any) {
    await supabase.from('pages').update({
      record_source: props.recordSource,
      allow_edits: props.allowEdits,
      allow_additions: props.allowAdditions,
      allow_deletions: props.allowDeletions,
      navigation_buttons: props.navigationButtons,
      default_view: props.defaultView,
      form_type: props.formType,
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
      if (!isDrawing.current) return

      const x = Math.min(drawStart.current.x, e.clientX - (canvasRef.current?.getBoundingClientRect().left || 0))
      const y = Math.min(drawStart.current.y, e.clientY - (canvasRef.current?.getBoundingClientRect().top || 0))
      const w = Math.abs(e.clientX - (canvasRef.current?.getBoundingClientRect().left || 0) - drawStart.current.x)
      const h = Math.abs(e.clientY - (canvasRef.current?.getBoundingClientRect().top || 0) - drawStart.current.y)

      setGhostRect({ x, y, w, h, section: currentSection })
    }

    function handleMouseUp() {
      if (!isDrawing.current) return

      if (ghostRect && ghostRect.w > 10 && ghostRect.h > 10) {
        const defaultSize = DEFAULT_SIZES[activeTool] || { w: 100, h: 30 }

        // Use drawn size if larger than default, otherwise use default (ISSUE 1)
        const finalW = Math.max(ghostRect.w, defaultSize.w)
        const finalH = Math.max(ghostRect.h, defaultSize.h)

        const newControl: Control = {
          id: `ctrl-${Date.now()}`,
          page_id: pageId,
          type: activeTool,
          x: ghostRect.x,
          y: ghostRect.y,
          w: finalW,
          h: finalH,
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
      ComboBox: { placeholder: 'Select...', color: '#1f2937', bg: '#fff', fontSize: 14, options: '' },
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

    // Enforce minimum size (ISSUE 1)
    const updated = {
      ...control,
      ...updates,
      w: updates.w !== undefined ? Math.max(20, updates.w) : control.w,
      h: updates.h !== undefined ? Math.max(16, updates.h) : control.h,
    }

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

  function duplicateControl() {
    if (!selectedControlId) return

    const control = controls.find(c => c.id === selectedControlId)
    if (!control) return

    const newControl: Control = {
      ...control,
      id: `ctrl-${Date.now()}`,
      x: control.x + 20,
      y: control.y + 20,
    }

    setControls([...controls, newControl])
    saveControl(newControl)
    setSelectedControlId(newControl.id)
  }

  // ISSUE 6: Auto-generate form from table
  function autoGenerateForm() {
    if (!formProps.recordSource) {
      alert('Please set a Record Source first')
      return
    }

    const table = tables.find((t: any) => t.name === formProps.recordSource)
    if (!table || !table.fields) return

    const newControls: Control[] = []
    let yPos = 20

    table.fields.filter((f: any) => f.name !== 'id').forEach((field: any, index: number) => {
      // Label
      newControls.push({
        id: `ctrl-label-${Date.now()}-${index}`,
        page_id: pageId,
        type: 'Label',
        x: 20,
        y: yPos,
        w: 120,
        h: 20,
        section: 'detail',
        props: { caption: field.caption || field.name, color: '#1f2937', fontSize: 12 },
      })

      // Input control based on field type
      let controlType = 'TextBox'
      let controlProps: any = { controlSource: field.name, color: '#1f2937', bg: '#fff', fontSize: 14 }

      if (['Number', 'Currency'].includes(field.type)) {
        controlType = 'NumberBox'
      } else if (field.type === 'Date/Time') {
        controlType = 'DatePicker'
      } else if (field.type === 'Yes/No') {
        controlType = 'CheckBox'
        controlProps.caption = field.caption || field.name
      } else if (field.type === 'Choice') {
        controlType = 'ComboBox'
        controlProps.options = field.options || ''
      }

      const defaultSize = DEFAULT_SIZES[controlType] || { w: 200, h: 24 }

      newControls.push({
        id: `ctrl-input-${Date.now()}-${index}`,
        page_id: pageId,
        type: controlType,
        x: 150,
        y: yPos,
        w: defaultSize.w,
        h: defaultSize.h,
        section: 'detail',
        props: controlProps,
      })

      yPos += 36
    })

    // Save button
    newControls.push({
      id: `ctrl-save-${Date.now()}`,
      page_id: pageId,
      type: 'Button',
      x: 150,
      y: yPos + 10,
      w: 100,
      h: 28,
      section: 'detail',
      props: { caption: 'Save', bg: '#10b981', color: '#fff', fontSize: 14 },
    })

    // New button
    newControls.push({
      id: `ctrl-new-${Date.now()}`,
      page_id: pageId,
      type: 'Button',
      x: 260,
      y: yPos + 10,
      w: 100,
      h: 28,
      section: 'detail',
      props: { caption: 'New', bg: '#6366f1', color: '#fff', fontSize: 14 },
    })

    // Navigation buttons in footer
    if (formProps.navigationButtons) {
      newControls.push({
        id: `ctrl-nav-${Date.now()}`,
        page_id: pageId,
        type: 'NavigationButtons',
        x: 20,
        y: 10,
        w: 240,
        h: 28,
        section: 'footer',
        props: {},
      })
    }

    setControls([...controls, ...newControls])
    newControls.forEach(ctrl => saveControl(ctrl))
  }

  const selectedControl = controls.find(c => c.id === selectedControlId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#13141f' }}>
      {/* Toolbar */}
      <div style={{ background: '#1a1d2e', borderBottom: '1px solid #252840', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => setView('design')} style={{ padding: '6px 12px', background: view === 'design' ? '#6366f1' : '#252840', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}>
          Design View
        </button>
        <button onClick={() => setView('form')} style={{ padding: '6px 12px', background: view === 'form' ? '#6366f1' : '#252840', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}>
          Form View
        </button>
        <button onClick={() => setView('datasheet')} style={{ padding: '6px 12px', background: view === 'datasheet' ? '#6366f1' : '#252840', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}>
          Datasheet
        </button>
        <button onClick={() => setShowFieldList(!showFieldList)} style={{ padding: '6px 12px', background: showFieldList ? '#6366f1' : '#252840', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}>
          Field List
        </button>
        {formProps.recordSource && (
          <button onClick={autoGenerateForm} style={{ padding: '6px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}>
            + Add All Fields
          </button>
        )}
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 10, color: saveStatus === 'saving' ? '#fbbf24' : '#10b981' }}>
          {saveStatus === 'saving' ? 'Saving...' : 'Saved ✓'}
        </div>
      </div>

      {view === 'form' ? (
        <FormView
          controls={controls}
          formProps={formProps}
          formData={formData}
          setFormData={setFormData}
          records={records}
          currentRecordIndex={currentRecordIndex}
          setCurrentRecordIndex={setCurrentRecordIndex}
          workspace={workspace}
          tables={tables}
          pageId={pageId}
        />
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
          <div ref={canvasRef} style={{ flex: 1, overflow: 'auto', background: '#fff', cursor: activeTool !== 'Select' ? 'crosshair' : 'default' }} onClick={() => setContextMenu(null)}>
            {/* Form Header */}
            <div style={{ background: '#e5e7eb', borderBottom: '1px solid #d1d5db', padding: '4px 8px', fontSize: 10, color: '#6b7280', fontWeight: 600 }}>
              ▼ Form Header (60px)
            </div>
            <div style={{ minHeight: 60, position: 'relative', background: '#f0f4ff' }} onMouseDown={(e) => handleCanvasMouseDown(e, 'header')}>
              {controls.filter(c => c.section === 'header').map((ctrl) => (
                <ControlWrapper
                  key={ctrl.id}
                  control={ctrl}
                  selected={selectedControlId === ctrl.id}
                  onSelect={() => setSelectedControlId(ctrl.id)}
                  onUpdate={(updates: any) => updateControlGeometry(ctrl.id, updates)}
                  onContextMenu={(e: React.MouseEvent) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setContextMenu({ x: e.clientX, y: e.clientY, controlId: ctrl.id })
                    setSelectedControlId(ctrl.id)
                  }}
                />
              ))}
              {ghostRect && ghostRect.section === 'header' && (
                <div style={{ position: 'absolute', left: ghostRect.x, top: ghostRect.y, width: ghostRect.w, height: ghostRect.h, border: '2px dashed #6366f1', background: 'rgba(99, 102, 241, 0.1)', pointerEvents: 'none' }} />
              )}
            </div>

            {/* Detail */}
            <div style={{ background: '#e5e7eb', borderBottom: '1px solid #d1d5db', padding: '4px 8px', fontSize: 10, color: '#6b7280', fontWeight: 600 }}>
              ▼ Detail (400px)
            </div>
            <div style={{ minHeight: 400, position: 'relative', background: '#fff', backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)', backgroundSize: '8px 8px' }} onMouseDown={(e) => handleCanvasMouseDown(e, 'detail')}>
              {controls.filter(c => c.section === 'detail').map((ctrl) => (
                <ControlWrapper
                  key={ctrl.id}
                  control={ctrl}
                  selected={selectedControlId === ctrl.id}
                  onSelect={() => setSelectedControlId(ctrl.id)}
                  onUpdate={(updates: any) => updateControlGeometry(ctrl.id, updates)}
                  onContextMenu={(e: React.MouseEvent) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setContextMenu({ x: e.clientX, y: e.clientY, controlId: ctrl.id })
                    setSelectedControlId(ctrl.id)
                  }}
                />
              ))}
              {ghostRect && ghostRect.section === 'detail' && (
                <div style={{ position: 'absolute', left: ghostRect.x, top: ghostRect.y, width: ghostRect.w, height: ghostRect.h, border: '2px dashed #6366f1', background: 'rgba(99, 102, 241, 0.1)', pointerEvents: 'none' }} />
              )}
            </div>

            {/* Form Footer */}
            <div style={{ background: '#e5e7eb', borderBottom: '1px solid #d1d5db', padding: '4px 8px', fontSize: 10, color: '#6b7280', fontWeight: 600 }}>
              ▼ Form Footer (60px)
            </div>
            <div style={{ minHeight: 60, position: 'relative', background: '#f0f4ff' }} onMouseDown={(e) => handleCanvasMouseDown(e, 'footer')}>
              {controls.filter(c => c.section === 'footer').map((ctrl) => (
                <ControlWrapper
                  key={ctrl.id}
                  control={ctrl}
                  selected={selectedControlId === ctrl.id}
                  onSelect={() => setSelectedControlId(ctrl.id)}
                  onUpdate={(updates: any) => updateControlGeometry(ctrl.id, updates)}
                  onContextMenu={(e: React.MouseEvent) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setContextMenu({ x: e.clientX, y: e.clientY, controlId: ctrl.id })
                    setSelectedControlId(ctrl.id)
                  }}
                />
              ))}
              {ghostRect && ghostRect.section === 'footer' && (
                <div style={{ position: 'absolute', left: ghostRect.x, top: ghostRect.y, width: ghostRect.w, height: ghostRect.h, border: '2px dashed #6366f1', background: 'rgba(99, 102, 241, 0.1)', pointerEvents: 'none' }} />
              )}
            </div>

            {/* Field List Panel */}
            {showFieldList && (
              <div style={{ position: 'absolute', top: 60, right: 260, width: 180, background: '#1a1d2e', border: '1px solid #252840', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 100 }}>
                <div style={{ padding: '8px 12px', background: '#252840', color: '#c8d0f0', fontSize: 12, fontWeight: 700, borderBottom: '1px solid #1a1d2e' }}>
                  Field List
                </div>
                <div style={{ padding: 8 }}>
                  {formProps.recordSource ? (
                    <div>
                      <div style={{ fontSize: 11, color: '#8890b8', marginBottom: 8 }}>{formProps.recordSource}</div>
                      {recordSourceFields.map((field: any) => (
                        <div key={field.name} style={{ padding: '4px 8px', fontSize: 11, color: '#c8d0f0', cursor: 'pointer', borderRadius: 4 }} onMouseEnter={(e) => e.currentTarget.style.background = '#252840'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
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
            onUpdateControlGeometry={updateControlGeometry}
            onUpdateFormProp={(prop: string, value: any) => {
              const updated = { ...formProps, [prop]: value }
              setFormProps(updated)
              saveFormProps(updated)
            }}
            onDelete={deleteControl}
          />

          {/* Context Menu (ISSUE 7) */}
          {contextMenu && (
            <div style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, background: '#252840', border: '1px solid #3a3f5c', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 10000, minWidth: 150 }} onClick={(e) => e.stopPropagation()}>
              <div onClick={() => { duplicateControl(); setContextMenu(null) }} style={{ padding: '8px 12px', fontSize: 11, color: '#c8d0f0', cursor: 'pointer', borderBottom: '1px solid #1a1d2e' }} onMouseEnter={(e) => e.currentTarget.style.background = '#1a1d2e'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                Duplicate
              </div>
              <div onClick={() => { deleteControl(); setContextMenu(null) }} style={{ padding: '8px 12px', fontSize: 11, color: '#ef4444', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = '#1a1d2e'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                Delete
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Control Wrapper with drag/resize (ISSUE 1 - proper resize handles)
function ControlWrapper({ control, selected, onSelect, onUpdate, onContextMenu }: any) {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState('')
  const dragStart = useRef({ x: 0, y: 0, ctrlX: 0, ctrlY: 0, ctrlW: 0, ctrlH: 0 })

  function handleMouseDown(e: React.MouseEvent, handle?: string) {
    if (e.button !== 0) return
    e.stopPropagation()
    onSelect()

    if (handle) {
      setIsResizing(true)
      setResizeHandle(handle)
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        ctrlX: control.x,
        ctrlY: control.y,
        ctrlW: control.w,
        ctrlH: control.h,
      }
    } else {
      setIsDragging(true)
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        ctrlX: control.x,
        ctrlY: control.y,
        ctrlW: control.w,
        ctrlH: control.h,
      }
    }
  }

  useEffect(() => {
    if (!isDragging && !isResizing) return

    function handleMove(e: MouseEvent) {
      const dx = e.clientX - dragStart.current.x
      const dy = e.clientY - dragStart.current.y

      if (isDragging) {
        onUpdate({ x: dragStart.current.ctrlX + dx, y: dragStart.current.ctrlY + dy })
      } else if (isResizing) {
        const updates: any = {}

        if (resizeHandle.includes('e')) {
          updates.w = Math.max(20, dragStart.current.ctrlW + dx)
        }
        if (resizeHandle.includes('w')) {
          updates.w = Math.max(20, dragStart.current.ctrlW - dx)
          updates.x = dragStart.current.ctrlX + dx
        }
        if (resizeHandle.includes('s')) {
          updates.h = Math.max(16, dragStart.current.ctrlH + dy)
        }
        if (resizeHandle.includes('n')) {
          updates.h = Math.max(16, dragStart.current.ctrlH - dy)
          updates.y = dragStart.current.ctrlY + dy
        }

        onUpdate(updates)
      }
    }

    function handleUp() {
      setIsDragging(false)
      setIsResizing(false)
      setResizeHandle('')
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)

    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [isDragging, isResizing, resizeHandle])

  return (
    <div
      onMouseDown={(e) => handleMouseDown(e)}
      onContextMenu={onContextMenu}
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
          {/* 8 Resize handles */}
          {[
            { handle: 'nw', cursor: 'nw-resize', top: -4, left: -4 },
            { handle: 'n', cursor: 'n-resize', top: -4, left: '50%', transform: 'translateX(-50%)' },
            { handle: 'ne', cursor: 'ne-resize', top: -4, right: -4 },
            { handle: 'e', cursor: 'e-resize', top: '50%', right: -4, transform: 'translateY(-50%)' },
            { handle: 'se', cursor: 'se-resize', bottom: -4, right: -4 },
            { handle: 's', cursor: 's-resize', bottom: -4, left: '50%', transform: 'translateX(-50%)' },
            { handle: 'sw', cursor: 'sw-resize', bottom: -4, left: -4 },
            { handle: 'w', cursor: 'w-resize', top: '50%', left: -4, transform: 'translateY(-50%)' },
          ].map((h, i) => (
            <div
              key={i}
              onMouseDown={(e) => handleMouseDown(e, h.handle)}
              style={{
                position: 'absolute',
                width: 8,
                height: 8,
                background: '#6366f1',
                border: '1px solid #fff',
                ...h,
              }}
            />
          ))}
        </>
      )}
    </div>
  )
}

// Property Sheet Component (ISSUE 2, 3)
function PropertySheet({ selectedControl, formProps, propertyTab, setPropertyTab, tables, queries, macros, recordSourceFields, onUpdateControlProp, onUpdateControlGeometry, onUpdateFormProp, onDelete }: any) {
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
          <button key={tab} onClick={() => setPropertyTab(tab)} style={{ padding: '4px 8px', background: propertyTab === tab ? '#6366f1' : '#1a1d2e', color: propertyTab === tab ? '#fff' : '#7480a8', border: 'none', borderRadius: 4, fontSize: 10, cursor: 'pointer', textTransform: 'capitalize' }}>
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
            onUpdateGeometry={onUpdateControlGeometry}
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

// Control Properties (ISSUE 3 - complete properties)
function ControlProperties({ control, tab, tables, queries, macros, recordSourceFields, onUpdate, onUpdateGeometry, onDelete }: any) {
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
        ) : type === 'yesno' ? (
          <select value={value ? 'Yes' : 'No'} onChange={(e) => onChange(e.target.value === 'Yes')} style={{ width: '100%', background: '#0f1117', color: '#c8d0f0', border: 'none', fontSize: 10, padding: '2px 4px' }}>
            <option>Yes</option>
            <option>No</option>
          </select>
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
        <PropRow label="Width" value={control.w} onChange={(v: number) => onUpdateGeometry(control.id, { w: v })} type="number" />
        <PropRow label="Height" value={control.h} onChange={(v: number) => onUpdateGeometry(control.id, { h: v })} type="number" />
        <PropRow label="Left" value={control.x} onChange={(v: number) => onUpdateGeometry(control.id, { x: v })} type="number" />
        <PropRow label="Top" value={control.y} onChange={(v: number) => onUpdateGeometry(control.id, { y: v })} type="number" />

        <div style={{ background: '#252840', color: '#6366f1', fontSize: 9, textTransform: 'uppercase', padding: '3px 8px', fontWeight: 700, marginTop: 8 }}>APPEARANCE</div>
        {!['Divider', 'NavigationButtons', 'StatusBar'].includes(control.type) && <PropRow label="Caption" value={props.caption || ''} onChange={(v: string) => onUpdate(control.id, 'caption', v)} />}
        {['TextBox', 'Button', 'ComboBox', 'DatePicker', 'CheckBox'].includes(control.type) && (
          <>
            <PropRow label="Back Color" value={props.bg || '#fff'} onChange={(v: string) => onUpdate(control.id, 'bg', v)} type="color" />
            <PropRow label="Fore Color" value={props.color || '#000'} onChange={(v: string) => onUpdate(control.id, 'color', v)} type="color" />
          </>
        )}
        {['Label', 'Heading', 'TextBox', 'Button', 'ComboBox'].includes(control.type) && (
          <>
            <PropRow label="Font Size" value={props.fontSize || 14} onChange={(v: number) => onUpdate(control.id, 'fontSize', v)} type="number" />
            <PropRow label="Font Bold" value={props.fontWeight === 'bold'} onChange={(v: boolean) => onUpdate(control.id, 'fontWeight', v ? 'bold' : 'normal')} type="yesno" />
          </>
        )}
        <PropRow label="Visible" value={props.visible !== false} onChange={(v: boolean) => onUpdate(control.id, 'visible', v)} type="yesno" />
        {control.type === 'Button' && <PropRow label="Border Radius" value={props.borderRadius || 4} onChange={(v: number) => onUpdate(control.id, 'borderRadius', v)} type="number" />}

        <div style={{ padding: 8, marginTop: 8 }}>
          <button onClick={onDelete} style={{ width: '100%', padding: '6px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, fontSize: 10, cursor: 'pointer' }}>
            Delete Control
          </button>
        </div>
      </>
    )
  }

  if (tab === 'data' || tab === 'all') {
    return (
      <>
        <div style={{ background: '#252840', color: '#6366f1', fontSize: 9, textTransform: 'uppercase', padding: '3px 8px', fontWeight: 700 }}>DATA</div>
        {['TextBox', 'ComboBox', 'CheckBox', 'DatePicker', 'NumberBox'].includes(control.type) && (
          <>
            <PropRow
              label="Control Source"
              value={props.controlSource || ''}
              onChange={(v: string) => onUpdate(control.id, 'controlSource', v)}
              type="select"
              options={recordSourceFields.length > 0 ? ['', ...recordSourceFields.map((f: any) => f.name)] : ['(Set Record Source on form first)']}
            />
            <PropRow label="Default Value" value={props.defaultValue || ''} onChange={(v: string) => onUpdate(control.id, 'defaultValue', v)} />
            <PropRow label="Enabled" value={props.enabled !== false} onChange={(v: boolean) => onUpdate(control.id, 'enabled', v)} type="yesno" />
            <PropRow label="Locked" value={props.locked === true} onChange={(v: boolean) => onUpdate(control.id, 'locked', v)} type="yesno" />
          </>
        )}
        {control.type === 'ComboBox' && (
          <PropRow label="Options" value={props.options || ''} onChange={(v: string) => onUpdate(control.id, 'options', v)} />
        )}
      </>
    )
  }

  if (tab === 'event' || tab === 'all') {
    return (
      <>
        <div style={{ background: '#252840', color: '#6366f1', fontSize: 9, textTransform: 'uppercase', padding: '3px 8px', fontWeight: 700 }}>EVENTS</div>
        {control.type === 'Button' && (
          <>
            <PropRow label="On Click" value={props.onClick || ''} onChange={(v: string) => onUpdate(control.id, 'onClick', v)} type="select" options={['', ...macros.map((m: any) => m.name)]} />
            <PropRow label="Before Update" value={props.beforeUpdate || ''} onChange={(v: string) => onUpdate(control.id, 'beforeUpdate', v)} type="select" options={['', ...macros.map((m: any) => m.name)]} />
            <PropRow label="After Update" value={props.afterUpdate || ''} onChange={(v: string) => onUpdate(control.id, 'afterUpdate', v)} type="select" options={['', ...macros.map((m: any) => m.name)]} />
          </>
        )}
        {['TextBox', 'ComboBox', 'CheckBox', 'DatePicker', 'NumberBox'].includes(control.type) && (
          <>
            <PropRow label="Before Update" value={props.beforeUpdate || ''} onChange={(v: string) => onUpdate(control.id, 'beforeUpdate', v)} type="select" options={['', ...macros.map((m: any) => m.name)]} />
            <PropRow label="After Update" value={props.afterUpdate || ''} onChange={(v: string) => onUpdate(control.id, 'afterUpdate', v)} type="select" options={['', ...macros.map((m: any) => m.name)]} />
          </>
        )}
      </>
    )
  }

  if (tab === 'other' || tab === 'all') {
    return (
      <>
        <div style={{ background: '#252840', color: '#6366f1', fontSize: 9, textTransform: 'uppercase', padding: '3px 8px', fontWeight: 700 }}>OTHER</div>
        <PropRow label="Name" value={props.name || control.id} onChange={(v: string) => onUpdate(control.id, 'name', v)} />
        <PropRow label="ControlTip" value={props.controlTip || ''} onChange={(v: string) => onUpdate(control.id, 'controlTip', v)} />
        <PropRow label="Tab Stop" value={props.tabStop !== false} onChange={(v: boolean) => onUpdate(control.id, 'tabStop', v)} type="yesno" />
        <PropRow label="Tab Index" value={props.tabIndex || 0} onChange={(v: number) => onUpdate(control.id, 'tabIndex', v)} type="number" />
      </>
    )
  }

  return null
}

// Form Properties (ISSUE 2 - Record Source dropdown)
function FormProperties({ formProps, tab, tables, queries, macros, onUpdate }: any) {
  function PropRow({ label, value, onChange, type = 'text', options = [] }: any) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', borderBottom: '1px solid #252840', padding: '3px 8px', height: 24, alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: '#8890b8', fontFamily: "'JetBrains Mono', monospace" }}>{label}</span>
        {type === 'select' ? (
          <select value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', background: '#0f1117', color: '#c8d0f0', border: 'none', fontSize: 10, padding: '2px 4px' }}>
            {options.map((opt: any) =>
              typeof opt === 'string' ? <option key={opt} value={opt}>{opt}</option> :
              opt.isHeader ? <option key={opt.label} disabled style={{ fontWeight: 700, color: '#6366f1' }}>{opt.label}</option> :
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            )}
          </select>
        ) : type === 'yesno' ? (
          <select value={value ? 'Yes' : 'No'} onChange={(e) => onChange(e.target.value === 'Yes')} style={{ width: '100%', background: '#0f1117', color: '#c8d0f0', border: 'none', fontSize: 10, padding: '2px 4px' }}>
            <option>Yes</option>
            <option>No</option>
          </select>
        ) : (
          <input type="text" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', background: '#0f1117', color: '#c8d0f0', border: 'none', fontSize: 10, padding: '2px 4px' }} />
        )}
      </div>
    )
  }

  if (tab === 'data' || tab === 'all') {
    // Build Record Source options with grouping (ISSUE 2)
    const recordSourceOptions = [
      { label: '', value: '' },
      { label: '--- Tables ---', isHeader: true },
      ...tables.map((t: any) => ({ label: t.name, value: t.name })),
      { label: '--- Queries ---', isHeader: true },
      ...queries.map((q: any) => ({ label: q.name, value: q.name })),
    ]

    return (
      <>
        <div style={{ background: '#252840', color: '#6366f1', fontSize: 9, textTransform: 'uppercase', padding: '3px 8px', fontWeight: 700 }}>DATA</div>
        <PropRow label="Record Source" value={formProps.recordSource || ''} onChange={(v: string) => onUpdate('recordSource', v)} type="select" options={recordSourceOptions} />
        <PropRow label="Allow Edits" value={formProps.allowEdits} onChange={(v: boolean) => onUpdate('allowEdits', v)} type="yesno" />
        <PropRow label="Allow Additions" value={formProps.allowAdditions} onChange={(v: boolean) => onUpdate('allowAdditions', v)} type="yesno" />
        <PropRow label="Allow Deletions" value={formProps.allowDeletions} onChange={(v: boolean) => onUpdate('allowDeletions', v)} type="yesno" />
      </>
    )
  }

  if (tab === 'format' || tab === 'all') {
    return (
      <>
        <div style={{ background: '#252840', color: '#6366f1', fontSize: 9, textTransform: 'uppercase', padding: '3px 8px', fontWeight: 700 }}>FORMAT</div>
        <PropRow label="Default View" value={formProps.defaultView || 'single'} onChange={(v: string) => onUpdate('defaultView', v)} type="select" options={['single', 'continuous', 'split']} />
        <PropRow label="Navigation Buttons" value={formProps.navigationButtons} onChange={(v: boolean) => onUpdate('navigationButtons', v)} type="yesno" />
      </>
    )
  }

  return (
    <div style={{ padding: 12, fontSize: 11, color: '#8890b8', textAlign: 'center' }}>
      {tab} properties
    </div>
  )
}

// Form View Component (ISSUE 4)
function FormView({ controls, formProps, formData, setFormData, records, currentRecordIndex, setCurrentRecordIndex, workspace, tables, pageId }: any) {
  const supabase = createClient()

  function handleInputChange(controlSource: string, value: any) {
    setFormData({ ...formData, [controlSource]: value })
  }

  async function handleSave() {
    if (!formProps.recordSource || !workspace) return

    const table = tables.find((t: any) => t.name === formProps.recordSource)
    if (!table) return

    const currentRecord = records[currentRecordIndex]

    if (currentRecord?.id) {
      // Update existing record
      await supabase
        .from('app_data')
        .update({ data: formData })
        .eq('id', currentRecord.id)
      alert('Record updated!')
    } else {
      // Insert new record
      await supabase
        .from('app_data')
        .insert({
          workspace_id: workspace.id,
          table_name: table.slug,
          data: formData,
        })
      alert('Record saved!')
    }
  }

  function handleNavigation(action: string) {
    if (action === 'first') setCurrentRecordIndex(0)
    else if (action === 'prev') setCurrentRecordIndex(Math.max(0, currentRecordIndex - 1))
    else if (action === 'next') setCurrentRecordIndex(Math.min(records.length - 1, currentRecordIndex + 1))
    else if (action === 'last') setCurrentRecordIndex(records.length - 1)
    else if (action === 'new') {
      setFormData({})
      setCurrentRecordIndex(-1)
    }

    if (action !== 'new' && records[currentRecordIndex]) {
      setFormData(records[currentRecordIndex].data)
    }
  }

  return (
    <div style={{ flex: 1, background: '#f3f4f6', overflow: 'auto', padding: 40 }}>
      <div style={{ maxWidth: 800, margin: '0 auto', background: '#fff', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: 40 }}>
        {/* Header controls */}
        {controls.filter((c: Control) => c.section === 'header').map((ctrl: Control) => (
          <div key={ctrl.id} style={{ marginBottom: 16 }}>
            <RenderLiveControl ctrl={ctrl} formData={formData} onChange={handleInputChange} onSave={handleSave} />
          </div>
        ))}

        {/* Detail controls */}
        {controls.filter((c: Control) => c.section === 'detail').map((ctrl: Control) => (
          <div key={ctrl.id} style={{ marginBottom: 16 }}>
            <RenderLiveControl ctrl={ctrl} formData={formData} onChange={handleInputChange} onSave={handleSave} />
          </div>
        ))}

        {/* Footer controls */}
        {controls.filter((c: Control) => c.section === 'footer').map((ctrl: Control) => (
          <div key={ctrl.id} style={{ marginTop: 24 }}>
            <RenderLiveControl ctrl={ctrl} formData={formData} onChange={handleInputChange} onSave={handleSave} />
          </div>
        ))}

        {/* Navigation Bar (ISSUE 4) */}
        {formProps.recordSource && formProps.navigationButtons && (
          <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <button onClick={() => handleNavigation('first')} style={{ padding: '6px 12px', background: '#252840', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>|◀</button>
            <button onClick={() => handleNavigation('prev')} style={{ padding: '6px 12px', background: '#252840', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>◀</button>
            <span style={{ fontSize: 12, color: '#6b7280' }}>Record {currentRecordIndex + 1} of {records.length}</span>
            <button onClick={() => handleNavigation('next')} style={{ padding: '6px 12px', background: '#252840', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>▶</button>
            <button onClick={() => handleNavigation('last')} style={{ padding: '6px 12px', background: '#252840', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>▶|</button>
            <button onClick={() => handleNavigation('new')} style={{ padding: '6px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', marginLeft: 8 }}>+ New</button>
          </div>
        )}
      </div>
    </div>
  )
}

// Live Control Renderer (ISSUE 4)
function RenderLiveControl({ ctrl, formData, onChange, onSave }: any) {
  const props = ctrl.props || {}
  const value = props.controlSource ? formData[props.controlSource] : (formData[ctrl.id] || props.value || '')

  if (ctrl.type === 'Label' || ctrl.type === 'Heading') {
    return <div style={{ fontSize: props.fontSize || 14, fontWeight: props.fontWeight || 'normal', color: props.color || '#000' }}>{props.caption}</div>
  }

  if (ctrl.type === 'TextBox') {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(props.controlSource || ctrl.id, e.target.value)}
        placeholder={props.placeholder}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: 4,
          fontSize: props.fontSize || 14,
          color: props.color,
          background: props.bg,
        }}
      />
    )
  }

  if (ctrl.type === 'ComboBox') {
    const options = (props.options || '').split(',').map((o: string) => o.trim()).filter(Boolean)
    return (
      <select
        value={value}
        onChange={(e) => onChange(props.controlSource || ctrl.id, e.target.value)}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: 4,
          fontSize: props.fontSize || 14,
          color: props.color,
          background: props.bg,
        }}
      >
        <option value="">{props.placeholder}</option>
        {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    )
  }

  if (ctrl.type === 'CheckBox') {
    return (
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(props.controlSource || ctrl.id, e.target.checked)}
        />
        <span style={{ fontSize: props.fontSize || 14 }}>{props.caption}</span>
      </label>
    )
  }

  if (ctrl.type === 'DatePicker') {
    return (
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(props.controlSource || ctrl.id, e.target.value)}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: 4,
          fontSize: props.fontSize || 14,
        }}
      />
    )
  }

  if (ctrl.type === 'NumberBox') {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(props.controlSource || ctrl.id, Number(e.target.value))}
        min={props.min}
        max={props.max}
        step={props.step}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: 4,
          fontSize: props.fontSize || 14,
        }}
      />
    )
  }

  if (ctrl.type === 'Button') {
    return (
      <button
        onClick={props.caption?.toLowerCase() === 'save' ? onSave : undefined}
        style={{
          padding: '8px 16px',
          background: props.bg || '#6366f1',
          color: props.color || '#fff',
          border: 'none',
          borderRadius: props.borderRadius || 4,
          fontSize: props.fontSize || 14,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {props.caption || 'Button'}
      </button>
    )
  }

  return <div style={{ padding: 8, color: '#8890b8' }}>{ctrl.type}</div>
}
