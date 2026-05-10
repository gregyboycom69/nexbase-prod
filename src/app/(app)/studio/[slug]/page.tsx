'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import NavPane from '@/components/studio/NavPane'
import CtrlRender from '@/components/controls/CtrlRender'
import Toast, { ToastMessage } from '@/components/Toast'
import { theme } from '@/lib/theme' // FIX 19.5: Import centralized theme
import TableDesignerInline from '@/components/TableDesignerInline' // FIX 19.11.1: Inline table designer
import { Table, FileText, Search, Zap } from 'lucide-react'

// UUID generator for control IDs
const generateId = () => crypto.randomUUID()

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

// Default control sizes
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

// FIX 19.6: Control color sanitization helpers
const BAD_COLORS = [
  '#7f1d1d', '#991b1b', '#450a0a', '#1f1d1d',
  '#2d1d1d', '#3d1d1d', '#181818', '#000000'
].map(c => c.toLowerCase());

const isBadColor = (color: string | undefined) => {
  if (!color) return false;
  return BAD_COLORS.includes(color.toLowerCase());
};

const getControlDefaultBg = (type: string) => {
  const defaults: Record<string, string> = {
    TextBox: theme.controls.textBoxBg,
    Label: 'transparent',
    Heading: 'transparent',
    Button: theme.controls.buttonBg,
    ComboBox: theme.controls.comboBg,
    CheckBox: 'transparent',
    DatePicker: theme.controls.textBoxBg,
    NumberBox: theme.controls.textBoxBg,
    Badge: theme.controls.badgeBg,
    Card: theme.controls.cardBg,
    Divider: theme.controls.dividerColor,
  };
  return defaults[type] || theme.bg.card;
};

const getControlDefaultColor = (type: string) => {
  const defaults: Record<string, string> = {
    TextBox: theme.controls.textBoxText,
    Label: theme.controls.labelText,
    Heading: theme.controls.headingText,
    Button: theme.controls.buttonText,
    ComboBox: theme.controls.comboText,
    CheckBox: theme.controls.checkboxText,
    DatePicker: theme.controls.textBoxText,
    NumberBox: theme.controls.textBoxText,
    Badge: theme.controls.badgeText,
    Card: theme.controls.cardText,
  };
  return defaults[type] || theme.text.primary;
};

const sanitizeControl = (ctrl: Control) => {
  const sanitized = { ...ctrl, props: { ...ctrl.props } };

  if (isBadColor(sanitized.props?.bg)) {
    sanitized.props.bg = getControlDefaultBg(ctrl.type);
  }
  if (isBadColor(sanitized.props?.color)) {
    sanitized.props.color = getControlDefaultColor(ctrl.type);
  }

  return sanitized;
};

// Get icon for tab type
const getTabIcon = (type: string) => {
  switch (type) {
    case 'table': return <Table size={14} style={{ flexShrink: 0 }} />
    case 'form': return <FileText size={14} style={{ flexShrink: 0 }} />
    case 'query': return <Search size={14} style={{ flexShrink: 0 }} />
    case 'macro': return <Zap size={14} style={{ flexShrink: 0 }} />
    default: return null
  }
};

// FIX 19.10.4: Auto-calculate contrast text color for buttons
const getContrastText = (bgHex: string | undefined) => {
  if (!bgHex || bgHex === 'transparent') return '#1e293b';

  const c = bgHex.replace('#', '');
  if (c.length !== 6) return '#ffffff';

  const r = parseInt(c.substr(0, 2), 16);
  const g = parseInt(c.substr(2, 2), 16);
  const b = parseInt(c.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 155 ? '#1e293b' : '#ffffff';
};

export default function StudioPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
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
  const [showCreateFormDialog, setShowCreateFormDialog] = useState(false)

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

  // FIX 19.12.2: Auto-select first form or table when workspace loads
  useEffect(() => {
    if (tabs.length > 0) return
    if (forms.length > 0) {
      const firstForm = forms[0]
      handleOpenObject('form-design', firstForm.id, firstForm.name || firstForm.slug)
    } else if (tables.length > 0) {
      const firstTable = tables[0]
      handleOpenObject('table', firstTable.id, firstTable.name)
    }
  }, [forms, tables, tabs.length])

  // FIX 19.12.4: Handle activeTable query param from redirects
  useEffect(() => {
    const queryActiveTable = searchParams.get('activeTable')
    if (!queryActiveTable || !tables.length) return

    const targetTable = tables.find(t => t.id === queryActiveTable)
    if (targetTable) {
      handleOpenObject('table', targetTable.id, targetTable.name)
    }
  }, [searchParams, tables])

  // FIX 2: Handle opening objects (especially forms)
  function handleOpenObject(type: string, id: string, name: string) {
    const baseType = type.replace('-design', '')
    const view = type.includes('-design') ? 'design' : (baseType === 'form' ? 'design' : 'data')

    const existingTab = tabs.find(t => t.objectId === id && t.type === baseType as any)
    if (existingTab) {
      setActiveTabId(existingTab.id)
      return
    }

    const newTab: Tab = {
      id: generateId(),
      type: baseType as any,
      objectId: id,
      name,
      view: view as any,
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

  // FIX 3: Create form dialog
  async function handleNewObject(type: string) {
    if (type === 'table') {
      router.push(`/studio/${slug}/tables`)
    } else if (type === 'form') {
      setShowCreateFormDialog(true)
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--color-background-tertiary)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Top Bar - Modern Design */}
      <div style={{
        height: 48,
        background: 'var(--color-background-primary)',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        justifyContent: 'space-between'
      }}>
        {/* Left Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 20,
            height: 20,
            background: '#4f46e5',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 11,
            fontWeight: 600
          }}>
            N
          </div>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text-primary)' }}>
            NexBase
          </div>
          <div style={{ width: 1, height: 16, background: 'var(--color-border-tertiary)' }} />
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {workspace?.name || slug}
          </div>
        </div>

        {/* Center Section - Tabs */}
        <div style={{
          background: 'var(--color-background-secondary)',
          padding: 3,
          borderRadius: 8,
          display: 'flex',
          gap: 2
        }}>
          {(['Data', 'Design', 'Publish'] as const).map((tab) => {
            const isActive = (tab === 'Design' && activeFilter === 'all') ||
                           (tab === 'Data' && activeFilter === 'tables') ||
                           (tab === 'Publish' && activeFilter === 'macros')
            return (
              <button
                key={tab}
                onClick={() => {
                  if (tab === 'Design') setActiveFilter('all')
                  else if (tab === 'Data') setActiveFilter('tables')
                  else setActiveFilter('macros')
                }}
                style={{
                  padding: '6px 16px',
                  background: isActive ? '#fff' : 'transparent',
                  color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: isActive ? 500 : 400,
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
                }}
              >
                {tab}
              </button>
            )
          })}
        </div>

        {/* Right Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 7,
              height: 7,
              background: '#94a3b8',
              borderRadius: '50%'
            }} />
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
              Draft
            </span>
          </div>
          <button style={{
            padding: '5px 14px',
            background: '#4f46e5',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer'
          }}>
            Publish
          </button>
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

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--color-background-tertiary)' }}>
          {tabs.length === 0 ? (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              fontSize: 14,
            }}>
              Click + next to TABLES or FORMS in sidebar to get started
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', background: 'var(--color-background-secondary)', borderBottom: '0.5px solid var(--color-border-tertiary)', padding: '0 8px', gap: 4 }}>
                {tabs.map((tab) => (
                  <div
                    key={tab.id}
                    onClick={() => setActiveTabId(tab.id)}
                    style={{
                      padding: '10px 16px',
                      background: activeTabId === tab.id ? '#f1f5f9' : 'transparent',
                      color: activeTabId === tab.id ? '#1e293b' : '#64748b',
                      borderRadius: '4px 4px 0 0',
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      maxWidth: 200,
                    }}
                  >
                    {getTabIcon(tab.type)}
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tab.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCloseTab(tab.id)
                      }}
                      style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 14, cursor: 'pointer', padding: 0, lineHeight: 1 }}
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
                {activeTab && activeTab.type === 'table' && (
                  <TableDesignerInline
                    workspaceId={workspace.id}
                    tableId={activeTab.objectId}
                    tableName={activeTab.name}
                  />
                )}
                {activeTab && activeTab.type !== 'form' && activeTab.type !== 'table' && (
                  <div style={{ padding: 40, color: '#64748b', textAlign: 'center' }}>
                    {activeTab.type} - {activeTab.name}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* FIX 3: Create Form Dialog */}
      {showCreateFormDialog && (
        <CreateFormDialog
          workspace={workspace}
          tables={tables}
          onClose={() => setShowCreateFormDialog(false)}
          onCreated={(formId: string, formName: string) => {
            setShowCreateFormDialog(false)
            loadAllObjects(workspace.id)
            handleOpenObject('form-design', formId, formName)
          }}
        />
      )}
    </div>
  )
}

// FIX 3: Create Form Dialog Component
function CreateFormDialog({ workspace, tables, onClose, onCreated }: any) {
  const supabase = createClient()
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState('single')
  const [bindToTable, setBindToTable] = useState('')

  async function handleCreate() {
    if (!formName.trim() || !workspace) return

    // Get existing pages count for display_order
    const { data: existingPages } = await supabase
      .from('pages')
      .select('id')
      .eq('workspace_id', workspace.id)

    const formSlug = formName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const { data, error } = await supabase
      .from('pages')
      .insert({
        workspace_id: workspace.id,
        name: formName,
        slug: formSlug,
        icon: '📄',
        subtitle: '',
        display_order: existingPages?.length || 0,
        is_home: false,
        form_type: formType,
        record_source: bindToTable || null,
        published: false
      })
      .select()
      .single()

    if (!error && data) {
      onCreated(data.id, data.name)
    } else if (error) {
      console.error('Error creating form:', error)
      alert('Error creating form: ' + error.message)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: '#f8fafc', borderRadius: 8, padding: 24, width: 480, maxWidth: '90vw' }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Create New Form</h2>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 6 }}>Form Name</label>
          <input
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Enter form name..."
            style={{ width: '100%', padding: '8px 12px', background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: 4, color: '#1e293b', fontSize: 13 }}
            autoFocus
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 6 }}>Form Type</label>
          <select value={formType} onChange={(e) => setFormType(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: 4, color: '#1e293b', fontSize: 13, cursor: 'pointer' }}>
            <option value="single">Single Form - shows one record at a time</option>
            <option value="continuous">Continuous Form - shows multiple records stacked</option>
            <option value="datasheet">Datasheet - shows records in grid</option>
            <option value="split">Split Form - form on top, datasheet on bottom</option>
            <option value="popup">Popup / Modal - opens as dialog over another form</option>
            <option value="blank">Blank - no data, just visual design</option>
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 6 }}>Bind to Table (optional)</label>
          <select value={bindToTable} onChange={(e) => setBindToTable(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: 4, color: '#1e293b', fontSize: 13, cursor: 'pointer' }}>
            <option value="">None</option>
            {tables.map((t: any) => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: '#f1f5f9', color: '#1e293b', border: 'none', borderRadius: 4, fontSize: 13, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleCreate} disabled={!formName.trim()} style={{ padding: '8px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: formName.trim() ? 'pointer' : 'not-allowed', opacity: formName.trim() ? 1 : 0.5 }}>
            Create Form
          </button>
        </div>
      </div>
    </div>
  )
}

// Generate Form Dialog Component (Phase 15 Feature 1)
function GenerateFormDialog({ onClose, onGenerate }: any) {
  const [layoutStyle, setLayoutStyle] = useState<'single' | 'two-column' | 'card' | 'compact'>('two-column')
  const [theme, setTheme] = useState<'clean' | 'dark' | 'colorful' | 'minimal'>('clean')
  const [includeSaveButton, setIncludeSaveButton] = useState(true)
  const [includeClearButton, setIncludeClearButton] = useState(true)
  const [includeDeleteButton, setIncludeDeleteButton] = useState(false)
  const [includeNavBar, setIncludeNavBar] = useState(true)
  const [includeFormTitle, setIncludeFormTitle] = useState(true)
  const [includeSectionDividers, setIncludeSectionDividers] = useState(true)

  function handleGenerate() {
    onGenerate({
      layoutStyle,
      theme,
      includeSaveButton,
      includeClearButton,
      includeDeleteButton,
      includeNavBar,
      includeFormTitle,
      includeSectionDividers
    })
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: '#f8fafc', borderRadius: 8, padding: 24, width: 560, maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Generate Form</h2>

        {/* Layout Style */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 8, fontWeight: 600 }}>Layout Style</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { value: 'single', label: 'Single Column', desc: 'Labels on top, mobile friendly' },
              { value: 'two-column', label: 'Two Column', desc: 'Label left, field right (MS Access)' },
              { value: 'card', label: 'Card Style', desc: 'Grouped in sections with cards' },
              { value: 'compact', label: 'Compact Grid', desc: 'Dense layout for data entry' }
            ].map(opt => (
              <div
                key={opt.value}
                onClick={() => setLayoutStyle(opt.value as any)}
                style={{
                  padding: 12,
                  background: layoutStyle === opt.value ? '#6366f1' : '#f1f5f9',
                  border: `1px solid ${layoutStyle === opt.value ? '#818cf8' : '#3d4059'}`,
                  borderRadius: 6,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>{opt.label}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{opt.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 8, fontWeight: 600 }}>Theme</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { value: 'clean', label: 'Clean White', color: '#ffffff' },
              { value: 'dark', label: 'Dark Professional', color: '#f8fafc' },
              { value: 'colorful', label: 'Colorful', color: '#f59e0b' },
              { value: 'minimal', label: 'Minimal', color: '#64748b' }
            ].map(opt => (
              <div
                key={opt.value}
                onClick={() => setTheme(opt.value as any)}
                style={{
                  padding: 12,
                  background: theme === opt.value ? '#6366f1' : '#f1f5f9',
                  border: `1px solid ${theme === opt.value ? '#818cf8' : '#3d4059'}`,
                  borderRadius: 6,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <div style={{ width: 16, height: 16, background: opt.color, borderRadius: 3, border: '1px solid rgba(255,255,255,0.1)' }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{opt.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Include Options */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 8, fontWeight: 600 }}>Include</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { checked: includeSaveButton, setter: setIncludeSaveButton, label: 'Save Button' },
              { checked: includeClearButton, setter: setIncludeClearButton, label: 'Clear/New Button' },
              { checked: includeDeleteButton, setter: setIncludeDeleteButton, label: 'Delete Button' },
              { checked: includeNavBar, setter: setIncludeNavBar, label: 'Navigation Bar (if bound to table)' },
              { checked: includeFormTitle, setter: setIncludeFormTitle, label: 'Form Title (heading with table name)' },
              { checked: includeSectionDividers, setter: setIncludeSectionDividers, label: 'Section Dividers between field groups' }
            ].map((opt, idx) => (
              <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f1f5f9', borderRadius: 4, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={opt.checked}
                  onChange={(e) => opt.setter(e.target.checked)}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <span style={{ fontSize: 13, color: '#1e293b' }}>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', background: '#f1f5f9', color: '#1e293b', border: 'none', borderRadius: 4, fontSize: 13, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleGenerate} style={{ padding: '8px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Generate Form
          </button>
        </div>
      </div>
    </div>
  )
}

// Form Designer Component (with all Phase 13 fixes)
function FormDesigner({ pageId, pageName, workspace, tables, queries, macros, forms, onReload }: any) {
  type ViewType = 'design' | 'form' | 'datasheet'
  const supabase = createClient()

  const [view, setView] = useState<ViewType>('design')
  const [controls, setControls] = useState<Control[]>([])
  const [selectedControlId, setSelectedControlId] = useState<string | null>(null)
  const [selectedControlIds, setSelectedControlIds] = useState<string[]>([]) // Phase 15 Feature 7: Multiple selection
  const [activeTool, setActiveTool] = useState<string>('Select')
  const [propertyTab, setPropertyTab] = useState<'format' | 'data' | 'event' | 'other' | 'all'>('format')
  const [showFieldList, setShowFieldList] = useState(false)
  const [formProps, setFormProps] = useState<any>({})
  const [recordSourceFields, setRecordSourceFields] = useState<any[]>([])
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; controlId?: string } | null>(null)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  // FIX 4: Clipboard for copy/paste
  const [clipboardControl, setClipboardControl] = useState<Control | null>(null)

  // FIX 7: Undo/redo history
  const [history, setHistory] = useState<Control[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Form View state
  const [formData, setFormData] = useState<any>({})
  const [records, setRecords] = useState<any[]>([])
  const [currentRecordIndex, setCurrentRecordIndex] = useState(0)

  // Phase 15: Generate Form Dialog state
  const [showGenerateFormDialog, setShowGenerateFormDialog] = useState(false)

  const canvasRef = useRef<HTMLDivElement>(null)
  const isDrawing = useRef(false)
  const drawStart = useRef({ x: 0, y: 0 })
  const [ghostRect, setGhostRect] = useState<any>(null)
  const [currentSection, setCurrentSection] = useState<'header' | 'detail' | 'footer'>('detail')
  const previousPageId = useRef<string | null>(null)

  // FIX 1: Auto-save debounce
  const saveTimeout = useRef<NodeJS.Timeout>()

  // Toast notifications
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = generateId()
    setToasts((prev) => [...prev, { id, message, type }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  useEffect(() => {
    // Save controls before switching to new form
    if (previousPageId.current && previousPageId.current !== pageId && controls.length > 0) {
      console.log('🔄 Switching forms - saving controls for:', previousPageId.current)
      saveAllControlsSync(previousPageId.current, controls)
    }

    previousPageId.current = pageId
    loadFormData()
  }, [pageId])

  useEffect(() => {
    async function loadTableFields() {
      if (formProps.recordSource && workspace) {
        const { data: tableData } = await supabase
          .from('workspace_tables')
          .select('*')
          .eq('workspace_id', workspace.id)
          .eq('name', formProps.recordSource)
          .single()

        if (tableData && tableData.fields) {
          setRecordSourceFields(tableData.fields)
        } else {
          setRecordSourceFields([])
        }
      } else {
        setRecordSourceFields([])
      }
    }
    loadTableFields()
  }, [formProps.recordSource, workspace])

  // FIX 7: Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (view !== 'design') return

      // FIX 1: Ctrl+S = Save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        saveAllControls(true) // Show success toast for manual save
      }
      // FIX 7: Ctrl+Z = Undo
      else if (e.ctrlKey && e.key === 'z') {
        e.preventDefault()
        undo()
      }
      // FIX 7: Ctrl+Y = Redo
      else if (e.ctrlKey && e.key === 'y') {
        e.preventDefault()
        redo()
      }
      // FIX 4: Ctrl+C = Copy
      else if (e.ctrlKey && e.key === 'c' && selectedControlId) {
        e.preventDefault()
        copyControl()
      }
      // FIX 4: Ctrl+V = Paste
      else if (e.ctrlKey && e.key === 'v' && clipboardControl) {
        e.preventDefault()
        pasteControl()
      }
      // FIX 4: Ctrl+X = Cut
      else if (e.ctrlKey && e.key === 'x' && selectedControlId) {
        e.preventDefault()
        cutControl()
      }
      // FIX 4 & 7: Ctrl+D = Duplicate
      else if (e.ctrlKey && e.key === 'd' && selectedControlId) {
        e.preventDefault()
        duplicateControl()
      }
      // FIX 7: Delete = Delete selected
      else if (e.key === 'Delete' && selectedControlId) {
        e.preventDefault()
        deleteControl()
      }
      // FIX 7: Escape = Deselect / close context menu
      else if (e.key === 'Escape') {
        setSelectedControlId(null)
        setContextMenu(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [view, selectedControlId, controls, clipboardControl, history, historyIndex])

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

      if (page.record_source && workspace) {
        const { data: tableData } = await supabase
          .from('workspace_tables')
          .select('*')
          .eq('workspace_id', workspace.id)
          .eq('name', page.record_source)
          .single()

        if (tableData && tableData.fields) {
          setRecordSourceFields(tableData.fields)
        }
      }
    }

    const { data: controlsData } = await supabase
      .from('controls')
      .select('*')
      .eq('page_id', pageId)
      .order('display_order')

    console.log('📥 Loaded controls:', controlsData?.length || 0)

    if (controlsData) {
      const parsedControls = controlsData.map(c => ({
        ...c,
        props: c.props || {},
      }))
      setControls(parsedControls)
      setHistory([parsedControls])
      setHistoryIndex(0)
    } else {
      setControls([])
      setHistory([[]])
      setHistoryIndex(0)
    }
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

  // FIX 1: Save all controls to Supabase
  async function saveAllControls(showSuccessToast = false) {
    console.log('💾 Saving all controls...', controls.length)
    console.log('currentPageId:', pageId)
    setSaveStatus('saving')

    if (!pageId) {
      console.error('❌ No pageId - cannot save')
      showToast('Error: No page ID found. Cannot save controls.', 'error')
      setSaveStatus('unsaved')
      return
    }

    // Use UPSERT to save all controls
    if (controls.length > 0) {
      const { error } = await supabase
        .from('controls')
        .upsert(
          controls.map((ctrl, index) => ({
            id: ctrl.id,
            page_id: pageId,
            type: ctrl.type,
            x: Math.round(ctrl.x),
            y: Math.round(ctrl.y),
            w: Math.round(ctrl.w),
            h: Math.round(ctrl.h),
            section: ctrl.section || 'detail',
            props: ctrl.props || {},
            macro_steps: ctrl.props?.steps || [],
            display_order: index,
          })),
          { onConflict: 'id' }
        )

      if (error) {
        console.error('❌ Save error:', error)
        showToast('Save failed: ' + error.message, 'error')
        setSaveStatus('unsaved')
      } else {
        console.log('✅ All controls saved successfully')
        // Only show success toast if manually saved (button click), not auto-save
        if (showSuccessToast) {
          showToast('Saved!', 'success')
        }
        setSaveStatus('saved')
        // Keep "Saved ✓" indicator visible for 2 seconds
        setTimeout(() => setSaveStatus('saved'), 2000)
      }
    } else {
      console.log('✅ No controls to save')
      setSaveStatus('saved')
    }
  }

  // Helper for synchronous save when switching forms
  function saveAllControlsSync(targetPageId: string, controlsToSave: Control[]) {
    if (!targetPageId) {
      console.error('❌ No targetPageId - cannot save')
      return
    }

    if (controlsToSave.length > 0) {
      supabase
        .from('controls')
        .upsert(
          controlsToSave.map((ctrl, index) => ({
            id: ctrl.id,
            page_id: targetPageId,
            type: ctrl.type,
            x: Math.round(ctrl.x),
            y: Math.round(ctrl.y),
            w: Math.round(ctrl.w),
            h: Math.round(ctrl.h),
            section: ctrl.section || 'detail',
            props: ctrl.props || {},
            macro_steps: ctrl.props?.steps || [],
            display_order: index,
          })),
          { onConflict: 'id' }
        )
        .then(({ error }) => {
          if (error) {
            console.error('❌ Sync save error:', error)
          } else {
            console.log('✅ Controls synced for page:', targetPageId)
          }
        })
    }
  }

  // FIX 1: Auto-save with debounce (3 seconds to avoid interrupting typing)
  function triggerAutoSave() {
    setSaveStatus('unsaved')
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current)
    }
    saveTimeout.current = setTimeout(() => {
      saveAllControls()
    }, 3000)
  }

  async function saveFormProps(props: any) {
    console.log('💾 Saving form props:', props)

    if (!workspace) {
      console.error('❌ Workspace not loaded')
      return
    }

    const { error } = await supabase.from('pages').update({
      record_source: props.recordSource,
      allow_edits: props.allowEdits,
      allow_additions: props.allowAdditions,
      allow_deletions: props.allowDeletions,
      navigation_buttons: props.navigationButtons,
      default_view: props.defaultView,
      form_type: props.formType,
    }).eq('id', pageId)

    if (error) {
      console.error('❌ Error saving form props:', error)
    } else {
      console.log('✅ Form props saved successfully')

      if (props.recordSource) {
        const { data: tableData } = await supabase
          .from('workspace_tables')
          .select('*')
          .eq('workspace_id', workspace.id)
          .eq('name', props.recordSource)
          .single()

        if (tableData && tableData.fields) {
          setRecordSourceFields(tableData.fields)
        }
      } else {
        setRecordSourceFields([])
      }
    }
  }

  function handleCanvasMouseDown(e: React.MouseEvent, section: 'header' | 'detail' | 'footer') {
    if (activeTool === 'Select') {
      setSelectedControlId(null)
      return
    }

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
        const finalW = Math.max(ghostRect.w, defaultSize.w)
        const finalH = Math.max(ghostRect.h, defaultSize.h)

        const newControl: Control = {
          id: generateId(),
          page_id: pageId,
          type: activeTool,
          x: Math.round(ghostRect.x),
          y: Math.round(ghostRect.y),
          w: Math.round(finalW),
          h: Math.round(finalH),
          section: currentSection,
          props: getDefaultProps(activeTool),
        }

        addControlToHistory([...controls, newControl])
        triggerAutoSave()
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
      Label: { caption: 'Label', color: '#374151', fontSize: 13, bg: 'transparent' },
      Heading: { caption: 'Heading', color: '#0f172a', fontSize: 24, fontWeight: 'bold', bg: 'transparent' },
      TextBox: { placeholder: 'Type here...', color: '#1e293b', bg: '#ffffff', fontSize: 13, border: '1px solid #e2e8f0' },
      Button: { caption: 'Button', bg: '#4f46e5', color: '#ffffff', fontSize: 13 },
      ComboBox: { placeholder: 'Select...', color: '#374151', bg: '#ffffff', fontSize: 13, options: '' },
      CheckBox: { caption: 'Checkbox', color: '#374151', bg: 'transparent', checked: false },
      DatePicker: { placeholder: 'DD/MM/YYYY', color: '#374151', bg: '#ffffff' },
      NumberBox: { value: 0, color: '#374151', bg: '#ffffff', min: 0, max: 100, step: 1 },
      DataTable: { caption: 'Table', columns: '' },
      Chart: { caption: 'Chart Title', chartType: 'bar' },
      Subform: { sourceObject: '', linkMasterFields: '', linkChildFields: '' },
      Card: { caption: 'Card Title', bg: '#ffffff', color: '#0f172a' },
      TabPanel: { tabs: 'Tab 1,Tab 2,Tab 3' },
      Modal: { caption: 'Modal Title' },
      Badge: { caption: 'Badge', bg: '#eff6ff', color: '#4f46e5' },
      Image: { src: '', alt: 'Image' },
      ProgressBar: { value: 65, max: 100 },
      NavigationButtons: {},
      StatusBar: { text: 'Ready' },
      Divider: { bg: '#e2e8f0', color: '#e2e8f0' },
      Lookup: { placeholder: 'Search...', rowSource: '' },
    }
    return defaults[type] || {}
  }

  function updateControlProp(controlId: string, propName: string, value: any) {
    const updated = controls.map(c => c.id === controlId ? { ...c, props: { ...c.props, [propName]: value } } : c)
    addControlToHistory(updated)
    // Don't auto-save on property changes - only save on blur or manual save
  }

  // Save single control to Supabase (called on blur)
  async function saveSingleControl(controlId: string) {
    const control = controls.find(c => c.id === controlId)
    if (!control || !pageId) return

    const index = controls.findIndex(c => c.id === controlId)

    await supabase.from('controls').upsert({
      id: control.id,
      page_id: pageId,
      type: control.type,
      x: Math.round(control.x),
      y: Math.round(control.y),
      w: Math.round(control.w),
      h: Math.round(control.h),
      section: control.section || 'detail',
      props: control.props || {},
      macro_steps: control.props?.steps || [],
      display_order: index,
    }, { onConflict: 'id' })
  }

  function updateControlGeometry(controlId: string, updates: Partial<Control>) {
    const updated = controls.map(c => c.id === controlId ? {
      ...c,
      ...updates,
      x: updates.x !== undefined ? Math.round(updates.x) : c.x,
      y: updates.y !== undefined ? Math.round(updates.y) : c.y,
      w: updates.w !== undefined ? Math.round(Math.max(20, updates.w)) : c.w,
      h: updates.h !== undefined ? Math.round(Math.max(16, updates.h)) : c.h
    } : c)
    addControlToHistory(updated)
    triggerAutoSave()
  }

  function deleteControl() {
    if (!selectedControlId) return
    if (!confirm('Delete this control?')) return

    const updated = controls.filter(c => c.id !== selectedControlId)
    addControlToHistory(updated)
    setSelectedControlId(null)
    triggerAutoSave()
  }

  // FIX 4: Copy/Paste/Duplicate
  function copyControl() {
    const control = controls.find(c => c.id === selectedControlId)
    if (control) {
      setClipboardControl(control)
      console.log('📋 Copied control:', control.type)
    }
  }

  function cutControl() {
    copyControl()
    deleteControl()
  }

  function pasteControl() {
    if (!clipboardControl) return

    const newControl: Control = {
      ...clipboardControl,
      id: generateId(),
      x: Math.round(clipboardControl.x + 20),
      y: Math.round(clipboardControl.y + 20),
    }

    addControlToHistory([...controls, newControl])
    setSelectedControlId(newControl.id)
    triggerAutoSave()
  }

  function duplicateControl() {
    copyControl()
    pasteControl()
  }

  // FIX 7: Undo/Redo
  function addControlToHistory(newControls: Control[]) {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newControls)
    if (newHistory.length > 30) newHistory.shift() // Phase 15: Increased from 20 to 30
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    setControls(newControls)
  }

  function undo() {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setControls(history[historyIndex - 1])
      triggerAutoSave()
    }
  }

  function redo() {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setControls(history[historyIndex + 1])
      triggerAutoSave()
    }
  }

  // Phase 15 Feature 7: Handle control selection with Shift+Click support
  function handleControlSelect(controlId: string, event?: any) {
    if (event?.shiftKey && selectedControlId) {
      // Shift+Click: Add to selection
      if (selectedControlIds.includes(controlId)) {
        // Deselect if already selected
        setSelectedControlIds(selectedControlIds.filter(id => id !== controlId))
      } else {
        // Add to selection, including the previously single-selected control if not already there
        const newSelection = selectedControlIds.includes(selectedControlId)
          ? [...selectedControlIds, controlId]
          : [selectedControlId, ...selectedControlIds, controlId]
        setSelectedControlIds(newSelection)
      }
    } else if (selectedControlIds.length > 0 && !event?.shiftKey) {
      // Clear multi-selection if clicking without Shift
      setSelectedControlIds([])
      setSelectedControlId(controlId)
    } else {
      // Normal click: select single control
      setSelectedControlId(controlId)
    }
  }

  // Phase 15 Feature 7: Alignment and Distribution Tools
  function alignLeft() {
    if (selectedControlIds.length < 2) return
    const selectedControls = controls.filter(c => selectedControlIds.includes(c.id))
    const minX = Math.min(...selectedControls.map(c => c.x))
    const updated = controls.map(c =>
      selectedControlIds.includes(c.id) ? { ...c, x: minX } : c
    )
    addControlToHistory(updated)
    triggerAutoSave()
  }

  function alignRight() {
    if (selectedControlIds.length < 2) return
    const selectedControls = controls.filter(c => selectedControlIds.includes(c.id))
    const maxRight = Math.max(...selectedControls.map(c => c.x + c.w))
    const updated = controls.map(c =>
      selectedControlIds.includes(c.id) ? { ...c, x: maxRight - c.w } : c
    )
    addControlToHistory(updated)
    triggerAutoSave()
  }

  function alignTop() {
    if (selectedControlIds.length < 2) return
    const selectedControls = controls.filter(c => selectedControlIds.includes(c.id))
    const minY = Math.min(...selectedControls.map(c => c.y))
    const updated = controls.map(c =>
      selectedControlIds.includes(c.id) ? { ...c, y: minY } : c
    )
    addControlToHistory(updated)
    triggerAutoSave()
  }

  function alignBottom() {
    if (selectedControlIds.length < 2) return
    const selectedControls = controls.filter(c => selectedControlIds.includes(c.id))
    const maxBottom = Math.max(...selectedControls.map(c => c.y + c.h))
    const updated = controls.map(c =>
      selectedControlIds.includes(c.id) ? { ...c, y: maxBottom - c.h } : c
    )
    addControlToHistory(updated)
    triggerAutoSave()
  }

  function alignCenterH() {
    if (selectedControlIds.length < 2) return
    const selectedControls = controls.filter(c => selectedControlIds.includes(c.id))
    const minX = Math.min(...selectedControls.map(c => c.x))
    const maxRight = Math.max(...selectedControls.map(c => c.x + c.w))
    const centerX = (minX + maxRight) / 2
    const updated = controls.map(c =>
      selectedControlIds.includes(c.id) ? { ...c, x: centerX - c.w / 2 } : c
    )
    addControlToHistory(updated)
    triggerAutoSave()
  }

  function alignCenterV() {
    if (selectedControlIds.length < 2) return
    const selectedControls = controls.filter(c => selectedControlIds.includes(c.id))
    const minY = Math.min(...selectedControls.map(c => c.y))
    const maxBottom = Math.max(...selectedControls.map(c => c.y + c.h))
    const centerY = (minY + maxBottom) / 2
    const updated = controls.map(c =>
      selectedControlIds.includes(c.id) ? { ...c, y: centerY - c.h / 2 } : c
    )
    addControlToHistory(updated)
    triggerAutoSave()
  }

  function distributeH() {
    if (selectedControlIds.length < 3) return
    const selectedControls = controls.filter(c => selectedControlIds.includes(c.id))
    const sorted = [...selectedControls].sort((a, b) => a.x - b.x)
    const minX = sorted[0].x
    const maxRight = sorted[sorted.length - 1].x + sorted[sorted.length - 1].w
    const totalWidth = sorted.reduce((sum, c) => sum + c.w, 0)
    const gap = (maxRight - minX - totalWidth) / (sorted.length - 1)

    let currentX = minX
    const updated = controls.map(c => {
      const index = sorted.findIndex(s => s.id === c.id)
      if (index !== -1) {
        const newX = index === 0 ? minX : currentX
        currentX = newX + c.w + gap
        return { ...c, x: newX }
      }
      return c
    })
    addControlToHistory(updated)
    triggerAutoSave()
  }

  function distributeV() {
    if (selectedControlIds.length < 3) return
    const selectedControls = controls.filter(c => selectedControlIds.includes(c.id))
    const sorted = [...selectedControls].sort((a, b) => a.y - b.y)
    const minY = sorted[0].y
    const maxBottom = sorted[sorted.length - 1].y + sorted[sorted.length - 1].h
    const totalHeight = sorted.reduce((sum, c) => sum + c.h, 0)
    const gap = (maxBottom - minY - totalHeight) / (sorted.length - 1)

    let currentY = minY
    const updated = controls.map(c => {
      const index = sorted.findIndex(s => s.id === c.id)
      if (index !== -1) {
        const newY = index === 0 ? minY : currentY
        currentY = newY + c.h + gap
        return { ...c, y: newY }
      }
      return c
    })
    addControlToHistory(updated)
    triggerAutoSave()
  }

  function makeSameWidth() {
    if (selectedControlIds.length < 2) return
    const firstControl = controls.find(c => c.id === selectedControlIds[0])
    if (!firstControl) return
    const updated = controls.map(c =>
      selectedControlIds.includes(c.id) ? { ...c, w: firstControl.w } : c
    )
    addControlToHistory(updated)
    triggerAutoSave()
  }

  function makeSameHeight() {
    if (selectedControlIds.length < 2) return
    const firstControl = controls.find(c => c.id === selectedControlIds[0])
    if (!firstControl) return
    const updated = controls.map(c =>
      selectedControlIds.includes(c.id) ? { ...c, h: firstControl.h } : c
    )
    addControlToHistory(updated)
    triggerAutoSave()
  }

  // FIX 6: Auto-generate form
  function autoGenerateForm() {
    if (!formProps.recordSource) {
      alert('Please set a Record Source first')
      return
    }
    setShowGenerateFormDialog(true)
  }

  function generateFormWithOptions(options: {
    layoutStyle: 'single' | 'two-column' | 'card' | 'compact'
    theme: 'clean' | 'dark' | 'colorful' | 'minimal'
    includeSaveButton: boolean
    includeClearButton: boolean
    includeDeleteButton: boolean
    includeNavBar: boolean
    includeFormTitle: boolean
    includeSectionDividers: boolean
  }) {
    const table = tables.find((t: any) => t.name === formProps.recordSource)
    if (!table || !table.fields) return

    const newControls: Control[] = []
    let yPos = 20

    // Theme colors
    const themes = {
      clean: { bg: '#ffffff', text: '#1f2937', accent: '#6366f1', labelColor: '#374151' },
      dark: { bg: '#f8fafc', text: '#1e293b', accent: '#818cf8', labelColor: '#9ca3af' },
      colorful: { bg: '#ffffff', text: '#1e293b', accent: '#f59e0b', labelColor: '#475569' },
      minimal: { bg: '#fafafa', text: '#0f172a', accent: '#64748b', labelColor: '#334155' },
    }
    const themeColors = themes[options.theme]

    // Add form title if requested
    if (options.includeFormTitle) {
      newControls.push({
        id: generateId(),
        page_id: pageId,
        type: 'Heading',
        x: 20,
        y: yPos,
        w: 400,
        h: 32,
        section: 'header',
        props: {
          caption: table.caption || table.name,
          color: themeColors.accent,
          fontSize: 24,
          bold: true
        },
      })
      yPos += 50
    }

    // Group fields by type for smart organization
    const textFields = table.fields.filter((f: any) => f.name !== 'id' && ['Short Text', 'Long Text'].includes(f.type))
    const dateNumberFields = table.fields.filter((f: any) => ['Number', 'Currency', 'Date/Time'].includes(f.type))
    const booleanFields = table.fields.filter((f: any) => f.type === 'Yes/No')
    const choiceFields = table.fields.filter((f: any) => f.type === 'Choice')
    const otherFields = table.fields.filter((f: any) =>
      f.name !== 'id' &&
      !['Short Text', 'Long Text', 'Number', 'Currency', 'Date/Time', 'Yes/No', 'Choice'].includes(f.type)
    )

    const fieldGroups = [
      { name: 'Basic Info', fields: textFields },
      { name: 'Details', fields: dateNumberFields },
      { name: 'Options', fields: choiceFields },
      { name: 'Settings', fields: booleanFields },
      { name: 'Other', fields: otherFields },
    ].filter(g => g.fields.length > 0)

    // Generate controls based on layout style
    fieldGroups.forEach((group, groupIndex) => {
      // Add section divider if requested and not first group
      if (options.includeSectionDividers && groupIndex > 0) {
        yPos += 10
        newControls.push({
          id: generateId(),
          page_id: pageId,
          type: 'SectionHeader',
          x: 20,
          y: yPos,
          w: options.layoutStyle === 'single' ? 400 : 550,
          h: 28,
          section: 'detail',
          props: { caption: group.name, color: themeColors.labelColor, fontSize: 14, bold: true },
        })
        yPos += 36
      }

      group.fields.forEach((field: any) => {
        if (options.layoutStyle === 'single') {
          // Single column: label on top, field below
          newControls.push({
            id: generateId(),
            page_id: pageId,
            type: 'Label',
            x: 20,
            y: yPos,
            w: 400,
            h: 20,
            section: 'detail',
            props: { caption: field.caption || field.name, color: themeColors.labelColor, fontSize: 12, bold: true },
          })
          yPos += 24

          const controlType = getControlTypeForField(field)
          const controlProps = getControlPropsForField(field, themeColors)
          const defaultSize = DEFAULT_SIZES[controlType] || { w: 200, h: 24 }

          newControls.push({
            id: generateId(),
            page_id: pageId,
            type: controlType,
            x: 20,
            y: yPos,
            w: 400,
            h: defaultSize.h,
            section: 'detail',
            props: controlProps,
          })
          yPos += defaultSize.h + 16

        } else if (options.layoutStyle === 'two-column') {
          // Two column: label left, field right
          newControls.push({
            id: generateId(),
            page_id: pageId,
            type: 'Label',
            x: 20,
            y: yPos,
            w: 150,
            h: 20,
            section: 'detail',
            props: { caption: field.caption || field.name, color: themeColors.labelColor, fontSize: 12, bold: true },
          })

          const controlType = getControlTypeForField(field)
          const controlProps = getControlPropsForField(field, themeColors)
          const defaultSize = DEFAULT_SIZES[controlType] || { w: 200, h: 24 }

          newControls.push({
            id: generateId(),
            page_id: pageId,
            type: controlType,
            x: 180,
            y: yPos,
            w: defaultSize.w,
            h: defaultSize.h,
            section: 'detail',
            props: controlProps,
          })
          yPos += 36

        } else if (options.layoutStyle === 'card') {
          // Card style: each field in its own card
          newControls.push({
            id: generateId(),
            page_id: pageId,
            type: 'Card',
            x: 20,
            y: yPos,
            w: 400,
            h: 80,
            section: 'detail',
            props: { bg: themeColors.bg, color: themeColors.text },
          })

          newControls.push({
            id: generateId(),
            page_id: pageId,
            type: 'Label',
            x: 32,
            y: yPos + 12,
            w: 380,
            h: 20,
            section: 'detail',
            props: { caption: field.caption || field.name, color: themeColors.labelColor, fontSize: 12, bold: true },
          })

          const controlType = getControlTypeForField(field)
          const controlProps = getControlPropsForField(field, themeColors)
          const defaultSize = DEFAULT_SIZES[controlType] || { w: 200, h: 24 }

          newControls.push({
            id: generateId(),
            page_id: pageId,
            type: controlType,
            x: 32,
            y: yPos + 38,
            w: 360,
            h: defaultSize.h,
            section: 'detail',
            props: controlProps,
          })
          yPos += 92

        } else if (options.layoutStyle === 'compact') {
          // Compact grid: tighter spacing
          newControls.push({
            id: generateId(),
            page_id: pageId,
            type: 'Label',
            x: 20,
            y: yPos,
            w: 120,
            h: 18,
            section: 'detail',
            props: { caption: field.caption || field.name, color: themeColors.labelColor, fontSize: 11, bold: true },
          })

          const controlType = getControlTypeForField(field)
          const controlProps = getControlPropsForField(field, themeColors)
          const defaultSize = DEFAULT_SIZES[controlType] || { w: 200, h: 24 }

          newControls.push({
            id: generateId(),
            page_id: pageId,
            type: controlType,
            x: 150,
            y: yPos,
            w: Math.min(defaultSize.w, 180),
            h: 22,
            section: 'detail',
            props: { ...controlProps, fontSize: 12 },
          })
          yPos += 28
        }
      })
    })

    yPos += 20

    // Add action buttons
    let buttonX = options.layoutStyle === 'single' ? 20 : 180
    if (options.includeSaveButton) {
      newControls.push({
        id: generateId(),
        page_id: pageId,
        type: 'Button',
        x: buttonX,
        y: yPos,
        w: 100,
        h: 32,
        section: 'detail',
        props: { caption: 'Save', bg: themeColors.accent, color: '#fff', fontSize: 13, bold: true },
      })
      buttonX += 110
    }

    if (options.includeClearButton) {
      newControls.push({
        id: generateId(),
        page_id: pageId,
        type: 'Button',
        x: buttonX,
        y: yPos,
        w: 100,
        h: 32,
        section: 'detail',
        props: { caption: 'New', bg: '#6366f1', color: '#fff', fontSize: 13 },
      })
      buttonX += 110
    }

    if (options.includeDeleteButton) {
      newControls.push({
        id: generateId(),
        page_id: pageId,
        type: 'Button',
        x: buttonX,
        y: yPos,
        w: 100,
        h: 32,
        section: 'detail',
        props: { caption: 'Delete', bg: '#ef4444', color: '#fff', fontSize: 13 },
      })
    }

    // Add navigation bar if requested
    if (options.includeNavBar) {
      newControls.push({
        id: generateId(),
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

    addControlToHistory([...controls, ...newControls])
    triggerAutoSave()
  }

  function getControlTypeForField(field: any): string {
    if (['Number', 'Currency'].includes(field.type)) return 'NumberBox'
    if (field.type === 'Date/Time') return 'DatePicker'
    if (field.type === 'Yes/No') return 'CheckBox'
    if (field.type === 'Choice') return 'ComboBox'
    if (field.type === 'Long Text') return 'TextBox'
    return 'TextBox'
  }

  function getControlPropsForField(field: any, themeColors: any): any {
    const baseProps = {
      controlSource: field.name,
      color: themeColors.text,
      bg: themeColors.bg,
      fontSize: 13
    }

    if (field.type === 'Yes/No') {
      return { ...baseProps, caption: field.caption || field.name }
    }
    if (field.type === 'Choice') {
      return { ...baseProps, options: field.options || '' }
    }
    if (field.required) {
      return { ...baseProps, required: true }
    }
    return baseProps
  }

  const selectedControl = controls.find(c => c.id === selectedControlId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f1f5f9' }}>
      {/* FIX 1: Toolbar with prominent Save button */}
      <div style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => setView('design')}
          onMouseEnter={(e) => { if (view !== 'design') e.currentTarget.style.background = '#e2e8f0' }}
          onMouseLeave={(e) => { if (view !== 'design') e.currentTarget.style.background = '#f1f5f9' }}
          style={{ padding: '6px 12px', background: view === 'design' ? '#4f46e5' : '#f1f5f9', color: view === 'design' ? '#ffffff' : '#64748b', border: view === 'design' ? 'none' : '1px solid #e2e8f0', borderRadius: 4, fontSize: 11, cursor: 'pointer', fontWeight: 500 }}>
          Design View
        </button>
        <button
          onClick={() => setView('form')}
          onMouseEnter={(e) => { if (view !== 'form') e.currentTarget.style.background = '#e2e8f0' }}
          onMouseLeave={(e) => { if (view !== 'form') e.currentTarget.style.background = '#f1f5f9' }}
          style={{ padding: '6px 12px', background: view === 'form' ? '#4f46e5' : '#f1f5f9', color: view === 'form' ? '#ffffff' : '#64748b', border: view === 'form' ? 'none' : '1px solid #e2e8f0', borderRadius: 4, fontSize: 11, cursor: 'pointer', fontWeight: 500 }}>
          Form View
        </button>
        <button
          onClick={() => setView('datasheet')}
          onMouseEnter={(e) => { if (view !== 'datasheet') e.currentTarget.style.background = '#e2e8f0' }}
          onMouseLeave={(e) => { if (view !== 'datasheet') e.currentTarget.style.background = '#f1f5f9' }}
          style={{ padding: '6px 12px', background: view === 'datasheet' ? '#4f46e5' : '#f1f5f9', color: view === 'datasheet' ? '#ffffff' : '#64748b', border: view === 'datasheet' ? 'none' : '1px solid #e2e8f0', borderRadius: 4, fontSize: 11, cursor: 'pointer', fontWeight: 500 }}>
          Datasheet
        </button>
        <button
          onClick={() => setShowFieldList(!showFieldList)}
          onMouseEnter={(e) => { if (!showFieldList) e.currentTarget.style.background = '#e2e8f0' }}
          onMouseLeave={(e) => { if (!showFieldList) e.currentTarget.style.background = '#f1f5f9' }}
          style={{ padding: '6px 12px', background: showFieldList ? '#4f46e5' : '#f1f5f9', color: showFieldList ? '#ffffff' : '#64748b', border: showFieldList ? 'none' : '1px solid #e2e8f0', borderRadius: 4, fontSize: 11, cursor: 'pointer', fontWeight: 500 }}>
          Field List
        </button>
        {formProps.recordSource && (
          <button onClick={autoGenerateForm} style={{ padding: '6px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}>
            + Add All Fields
          </button>
        )}

        {/* Phase 15 Feature 8: Undo/Redo buttons */}
        <div style={{ borderLeft: '1px solid #f1f5f9', paddingLeft: 12, display: 'flex', gap: 8 }}>
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            title={historyIndex > 0 ? 'Undo (Ctrl+Z)' : 'Nothing to undo'}
            style={{
              padding: '6px 12px',
              background: historyIndex > 0 ? '#f1f5f9' : '#f8fafc',
              color: historyIndex > 0 ? '#1e293b' : '#4b5563',
              border: 'none',
              borderRadius: 4,
              fontSize: 11,
              cursor: historyIndex > 0 ? 'pointer' : 'not-allowed',
              opacity: historyIndex > 0 ? 1 : 0.5
            }}
          >
            ↩ Undo
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            title={historyIndex < history.length - 1 ? 'Redo (Ctrl+Y)' : 'Nothing to redo'}
            style={{
              padding: '6px 12px',
              background: historyIndex < history.length - 1 ? '#f1f5f9' : '#f8fafc',
              color: historyIndex < history.length - 1 ? '#1e293b' : '#4b5563',
              border: 'none',
              borderRadius: 4,
              fontSize: 11,
              cursor: historyIndex < history.length - 1 ? 'pointer' : 'not-allowed',
              opacity: historyIndex < history.length - 1 ? 1 : 0.5
            }}
          >
            ↪ Redo
          </button>
        </div>

        <div style={{ flex: 1 }} />
        {/* FIX 1: Large prominent Save button */}
        <button onClick={() => saveAllControls(true)} disabled={saveStatus === 'saving'} style={{ padding: '8px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: saveStatus === 'saving' ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>
          💾 {saveStatus === 'saving' ? 'Saving...' : 'Save Form'}
        </button>
        <div style={{ fontSize: 10, color: saveStatus === 'saving' ? '#fbbf24' : saveStatus === 'saved' ? '#10b981' : '#ef4444', minWidth: 60, textAlign: 'right' }}>
          {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved ✓' : 'Unsaved'}
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
        <div style={{ flex: 1, display: 'flex', background: '#f1f5f9' }}>
          {/* Toolbox */}
          <div style={{ width: 72, background: '#f8fafc', borderRight: '1px solid #f1f5f9', padding: '8px 4px', overflow: 'auto' }}>
            {['BASIC', 'INPUTS', 'DATA', 'LAYOUT'].map((group) => (
              <div key={group}>
                <div style={{ fontSize: 9, color: '#94a3b8', marginTop: group !== 'BASIC' ? 12 : 0, marginBottom: 4, textAlign: 'center', fontWeight: 700 }}>
                  {group}
                </div>
                {CONTROL_TYPES.filter(ct => ct.group === group).map((ct) => (
                  <div
                    key={ct.name}
                    onClick={() => setActiveTool(ct.name)}
                    style={{
                      padding: '8px 4px',
                      background: activeTool === ct.name ? 'rgba(99,102,241,0.06)' : 'transparent',
                      border: activeTool === ct.name ? '1px solid #4f46e5' : '1px solid transparent',
                      borderRadius: 4,
                      marginBottom: 4,
                      fontSize: 9,
                      color: activeTool === ct.name ? '#4f46e5' : '#64748b',
                      textAlign: 'center',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2,
                    }}
                    onMouseEnter={(e) => {
                      if (activeTool !== ct.name) {
                        e.currentTarget.style.background = '#f1f5f9'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTool !== ct.name) {
                        e.currentTarget.style.background = 'transparent'
                      }
                    }}
                  >
                    <div style={{ fontSize: 16, color: activeTool === ct.name ? '#4f46e5' : '#64748b' }}>{ct.icon}</div>
                    <div>{ct.name}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Phase 15 Feature 7: Alignment Toolbar (shows when 2+ controls selected) */}
          {selectedControlIds.length >= 2 && (
            <div style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: '#64748b', marginRight: 8 }}>{selectedControlIds.length} controls selected</span>

              <div style={{ display: 'flex', gap: 4, borderLeft: '1px solid #f1f5f9', paddingLeft: 8 }}>
                <button onClick={alignLeft} title="Align Left" style={{ padding: '6px 10px', background: '#f1f5f9', color: '#1e293b', border: 'none', borderRadius: 4, fontSize: 10, cursor: 'pointer' }}>
                  ⬅ Left
                </button>
                <button onClick={alignCenterH} title="Center Horizontally" style={{ padding: '6px 10px', background: '#f1f5f9', color: '#1e293b', border: 'none', borderRadius: 4, fontSize: 10, cursor: 'pointer' }}>
                  ↔ Center H
                </button>
                <button onClick={alignRight} title="Align Right" style={{ padding: '6px 10px', background: '#f1f5f9', color: '#1e293b', border: 'none', borderRadius: 4, fontSize: 10, cursor: 'pointer' }}>
                  ➡ Right
                </button>
              </div>

              <div style={{ display: 'flex', gap: 4, borderLeft: '1px solid #f1f5f9', paddingLeft: 8 }}>
                <button onClick={alignTop} title="Align Top" style={{ padding: '6px 10px', background: '#f1f5f9', color: '#1e293b', border: 'none', borderRadius: 4, fontSize: 10, cursor: 'pointer' }}>
                  ⬆ Top
                </button>
                <button onClick={alignCenterV} title="Center Vertically" style={{ padding: '6px 10px', background: '#f1f5f9', color: '#1e293b', border: 'none', borderRadius: 4, fontSize: 10, cursor: 'pointer' }}>
                  ↕ Center V
                </button>
                <button onClick={alignBottom} title="Align Bottom" style={{ padding: '6px 10px', background: '#f1f5f9', color: '#1e293b', border: 'none', borderRadius: 4, fontSize: 10, cursor: 'pointer' }}>
                  ⬇ Bottom
                </button>
              </div>

              <div style={{ display: 'flex', gap: 4, borderLeft: '1px solid #f1f5f9', paddingLeft: 8 }}>
                <button onClick={distributeH} disabled={selectedControlIds.length < 3} title="Distribute Horizontally" style={{ padding: '6px 10px', background: selectedControlIds.length >= 3 ? '#f1f5f9' : '#f8fafc', color: selectedControlIds.length >= 3 ? '#1e293b' : '#4b5563', border: 'none', borderRadius: 4, fontSize: 10, cursor: selectedControlIds.length >= 3 ? 'pointer' : 'not-allowed', opacity: selectedControlIds.length >= 3 ? 1 : 0.5 }}>
                  ⬌ Distribute H
                </button>
                <button onClick={distributeV} disabled={selectedControlIds.length < 3} title="Distribute Vertically" style={{ padding: '6px 10px', background: selectedControlIds.length >= 3 ? '#f1f5f9' : '#f8fafc', color: selectedControlIds.length >= 3 ? '#1e293b' : '#4b5563', border: 'none', borderRadius: 4, fontSize: 10, cursor: selectedControlIds.length >= 3 ? 'pointer' : 'not-allowed', opacity: selectedControlIds.length >= 3 ? 1 : 0.5 }}>
                  ⬍ Distribute V
                </button>
              </div>

              <div style={{ display: 'flex', gap: 4, borderLeft: '1px solid #f1f5f9', paddingLeft: 8 }}>
                <button onClick={makeSameWidth} title="Same Width" style={{ padding: '6px 10px', background: '#f1f5f9', color: '#1e293b', border: 'none', borderRadius: 4, fontSize: 10, cursor: 'pointer' }}>
                  ↔ Width
                </button>
                <button onClick={makeSameHeight} title="Same Height" style={{ padding: '6px 10px', background: '#f1f5f9', color: '#1e293b', border: 'none', borderRadius: 4, fontSize: 10, cursor: 'pointer' }}>
                  ↕ Height
                </button>
              </div>

              <div style={{ flex: 1 }} />
              <button onClick={() => setSelectedControlIds([])} style={{ padding: '6px 10px', background: '#f1f5f9', color: '#1e293b', border: 'none', borderRadius: 4, fontSize: 10, cursor: 'pointer' }}>
                Clear Selection
              </button>
            </div>
          )}

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
                  selected={selectedControlId === ctrl.id || selectedControlIds.includes(ctrl.id)}
                  onSelect={(e: any) => handleControlSelect(ctrl.id, e)}
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
                  selected={selectedControlId === ctrl.id || selectedControlIds.includes(ctrl.id)}
                  onSelect={(e: any) => handleControlSelect(ctrl.id, e)}
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
                  selected={selectedControlId === ctrl.id || selectedControlIds.includes(ctrl.id)}
                  onSelect={(e: any) => handleControlSelect(ctrl.id, e)}
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
              <div style={{ position: 'absolute', top: 60, right: 260, width: 180, background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 100 }}>
                <div style={{ padding: '8px 12px', background: '#f1f5f9', color: '#1e293b', fontSize: 12, fontWeight: 700, borderBottom: '1px solid #f8fafc' }}>
                  Field List
                </div>
                <div style={{ padding: 8 }}>
                  {formProps.recordSource ? (
                    <div>
                      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>{formProps.recordSource}</div>
                      {recordSourceFields.map((field: any) => (
                        <div key={field.name} style={{ padding: '4px 8px', fontSize: 11, color: '#1e293b', cursor: 'pointer', borderRadius: 4 }} onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                          📝 {field.name}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: 12, fontSize: 11, color: '#64748b', textAlign: 'center' }}>
                      Set Record Source in the Data tab first
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* FIX 5: Completely rebuilt Property Sheet */}
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
            onSaveSingleControl={saveSingleControl}
          />

          {/* FIX 4: Context Menu */}
          {contextMenu && (
            <div style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 10000, minWidth: 150 }} onClick={(e) => e.stopPropagation()}>
              {contextMenu.controlId && (
                <>
                  <div onClick={() => { copyControl(); setContextMenu(null) }} style={{ padding: '8px 12px', fontSize: 11, color: '#1e293b', cursor: 'pointer', borderBottom: '1px solid #f8fafc' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    Copy (Ctrl+C)
                  </div>
                  {clipboardControl && (
                    <div onClick={() => { pasteControl(); setContextMenu(null) }} style={{ padding: '8px 12px', fontSize: 11, color: '#1e293b', cursor: 'pointer', borderBottom: '1px solid #f8fafc' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      Paste (Ctrl+V)
                    </div>
                  )}
                  <div onClick={() => { duplicateControl(); setContextMenu(null) }} style={{ padding: '8px 12px', fontSize: 11, color: '#1e293b', cursor: 'pointer', borderBottom: '1px solid #f8fafc' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    Duplicate (Ctrl+D)
                  </div>
                  <div onClick={() => { cutControl(); setContextMenu(null) }} style={{ padding: '8px 12px', fontSize: 11, color: '#1e293b', cursor: 'pointer', borderBottom: '1px solid #f8fafc' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    Cut (Ctrl+X)
                  </div>
                  <div onClick={() => { deleteControl(); setContextMenu(null) }} style={{ padding: '8px 12px', fontSize: 11, color: '#ef4444', cursor: 'pointer', borderBottom: '1px solid #f8fafc' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    Delete (Del)
                  </div>
                  <div style={{ borderBottom: '1px solid #e2e8f0', height: 1, margin: '4px 0' }} />
                  <div onClick={() => setContextMenu(null)} style={{ padding: '8px 12px', fontSize: 11, color: '#1e293b', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    Properties
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Toast Notifications */}
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Phase 15: Generate Form Dialog */}
      {showGenerateFormDialog && (
        <GenerateFormDialog
          onClose={() => setShowGenerateFormDialog(false)}
          onGenerate={(options: any) => {
            setShowGenerateFormDialog(false)
            generateFormWithOptions(options)
          }}
        />
      )}
    </div>
  )
}

// Control Wrapper with drag/resize
function ControlWrapper({ control, selected, onSelect, onUpdate, onContextMenu }: any) {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState('')
  const dragStart = useRef({ x: 0, y: 0, ctrlX: 0, ctrlY: 0, ctrlW: 0, ctrlH: 0 })

  function handleMouseDown(e: React.MouseEvent, handle?: string) {
    if (e.button !== 0) return
    e.stopPropagation()
    onSelect(e) // Phase 15 Feature 7: Pass event for Shift+Click support

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
        onUpdate({
          x: Math.round(dragStart.current.ctrlX + dx),
          y: Math.round(dragStart.current.ctrlY + dy)
        })
      } else if (isResizing) {
        const updates: any = {}

        if (resizeHandle.includes('e')) {
          updates.w = Math.round(Math.max(20, dragStart.current.ctrlW + dx))
        }
        if (resizeHandle.includes('w')) {
          updates.w = Math.round(Math.max(20, dragStart.current.ctrlW - dx))
          updates.x = Math.round(dragStart.current.ctrlX + dx)
        }
        if (resizeHandle.includes('s')) {
          updates.h = Math.round(Math.max(16, dragStart.current.ctrlH + dy))
        }
        if (resizeHandle.includes('n')) {
          updates.h = Math.round(Math.max(16, dragStart.current.ctrlH - dy))
          updates.y = Math.round(dragStart.current.ctrlY + dy)
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
      <CtrlRender ctrl={{ ...sanitizeControl(control), ...sanitizeControl(control).props }} />
      {selected && (
        <>
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

// FIX 5: Completely rebuilt Property Sheet Component
function PropertySheet({ selectedControl, formProps, propertyTab, setPropertyTab, tables, queries, macros, recordSourceFields, onUpdateControlProp, onUpdateControlGeometry, onUpdateFormProp, onDelete, onSaveSingleControl }: any) {
  const tabs = ['format', 'data', 'event', 'other', 'all'] as const

  return (
    <div style={{ width: 280, background: '#ffffff', borderLeft: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: '#ffffff', padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Property Sheet</div>
        <div style={{ fontSize: 11, color: '#64748b' }}>
          Selection: {selectedControl ? selectedControl.type : 'Form'}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setPropertyTab(tab)}
            style={{
              flex: 1,
              padding: '8px 4px',
              background: 'transparent',
              color: propertyTab === tab ? '#4f46e5' : '#64748b',
              border: 'none',
              borderBottom: `2px solid ${propertyTab === tab ? '#4f46e5' : 'transparent'}`,
              fontSize: 11,
              fontWeight: propertyTab === tab ? 500 : 400,
              cursor: 'pointer',
              textTransform: 'capitalize',
              textAlign: 'center'
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
            onUpdateGeometry={onUpdateControlGeometry}
            onDelete={onDelete}
            onSave={() => onSaveSingleControl(selectedControl.id)}
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

// Phase 16: Complete property sheet rewrite
function ControlProperties({ control, tab, tables, queries, macros, recordSourceFields, onUpdate, onUpdateGeometry, onDelete, onSave }: any) {
  const props = control.props || {}

  // Property Row Component - FIX 19.1: Changed text/number inputs to use onBlur with change detection
  function PropRow({ label, value, onChange, type = 'text', options = [], onBlur }: any) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', borderBottom: '1px solid #f1f5f9', minHeight: 24, alignItems: 'center', padding: '0 8px' }}>
        <span style={{ fontSize: 11, color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>{label}</span>
        {type === 'select' ? (
          <select value={value} onChange={(e) => onChange(e.target.value)} style={{ background: 'transparent', color: '#1e293b', border: 'none', fontSize: 11, width: '100%', padding: '2px 4px', cursor: 'pointer' }}>
            {options.map((opt: any) => (
              typeof opt === 'string' ?
                <option key={opt} value={opt}>{opt}</option> :
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : type === 'color' ? (
          <input type="color" value={value || '#ffffff'} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', height: 20, background: 'transparent', border: 'none' }} />
        ) : type === 'number' ? (
          <input
            type="number"
            defaultValue={value}
            onBlur={(e) => {
              const newValue = Number(e.target.value)
              if (newValue !== value) {
                onChange(newValue)
                onBlur?.()
              }
            }}
            key={`${label}-${value}`}
            style={{ background: 'transparent', color: '#1e293b', border: 'none', fontSize: 11, width: '100%', padding: '2px 4px' }}
          />
        ) : (
          <input
            type="text"
            defaultValue={value || ''}
            onBlur={(e) => {
              if (e.target.value !== (value || '')) {
                onChange(e.target.value)
                onBlur?.()
              }
            }}
            key={`${label}-${value}`}
            style={{ background: 'transparent', color: '#1e293b', border: 'none', fontSize: 11, width: '100%', padding: '2px 4px' }}
          />
        )}
      </div>
    )
  }

  function SectionHeader({ title }: { title: string }) {
    return (
      <div style={{ background: '#f8fafc', padding: '4px 8px', borderBottom: '1px solid #f1f5f9', marginTop: 8 }}>
        <span style={{ fontSize: 9, color: '#4f46e5', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</span>
      </div>
    )
  }

  // FORMAT TAB
  if (tab === 'format' || tab === 'all') {
    return (
      <>
        <SectionHeader title="POSITION" />
        <PropRow label="X (Left)" value={control.x} onChange={(v: number) => onUpdateGeometry(control.id, { x: v })} type="number" onBlur={onSave} />
        <PropRow label="Y (Top)" value={control.y} onChange={(v: number) => onUpdateGeometry(control.id, { y: v })} type="number" onBlur={onSave} />
        <PropRow label="Width" value={control.w} onChange={(v: number) => onUpdateGeometry(control.id, { w: v })} type="number" onBlur={onSave} />
        <PropRow label="Height" value={control.h} onChange={(v: number) => onUpdateGeometry(control.id, { h: v })} type="number" onBlur={onSave} />

        <SectionHeader title="APPEARANCE" />
        <PropRow label="Back Color" value={props.bg || '#ffffff'} onChange={(v: string) => onUpdate(control.id, 'bg', v)} type="color" onBlur={onSave} />
        <PropRow label="Text Color" value={props.color || '#000000'} onChange={(v: string) => onUpdate(control.id, 'color', v)} type="color" onBlur={onSave} />
        <PropRow label="Border Radius" value={props.radius || 0} onChange={(v: number) => onUpdate(control.id, 'radius', v)} type="number" onBlur={onSave} />
        <PropRow label="Visible" value={props.visible !== false ? 'Yes' : 'No'} onChange={(v: string) => onUpdate(control.id, 'visible', v === 'Yes')} type="select" options={['Yes', 'No']} onBlur={onSave} />

        {!['Divider', 'ProgressBar', 'Image'].includes(control.type) && (
          <>
            <SectionHeader title="TYPOGRAPHY" />
            <PropRow label="Font Size" value={props.fontSize || 13} onChange={(v: number) => onUpdate(control.id, 'fontSize', v)} type="number" onBlur={onSave} />
            <PropRow label="Bold" value={props.bold ? 'Yes' : 'No'} onChange={(v: string) => onUpdate(control.id, 'bold', v === 'Yes')} type="select" options={['Yes', 'No']} onBlur={onSave} />
            <PropRow label="Italic" value={props.italic ? 'Yes' : 'No'} onChange={(v: string) => onUpdate(control.id, 'italic', v === 'Yes')} type="select" options={['Yes', 'No']} onBlur={onSave} />
            <PropRow label="Text Align" value={props.textAlign || 'Left'} onChange={(v: string) => onUpdate(control.id, 'textAlign', v)} type="select" options={['Left', 'Center', 'Right']} onBlur={onSave} />
          </>
        )}

        {['Label', 'Heading', 'Button', 'Badge'].includes(control.type) && (
          <>
            <SectionHeader title="CONTENT" />
            <PropRow label="Caption" value={props.caption || ''} onChange={(v: string) => onUpdate(control.id, 'caption', v)} onBlur={onSave} />
          </>
        )}

        {control.type === 'Button' && (
          <PropRow label="Variant" value={props.variant || 'Filled'} onChange={(v: string) => onUpdate(control.id, 'variant', v)} type="select" options={['Filled', 'Outline', 'Ghost']} onBlur={onSave} />
        )}

        {control.type === 'ComboBox' && (
          <>
            <PropRow label="Placeholder" value={props.placeholder || ''} onChange={(v: string) => onUpdate(control.id, 'placeholder', v)} onBlur={onSave} />
            <PropRow label="Options" value={props.options || ''} onChange={(v: string) => onUpdate(control.id, 'options', v)} onBlur={onSave} />
          </>
        )}

        {control.type === 'TextBox' && (
          <PropRow label="Placeholder" value={props.placeholder || ''} onChange={(v: string) => onUpdate(control.id, 'placeholder', v)} onBlur={onSave} />
        )}

        {tab === 'format' && (
          <div style={{ padding: 8, marginTop: 8 }}>
            <button onClick={onDelete} style={{ width: '100%', padding: '6px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, fontSize: 10, cursor: 'pointer' }}>
              Delete Control
            </button>
          </div>
        )}
      </>
    )
  }

  // DATA TAB
  if (tab === 'data' || tab === 'all') {
    const fieldOptions = recordSourceFields.length > 0
      ? ['(none)', ...recordSourceFields.map((f: any) => ({ value: f.name, label: f.caption || f.name }))]
      : ['(Set Record Source on form first)']

    return (
      <>
        {['TextBox', 'NumberBox', 'DatePicker', 'CheckBox', 'ComboBox'].includes(control.type) && (
          <>
            <PropRow label="Control Source" value={props.controlSource || '(none)'} onChange={(v: string) => onUpdate(control.id, 'controlSource', v === '(none)' ? '' : v)} type="select" options={fieldOptions} onBlur={onSave} />
            <PropRow label="Default Value" value={props.defaultValue || ''} onChange={(v: string) => onUpdate(control.id, 'defaultValue', v)} onBlur={onSave} />
            <PropRow label="Enabled" value={props.enabled !== false ? 'Yes' : 'No'} onChange={(v: string) => onUpdate(control.id, 'enabled', v === 'Yes')} type="select" options={['Yes', 'No']} onBlur={onSave} />
            <PropRow label="Locked" value={props.locked === true ? 'Yes' : 'No'} onChange={(v: string) => onUpdate(control.id, 'locked', v === 'Yes')} type="select" options={['Yes', 'No']} onBlur={onSave} />
          </>
        )}

        {control.type === 'TextBox' && (
          <>
            <PropRow label="Validation Rule" value={props.validationRule || ''} onChange={(v: string) => onUpdate(control.id, 'validationRule', v)} onBlur={onSave} />
            <PropRow label="Validation Text" value={props.validationText || ''} onChange={(v: string) => onUpdate(control.id, 'validationText', v)} onBlur={onSave} />
          </>
        )}

        {control.type === 'ComboBox' && (
          <>
            <PropRow label="Row Source Type" value={props.rowSourceType || 'Value List'} onChange={(v: string) => onUpdate(control.id, 'rowSourceType', v)} type="select" options={['Value List', 'Table/Query']} onBlur={onSave} />
            <PropRow label="Limit to List" value={props.limitToList ? 'Yes' : 'No'} onChange={(v: string) => onUpdate(control.id, 'limitToList', v === 'Yes')} type="select" options={['Yes', 'No']} onBlur={onSave} />
          </>
        )}

        {control.type === 'NumberBox' && (
          <>
            <PropRow label="Min Value" value={props.minValue || ''} onChange={(v: number) => onUpdate(control.id, 'minValue', v)} type="number" onBlur={onSave} />
            <PropRow label="Max Value" value={props.maxValue || ''} onChange={(v: number) => onUpdate(control.id, 'maxValue', v)} type="number" onBlur={onSave} />
            <PropRow label="Decimal Places" value={props.decimalPlaces || 'Auto'} onChange={(v: string) => onUpdate(control.id, 'decimalPlaces', v)} type="select" options={['0', '1', '2', '3', 'Auto']} onBlur={onSave} />
          </>
        )}

        {control.type === 'DataTable' && (
          <>
            <PropRow label="Record Source" value={props.recordSource || ''} onChange={(v: string) => onUpdate(control.id, 'recordSource', v)} type="select" options={['(none)', ...tables.map((t: any) => t.name), ...queries.map((q: any) => q.name)]} onBlur={onSave} />
            <PropRow label="Allow Edits" value={props.allowEdits ? 'Yes' : 'No'} onChange={(v: string) => onUpdate(control.id, 'allowEdits', v === 'Yes')} type="select" options={['Yes', 'No']} onBlur={onSave} />
            <PropRow label="Show Search" value={props.showSearch ? 'Yes' : 'No'} onChange={(v: string) => onUpdate(control.id, 'showSearch', v === 'Yes')} type="select" options={['Yes', 'No']} onBlur={onSave} />
          </>
        )}

        {control.type === 'Button' && (
          <>
            <PropRow label="Default" value={props.isDefault ? 'Yes' : 'No'} onChange={(v: string) => onUpdate(control.id, 'isDefault', v === 'Yes')} type="select" options={['Yes', 'No']} onBlur={onSave} />
            <PropRow label="Cancel" value={props.isCancel ? 'Yes' : 'No'} onChange={(v: string) => onUpdate(control.id, 'isCancel', v === 'Yes')} type="select" options={['Yes', 'No']} onBlur={onSave} />
          </>
        )}

        {['Label', 'Heading', 'Badge'].includes(control.type) && (
          <PropRow label="Default Value" value={props.defaultValue || ''} onChange={(v: string) => onUpdate(control.id, 'defaultValue', v)} onBlur={onSave} />
        )}
      </>
    )
  }

  // EVENT TAB
  if (tab === 'event' || tab === 'all') {
    const macroOptions = ['(none)', ...macros.map((m: any) => m.name)]

    return (
      <>
        <PropRow label="On Click" value={props.onClickMacro || '(none)'} onChange={(v: string) => onUpdate(control.id, 'onClickMacro', v)} type="select" options={macroOptions} onBlur={onSave} />
        <PropRow label="On Dbl Click" value={props.onDblClickMacro || '(none)'} onChange={(v: string) => onUpdate(control.id, 'onDblClickMacro', v)} type="select" options={macroOptions} onBlur={onSave} />
        <PropRow label="On Got Focus" value={props.onGotFocus || '(none)'} onChange={(v: string) => onUpdate(control.id, 'onGotFocus', v)} type="select" options={macroOptions} onBlur={onSave} />
        <PropRow label="On Lost Focus" value={props.onLostFocus || '(none)'} onChange={(v: string) => onUpdate(control.id, 'onLostFocus', v)} type="select" options={macroOptions} onBlur={onSave} />

        {['TextBox', 'ComboBox', 'DatePicker', 'NumberBox'].includes(control.type) && (
          <>
            <PropRow label="Before Update" value={props.beforeUpdate || '(none)'} onChange={(v: string) => onUpdate(control.id, 'beforeUpdate', v)} type="select" options={macroOptions} onBlur={onSave} />
            <PropRow label="After Update" value={props.afterUpdate || '(none)'} onChange={(v: string) => onUpdate(control.id, 'afterUpdate', v)} type="select" options={macroOptions} onBlur={onSave} />
            <PropRow label="On Change" value={props.onChange || '(none)'} onChange={(v: string) => onUpdate(control.id, 'onChange', v)} type="select" options={macroOptions} onBlur={onSave} />
          </>
        )}
      </>
    )
  }

  // OTHER TAB
  if (tab === 'other' || tab === 'all') {
    return (
      <>
        <PropRow label="Name" value={props.ctrlName || control.type + control.id.slice(-4)} onChange={(v: string) => onUpdate(control.id, 'ctrlName', v)} onBlur={onSave} />
        <PropRow label="Status Bar" value={props.statusBarText || ''} onChange={(v: string) => onUpdate(control.id, 'statusBarText', v)} onBlur={onSave} />
        <PropRow label="ControlTip" value={props.tooltip || ''} onChange={(v: string) => onUpdate(control.id, 'tooltip', v)} onBlur={onSave} />
        <PropRow label="Tab Stop" value={props.tabStop !== false ? 'Yes' : 'No'} onChange={(v: string) => onUpdate(control.id, 'tabStop', v === 'Yes')} type="select" options={['Yes', 'No']} onBlur={onSave} />
        <PropRow label="Tab Index" value={props.tabIndex || 0} onChange={(v: number) => onUpdate(control.id, 'tabIndex', v)} type="number" onBlur={onSave} />
      </>
    )
  }

  return null
}

// FIX 5: Form Properties - FIX 19.1: Changed text inputs to use onBlur with change detection
function FormProperties({ formProps, tab, tables, queries, macros, onUpdate }: any) {
  function PropRow({ label, value, onChange, type = 'text', options = [] }: any) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', borderBottom: '1px solid #f1f5f9', padding: '3px 8px', height: 24, alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>{label}</span>
        {type === 'select' ? (
          <select value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', background: '#ffffff', color: '#1e293b', border: 'none', fontSize: 10, padding: '2px 4px' }}>
            {options.map((opt: any) =>
              typeof opt === 'string' ? <option key={opt} value={opt}>{opt}</option> :
              opt.isHeader ? <option key={opt.label} disabled style={{ fontWeight: 700, color: '#6366f1' }}>{opt.label}</option> :
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            )}
          </select>
        ) : type === 'yesno' ? (
          <select value={value ? 'Yes' : 'No'} onChange={(e) => onChange(e.target.value === 'Yes')} style={{ width: '100%', background: '#ffffff', color: '#1e293b', border: 'none', fontSize: 10, padding: '2px 4px' }}>
            <option>Yes</option>
            <option>No</option>
          </select>
        ) : (
          <input
            type="text"
            defaultValue={value}
            onBlur={(e) => {
              if (e.target.value !== value) {
                onChange(e.target.value)
              }
            }}
            key={`${label}-${value}`}
            style={{ width: '100%', background: '#ffffff', color: '#1e293b', border: 'none', fontSize: 10, padding: '2px 4px' }}
          />
        )}
      </div>
    )
  }

  if (tab === 'format' || tab === 'all') {
    return (
      <>
        <div style={{ background: '#f1f5f9', color: '#6366f1', fontSize: 9, textTransform: 'uppercase', padding: '3px 8px', fontWeight: 700 }}>FORMAT</div>
        <PropRow label="Default View" value={formProps.defaultView || 'single'} onChange={(v: string) => onUpdate('defaultView', v)} type="select" options={['single', 'continuous', 'datasheet', 'split']} />
        <PropRow label="Navigation Buttons" value={formProps.navigationButtons} onChange={(v: boolean) => onUpdate('navigationButtons', v)} type="yesno" />
      </>
    )
  }

  if (tab === 'data' || tab === 'all') {
    const recordSourceOptions = [
      { label: '', value: '' },
      { label: '--- Tables ---', isHeader: true },
      ...tables.map((t: any) => ({ label: t.name, value: t.name })),
      { label: '--- Queries ---', isHeader: true },
      ...queries.map((q: any) => ({ label: q.name, value: q.name })),
    ]

    return (
      <>
        <div style={{ background: '#f1f5f9', color: '#6366f1', fontSize: 9, textTransform: 'uppercase', padding: '3px 8px', fontWeight: 700 }}>DATA</div>
        <PropRow label="Record Source" value={formProps.recordSource || ''} onChange={(v: string) => onUpdate('recordSource', v)} type="select" options={recordSourceOptions} />
        <PropRow label="Allow Edits" value={formProps.allowEdits} onChange={(v: boolean) => onUpdate('allowEdits', v)} type="yesno" />
        <PropRow label="Allow Additions" value={formProps.allowAdditions} onChange={(v: boolean) => onUpdate('allowAdditions', v)} type="yesno" />
        <PropRow label="Allow Deletions" value={formProps.allowDeletions} onChange={(v: boolean) => onUpdate('allowDeletions', v)} type="yesno" />
      </>
    )
  }

  if (tab === 'event' || tab === 'all') {
    return (
      <>
        <div style={{ background: '#f1f5f9', color: '#6366f1', fontSize: 9, textTransform: 'uppercase', padding: '3px 8px', fontWeight: 700 }}>EVENTS</div>
        <PropRow label="On Open" value={''} onChange={() => {}} type="select" options={['(none)', ...macros.map((m: any) => m.name)]} />
        <PropRow label="On Load" value={''} onChange={() => {}} type="select" options={['(none)', ...macros.map((m: any) => m.name)]} />
        <PropRow label="On Close" value={''} onChange={() => {}} type="select" options={['(none)', ...macros.map((m: any) => m.name)]} />
        <PropRow label="On Current" value={''} onChange={() => {}} type="select" options={['(none)', ...macros.map((m: any) => m.name)]} />
      </>
    )
  }

  return (
    <div style={{ padding: 12, fontSize: 11, color: '#64748b', textAlign: 'center' }}>
      {tab} properties
    </div>
  )
}

// FIX 8: Form View Component
function FormView({ controls, formProps, formData, setFormData, records, currentRecordIndex, setCurrentRecordIndex, workspace, tables, pageId }: any) {
  const supabase = createClient()
  const [toasts, setToasts] = useState<any[]>([])

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = crypto.randomUUID()
    setToasts((prev: any[]) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev: any[]) => prev.filter((t: any) => t.id !== id))
    }, 3000)
  }

  function handleInputChange(controlSource: string, value: any) {
    setFormData({ ...formData, [controlSource]: value })
  }

  async function handleSave() {
    if (!formProps.recordSource || !workspace) return

    const table = tables.find((t: any) => t.name === formProps.recordSource)
    if (!table) return

    const currentRecord = records[currentRecordIndex]

    if (currentRecord?.id) {
      await supabase.from('app_data').update({ data: formData }).eq('id', currentRecord.id)
      showToast('Record updated!', 'success')
    } else {
      await supabase.from('app_data').insert({
        workspace_id: workspace.id,
        table_name: table.slug,
        data: formData,
      })
      showToast('Record saved!', 'success')
    }
  }

  async function handleButtonClick(ctrl: any) {
    if (ctrl.macro_steps && ctrl.macro_steps.length > 0) {
      const { runMacro } = await import('@/lib/macroEngine')
      await runMacro(ctrl.macro_steps, {
        formData,
        setFormData,
        workspaceId: workspace.id,
        showToast,
      })
    } else if (ctrl.props?.caption?.toLowerCase() === 'save') {
      await handleSave()
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

  // Calculate canvas dimensions from controls
  const canvasWidth = controls.length > 0
    ? Math.max(...controls.map((c: Control) => c.x + c.w), 600) + 40
    : 600
  const canvasHeight = controls.length > 0
    ? Math.max(...controls.map((c: Control) => c.y + c.h), 500) + 40
    : 500

  return (
    <div style={{ flex: 1, background: '#f3f4f6', overflow: 'auto', padding: 40, position: 'relative' }}>
      {/* Toast notifications */}
      {toasts.map((toast: any) => (
        <div key={toast.id} style={{ position: 'fixed', top: 20, right: 20, background: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : '#3b82f6', color: '#fff', padding: '12px 20px', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 9999 }}>
          {toast.message}
        </div>
      ))}
      {/* Form canvas with exact same positioning as design view */}
      <div style={{
        width: canvasWidth,
        height: canvasHeight,
        margin: '0 auto',
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        position: 'relative'
      }}>
        {/* Render all controls at exact same x, y, w, h as design view */}
        {controls.map((ctrl: Control) => (
          <div
            key={ctrl.id}
            style={{
              position: 'absolute',
              left: ctrl.x,
              top: ctrl.y,
              width: ctrl.w,
              height: ctrl.h,
            }}
          >
            <RenderLiveControl ctrl={ctrl} formData={formData} onChange={handleInputChange} onButtonClick={() => handleButtonClick(ctrl)} />
          </div>
        ))}
      </div>

      {/* Navigation buttons below the form */}
      {formProps.recordSource && formProps.navigationButtons && (
        <div style={{ maxWidth: canvasWidth, margin: '20px auto 0', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', background: '#fff', padding: '12px 20px', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <button onClick={() => handleNavigation('first')} style={{ padding: '6px 12px', background: '#f1f5f9', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>|◀</button>
          <button onClick={() => handleNavigation('prev')} style={{ padding: '6px 12px', background: '#f1f5f9', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>◀</button>
          <span style={{ fontSize: 12, color: '#6b7280' }}>Record {currentRecordIndex + 1} of {records.length}</span>
          <button onClick={() => handleNavigation('next')} style={{ padding: '6px 12px', background: '#f1f5f9', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>▶</button>
          <button onClick={() => handleNavigation('last')} style={{ padding: '6px 12px', background: '#f1f5f9', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>▶|</button>
          <button onClick={() => handleNavigation('new')} style={{ padding: '6px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', marginLeft: 8 }}>+ New</button>
        </div>
      )}
    </div>
  )
}

// Live Control Renderer
function RenderLiveControl({ ctrl, formData, onChange, onButtonClick }: any) {
  const props = ctrl.props || {}
  const value = props.controlSource ? formData[props.controlSource] : (formData[ctrl.id] || props.value || '')

  if (ctrl.type === 'Label') {
    return (
      <div style={{
        fontSize: props.fontSize || 13,
        fontWeight: props.bold ? 700 : 400,
        color: props.color || '#374151',
        background: props.bg === 'transparent' || !props.bg ? 'transparent' : props.bg,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center'
      }}>
        {props.caption || 'Label'}
      </div>
    )
  }

  if (ctrl.type === 'Heading') {
    return (
      <div style={{
        fontSize: props.fontSize || 20,
        fontWeight: 800,
        color: props.color || '#0f172a',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center'
      }}>
        {props.caption || 'Heading'}
      </div>
    )
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
          height: '100%',
          padding: '0 12px',
          border: '1px solid #e2e8f0',
          borderRadius: props.radius !== undefined ? props.radius : 8,
          fontSize: props.fontSize || 14,
          color: props.color || '#1e293b',
          background: props.bg || '#ffffff',
          outline: 'none',
          boxSizing: 'border-box'
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
          height: '100%',
          padding: '0 12px',
          border: '1px solid #e2e8f0',
          borderRadius: 4,
          fontSize: props.fontSize || 13,
          color: props.color || '#374151',
          background: props.bg || '#ffffff',
          cursor: 'pointer',
          boxSizing: 'border-box'
        }}
      >
        <option value="">{props.placeholder || 'Select...'}</option>
        {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    )
  }

  if (ctrl.type === 'CheckBox') {
    return (
      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        cursor: 'pointer',
        width: '100%',
        height: '100%',
        fontSize: props.fontSize || 13,
        color: props.color || '#374151'
      }}>
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(props.controlSource || ctrl.id, e.target.checked)}
        />
        <span>{props.caption || 'CheckBox'}</span>
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
          height: '100%',
          padding: '0 12px',
          border: '1px solid #e2e8f0',
          borderRadius: 4,
          fontSize: props.fontSize || 13,
          color: props.color || '#374151',
          background: props.bg || '#ffffff',
          boxSizing: 'border-box'
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
          height: '100%',
          padding: '0 12px',
          border: '1px solid #e2e8f0',
          borderRadius: 4,
          fontSize: props.fontSize || 13,
          color: props.color || '#374151',
          background: props.bg || '#ffffff',
          boxSizing: 'border-box'
        }}
      />
    )
  }

  if (ctrl.type === 'Button') {
    const bgColor = props.bg || '#4f46e5';
    return (
      <button
        onClick={onButtonClick}
        style={{
          width: '100%',
          height: '100%',
          background: bgColor,
          color: props.color || getContrastText(bgColor),
          border: 'none',
          borderRadius: props.radius !== undefined ? props.radius : 8,
          fontSize: props.fontSize || 14,
          fontWeight: props.bold ? 700 : 400,
          cursor: 'pointer',
        }}
      >
        {props.caption || 'Button'}
      </button>
    )
  }

  return <div style={{ padding: 8, color: '#64748b' }}>{ctrl.type}</div>
}
