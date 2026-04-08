'use client'

import { useState, useEffect } from 'react'
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

  // Form designer state
  const [controls, setControls] = useState<any[]>([])
  const [selectedControlId, setSelectedControlId] = useState<string | null>(null)
  const [formProperties, setFormProperties] = useState<any>({})

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
    // Load tables
    const { data: tablesData } = await supabase
      .from('workspace_tables')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('name')
    setTables(tablesData || [])

    // Load queries
    const { data: queriesData } = await supabase
      .from('workspace_queries')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('name')
    setQueries(queriesData || [])

    // Load forms (pages)
    const { data: formsData } = await supabase
      .from('pages')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('slug')
    setForms(formsData || [])

    // Load macros
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

    // Check if tab already open
    const existingTab = tabs.find(t => t.objectId === id && t.type === baseType as any)
    if (existingTab) {
      setActiveTabId(existingTab.id)
      return
    }

    // Create new tab
    const newTab: Tab = {
      id: `tab-${Date.now()}`,
      type: baseType as any,
      objectId: id,
      name,
      view,
    }

    setTabs([...tabs, newTab])
    setActiveTabId(newTab.id)

    // Load data for this tab
    if (baseType === 'form') {
      loadFormControls(id)
    }
  }

  async function loadFormControls(pageId: string) {
    const { data } = await supabase
      .from('controls')
      .select('*')
      .eq('page_id', pageId)
      .order('created_at')

    setControls(data || [])

    // Load form properties from page
    const form = forms.find(f => f.id === pageId)
    if (form) {
      setFormProperties({
        recordSource: form.record_source,
        allowEdits: form.allow_edits,
        allowAdditions: form.allow_additions,
        allowDeletions: form.allow_deletions,
        navigationButtons: form.navigation_buttons,
      })
    }
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
      const name = prompt('Enter table name:')
      if (!name || !workspace) return

      const slug = name.toLowerCase().replace(/\s+/g, '_')
      const { data, error } = await supabase
        .from('workspace_tables')
        .insert({
          workspace_id: workspace.id,
          name,
          slug,
          fields: [{ name: 'id', type: 'AutoNumber', required: true }]
        })
        .select()
        .single()

      if (!error && data) {
        loadAllObjects(workspace.id)
        handleOpenObject('table-design', data.id, data.name)
      }
    } else if (type === 'form') {
      const name = prompt('Enter form name:')
      if (!name || !workspace) return

      const slug = name.toLowerCase().replace(/\s+/g, '-')
      const { data, error } = await supabase
        .from('pages')
        .insert({
          workspace_id: workspace.id,
          slug,
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
      const name = prompt('Enter query name:')
      if (!name || !workspace) return

      const { data, error } = await supabase
        .from('workspace_queries')
        .insert({
          workspace_id: workspace.id,
          name,
          definition: { fields: [], tables: [] }
        })
        .select()
        .single()

      if (!error && data) {
        loadAllObjects(workspace.id)
        handleOpenObject('query-design', data.id, data.name)
      }
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
        handleOpenObject('macro', data.id, data.name)
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

    // Close any tabs with this object
    const newTabs = tabs.filter(t => t.objectId !== id)
    setTabs(newTabs)
  }

  const activeTab = tabs.find(t => t.id === activeTabId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f1117', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Top Bar */}
      <div style={{ height: 56, background: '#1a1d2e', borderBottom: '1px solid #252840', display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between' }}>
        {/* Left: Back + Workspace Name */}
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

        {/* Center: Filter Tabs */}
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

        {/* Right: User Info */}
        <div style={{ fontSize: 12, color: '#8890b8' }}>
          Studio
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Navigation Pane */}
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

        {/* Main Workspace Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0f1117' }}>
          {tabs.length === 0 ? (
            // Welcome Screen
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
              {/* Tab Bar */}
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

              {/* Tab Content */}
              <div style={{ flex: 1, overflow: 'auto' }}>
                {activeTab && activeTab.type === 'form' && (
                  <FormTabContent
                    tab={activeTab}
                    controls={controls}
                    formProperties={formProperties}
                    tables={tables}
                    selectedControlId={selectedControlId}
                    onSelectControl={setSelectedControlId}
                    onUpdateControl={(id: string, updates: any) => {
                      setControls(controls.map(c => c.id === id ? { ...c, ...updates } : c))
                    }}
                    onAddControl={(ctrl: any) => setControls([...controls, ctrl])}
                  />
                )}
                {activeTab && activeTab.type === 'table' && (
                  <TableTabContent tab={activeTab} table={tables.find(t => t.id === activeTab.objectId)} />
                )}
                {activeTab && activeTab.type === 'query' && (
                  <div style={{ padding: 40, color: '#8890b8', textAlign: 'center' }}>
                    Query Builder - {activeTab.name}
                  </div>
                )}
                {activeTab && activeTab.type === 'macro' && (
                  <div style={{ padding: 40, color: '#8890b8', textAlign: 'center' }}>
                    Macro Editor - {activeTab.name}
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

// Form Tab Content Component
function FormTabContent({ tab, controls, formProperties, tables, selectedControlId, onSelectControl, onUpdateControl, onAddControl }: any) {
  const [view, setView] = useState<'form' | 'design' | 'datasheet'>(tab.view === 'design' ? 'design' : 'form')

  if (view === 'design') {
    return (
      <div style={{ display: 'flex', height: '100%' }}>
        {/* Toolbox */}
        <div style={{ width: 64, background: '#1a1d2e', borderRight: '1px solid #252840', padding: 8 }}>
          <div style={{ fontSize: 10, color: '#8890b8', marginBottom: 8, textAlign: 'center' }}>Controls</div>
          {['Label', 'TextBox', 'Button', 'ComboBox', 'CheckBox'].map((type) => (
            <div
              key={type}
              onClick={() => {
                const newCtrl = {
                  id: `ctrl-${Date.now()}`,
                  type,
                  x: 50,
                  y: 50,
                  w: 120,
                  h: 32,
                  caption: type,
                  color: '#1f2937',
                  bg: type === 'Button' ? '#6366f1' : '#fff',
                  radius: 4,
                  fontSize: 14,
                }
                onAddControl(newCtrl)
              }}
              style={{
                padding: 8,
                background: '#252840',
                borderRadius: 4,
                marginBottom: 8,
                fontSize: 9,
                color: '#c8d0f0',
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              {type}
            </div>
          ))}
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, background: '#fff', position: 'relative', overflow: 'auto' }}>
          {/* Form Sections */}
          <div style={{ minHeight: '100%' }}>
            {/* Form Header */}
            <div style={{ background: '#f0f4ff', borderBottom: '1px solid #d1d5db', padding: '4px 8px', fontSize: 10, color: '#6b7280', fontWeight: 600 }}>
              ▼ Form Header
            </div>
            <div style={{ minHeight: 60, position: 'relative', background: '#f0f4ff' }} />

            {/* Detail Section */}
            <div style={{ background: '#e5e7eb', borderBottom: '1px solid #d1d5db', padding: '4px 8px', fontSize: 10, color: '#6b7280', fontWeight: 600 }}>
              ▼ Detail
            </div>
            <div style={{ minHeight: 400, position: 'relative', background: '#fff', backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)', backgroundSize: '8px 8px' }}>
              {controls.map((ctrl: any) => (
                <div
                  key={ctrl.id}
                  onClick={() => onSelectControl(ctrl.id)}
                  style={{
                    position: 'absolute',
                    left: ctrl.x,
                    top: ctrl.y,
                    width: ctrl.w,
                    height: ctrl.h,
                    border: selectedControlId === ctrl.id ? '2px solid #6366f1' : '1px solid transparent',
                    cursor: 'move',
                  }}
                >
                  <CtrlRender ctrl={ctrl} />
                </div>
              ))}
            </div>

            {/* Form Footer */}
            <div style={{ background: '#e5e7eb', borderBottom: '1px solid #d1d5db', padding: '4px 8px', fontSize: 10, color: '#6b7280', fontWeight: 600 }}>
              ▼ Form Footer
            </div>
            <div style={{ minHeight: 60, position: 'relative', background: '#f0f4ff' }} />
          </div>
        </div>

        {/* Property Sheet */}
        <div style={{ width: 260, background: '#1a1d2e', borderLeft: '1px solid #252840', padding: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#c8d0f0', marginBottom: 12 }}>
            Property Sheet
          </div>
          {selectedControlId ? (
            <div style={{ fontSize: 11, color: '#8890b8' }}>
              Properties for {controls.find((c: any) => c.id === selectedControlId)?.type}
            </div>
          ) : (
            <div style={{ fontSize: 11, color: '#8890b8' }}>
              Select a control to view properties
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 40, color: '#8890b8', textAlign: 'center' }}>
      Form View - {tab.name}
    </div>
  )
}

// Table Tab Content Component
function TableTabContent({ tab, table }: any) {
  if (!table) return <div style={{ padding: 40, color: '#8890b8' }}>Table not found</div>

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#c8d0f0', marginBottom: 16 }}>
        Table: {table.name}
      </div>
      <div style={{ background: '#1a1d2e', border: '1px solid #252840', borderRadius: 4, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#252840' }}>
              {(table.fields || []).map((field: any, i: number) => (
                <th key={i} style={{ padding: '8px 12px', textAlign: 'left', borderRight: '1px solid #1a1d2e', color: '#c8d0f0', fontWeight: 600 }}>
                  {field.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={table.fields?.length || 1} style={{ padding: 20, textAlign: 'center', color: '#7480a8', fontStyle: 'italic' }}>
                No data yet
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
